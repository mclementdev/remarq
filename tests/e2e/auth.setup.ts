import { test as setup, expect } from "@playwright/test";
import { TEST_USER } from "./helpers";

setup("connexion de Martin", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("E-mail").fill(TEST_USER.email);
  await page.getByLabel("Mot de passe").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  await page.context().storageState({ path: "tests/e2e/.auth/martin.json" });
});
