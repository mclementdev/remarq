import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const SUB = "6f1c2a9e-3b4d-4c5e-8f60-123456789abc";
const db = {
  files: [] as string[],
  existingCount: 0,
  inserts: {} as Record<string, Record<string, unknown>[]>,
  deleted: [] as string[],
  failPhotos: false,
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: { from: () => ({ list: async () => ({ data: db.files.map((name) => ({ name })), error: null }) }) },
    from: (table: string) => ({
      select: () => ({
        eq: async () =>
          table === "brands"
            ? { data: [{ id: "brand-knoll", name: "Knoll" }], error: null }
            : { count: db.existingCount, error: null },
      }),
      insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => {
        const list = Array.isArray(rows) ? rows : [rows];
        (db.inserts[table] ??= []).push(...list);
        if (table === "furnitures") {
          return {
            select: async () => ({
              data: list.map((r, i) => ({ id: `f-${i + 1}`, item_index: r.item_index, brand_other: r.brand_other })),
              error: null,
            }),
          };
        }
        return Promise.resolve({ error: table === "photos" && db.failPhotos ? { message: "boom" } : null });
      },
      delete: () => ({ eq: async (_col: string, value: string) => { db.deleted.push(value); return { error: null }; } }),
    }),
  }),
}));

const { POST } = await import("@/app/api/depot/submit/route");

const photos = (piece: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({ path: `depot/${SUB}/p${piece}-${i}.jpg`, thumbPath: `depot/${SUB}/p${piece}-${i}_thumb.jpg`, slot: "other" }));

const piece = (n: number, over: Record<string, unknown> = {}) => ({
  brand: "Knoll",
  model: "Womb",
  itemType: "armchair",
  quantity: 1,
  description: "Fauteuil en tissu rouge, très bon état.",
  purchaseYear: "années 70",
  originalPrice: 3500,
  conditionScore: 8,
  conditionDetails: "",
  photos: photos(n, 3),
  ...over,
});

const body = (over: Record<string, unknown> = {}) => ({
  submissionId: SUB,
  source: "ig",
  seller: { firstName: "Claire", lastName: "", email: " Claire@Example.com ", phoneDial: "+33", phone: "06 12 34 56 78" },
  pieces: [piece(1)],
  pickup: { street: "12 rue des Lilas", postalCode: "75011", city: "Paris", floor: "3", hasElevator: true, accessNotes: "", certified: true },
  ...over,
});

const post = (b: unknown) => POST(new Request("http://localhost/api/depot/submit", { method: "POST", body: JSON.stringify(b) }));

const registerFiles = (b: ReturnType<typeof body>) => {
  db.files = (b.pieces as { photos: { path: string; thumbPath: string }[] }[])
    .flatMap((p) => p.photos.flatMap((ph) => [ph.path, ph.thumbPath]))
    .map((p) => p.split("/").pop()!);
};

beforeEach(() => {
  db.files = [];
  db.existingCount = 0;
  db.inserts = {};
  db.deleted = [];
  db.failPhotos = false;
});

describe("POST /api/depot/submit", () => {
  it("enregistre une demande de 2 pièces avec le même identifiant de demande", async () => {
    const b = body({ pieces: [piece(1), piece(2, { brand: "Inconnu", model: null, itemType: "lamp", quantity: 2, conditionScore: 3, photos: photos(2, 10) })] });
    registerFiles(b);
    const res = await post(b);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, count: 2 });

    const [first, second] = db.inserts.furnitures;
    expect(first).toMatchObject({
      submission_id: SUB,
      item_index: 1,
      source: "ig",
      name: "Fauteuil ou chauffeuse · Knoll Womb",
      item_type: "armchair",
      category: "seating",
      brand_id: "brand-knoll",
      brand_other: null,
      condition_score: 8,
      condition: "very_good",
      original_price: 3500,
      seller_last_name: null,
      seller_email: "claire@example.com",
      seller_phone: "+33612345678",
      seller_city: "Paris",
      floor: "3",
    });
    expect(first.contact_consent_text).toContain("vous recontacte");
    expect(second).toMatchObject({ item_index: 2, name: "Luminaire", category: "lighting_decor", brand_id: null, brand_other: "Inconnu", quantity: 2, condition: "used" });

    expect(db.inserts.photos).toHaveLength(13);
    expect(db.inserts.photos.filter((p) => p.is_main).map((p) => p.furniture_id)).toEqual(["f-1", "f-2"]);
    expect(db.inserts.status_history).toHaveLength(2);
    expect(db.inserts.brand_suggestions).toBeUndefined(); // « Inconnu » n'est pas proposé comme marque
  });

  it("propose une marque inconnue de la liste", async () => {
    const b = body({ pieces: [piece(1, { brand: "Pierre Paulin" })] });
    registerFiles(b);
    expect((await post(b)).status).toBe(200);
    expect(db.inserts.brand_suggestions).toEqual([{ label: "Pierre Paulin", furniture_id: "f-1" }]);
  });

  it("400 si une pièce a moins de 3 photos", async () => {
    const b = body({ pieces: [piece(1, { photos: photos(1, 2) })] });
    registerFiles(b);
    const res = await post(b);
    expect(res.status).toBe(400);
    expect((await res.json()).issues[0].path).toBe("pieces.0.photos");
  });

  it("400 au-delà de 10 pièces ou de 10 photos", async () => {
    expect((await post(body({ pieces: Array.from({ length: 11 }, (_, i) => piece(i)) }))).status).toBe(400);
    expect((await post(body({ pieces: [piece(1, { photos: photos(1, 11) })] }))).status).toBe(400);
  });

  it("400 si une photo sert à deux pièces", async () => {
    const b = body({ pieces: [piece(1), piece(2, { photos: photos(1, 3) })] });
    registerFiles(b);
    expect((await post(b)).status).toBe(400);
  });

  it("400 si un fichier n'est pas dans le dossier de la demande", async () => {
    const b = body();
    registerFiles(b);
    db.files.pop();
    const res = await post(b);
    expect(res.status).toBe(400);
    expect(db.inserts.furnitures).toBeUndefined();
  });

  it("400 si le téléphone est invalide ou la certification manquante", async () => {
    const b = body({ seller: { firstName: "A", email: "a@b.fr", phoneDial: "+33", phone: "12" } });
    expect((await post(b)).status).toBe(400);
    const c = body({ pickup: { street: "x", postalCode: "75011", city: "Paris", certified: false } });
    expect((await post(c)).status).toBe(400);
  });

  it("409 si la demande a déjà été envoyée", async () => {
    const b = body();
    registerFiles(b);
    db.existingCount = 1;
    expect((await post(b)).status).toBe(409);
  });

  it("supprime les pièces insérées si l'enregistrement des photos échoue", async () => {
    const b = body();
    registerFiles(b);
    db.failPhotos = true;
    expect((await post(b)).status).toBe(500);
    expect(db.deleted).toEqual([SUB]);
  });

  it("source inconnue ignorée", async () => {
    const b = body({ source: "pirate" });
    registerFiles(b);
    expect((await post(b)).status).toBe(200);
    expect(db.inserts.furnitures[0].source).toBeNull();
  });
});
