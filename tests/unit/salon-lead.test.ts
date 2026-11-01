import { describe, expect, it } from "vitest";
import { parseLead } from "@/lib/salon/lead";
import { buildSalonEmail } from "@/lib/email/salon-email";

const valid = { email: " Claire@Exemple.FR ", consent: true, source: "carte" };

describe("validation d'un lead", () => {
  it("accepte un e-mail normalisé", () => {
    expect(parseLead(valid)).toEqual({ ok: true, spam: false, email: "claire@exemple.fr", source: "carte" });
  });

  it("refuse un e-mail invalide", () => {
    expect(parseLead({ ...valid, email: "claire@" })).toMatchObject({ ok: false, field: "email", error: "Adresse e-mail invalide." });
  });

  it("refuse sans consentement", () => {
    expect(parseLead({ email: "a@b.fr", source: "stand" })).toMatchObject({ ok: false, field: "consent" });
    expect(parseLead({ ...valid, consent: false })).toMatchObject({ ok: false, field: "consent" });
  });

  it("source inconnue → stand ; champ piège rempli → spam", () => {
    expect(parseLead({ ...valid, source: "autre" })).toMatchObject({ ok: true, source: "stand" });
    expect(parseLead({ ...valid, website: "http://spam" })).toMatchObject({ ok: true, spam: true });
  });

  it("ignore une date de rappel envoyée par une ancienne page", () => {
    expect(parseLead({ ...valid, remindAt: "2026-11-10T09:30" })).toEqual({ ok: true, spam: false, email: "claire@exemple.fr", source: "carte" });
  });
});

describe("e-mail du salon", () => {
  it("lien du formulaire, sans pièce jointe", () => {
    const mail = buildSalonEmail({ to: "a@b.fr", formUrl: "https://x.fr/depot" });
    expect(mail.text).toContain("https://x.fr/depot");
    expect(mail.html).toContain('href="https://x.fr/depot"');
    expect(mail.attachments).toBeUndefined();
  });
});
