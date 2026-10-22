import { test, expect, type Page } from "@playwright/test";
import { adminClient, createTestFurniture } from "./helpers";

async function dragCard(page: Page, name: string, toStatus: string) {
  const card = page.getByTestId("kanban-card").filter({ hasText: name });
  const column = page.locator(`[data-status="${toStatus}"]`);
  await card.scrollIntoViewIfNeeded();
  const from = (await card.boundingBox())!;
  const to = (await column.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 20, from.y + from.height / 2 + 5, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 15 });
  await page.mouse.up();
  // dnd-kit ignore les clics pendant 50 ms après un dépôt (anti-clic accidentel).
  await page.waitForTimeout(100);
}

const dialog = (page: Page) => page.getByRole("dialog");

async function validate(page: Page) {
  await dialog(page).getByRole("button", { name: "Valider" }).click();
}

async function finishEmailStep(page: Page, emailTitle: string) {
  await expect(dialog(page).getByRole("heading", { name: `Mail « ${emailTitle} »` })).toBeVisible();
  await dialog(page).getByRole("button", { name: "Terminer" }).click();
  await expect(dialog(page)).toHaveCount(0);
}

test("parcours complet d'un meuble, de Nouvelle demande à Nouvelle vie", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const f = await createTestFurniture();

  // --- Kanban : Nouvelle demande → Accepté → Proposition envoyée → Proposition acceptée
  await page.goto("/crm");
  await expect(page.locator('[data-status="new"]').getByText(f.name)).toBeVisible();

  await dragCard(page, f.name, "accepted");
  await expect(dialog(page)).toContainText("Accepté — proposition à envoyer");
  await validate(page);
  await expect(page.locator('[data-status="accepted"]').getByText(f.name)).toBeVisible();

  await dragCard(page, f.name, "offer_sent");
  await dialog(page).getByLabel("Prix de rachat proposé").fill("1 200");
  await dialog(page).getByLabel("Prix de vente espéré").fill("2400");
  await dialog(page).getByLabel("Coût de transport").fill("150");
  await validate(page);
  await expect(dialog(page).getByRole("heading", { name: "Mail « Proposition »" })).toBeVisible();
  await expect(page.getByLabel("Corps du message")).toHaveValue(/Nous vous rachetons votre meuble pour 1 200 € TTC/);
  await dialog(page).getByRole("button", { name: "Copier tout" }).click();
  await expect(dialog(page).getByRole("button", { name: "Copié ✓" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Objet : Votre ");
  await dialog(page).getByRole("button", { name: "Terminer" }).click();

  await dragCard(page, f.name, "offer_accepted");
  await dialog(page).getByLabel("Rachat direct").check();
  await expect(dialog(page).getByLabel("Prix de rachat final")).toHaveValue("1200");
  await dialog(page).getByLabel("Prix de rachat final").fill("1100");
  await validate(page);
  const card = page.getByTestId("kanban-card").filter({ hasText: f.name });
  await expect(card.getByText("Rachat", { exact: true })).toBeVisible();
  await expect(card.getByText("2 400 €")).toBeVisible();

  // --- Fiche : la suite du workflow avec les boutons d'action
  await page.goto(`/meubles/${f.id}`);
  const header = page.locator("header").filter({ has: page.getByRole("heading", { level: 1 }) });

  await header.getByRole("button", { name: "Planifier l'enlèvement" }).click();
  await dialog(page).getByLabel("Date d'enlèvement").fill("2026-10-27");
  await dialog(page).getByLabel("Après-midi").check();
  await validate(page);
  await expect(page.getByLabel("Objet")).toHaveValue(/confirmé — mardi 27 octobre 2026/);
  await finishEmailStep(page, "Confirmation de prise en charge");

  await header.getByRole("button", { name: "Marquer en transit" }).click();
  await validate(page);

  await header.getByRole("button", { name: "Réceptionner" }).click();
  await dialog(page).getByLabel("Date de réception").fill("2026-10-28");
  await validate(page);

  await header.getByRole("button", { name: "Conforme — en préparation" }).click();
  await validate(page);
  await dialog(page).getByRole("button", { name: "Terminer" }).click();

  await header.getByRole("button", { name: "Mettre en ligne" }).click();
  await expect(dialog(page).getByLabel("Prix affiché")).toHaveValue("2400");
  await dialog(page).getByLabel("Publié sur le site").check();
  await validate(page);

  await header.getByRole("button", { name: "Marquer vendu" }).click();
  await dialog(page).getByLabel("Prix de vente final").fill("2300");
  await dialog(page).getByLabel("Leboncoin").check();
  await dialog(page).getByLabel("Date de vente").fill("2026-11-05");
  await validate(page);

  await header.getByRole("button", { name: "Retiré par l'acheteur" }).click();
  await validate(page);
  await expect(header.getByText("Nouvelle vie")).toBeVisible();

  // --- Historique : chaque changement est visible avec date et auteur
  const history = page.locator("#historique");
  for (const line of [
    "Nouvelle demande → Accepté",
    "Accepté → Proposition envoyée",
    "Proposition envoyée → Proposition acceptée",
    "Proposition acceptée → Enlèvement planifié",
    "Enlèvement planifié → En transit",
    "En transit → Réceptionné",
    "Réceptionné → En préparation",
    "En préparation → En ligne",
    "En ligne → Vendu",
    "Vendu → Nouvelle vie",
  ]) {
    await expect(history.getByText(line, { exact: true })).toBeVisible();
  }
  await expect(history.getByText("Prix de rachat proposé : 1 200 €")).toBeVisible();
  await expect(history.getByText("Mail « Proposition » préparé")).toBeVisible();
  await expect(history.getByText("Mail « Proposition » copié")).toBeVisible();

  const supabase = adminClient();
  const { data: rows } = await supabase.from("status_history").select("author_id, to_status").eq("furniture_id", f.id);
  expect(rows).toHaveLength(11);
  expect(rows!.filter((r) => r.author_id === "11111111-1111-1111-1111-111111111111")).toHaveLength(10);
  const { data: saved } = await supabase.from("furnitures").select("mode, final_buyout_price, final_sale_price, sale_channel, sold_at, status").eq("id", f.id).single();
  expect(saved).toMatchObject({ mode: "buyout", final_buyout_price: 1100, final_sale_price: 2300, sale_channel: "leboncoin", sold_at: "2026-11-05", status: "done" });
  const { data: appts } = await supabase.from("appointments").select("type, appointment_date, period").eq("furniture_id", f.id);
  expect(appts).toEqual([{ type: "seller_pickup", appointment_date: "2026-10-27", period: "afternoon" }]);
});

test("un refus demande le motif et propose le bon modèle", async ({ page }) => {
  const f = await createTestFurniture();
  await page.goto(`/meubles/${f.id}`);
  await page.locator("header").getByRole("button", { name: "Refuser" }).click();
  await validate(page);
  await expect(dialog(page).getByRole("alert")).toHaveText("Champ obligatoire : Motif du refus.");
  await dialog(page).getByLabel("État trop dégradé").check();
  await validate(page);
  await finishEmailStep(page, "Refus – état");
  await expect(page.locator("#historique").getByText("Motif : État trop dégradé")).toBeVisible();
});

test("un meuble non conforme affiche J+X / 15 et peut être conservé après abandon", async ({ page }) => {
  const sixteenDaysAgo = new Date(Date.now() - 16 * 86_400_000).toISOString();
  const f = await createTestFurniture({ status: "non_conform", mode: "consignment", non_conform_at: sixteenDaysAgo, status_changed_at: sixteenDaysAgo, conformity_report: "Pied fendu" });

  await page.goto("/crm");
  const card = page.getByTestId("kanban-card").filter({ hasText: f.name });
  await expect(card.getByText("J+16 / 15")).toBeVisible();

  await page.goto(`/meubles/${f.id}`);
  await page.locator("header").getByRole("button", { name: "Conforme — en préparation" }).click();
  await expect(dialog(page).getByLabel(/Abandonné par le client/)).toBeChecked();
  await expect(dialog(page).getByLabel("Prix d'achat")).toHaveValue("0");
  await validate(page);
  await expect(page.locator("header").getByText("Abandonné par le client")).toBeVisible();
  await expect(page.locator("header").getByText("Rachat", { exact: true })).toBeVisible();
});
