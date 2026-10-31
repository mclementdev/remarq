import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const db = { count: 0, inserted: [] as Record<string, unknown>[], updates: [] as Record<string, unknown>[] };
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ gte: async () => ({ count: db.count, error: null }) }) }),
      insert: (row: Record<string, unknown>) => {
        db.inserted.push(row);
        return { select: () => ({ single: async () => ({ data: { id: "lead-1" }, error: null }) }) };
      },
      update: (patch: Record<string, unknown>) => {
        db.updates.push(patch);
        return { eq: async () => ({ error: null }) };
      },
    }),
  }),
}));

const sendEmail = vi.fn();
vi.mock("@/lib/email/send", () => ({ sendEmail: (...args: unknown[]) => sendEmail(...args) }));

const { POST } = await import("@/app/api/salon/leads/route");

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/salon/leads", { method: "POST", headers: { "x-forwarded-for": "1.2.3.4" }, body: JSON.stringify(body) }));

beforeEach(() => {
  db.count = 0;
  db.inserted = [];
  db.updates = [];
  sendEmail.mockReset().mockResolvedValue({ ok: true, logged: true });
});

describe("POST /api/salon/leads", () => {
  it("400 si l'e-mail est invalide, sans rien enregistrer", async () => {
    const res = await post({ email: "pas-un-email", consent: true, source: "stand" });
    expect(res.status).toBe(400);
    expect(db.inserted).toHaveLength(0);
  });

  it("400 sans consentement", async () => {
    const res = await post({ email: "a@b.fr", source: "stand" });
    expect(res.status).toBe(400);
    expect((await res.json()).field).toBe("consent");
  });

  it("enregistre le lead (source, consentement, IP hachée) et envoie l'e-mail", async () => {
    const res = await post({ email: "a@b.fr", consent: true, source: "flyer" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, emailSent: true, formUrl: "http://localhost:3100/depot" });
    expect(db.inserted[0]).toMatchObject({ email: "a@b.fr", source: "flyer", consent: true, remind_at: null });
    expect(db.inserted[0].ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(db.inserted[0].ip_hash).not.toContain("1.2.3.4");
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(db.updates[0]).toHaveProperty("email_sent_at");
  });

  it("joint le .ics quand une date de rappel est choisie", async () => {
    const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const res = await post({ email: "a@b.fr", consent: true, source: "stand", remindAt: `${nextWeek}T09:30` });
    expect(res.status).toBe(200);
    expect(sendEmail.mock.calls[0][0].attachments[0].filename).toBe("rappel-remarq.ics");
  });

  it("429 au-delà de 5 envois en 10 minutes", async () => {
    db.count = 5;
    const res = await post({ email: "a@b.fr", consent: true, source: "stand" });
    expect(res.status).toBe(429);
    expect(db.inserted).toHaveLength(0);
  });

  it("champ piège rempli : réponse normale, rien n'est enregistré ni envoyé", async () => {
    const res = await post({ email: "a@b.fr", consent: true, source: "stand", website: "spam" });
    expect(res.status).toBe(200);
    expect(db.inserted).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("échec d'envoi : le lead reste enregistré, l'erreur est notée", async () => {
    sendEmail.mockResolvedValue({ ok: false, error: "validation_error: domaine non vérifié" });
    const res = await post({ email: "a@b.fr", consent: true, source: "stand" });
    expect(await res.json()).toMatchObject({ ok: true, emailSent: false });
    expect(db.updates[0]).toMatchObject({ email_error: "validation_error: domaine non vérifié" });
  });
});
