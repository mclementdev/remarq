import { test, expect } from "@playwright/test";
import { adminClient, createTestFurniture } from "./helpers";

test("une marque saisie via « Autre » peut être ajoutée à la liste", async ({ page }) => {
  const label = `Gufram${Date.now()}`;
  const f = await createTestFurniture({ brand_id: null, brand_other: label });
  const supabase = adminClient();
  await supabase.from("brand_suggestions").insert({ label, furniture_id: f.id });

  await page.goto("/reglages");
  const row = page.getByRole("listitem").filter({ hasText: label });
  await row.getByRole("button", { name: "Ajouter à la liste" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: `${label} · 1 meuble` })).toBeVisible();

  const { data } = await supabase.from("furnitures").select("brand_id, brand_other").eq("id", f.id).single();
  expect(data!.brand_id).toBeTruthy();
  expect(data!.brand_other).toBeNull();
  await supabase.from("furnitures").update({ brand_id: null, brand_other: label }).eq("id", f.id);
  await supabase.from("brands").delete().eq("name", label);
});

test("les paramètres alimentent les variables des e-mails", async ({ page }) => {
  const supabase = adminClient();
  const f = await createTestFurniture();
  await page.goto("/reglages");
  await page.getByLabel("Nom de la boutique").fill("Remarq Atelier");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Réglages enregistrés ✓");
  try {
    await page.goto(`/meubles/${f.id}`);
    await page.locator("#actions").getByLabel("Préparer un autre e-mail").selectOption({ label: "Refus – hors sélection" });
    await expect(page.getByLabel("Corps du message")).toHaveValue(/Merci d'avoir pensé à Remarq Atelier/);
    await expect(page.getByLabel("Corps du message")).toHaveValue(/L'équipe Remarq Atelier$/);
  } finally {
    await supabase.from("settings").update({ value: "Remarq" }).eq("key", "shop_name");
  }
});
