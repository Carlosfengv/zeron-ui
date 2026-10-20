import { defineConfig } from "@playwright/test";
import { e2eDefaults } from "./playwright.shared";

const origin = process.env.GROUPED_TABLE_TEST_ORIGIN;

export default defineConfig({
  ...e2eDefaults,
  testDir: "./tests",
  testMatch: ["grouped-data-table.e2e.ts", "sectioned-data-table.e2e.ts", "grouped-data-table-review.e2e.ts"],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: {
    ...e2eDefaults.use,
    baseURL: origin ?? "http://127.0.0.1:3361",
    headless: true,
    contextOptions: { reducedMotion: "reduce" },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : undefined,
  },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 } } },
  ],
  webServer: origin ? undefined : {
    command: "pnpm exec next dev --turbopack -p 3361 --hostname 127.0.0.1",
    env: { NEXT_DEV_DIST_DIR: ".next-dev-grouped-table" },
    url: "http://127.0.0.1:3361",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
