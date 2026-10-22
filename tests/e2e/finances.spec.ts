import { test, expect } from "@playwright/test";
import { adminClient, createTestFurniture } from "./helpers";

const detail = (page: import("@playwright/test").Page) => page.getByRole("table", { name: "Détail du calcul" });

test("marge d'un rachat : lignes d'ajustement, temps passé et détail du calcul", async ({ page }) => {
  const f = await createTestFurniture({ status: "sold", mode: "buyout", final_buyout_price: 1100, final_sale_price: 2300, sold_at: "2026-11-05" });
  await page.goto(`/meubles/${f.id}`);
  const fin = page.locator("#finances");

  await fin.getByPlaceholder("Libellé (ex. produit de nettoyage)").fill("Produit de nettoyage cuir");
  await fin.getByLabel("Montant (€)").fill("45,50");
  await fin.getByRole("button", { name: "Ajouter" }).click();
  await expect(fin.getByRole("listitem").filter({ hasText: "Produit de nettoyage cuir" })).toContainText("-45,50 €");

  await fin.getByPlaceholder("Libellé (ex. produit de nettoyage)").fill("Remboursement transport");
  await fin.getByText("Gain", { exact: true }).click();
  await fin.getByLabel("Montant (€)").fill("20");
  await fin.getByRole("button", { name: "Ajouter" }).click();
  await expect(fin.getByRole("listitem").filter({ hasText: "Remboursement transport" })).toContainText("+20,00 €");

  // 2 300 − 1 100 − 45,50 + 20 = 1 174,50
  await expect(detail(page).getByRole("row", { name: /= Marge brute/ })).toContainText("1 174,50 €");
  await expect(detail(page).getByRole("row", { name: /= Marge nette/ })).toContainText("1 174,50 €");

  const time = page.locator("#temps");
  await time.getByRole("button", { name: "Ajouter 1 h de nettoyage" }).click();
  await time.getByRole("button", { name: "Ajouter 0,5 h de nettoyage" }).click();
  await time.getByRole("button", { name: "Ajouter 0,25 h de réparation" }).click();
  await expect(time.getByTestId("total-cleaning")).toHaveText("1,5 h");
  await expect(time.getByTestId("total-hours")).toHaveText("1,75 h");

  // Taux horaire 40 € : marge nette = 1 174,50 − 1,75 × 40 = 1 104,50
  const supabase = adminClient();
  await supabase.from("settings").update({ value: 40 }).eq("key", "hourly_rate");
  try {
    await page.reload();
    await expect(detail(page).getByRole("row", { name: /Temps passé/ })).toContainText("-70,00 €");
    await expect(detail(page).getByRole("row", { name: /= Marge nette/ })).toContainText("1 104,50 €");
  } finally {
    await supabase.from("settings").update({ value: 0 }).eq("key", "hourly_rate");
  }
});

test("dépôt-vente : recette, % de commission et montant à reverser", async ({ page }) => {
  const f = await createTestFurniture({ status: "sold", mode: "consignment", final_sale_price: 2000, sold_at: "2026-11-05" });
  await page.goto(`/meubles/${f.id}`);
  const fin = page.locator("#finances");
  await fin.getByRole("button", { name: "Modifier" }).click();
  await fin.getByLabel("Commission dépôt-vente (€)").fill("500");
  await fin.getByRole("button", { name: "Enregistrer" }).click();
  await expect(fin.getByText("(25 %)")).toBeVisible();
  await expect(detail(page).getByRole("row", { name: /= Recette/ })).toContainText("500,00 €");
  await expect(detail(page).getByRole("row", { name: /Montant à reverser/ })).toContainText("1 500,00 €");
  await expect(page.locator("#historique").getByText("Finances modifiées : Commission dépôt-vente → 500 €")).toBeVisible();
});
