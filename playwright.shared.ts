import type { PlaywrightTestConfig } from "@playwright/test";

export const e2eDefaults = {
  forbidOnly: Boolean(process.env.CI),
  failOnFlakyTests: true,
  retries: 0,
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
} satisfies PlaywrightTestConfig;
