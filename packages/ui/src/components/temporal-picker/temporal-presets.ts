import type {
  DateRangeValue,
  DateTimeRangeValue,
  ISOTimeString,
  TemporalPreset,
  TimeRangeValue,
} from "./temporal-types";
import {
  addCalendarDays,
  assertISODateTime,
  assertISOTime,
  todayInTimeZone,
} from "./temporal-utils";

export function createRecentDateTimePreset(options: {
  id: string;
  label: string;
  description?: string;
  amount: number;
  unit: "minute" | "hour" | "day";
}): TemporalPreset<DateTimeRangeValue> {
  const unitMilliseconds = { minute: 60_000, hour: 3_600_000, day: 86_400_000 } as const;
  if (!Number.isFinite(options.amount) || options.amount < 1) throw new RangeError("Preset amount must be at least 1.");
  return {
    id: options.id,
    label: options.label,
    description: options.description,
    resolve: ({ now }) => ({
      from: assertISODateTime(new Date(now.getTime() - options.amount * unitMilliseconds[options.unit]).toISOString()),
      to: assertISODateTime(now.toISOString()),
    }),
  };
}

export function createRecentDateRangePreset(options: {
  id: string;
  label: string;
  description?: string;
  amount: number;
  unit: "day";
  includeToday?: boolean;
}): TemporalPreset<DateRangeValue> {
  if (!Number.isInteger(options.amount) || options.amount < 1) throw new RangeError("Preset amount must be a positive integer.");
  return {
    id: options.id,
    label: options.label,
    description: options.description,
    resolve: ({ now, timeZone = "UTC" }) => {
      const today = todayInTimeZone(now, timeZone);
      const to = options.includeToday === false ? addCalendarDays(today, -1) : today;
      return { from: addCalendarDays(to, -(options.amount - 1)), to };
    },
  };
}

export function createFixedTimeRangePreset(options: {
  id: string;
  label: string;
  description?: string;
  from: string | ISOTimeString;
  to: string | ISOTimeString;
  overnight?: boolean;
}): TemporalPreset<TimeRangeValue> {
  const from = assertISOTime(options.from);
  const to = assertISOTime(options.to);
  return {
    id: options.id,
    label: options.label,
    description: options.description,
    resolve: () => ({ from, to, ...(options.overnight ? { overnight: true } : {}) }),
  };
}
