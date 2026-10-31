import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", locale: "fr-FR", timezoneId: "Europe/Paris", trace: "retain-on-failure" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "mobile", testMatch: /(depot|salon)\.spec\.ts/, use: { ...devices["Pixel 7"] } },
    {
      name: "desktop",
      testIgnore: [/(depot|salon)\.spec\.ts/, /auth\.setup\.ts/],
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1600, height: 900 }, storageState: "tests/e2e/.auth/martin.json" },
    },
  ],
  webServer: { command: "npm run dev", port: 3100, reuseExistingServer: true, timeout: 120_000 },
});
