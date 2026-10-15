import type { AccountActivityData, AccountActivityDayType, AccountActivityEvent, AccountActivityQuery, AccountActivitySample } from "./account-activity-types";

export const HOUR = 3_600_000;
export const DAY = HOUR * 24;
export function createActivityCalendar(timeZone: string, locale: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const dateFormat = new Intl.DateTimeFormat(locale, { timeZone, month: "short", day: "numeric" });
  const weekdayFormat = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short" });
  return {
    fromCalendar(date: string, hour = 0) {
      const target = Date.parse(`${date}T00:00:00Z`) + hour * HOUR;
      let guess = target;
      for (let iteration = 0; iteration < 3; iteration++) {
        const fields = Object.fromEntries(parts.formatToParts(guess).map((part) => [part.type, part.value]));
        const observed = Date.parse(`${fields.year}-${fields.month}-${fields.day}T00:00:00Z`) + Number(fields.hour) * HOUR + Number(fields.minute) * 60_000;
        guess += target - observed;
      }
      return guess;
    },
    parts(timestamp: number) {
      const fields = Object.fromEntries(parts.formatToParts(timestamp).map((part) => [part.type, part.value]));
      const date = `${fields.year}-${fields.month}-${fields.day}`;
      return { date, hour: Number(fields.hour), weekday: (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7 };
    },
    /** Wall-clock coordinate for weekly lanes; retain partial-hour lock endpoints. */
    coordinate(timestamp: number) {
      const fields = Object.fromEntries(parts.formatToParts(timestamp).map((part) => [part.type, part.value]));
      return Date.parse(`${fields.year}-${fields.month}-${fields.day}T00:00:00Z`) + Number(fields.hour) * HOUR + Number(fields.minute) * 60_000;
    },
    date: (timestamp: number) => dateFormat.format(timestamp),
    weekday: (index: number) => weekdayFormat.format(new Date(Date.UTC(2026, 8, 14 + index))),
  };
}
export type ActivityCalendar = ReturnType<typeof createActivityCalendar>;
export function matchesDay(timestamp: number, type: AccountActivityDayType, calendar: ActivityCalendar) {
  const weekend = calendar.parts(timestamp).weekday >= 5;
  return type === "all" || (type === "weekends" ? weekend : !weekend);
}
export function isLocked(sample: Pick<AccountActivitySample, "accountId" | "timestamp">, events: readonly AccountActivityEvent[]) {
  return events.some((event) => event.accountId === sample.accountId && sample.timestamp >= event.timestamp && sample.timestamp < event.unlockedAt);
}
export function clippedLockedHours(events: readonly AccountActivityEvent[], start: number, end: number) {
  // Merge overlapping incidents per account so one blocked hour is counted once.
  const groups = new Map<string, [number, number][]>();
  for (const event of events) {
    const a = Math.max(start, event.timestamp), b = Math.min(end, event.unlockedAt);
    if (b > a) groups.set(event.accountId, [...(groups.get(event.accountId) ?? []), [a, b]]);
  }
  let total = 0;
  for (const intervals of groups.values()) {
    intervals.sort((a, b) => a[0] - b[0]);
    let edge = -Infinity;
    for (const [a, b] of intervals) { total += Math.max(0, b - Math.max(a, edge)); edge = Math.max(edge, b); }
  }
  return total / HOUR;
}
export function selectActivity(data: AccountActivityData, query: AccountActivityQuery, calendar: ActivityCalendar, selectedRange = false) {
  const start = selectedRange ? Math.max(data.start, query.range.start) : data.start;
  const end = selectedRange ? Math.min(data.end, query.range.end) : data.end;
  const hidden = new Set(query.hiddenAccountIds);
  const accounts = data.accounts.filter((account) => (query.accountId === "all" || query.accountId === account.id) && !hidden.has(account.id));
  const ids = new Set(accounts.map((account) => account.id));
  // Account readings usually share hourly timestamps. Resolve each timestamp
  // once per selection instead of formatting it again for every account.
  const calendarParts = new Map<number, ReturnType<ActivityCalendar["parts"]>>();
  const partsAt = (timestamp: number) => {
    let part = calendarParts.get(timestamp);
    if (!part) { part = calendar.parts(timestamp); calendarParts.set(timestamp, part); }
    return part;
  };
  const accepts = (timestamp: number) => {
    if (!Number.isFinite(timestamp) || timestamp < start || timestamp >= end) return false;
    if (query.dayType === "all") return true;
    const weekend = partsAt(timestamp).weekday >= 5;
    return query.dayType === "weekends" ? weekend : !weekend;
  };
  const samples = data.samples.filter((sample) => ids.has(sample.accountId) && accepts(sample.timestamp));
  const events = data.events.filter((event) => ids.has(event.accountId) && accepts(event.timestamp));
  const locks = data.events.filter((event) => ids.has(event.accountId) && event.timestamp < end && event.unlockedAt > start);
  // One observed hour contributes once even when an account reports multiple samples.
  const buckets = new Map<string, { date: string; hour: number; weekday: number; timestamp: number; values: Map<string, boolean> }>();
  for (const sample of samples) {
    if (sample.value === null || !Number.isFinite(sample.value) || sample.value < 0) continue;
    const part = partsAt(sample.timestamp), key = `${part.date}/${part.hour}`;
    let bucket = buckets.get(key);
    if (!bucket) { bucket = { ...part, timestamp: sample.timestamp, values: new Map() }; buckets.set(key, bucket); }
    bucket.values.set(sample.accountId, bucket.values.get(sample.accountId) === true || sample.value > 0);
  }
  const hours = [...buckets.values()].map(({ values, ...bucket }) => ({ ...bucket, active: [...values.values()].filter(Boolean).length }));
  const lockRanges = activityDays({ start, end }, calendar).flatMap((day) => {
    if (!matchesDay(day.timestamp, query.dayType, calendar)) return [];
    return [{ start: Math.max(start, day.timestamp), end: Math.min(end, day.end) }];
  });
  return { start, end, accounts, samples, events, locks, hours, lockRanges };
}
export type ActivitySelection = ReturnType<typeof selectActivity>;
export function average(values: readonly number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
export function profile(selection: ActivitySelection) {
  return Array.from({ length: 24 }, (_, hour) => ({ timestamp: hour * HOUR,
    weekday: average(selection.hours.filter((point) => point.hour === hour && point.weekday < 5).map((point) => point.active)),
    weekend: average(selection.hours.filter((point) => point.hour === hour && point.weekday >= 5).map((point) => point.active)),
  }));
}
export function activityDays(data: Pick<AccountActivityData, "start" | "end">, calendar: ActivityCalendar) {
  const days: { date: string; timestamp: number; end: number; weekday: number }[] = [];
  if (!Number.isFinite(data.start) || !Number.isFinite(data.end) || data.end <= data.start) return days;
  const first = Date.parse(`${calendar.parts(data.start).date}T00:00:00Z`);
  const last = Date.parse(`${calendar.parts(data.end - 1).date}T00:00:00Z`);
  for (let date = first; date <= last; date += DAY) {
    const iso = new Date(date).toISOString().slice(0, 10), timestamp = calendar.fromCalendar(iso);
    // Some zones have historically skipped an entire calendar date.
    if (calendar.parts(timestamp).date !== iso) continue;
    days.push({ date: iso, timestamp, end: calendar.fromCalendar(new Date(date + DAY).toISOString().slice(0, 10)), weekday: (new Date(date).getUTCDay() + 6) % 7 });
  }
  return days;
}
export type ActivityDay = ReturnType<typeof activityDays>[number];

/** Brush and keyboard ranges must also fit reports shorter than one hour. */
export function clampActivityRange(data: Pick<AccountActivityData, "start" | "end">, range: AccountActivityQuery["range"]) {
  const span = Math.min(HOUR, data.end - data.start);
  const start = Math.max(data.start, Math.min(data.end - span, Number.isFinite(range.start) ? range.start : data.start));
  const end = Math.max(start + span, Math.min(data.end, Number.isFinite(range.end) ? range.end : data.end));
  return { start, end };
}

/** Keep the displayed day and three-hour peak from the same observation group. */
export function busiestActivity(selection: ActivitySelection, grouping: "dayType" | "weekday" | "all") {
  const groups = Array.from({ length: grouping === "weekday" ? 7 : grouping === "dayType" ? 2 : 1 }, () => Array.from({ length: 24 }, () => ({ sum: 0, count: 0 })));
  for (const point of selection.hours) {
    const day = grouping === "weekday" ? point.weekday : grouping === "dayType" && point.weekday >= 5 ? 1 : 0;
    const bucket = groups[day][point.hour]; bucket.sum += point.active; bucket.count++;
  }
  let best: { hour: number; day: number; score: number } | null = null;
  for (const [day, hours] of groups.entries()) {
    for (let hour = 0; hour <= 21; hour++) {
      const score = hours.slice(hour, hour + 3).reduce((sum, bucket) => sum + (bucket.count ? bucket.sum / bucket.count : 0), 0);
      if (score > 0 && (!best || score > best.score)) best = { hour, day, score };
    }
  }
  return best;
}
export function selectionLockedHours(selection: ActivitySelection, start = selection.start, end = selection.end, accountId?: string) {
  const events = accountId ? selection.locks.filter((event) => event.accountId === accountId) : selection.locks;
  return selection.lockRanges.reduce((sum, range) => sum + clippedLockedHours(events, Math.max(start, range.start), Math.min(end, range.end)), 0);
}
