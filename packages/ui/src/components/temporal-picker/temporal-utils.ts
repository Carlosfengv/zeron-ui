import type {
  DateRangeValue,
  DateTimeRangeValue,
  ISODateString,
  ISODateTimeString,
  ISOTimeString,
  TimeRangeValue,
} from "./temporal-types";

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const timePattern = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
const instantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i;

export function parseISODate(value: string): ISODateString | undefined {
  const match = datePattern.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return undefined;
  return value as ISODateString;
}

export function parseISOTime(value: string): ISOTimeString | undefined {
  const match = timePattern.exec(value);
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] === undefined ? 0 : Number(match[3]);
  if (hour > 23 || minute > 59 || second > 59) return undefined;
  return value as ISOTimeString;
}

export function parseISODateTime(value: string): ISODateTimeString | undefined {
  if (!instantPattern.test(value) || Number.isNaN(Date.parse(value))) return undefined;
  return value as ISODateTimeString;
}

export function isISODate(value: string): value is ISODateString {
  return parseISODate(value) !== undefined;
}

export function isISOTime(value: string): value is ISOTimeString {
  return parseISOTime(value) !== undefined;
}

export function isISODateTime(value: string): value is ISODateTimeString {
  return parseISODateTime(value) !== undefined;
}

export function assertISODate(value: string): ISODateString {
  const parsed = parseISODate(value);
  if (!parsed) throw new TypeError(`Invalid ISO date: ${value}`);
  return parsed;
}

export function assertISOTime(value: string): ISOTimeString {
  const parsed = parseISOTime(value);
  if (!parsed) throw new TypeError(`Invalid ISO time: ${value}`);
  return parsed;
}

export function assertISODateTime(value: string): ISODateTimeString {
  const parsed = parseISODateTime(value);
  if (!parsed) throw new TypeError(`Invalid RFC 3339 instant: ${value}`);
  return parsed;
}

export function timeToSeconds(value: ISOTimeString): number {
  const match = timePattern.exec(value)!;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0);
}

export function normaliseTime(value: ISOTimeString, includeSeconds = value.length === 8): ISOTimeString {
  const seconds = timeToSeconds(value);
  const hour = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minute = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  if (!includeSeconds) return assertISOTime(`${hour}:${minute}`);
  return assertISOTime(`${hour}:${minute}:${String(seconds % 60).padStart(2, "0")}`);
}

/** A local-noon Date keeps react-day-picker from crossing a browser DST boundary. */
export function dateToCalendarDate(value: ISODateString): Date {
  const [, year, month, day] = datePattern.exec(value)!;
  return new Date(Number(year), Number(month) - 1, Number(day), 12);
}

export function calendarDateToISODate(date: Date): ISODateString {
  return assertISODate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
}

export function compareISODate(left: ISODateString, right: ISODateString): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function compareISOTime(left: ISOTimeString, right: ISOTimeString): number {
  return timeToSeconds(left) - timeToSeconds(right);
}

export function compareISODateTime(left: ISODateTimeString, right: ISODateTimeString): number {
  return Date.parse(left) - Date.parse(right);
}

export function selectedDayCount(range: DateRangeValue): number {
  const from = Date.UTC(...dateParts(range.from));
  const to = Date.UTC(...dateParts(range.to));
  return Math.round((to - from) / 86_400_000) + 1;
}

function dateParts(value: ISODateString): [number, number, number] {
  const [, year, month, day] = datePattern.exec(value)!;
  return [Number(year), Number(month) - 1, Number(day)];
}

export function addCalendarDays(value: ISODateString, amount: number): ISODateString {
  const [year, month, day] = dateParts(value);
  const date = new Date(Date.UTC(year, month, day + amount));
  return assertISODate(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`);
}

export function temporalValueEquals<T>(left: T | undefined, right: T | undefined): boolean {
  if (left === right) return true;
  if (left === undefined || right === undefined) return false;
  if (typeof left === "string" && typeof right === "string") {
    if (isISODateTime(left) && isISODateTime(right)) return Date.parse(left) === Date.parse(right);
    if (isISOTime(left) && isISOTime(right)) return timeToSeconds(left) === timeToSeconds(right);
    return left === right;
  }
  if (isTimeRangeValue(left) && isTimeRangeValue(right)) {
    return timeToSeconds(left.from) === timeToSeconds(right.from)
      && timeToSeconds(left.to) === timeToSeconds(right.to)
      && Boolean(left.overnight) === Boolean(right.overnight);
  }
  if (isDateTimeRangeValue(left) && isDateTimeRangeValue(right)) {
    return Date.parse(left.from) === Date.parse(right.from) && Date.parse(left.to) === Date.parse(right.to);
  }
  if (isDateRangeValue(left) && isDateRangeValue(right)) return left.from === right.from && left.to === right.to;
  return false;
}

export function isDateRangeValue(value: unknown): value is DateRangeValue {
  if (!value || typeof value !== "object" || !("from" in value) || !("to" in value)) return false;
  const range = value as { from?: unknown; to?: unknown };
  return typeof range.from === "string" && typeof range.to === "string" && isISODate(range.from) && isISODate(range.to);
}

export function isTimeRangeValue(value: unknown): value is TimeRangeValue {
  if (!value || typeof value !== "object" || !("from" in value) || !("to" in value)) return false;
  const range = value as { from?: unknown; to?: unknown };
  return typeof range.from === "string" && typeof range.to === "string" && isISOTime(range.from) && isISOTime(range.to);
}

export function isDateTimeRangeValue(value: unknown): value is DateTimeRangeValue {
  if (!value || typeof value !== "object" || !("from" in value) || !("to" in value)) return false;
  const range = value as { from?: unknown; to?: unknown };
  return typeof range.from === "string" && typeof range.to === "string" && isISODateTime(range.from) && isISODateTime(range.to);
}

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const zonedPartFormatters = new Map<string, Intl.DateTimeFormat>();
const offsetFormatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = zonedPartFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      calendar: "iso8601",
      hour12: false,
      hourCycle: "h23",
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    zonedPartFormatters.set(timeZone, formatter);
  }
  return formatter;
}

function offsetFormatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = offsetFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
      timeZoneName: "longOffset",
    });
    offsetFormatters.set(timeZone, formatter);
  }
  return formatter;
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = formatterFor(timeZone).formatToParts(date);
  const number = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: number("year"), month: number("month"), day: number("day"), hour: number("hour"), minute: number("minute"), second: number("second") };
}

function offsetAt(timestamp: number, timeZone: string): number | undefined {
  const name = offsetFormatterFor(timeZone).formatToParts(new Date(timestamp)).find((part) => part.type === "timeZoneName")?.value;
  if (!name || name === "GMT" || name === "UTC") return 0;
  const match = /^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(name);
  if (!match) return undefined;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "+" ? minutes : -minutes;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone).format(0);
    return true;
  } catch {
    return false;
  }
}

export function todayInTimeZone(now: Date, timeZone: string): ISODateString {
  const parts = zonedParts(now, timeZone);
  return assertISODate(`${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`);
}

export function formatISODate(value: ISODateString, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T12:00:00.000Z`));
}

export function formatISOTime(value: ISOTimeString, locale: string, hourCycle: "locale" | 12 | 24 = "locale"): string {
  const [hour, minute, second] = value.split(":").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hour, minute, second ?? 0));
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    ...(value.length === 8 ? { second: "2-digit" } : {}),
    ...(hourCycle === "locale" ? {} : { hourCycle: hourCycle === 12 ? "h12" : "h23" }),
    timeZone: "UTC",
  }).format(date);
}

export function formatISODateTime(value: ISODateTimeString, locale: string, timeZone: string, includeSeconds = false): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: includeSeconds ? "medium" : "short",
    timeZone,
  }).format(new Date(value));
}

export type ZonedDateTimeResolution =
  | { kind: "resolved"; value: ISODateTimeString; offsetMinutes: number }
  | { kind: "ambiguous"; candidates: readonly { value: ISODateTimeString; offsetMinutes: number }[] }
  | { kind: "nonexistent" };

/**
 * Resolves a wall-clock date/time using Intl's IANA database. Sampling offset
 * changes around the target makes repeated and skipped DST hours explicit,
 * rather than relying on Date's host-zone coercion.
 */
export function resolveZonedDateTime(
  date: ISODateString,
  time: ISOTimeString,
  timeZone: string,
  disambiguation: "earlier" | "later" | "reject" = "reject",
): ZonedDateTimeResolution {
  if (!isValidTimeZone(timeZone)) return { kind: "nonexistent" };
  const [year, month, day] = dateParts(date);
  const seconds = timeToSeconds(time);
  const naive = Date.UTC(year, month, day, Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60);
  const offsets = new Set<number>();
  for (let timestamp = naive - 36 * 3_600_000; timestamp <= naive + 36 * 3_600_000; timestamp += 6 * 3_600_000) {
    const offset = offsetAt(timestamp, timeZone);
    if (offset !== undefined) offsets.add(offset);
  }
  const candidates = Array.from(offsets, (offsetMinutes) => {
    const timestamp = naive - offsetMinutes * 60_000;
    const parts = zonedParts(new Date(timestamp), timeZone);
    if (parts.year !== year || parts.month !== month + 1 || parts.day !== day || parts.hour !== Math.floor(seconds / 3600) || parts.minute !== Math.floor((seconds % 3600) / 60) || parts.second !== seconds % 60) return undefined;
    return { value: assertISODateTime(new Date(timestamp).toISOString()), offsetMinutes };
  }).filter((candidate): candidate is { value: ISODateTimeString; offsetMinutes: number } => Boolean(candidate)).sort((a, b) => Date.parse(a.value) - Date.parse(b.value));
  if (candidates.length === 0) return { kind: "nonexistent" };
  if (candidates.length === 1) return { kind: "resolved", ...candidates[0] };
  if (disambiguation === "earlier") return { kind: "resolved", ...candidates[0] };
  if (disambiguation === "later") return { kind: "resolved", ...candidates[candidates.length - 1] };
  return { kind: "ambiguous", candidates };
}

export function instantToZonedDateTime(value: ISODateTimeString, timeZone: string): { date: ISODateString; time: ISOTimeString } {
  const parts = zonedParts(new Date(value), timeZone);
  return {
    date: assertISODate(`${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`),
    time: assertISOTime(`${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:${String(parts.second).padStart(2, "0")}`),
  };
}
