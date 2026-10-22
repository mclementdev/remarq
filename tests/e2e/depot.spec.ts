import { test, expect, type Page } from "@playwright/test";
import { adminClient, fixture } from "./helpers";

async function fillRequiredFields(page: Page, name: string) {
  await page.getByLabel("Nom / modèle du meuble").fill(name);
  await page.getByLabel("Catégorie").selectOption({ label: "Assises" });
  await page.locator("#brand").selectOption({ label: "Ibisco" });
  await page.getByLabel("Description rapide").fill("Fauteuil en cuir blanc, structure chromée, très confortable.");
  await page.locator("#condition").selectOption({ label: "Très bon état" });
  await page.getByLabel("Prénom").fill("Claire");
  await page.locator("#lastName").fill("Dupont");
  await page.getByLabel("E-mail").fill("claire.dupont@example.com");
  await page.getByLabel("Téléphone").fill("06 12 34 56 78");
  await page.getByLabel("Adresse (rue)").fill("12 rue des Lilas");
  await page.getByLabel("Code postal").fill("75011");
  await page.getByLabel("Ville").fill("Paris");
}

async function addPhoto(page: Page, slotLabel: string, file: string) {
  await page.locator("label", { hasText: `la photo ${slotLabel}` }).locator("xpath=following-sibling::input").setInputFiles(fixture(file));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/depot");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
});

test("bloque l'envoi avec moins de 3 photos et sans certification", async ({ page }) => {
  await fillRequiredFields(page, "Test blocage");
  await addPhoto(page, "Face", "meuble-1.jpg");
  await addPhoto(page, "Dos", "meuble-2.jpg");
  await expect(page.getByText("✓ Envoyée")).toHaveCount(2, { timeout: 30_000 });

  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByText("Ajoutez au moins 3 photos du meuble.")).toBeVisible();
  await expect(page.getByText("Vous devez cocher la case de certification.")).toBeVisible();
  await expect(page).toHaveURL(/\/depot$/);
});

test("un vendeur dépose un meuble depuis son téléphone", async ({ page }) => {
  const name = `Fauteuil Safari E2E ${Date.now()}`;
  await fillRequiredFields(page, name);
  await page.getByLabel("Designer").fill("Dino Gavina");
  await page.getByLabel("Largeur").fill("80");
  await page.getByLabel("Étage").selectOption({ label: "3e étage" });
  await page.getByLabel("Oui").check();

  await addPhoto(page, "Face", "meuble-1.jpg");
  await addPhoto(page, "Dos", "meuble-2.jpg");
  await addPhoto(page, "Profil", "meuble-3.jpg");
  await addPhoto(page, "Certificat", "meuble-4.jpg");
  await expect(page.getByText("✓ Envoyée")).toHaveCount(4, { timeout: 30_000 });
  await expect(page.getByText("3 / 10 photos")).toBeVisible();

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();

  await expect(page).toHaveURL(/\/depot\/merci$/);
  await expect(page.getByText("Merci, nous avons bien reçu votre demande")).toBeVisible();

  const supabase = adminClient();
  const { data: furniture } = await supabase.from("furnitures").select("id, status, width_cm, floor, has_elevator, certified_at, certification_text").eq("name", name).single();
  expect(furniture?.status).toBe("new");
  expect(Number(furniture?.width_cm)).toBe(80);
  expect(furniture?.floor).toBe("3");
  expect(furniture?.has_elevator).toBe(true);
  expect(furniture?.certified_at).toBeTruthy();
  expect(furniture?.certification_text).toContain("Je certifie que ce meuble est authentique");

  const { data: photos } = await supabase.from("photos").select("kind, slot, is_main").eq("furniture_id", furniture!.id);
  expect(photos?.filter((p) => p.kind === "deposit")).toHaveLength(3);
  expect(photos?.filter((p) => p.kind === "certificate")).toHaveLength(1);
  expect(photos?.find((p) => p.is_main)?.slot).toBe("front");

  const { data: history } = await supabase.from("status_history").select("to_status").eq("furniture_id", furniture!.id);
  expect(history).toEqual([{ to_status: "new" }]);

  // « Déposer un autre meuble » : coordonnées pré-remplies.
  await page.getByRole("link", { name: "Déposer un autre meuble" }).click();
  await expect(page.getByLabel("E-mail")).toHaveValue("claire.dupont@example.com");
  await expect(page.getByLabel("Nom / modèle du meuble")).toHaveValue("");
});
