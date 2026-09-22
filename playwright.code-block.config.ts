import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "code-block.e2e.ts",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3335",
    headless: true,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    {
      name: "firefox-desktop",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "webkit-mobile",
      use: devices["iPhone 13"],
    },
  ],
  webServer: {
    command: "pnpm exec next start -p 3335",
    url: "http://127.0.0.1:3335",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
