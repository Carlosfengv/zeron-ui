import type { UsageTimelineProvider } from "./usage-timeline-types";

export const USAGE_TIMELINE_HOUR = 3_600_000;
const DATE_LIMIT = 8_640_000_000_000_000;

export function isUsageTimelineDate(value: number) {
  return Number.isFinite(value) && Math.abs(value) <= DATE_LIMIT;
}

function utcTime(year: number, month: number, day: number, hour = 0, minute = 0, second = 0) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return date.getTime();
}

/** Reuses one formatter for calendar arithmetic throughout a rendered view. */
export function createUsageTimelineDay(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone, era: "short", year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
  });
  const parts = (at: number) => {
    const values = Object.fromEntries(formatter.formatToParts(at).map((part) => [part.type, part.value]));
    const year = Number(values.year);
    return { year: values.era === "BC" ? 1 - year : year, month: Number(values.month), day: Number(values.day),
      hour: Number(values.hour), minute: Number(values.minute), second: Number(values.second) };
  };
  const localDay = (at: number) => { const date = parts(at); return utcTime(date.year, date.month, date.day); };

  return (timestamp: number, offset = 0): number => {
    if (!isUsageTimelineDate(timestamp)) return NaN;
    const date = parts(timestamp);
    const target = utcTime(date.year, date.month, date.day + offset);
    if (!isUsageTimelineDate(target)) return NaN;
    let result = target;
    for (let index = 0; index < 4; index++) {
      if (!isUsageTimelineDate(result)) return NaN;
      const current = parts(result);
      const delta = target - utcTime(current.year, current.month, current.day, current.hour, current.minute, current.second);
      if (delta === 0) {
        // An ambiguous midnight must use its first occurrence.
        if (isUsageTimelineDate(result - 1) && localDay(result - 1) < target) return result;
        break;
      }
      result += delta;
    }
    // Midnight may not exist during a clock change. Find the first valid
    // instant of this local date instead of oscillating into the previous day.
    let low = Math.max(-DATE_LIMIT, target - USAGE_TIMELINE_HOUR * 36);
    let high = Math.min(DATE_LIMIT, target + USAGE_TIMELINE_HOUR * 36);
    while (high - low > 1_000) {
      const middle = Math.floor((low + (high - low) / 2) / 1_000) * 1_000;
      if (localDay(middle) < target) low = middle;
      else high = middle;
    }
    return high;
  };
}

/** Calendar-day arithmetic in the supplied zone, including DST boundaries. */
export function usageTimelineDay(timestamp: number, offset: number, timeZone: string): number {
  return createUsageTimelineDay(timeZone)(timestamp, offset);
}

export function validUsageTimeline(providers: readonly UsageTimelineProvider[], now: number) {
  const ids = new Set<string>();
  const percent = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100;
  return isUsageTimelineDate(now) && new Set(providers.map((provider) => provider.id)).size === providers.length
    && providers.every((provider) => provider.id && provider.accounts.every((account) => {
      if (!account.id || ids.has(account.id)) return false;
      ids.add(account.id);
      return new Set(account.limits.map((limit) => limit.id)).size === account.limits.length
        && account.limits.every((limit) => limit.id && percent(limit.usedPercent))
        && Object.values(account.windows).every((window) => window === undefined || (isUsageTimelineDate(window.start) && isUsageTimelineDate(window.end)
          && window.start < window.end && percent(window.usedPercent)
          && (window.previousStart === undefined || (isUsageTimelineDate(window.previousStart) && window.previousStart < window.start))
          && (window.nextEnd === undefined || (isUsageTimelineDate(window.nextEnd) && window.nextEnd > window.end))))
        && new Set((account.markers ?? []).map((marker) => marker.id)).size === (account.markers ?? []).length
        && (account.markers ?? []).every((marker) => marker.id && isUsageTimelineDate(marker.at));
    }));
}

export function usageTimelineTone(usedPercent: number) {
  return usedPercent >= 95 ? "danger" : usedPercent >= 80 ? "warning" : "success";
}
