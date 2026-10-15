import { USAGE_FORECAST_DAY as DAY } from "./usage-forecast-data";
import type { UsageForecastAccount, UsageForecastProvider } from "./usage-forecast-types";

/** Fixed example snapshot; no external account or billing service is connected. */
export const usageForecastDemoNow = Date.parse("2026-10-15T10:25:00+08:00");
const now = usageForecastDemoNow;
const samples = [0, 4, 11, 15, 16, 16, 17, 22, 37, 44, 47, 47, 48, 52, 68, 75, 77, 77, 79, 82];
function account(id: string, name: string, provider: UsageForecastProvider, usedPercent: number, elapsed: number, remaining: number, projected: number, description?: string): UsageForecastAccount {
  const windowStart = now - elapsed * DAY;
  return {
    id, name, provider, usedPercent, windowStart, resetsAt: now + remaining * DAY, description,
    dailyRate: (projected - usedPercent) / remaining,
    history: samples.map((value, index) => ({ timestamp: windowStart + index / (samples.length - 1) * (now - windowStart), usedPercent: value / 82 * usedPercent })),
    recentUsage: [11, 2, 2, 15, 31, 28, 6].map((value, index) => ({ id: `day-${index}`, label: ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Today"][index], usedPercent: Math.round(value / 82 * usedPercent) })),
  };
}
export const usageForecastDemoAccounts: readonly UsageForecastAccount[] = [
  account("claude-pro", "Claude Pro", "anthropic", 82, 2.861, 4.139, 200.3, "Claude Pro · Side project"),
  account("cursor-2", "Cursor (personal 2)", "cursor", 56, 5.8, 25.2, 300, "Cursor Pro · Personal workspace"),
  account("copilot", "Copilot", "github", 32, 13, 17, 70, "GitHub Copilot · Development"),
  account("cursor", "Cursor (personal)", "cursor", 39, 17, 13, 68, "Cursor Pro · Main workspace"),
  account("grok-heavy", "SuperGrok Heavy", "xai", 49, 5.625, 1.375, 60),
  account("claude-max", "Claude Max", "anthropic", 33, 4, 3, 59),
  account("google", "Google AI Pro", "google", 32, 5, 2, 49),
  account("codex-pro", "Codex Pro", "openai", 22, 4, 3, 39),
  account("grok", "SuperGrok", "xai", 16, 5.625, 1.375, 20),
  { ...account("codex-plus", "Codex Plus", "openai", 7, 0.4, 6.6, 39), status: "new", history: undefined, recentUsage: undefined },
  { ...account("antigravity", "Antigravity Starter Quota", "google", 53, 3, 4, 80), status: "disconnected", history: undefined, recentUsage: undefined },
];
