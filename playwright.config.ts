import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "i18n-navigation.e2e.ts",
  timeout: 45_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3333",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "pnpm start -- -p 3333",
    url: "http://127.0.0.1:3333",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
