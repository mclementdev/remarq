import { test, expect, type Page } from "@playwright/test";
import { createTestFurniture } from "./helpers";

const tileValue = async (page: Page, label: string) => {
  const text = await page.locator(".panel", { has: page.getByText(label, { exact: true }) }).locator("p.text-2xl").innerText();
  return Number(text.replace(/[^\d,-]/g, "").replace(",", "."));
};

test("le dashboard totalise les ventes du mois sur la date de vente", async ({ page }) => {
  await page.goto("/");
  const soldBefore = await tileValue(page, "Meubles vendus");
  const revenueBefore = await tileValue(page, "Chiffre d'affaires TTC");
  const marginBefore = await tileValue(page, "Marge totale");

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
  await createTestFurniture({ status: "done", mode: "buyout", final_buyout_price: 600, final_sale_price: 1000, sold_at: today });

  await page.reload();
  expect(await tileValue(page, "Meubles vendus")).toBe(soldBefore + 1);
  expect(await tileValue(page, "Chiffre d'affaires TTC")).toBe(revenueBefore + 1000);
  expect(await tileValue(page, "Marge totale")).toBe(marginBefore + 400);

  await page.getByRole("link", { name: /Nouvelle demande/ }).first().click();
  await expect(page).toHaveURL(/\/crm\?statut=new$/);
  await expect(page.locator('[data-status="accepted"]')).toHaveCount(0);
});
