import { DAY, HOUR } from "./account-activity-data";
import type { AccountActivityData, AccountActivityWindow } from "./account-activity-types";

const start = Date.UTC(2026, 8, 15), end = start + 30 * DAY;
const accounts = [
  ["cursor", "Cursor (personal)"], ["claude-max", "Claude Max"], ["google", "Google AI Pro"], ["codex-plus", "Codex Plus"],
  ["grok", "SuperGrok"], ["cursor-2", "Cursor (personal 2)"], ["codex-pro", "Codex Pro"], ["copilot", "Copilot"],
  ["grok-heavy", "SuperGrok Heavy"], ["claude-pro", "Claude Pro"], ["antigravity", "Antigravity Starter Quota"],
].map(([id, name]) => ({ id, name }));
const events = [
  { id: "e1", accountId: "cursor", timestamp: start + 10 * DAY + 17 * HOUR, unlockedAt: start + 13 * DAY + 8 * HOUR },
  { id: "e2", accountId: "claude-max", timestamp: start + 18 * DAY + 13 * HOUR, unlockedAt: start + 19 * DAY + 8 * HOUR },
  { id: "e3", accountId: "claude-max", timestamp: start + 18 * DAY + 17 * HOUR, unlockedAt: start + 18 * DAY + 21 * HOUR },
  { id: "e4", accountId: "codex-plus", timestamp: start + 22 * DAY + 15 * HOUR, unlockedAt: start + 22 * DAY + 17 * HOUR },
  { id: "e5", accountId: "codex-pro", timestamp: start + 26 * DAY + 12 * HOUR, unlockedAt: start + 26 * DAY + 14 * HOUR },
];
const rhythm = [0, 0, 0, 0, 0, 0, .05, .3, .72, .95, 1, .92, .86, .88, .84, .78, .65, .35, .04, .08, .4, .55, .32, 0];
const samples = accounts.flatMap((account, index) => Array.from({ length: 30 * 24 }, (_, offset) => {
  const timestamp = start + offset * HOUR, date = new Date(timestamp), hour = date.getUTCHours(), day = Math.floor(offset / 24);
  const weekend = [0, 6].includes(date.getUTCDay());
  const noise = ((day * 13 + hour * 7 + index * 17) % 23) / 23;
  const intensity = rhythm[hour] * (weekend ? .35 : 1) * (.65 + noise * .35);
  const active = intensity > .1 && noise < intensity * .96;
  const locked = events.some((event) => event.accountId === account.id && timestamp >= event.timestamp && timestamp < event.unlockedAt);
  return { accountId: account.id, timestamp, value: offset === 0 || (day === 29 && hour >= 9) ? null : locked || !active ? 0 : Math.round(intensity * 100) };
}));
const windows: AccountActivityWindow[] = accounts.flatMap((account, index) => {
  const period = index === 0 || index === 5 || index === 7 ? 30 : 7;
  const origin = start - ((index * 2 + 3) % period) * DAY;
  return Array.from({ length: Math.ceil((end - origin) / (period * DAY)) }, (_, n) => {
    const a = origin + n * period * DAY, b = a + period * DAY;
    const hit = events.some((event) => event.accountId === account.id && event.timestamp >= a && event.timestamp < b);
    const current = b >= end;
    const peakPercent = hit ? 100 : Math.round((index < 6 ? 74 : 24) + ((n * 19 + index * 7) % 24));
    const observedEnd = Math.min(b, end);
    const readings = Array.from({ length: Math.ceil((observedEnd - a) / (6 * HOUR)) + 1 }, (_, slot) => {
      const timestamp = Math.min(observedEnd, a + slot * 6 * HOUR);
      return { timestamp, percent: Math.min(peakPercent, Math.round((timestamp - a) / (observedEnd - a) * peakPercent)) };
    });
    return { id: `${account.id}-${n}`, accountId: account.id, start: a, end: b, current, peakPercent, readings };
  });
});
/** Deterministic sample data only; no account connections or external requests. */
export const accountActivityDemoData: AccountActivityData = { start, end, accounts, samples, events, windows };
