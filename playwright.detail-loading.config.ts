import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "detail-loading.e2e.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3358", headless: true, trace: "retain-on-failure" },
  projects: [
    { name: "chromium-desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 960 } } },
    { name: "chromium-mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, contextOptions: { reducedMotion: "reduce" } } },
  ],
  webServer: {
    command: "./node_modules/.bin/next start -p 3358 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3358",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
