import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { adminClient, fixture } from "./helpers";

const FILES = ["meuble-1.jpg", "meuble-2.jpg", "meuble-3.jpg", "meuble-4.jpg"];
/** n photos (les fixtures, réutilisées sous des noms différents). */
const photos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ name: `photo-${i + 1}.jpg`, mimeType: "image/jpeg", buffer: fs.readFileSync(fixture(FILES[i % FILES.length])) }));

async function fillPiece(page: Page, n: number, { brand, model, type, quantity = "1", score, photoCount }: { brand: string; model?: string; type: string; quantity?: string; score?: number; photoCount: number }) {
  const piece = page.getByRole("region", { name: `Pièce ${n}` });
  await piece.getByLabel("Marque ou designer").fill(brand);
  if (model) await piece.getByLabel("Modèle").fill(model);
  await piece.getByLabel("Type de pièce").selectOption({ label: type });
  await piece.getByLabel("Quantité").fill(quantity);
  await piece.getByLabel("Description").fill("Bel état général, dimensions environ 80 × 90 cm.");
  if (score !== undefined) await piece.getByLabel("Note d'état").fill(String(score));
  await piece.locator('input[type="file"]').setInputFiles(photos(photoCount));
  await expect(piece.getByText("✓ Envoyée")).toHaveCount(photoCount, { timeout: 60_000 });
}

/** Étape 2 (enlèvement) puis passage à l'étape 3 (coordonnées). */
async function fillPickup(page: Page) {
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByRole("heading", { name: "Organisons l'enlèvement" })).toBeVisible();
  await page.getByLabel("Adresse").fill("12 rue des Lilas");
  await page.getByLabel("Code postal").fill("75011");
  await page.getByLabel("Ville").fill("Paris");
  await page.getByLabel("Étage").selectOption({ label: "3e étage" });
  await page.getByLabel("Oui").check();
  await page.getByRole("checkbox", { name: /Je certifie/ }).check();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByRole("heading", { name: "Faisons connaissance" })).toBeVisible();
}

async function fillSellerAndSend(page: Page, email: string) {
  await page.locator("#firstName").fill("Claire");
  await page.locator("#email").fill(email);
  await page.locator("#phone").fill("06 12 34 56 78");
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page).toHaveURL(/\/depot\/merci/);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/depot");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
});

test("étape 1 : bloque sans photo, puis brouillon retrouvé après rechargement", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Parlez-nous de vos pièces" })).toBeVisible();
  const piece = page.getByRole("region", { name: "Pièce 1" });
  await piece.getByLabel("Marque ou designer").fill("Knoll");
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByText("Choisissez le type de pièce.")).toBeVisible();
  await expect(page.getByText("Ajoutez au moins 3 photos de cette pièce.")).toBeVisible();

  await page.waitForTimeout(600); // enregistrement différé du brouillon
  await page.reload();
  await expect(page.getByRole("heading", { name: "Parlez-nous de vos pièces" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Pièce 1" }).getByLabel("Marque ou designer")).toHaveValue("Knoll");
});

test("un vendeur dépose une pièce depuis son téléphone", async ({ page }) => {
  const email = `une-piece-${Date.now()}@example.com`;
  await fillPiece(page, 1, { brand: "ibisco", model: "Safari", type: "Fauteuil ou chauffeuse", score: 9, photoCount: 3 });
  await fillPickup(page);

  // Étape 3 : champs obligatoires et téléphone vérifiés.
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByText("Indiquez votre prénom.")).toBeVisible();
  await page.locator("#firstName").fill("Claire");
  await page.locator("#email").fill(email);
  await page.locator("#phone").fill("12");
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByText("Numéro de téléphone invalide.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Faisons connaissance" })).toBeVisible();

  await fillSellerAndSend(page, email);
  await expect(page.getByText("Nous avons bien reçu votre demande.")).toBeVisible();

  const supabase = adminClient();
  const { data: rows } = await supabase
    .from("furniture_overview")
    .select("id, name, status, item_type, category, brand_name, brand_id, model, quantity, condition, condition_score, seller_phone, seller_last_name, floor, has_elevator, contact_consent_at, certified_at, submission_size, source")
    .eq("seller_email", email);
  expect(rows).toHaveLength(1);
  const f = rows![0];
  expect(f).toMatchObject({
    name: "Fauteuil ou chauffeuse · Ibisco Safari",
    status: "new",
    item_type: "armchair",
    category: "seating",
    brand_name: "Ibisco",
    model: "Safari",
    quantity: 1,
    condition: "new",
    condition_score: 9,
    seller_phone: "+33612345678",
    seller_last_name: null,
    floor: "3",
    has_elevator: true,
    submission_size: 1,
    source: null,
  });
  expect(f.brand_id).toBeTruthy();
  expect(f.contact_consent_at).toBeTruthy();
  expect(f.certified_at).toBeTruthy();

  const { data: ph } = await supabase.from("photos").select("kind, is_main, position").eq("furniture_id", f.id).order("position");
  expect(ph).toHaveLength(3);
  expect(ph![0].is_main).toBe(true);

  // « Proposer d'autres pièces » : coordonnées et adresse gardées pour la prochaine demande.
  await page.getByRole("link", { name: "Proposer d'autres pièces" }).click();
  await expect(page.getByRole("heading", { name: "Parlez-nous de vos pièces" })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("remarq-depot-vendeur-v2"))).toContain(email);
});

test("deux pièces (dont une à 10 photos) depuis le salon via Instagram", async ({ page }) => {
  test.setTimeout(180_000);
  const email = `deux-pieces-${Date.now()}@example.com`;
  await page.goto("/salon?source=ig#formulaire");
  await fillPiece(page, 1, { brand: "Inconnu", type: "Luminaire", quantity: "2", score: 3, photoCount: 3 });
  await page.getByRole("button", { name: "Ajouter une autre pièce" }).click();
  await fillPiece(page, 2, { brand: "Pierre Paulin", model: "Pumpkin", type: "Canapé", photoCount: 10 });
  await expect(page.getByRole("region", { name: "Pièce 2" }).getByText("Ajouter d'autres photos")).toHaveCount(0);
  await fillPickup(page);
  await fillSellerAndSend(page, email);
  await expect(page.getByText("votre demande pour 2 pièces")).toBeVisible();

  const supabase = adminClient();
  const { data: rows } = await supabase
    .from("furniture_overview")
    .select("id, name, item_index, submission_id, submission_size, source, quantity, condition, brand_other, category")
    .eq("seller_email", email)
    .order("item_index");
  expect(rows).toHaveLength(2);
  expect(rows![0].submission_id).toBe(rows![1].submission_id);
  expect(rows![0]).toMatchObject({ item_index: 1, name: "Luminaire", source: "ig", quantity: 2, condition: "used", brand_other: "Inconnu", submission_size: 2 });
  expect(rows![1]).toMatchObject({ item_index: 2, name: "Canapé · Pierre Paulin Pumpkin", category: "seating", brand_other: "Pierre Paulin" });

  const { count } = await supabase.from("photos").select("id", { count: "exact", head: true }).eq("furniture_id", rows![1].id);
  expect(count).toBe(10);
  const { data: suggestions } = await supabase.from("brand_suggestions").select("label").in("furniture_id", rows!.map((r) => r.id));
  expect(suggestions).toEqual([{ label: "Pierre Paulin" }]);
});
