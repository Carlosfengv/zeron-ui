import { defineConfig } from "@playwright/test";
import { e2eDefaults } from "./playwright.shared";

// Build the candidate before running. This suite intentionally owns its server.
export default defineConfig({
  ...e2eDefaults,
  testDir: "./tests",
  testMatch: "navigation-loading.e2e.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: { ...e2eDefaults.use, baseURL: "http://127.0.0.1:3345", headless: true },
  projects: [
    { name: "chromium-desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 960 } } },
    { name: "chromium-mobile-reduced", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, contextOptions: { reducedMotion: "reduce" } } },
  ],
  webServer: {
    command: "pnpm exec next start -p 3345 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3345",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
