import type { CreditUsageData } from "./credit-usage-types";

/** Documentation defaults. Product integrations should pass live credit data. */
export const creditUsageDemoData = {
  planName: "Pro plan",
  totalCredits: 5_000,
  currentCycle: {
    resetAt: "Sep 19",
    projection: {
      depletesAt: "Sep 12",
      daysBeforeReset: 7,
    },
    models: [
      { id: "pixels-ui", name: "Pixelsz UI 2.1", credits: 1_548, color: "blue" },
      { id: "claude-opus", name: "Claude Opus 5 · Long-running (high)", credits: 946, color: "orange", provider: "anthropic" },
      { id: "gpt-sol", name: "GPT-5.6 Sol", credits: 598, color: "violet", provider: "openai" },
      { id: "claude-sonnet", name: "Claude Sonnet 5", credits: 324, color: "green", provider: "anthropic" },
      { id: "gemini-flash", name: "Gemini 3.8 Flash", credits: 144, color: "cyan", provider: "google" },
    ],
  },
  previousCycle: {
    resetAt: "Aug 19",
    models: [
      { id: "pixels-ui", name: "Pixelsz UI 2.1", credits: 1_802, color: "blue" },
      { id: "claude-opus", name: "Claude Opus 5 · Long-running (high)", credits: 1_104, color: "orange", provider: "anthropic" },
      { id: "gpt-sol", name: "GPT-5.6 Sol", credits: 692, color: "violet", provider: "openai" },
      { id: "claude-sonnet", name: "Claude Sonnet 5", credits: 438, color: "green", provider: "anthropic" },
      { id: "gemini-flash", name: "Gemini 3.8 Flash", credits: 248, color: "cyan", provider: "google" },
    ],
  },
  autoSwitch: {
    targetModel: "Claude Sonnet 5",
    threshold: 90,
    description: "Keeps runs going on cheaper credits until the cycle resets",
  },
} as const satisfies CreditUsageData;
