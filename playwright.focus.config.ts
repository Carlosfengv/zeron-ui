import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "focus-modality.e2e.ts",
  timeout: 45_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3334",
    headless: true,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 720 } },
    },
    {
      name: "chromium-mobile",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "pnpm exec next start -p 3334",
    url: "http://127.0.0.1:3334",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
