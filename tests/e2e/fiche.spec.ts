import { test, expect } from "@playwright/test";
import { createTestFurniture } from "./helpers";

test("modifier les informations d'un meuble les journalise dans l'historique", async ({ page }) => {
  const f = await createTestFurniture();
  await page.goto(`/meubles/${f.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(f.name);

  const info = page.locator("#informations");
  await info.getByRole("button", { name: "Modifier" }).click();
  await info.getByLabel("Designer").fill("Mario Bellini");
  await info.getByLabel("Matières / couleur").fill("Cuir cognac");
  await info.getByRole("button", { name: "Enregistrer" }).click();

  await expect(info.getByText("Mario Bellini")).toBeVisible();
  const history = page.locator("#historique");
  await expect(history.getByText("Informations modifiées : designer, matières")).toBeVisible();
  await expect(history.getByText(/· Martin$/).first()).toBeVisible();
});

test("la liste retrouve un meuble par le nom du vendeur", async ({ page }) => {
  const f = await createTestFurniture({ seller_last_name: "Zébulon-Test" });
  await page.goto("/meubles?q=Zébulon");
  await expect(page.getByRole("link", { name: f.name })).toBeVisible();
  await page.getByRole("link", { name: f.name }).click();
  await expect(page).toHaveURL(new RegExp(`/meubles/${f.id}$`));
});

test("notes internes avec pièce jointe et rendez-vous du calendrier", async ({ page }) => {
  const f = await createTestFurniture();
  await page.goto(`/meubles/${f.id}`);

  const notes = page.locator("#notes");
  await notes.getByPlaceholder("Ajouter une note interne…").fill("Le vendeur préfère être appelé après 18 h.");
  await notes.locator('input[type="file"]').setInputFiles({ name: "facture.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });
  await notes.getByRole("button", { name: "Ajouter la note" }).click();
  await expect(notes.getByText("Le vendeur préfère être appelé après 18 h.")).toBeVisible();
  await expect(notes.getByRole("link", { name: "facture.pdf" })).toBeVisible();
  await expect(notes.getByText(/· Martin$/)).toBeVisible();

  const cal = page.locator("#calendrier");
  await cal.getByRole("button", { name: "Ajouter un rendez-vous" }).click();
  await cal.getByLabel("Type").selectOption({ label: "Retrait acheteur" });
  await cal.getByLabel("Date").fill("2026-11-12");
  await cal.getByText("Matin", { exact: true }).click();
  await cal.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(cal.getByText("Retrait acheteur — jeudi 12 novembre 2026, matin")).toBeVisible();
  await cal.getByLabel("Rendez-vous effectué").check();
  await expect(page.locator("#historique").getByText("Rendez-vous effectué : Retrait acheteur du 12/11/2026")).toBeVisible();
  await expect(page.locator("#historique").getByText(/Note : « Le vendeur préfère/)).toBeVisible();
});
