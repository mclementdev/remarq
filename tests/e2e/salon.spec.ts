import { test, expect } from "@playwright/test";
import { adminClient } from "./helpers";

// Une IP différente par test : la limite de 5 envois / 10 min ne gêne pas les relances.
test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` });
});

test("visiteur sur le stand : reçoit le lien et voit le formulaire en bas de page", async ({ page }) => {
  const email = `visiteur-${Date.now()}@exemple.fr`;
  await page.goto("/salon?source=carte");

  const hero = page.locator("header", { has: page.getByRole("heading", { level: 1 }) });
  await expect(hero.getByRole("link").first()).toHaveText("Recevez le lien pour plus tard");

  await page.getByLabel("Votre e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByText("Merci d'accepter l'utilisation de votre e-mail.")).toBeVisible();

  await page.getByRole("checkbox", { name: /J'accepte que Remarq utilise mon e-mail/ }).check();
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByRole("status")).toContainText("C'est envoyé !");

  const { data } = await adminClient().from("salon_leads").select("source, consent, remind_at, email_sent_at").eq("email", email).single();
  expect(data).toMatchObject({ source: "carte", consent: true, remind_at: null });
  expect(data!.email_sent_at).toBeTruthy();

  await hero.getByRole("link", { name: "Remplir le formulaire maintenant" }).click();
  await expect(page).toHaveURL(/#formulaire$/);
  await expect(page.getByRole("heading", { name: "Décrivez votre meuble" })).toBeInViewport();
  await expect(page.getByLabel("Nom / modèle du meuble")).toBeVisible();
  await expect(page.getByRole("button", { name: "Envoyer ma demande" })).toBeVisible();
});

test("rappel facultatif enregistré en heure de Paris", async ({ page }) => {
  const email = `rappel-${Date.now()}@exemple.fr`;
  const day = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
  await page.goto("/salon?source=stand");
  await page.getByLabel("Votre e-mail").fill(email);
  await page.getByLabel("Me le rappeler le (facultatif)").fill(`${day}T18:30`);
  await page.getByRole("checkbox", { name: /J'accepte/ }).check();
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByRole("status")).toContainText("C'est envoyé !");
  const { data } = await adminClient().from("salon_leads").select("remind_at").eq("email", email).single();
  const local = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }).format(new Date(data!.remind_at!));
  expect(local).toBe(`${day} 18:30`);
});

test("visiteur venant d'Instagram : le formulaire est mis en avant", async ({ page }) => {
  await page.goto("/salon?source=ig");
  const hero = page.locator("header", { has: page.getByRole("heading", { level: 1 }) });
  await expect(hero.getByRole("link").first()).toHaveText("Remplir le formulaire maintenant");
});
