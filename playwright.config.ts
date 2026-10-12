import { defineConfig } from "@playwright/test";
import { e2eDefaults } from "./playwright.shared";

export default defineConfig({
  ...e2eDefaults,
  testDir: "./tests",
  testMatch: ["i18n-navigation.e2e.ts", "docs-collections.e2e.ts"],
  timeout: 45_000,
  workers: 1,
  use: {
    ...e2eDefaults.use,
    baseURL: "http://127.0.0.1:3333",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "pnpm exec next start -p 3333 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3333",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
