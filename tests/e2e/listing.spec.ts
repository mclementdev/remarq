import { test, expect } from "@playwright/test";
import JSZip from "jszip";
import fs from "node:fs";
import { adminClient, createTestFurniture } from "./helpers";

test("ZIP des photos : contient les photos du dépôt dans l'ordre", async ({ page }) => {
  const supabase = adminClient();
  const { data: withPhotos } = await supabase.from("photos").select("furniture_id").eq("kind", "deposit").not("furniture_id", "is", null).limit(1).single();
  test.skip(!withPhotos, "Lancer d'abord le test du formulaire (mobile) pour avoir un meuble avec photos.");
  await page.goto(`/meubles/${withPhotos!.furniture_id}`);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Télécharger les photos (ZIP)" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/-photos\.zip$/);
  const zip = await JSZip.loadAsync(fs.readFileSync((await download.path())!));
  const names = Object.keys(zip.files);
  expect(names.length).toBe(3);
  expect(names[0]).toMatch(/-01\.jpg$/);
});

test("génération IA : erreur explicite sans clé API, textes éditables et sauvegardés", async ({ page }) => {
  test.skip(!!process.env.ANTHROPIC_API_KEY, "Clé présente : le chemin d'erreur n'est pas testable.");
  const f = await createTestFurniture({
    status: "preparing",
    listing_site: { title: "Fauteuil test", body: "Texte initial", missing: [], generatedAt: new Date().toISOString() },
  });
  await page.goto(`/meubles/${f.id}`);
  const section = page.locator("#mise-en-ligne");

  await section.getByRole("button", { name: "Régénérer les deux textes" }).click();
  await expect(section.getByRole("alert")).toContainText("ANTHROPIC_API_KEY");

  await section.getByLabel("Texte", { exact: true }).fill("Texte corrigé à la main");
  await section.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(section.getByRole("button", { name: "Enregistré ✓" })).toBeVisible();
  const { data } = await adminClient().from("furnitures").select("listing_site").eq("id", f.id).single();
  expect((data!.listing_site as { body: string }).body).toBe("Texte corrigé à la main");

  await section.getByLabel("Publié sur le site").check();
  await section.getByRole("button", { name: "Enregistrer la publication" }).click();
  await expect(section.getByRole("status")).toHaveText("Publication enregistrée ✓");
});
