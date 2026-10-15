import type { UsageTimelineAccount, UsageTimelineProvider, UsageTimelineWindow } from "./usage-timeline-types";

export const usageTimelineDemoNow = Date.parse("2026-10-15T10:30:00+08:00");
const at = (day: number, time = "00:00") => Date.parse(`2026-10-${String(day).padStart(2, "0")}T${time}:00+08:00`);
const window = (day: number, time: string, usedPercent: number): UsageTimelineWindow => ({ start: at(day, time), end: at(day + 7, time), previousStart: at(day - 7, time), nextEnd: at(day + 14, time), usedPercent });
function account(id: string, name: string, plan: string, email: string, weekly: UsageTimelineWindow, limits: [string, number][], options: Partial<UsageTimelineAccount> = {}): UsageTimelineAccount {
  return { id, name, plan, email, limits: limits.map(([label, usedPercent], index) => ({ id: `${id}-${index}`, label, usedPercent })),
    windows: { weekly, "five-hour": { start: at(15, "08:00"), end: at(15, "13:00"), previousStart: at(15, "03:00"), nextEnd: at(15, "18:00"), usedPercent: limits.find(([label]) => label === "Session")?.[1] ?? weekly.usedPercent },
      cycle: { start: at(1), end: Date.parse("2026-11-01T00:00:00+08:00"), previousStart: Date.parse("2026-09-01T00:00:00+08:00"), nextEnd: Date.parse("2026-12-01T00:00:00+08:00"), usedPercent: weekly.usedPercent } }, ...options };
}

/** Fixed demonstration data, with no live account connection. */
export const usageTimelineDemoProviders: readonly UsageTimelineProvider[] = [
  { id: "codex", name: "Codex", brand: "openai", accounts: [
    account("codex-personal", "Personal", "Plus", "nadiaashworth@example.com", window(14, "23:28", 7), [["Session", 24], ["Weekly", 7]], { markers: [{ id: "early", at: at(14, "22:30"), kind: "reset", label: "Reset early · Oct 14, 22:30" }] }),
    account("codex-work", "Work", "Pro", "nadia.ashworth@tessellate.example", window(11, "11:00", 22), [["Weekly", 22]], { markers: [{ id: "banked", at: at(17, "12:00"), kind: "expiry", label: "Banked reset expires · Oct 17, 12:00" }] }),
  ] },
  { id: "claude", name: "Claude", brand: "anthropic", accounts: [
    account("claude-personal", "Personal", "Max", "nadiaashworth@example.com", window(11, "13:52", 33), [["Session", 39], ["Weekly", 33], ["Opus", 12]], { markers: [{ id: "early", at: at(11, "13:00"), label: "Reset early · Oct 11, 13:00" }] }),
    account("claude-side", "Side project", "Pro", "nadia.ashworth@mail.example", window(12, "13:45", 82), [["Session", 44], ["Weekly", 82], ["Sonnet", 53]]),
  ] },
  { id: "grok", name: "Grok", brand: "xai", accounts: [
    account("grok-personal", "Personal", "SuperGrok", "nadiaashworth@example.com", window(9, "19:18", 16), [["Weekly Pool", 16], ["Chat", 5], ["Code", 11]]),
    account("grok-heavy", "Personal", "SuperGrok Heavy", "nadia.ashworth@mail.example", window(9, "18:58", 49), [["Weekly Pool", 49], ["Chat", 49]]),
  ] },
  { id: "antigravity", name: "Antigravity", brand: "antigravity", accounts: [
    account("antigravity-pro", "Personal", "Google AI Pro", "nadiaashworth@example.com", window(9, "20:26", 51), [["Gemini", 5], ["Gemini", 32], ["Claude and GPT", 40], ["Claude and GPT", 51]]),
    account("antigravity-starter", "Personal", "Starter Quota", "nadia_a65@example.com", window(12, "15:39", 53), [["Gemini", 53], ["Claude and GPT", 46]], { disconnected: true }),
  ] },
  { id: "cursor", name: "Cursor", brand: "cursor", accounts: [
    account("cursor-personal", "Personal", "", "nadiaashworth@example.com", window(13, "23:14", 44), [["Included", 39], ["Auto Pool", 44], ["API Pool", 10], ["Grok Bot", 44]]),
    account("cursor-work", "Personal", "", "nadia.ashworth@tessellate.example", window(12, "21:02", 60), [["Included", 56], ["Auto Pool", 58], ["API Pool", 34], ["Grok Bot", 60]]),
  ] },
];
