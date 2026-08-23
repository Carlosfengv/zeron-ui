import {
  parseISODate,
  parseISODateTime,
  parseISOTime,
  resolveZonedDateTime,
} from "@zeron/ui/temporal-picker";
import type { InfiniteLogFilters } from "./infinite-log-types";

const dateTimePattern = /^(\d{4}) (\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

export function formatInfiniteLogDateTime(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")} ${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
}

export function formatInfiniteLogTimeRange(
  timeRange: NonNullable<InfiniteLogFilters["timeRange"]>,
  timeZone: string,
) {
  return `${formatInfiniteLogDateTime(timeRange.from, timeZone)} – ${formatInfiniteLogDateTime(timeRange.to, timeZone)}`;
}

export function parseInfiniteLogDateTime(value: string, timeZone: string) {
  const instant = parseISODateTime(value);
  if (instant) return instant;

  const match = dateTimePattern.exec(value);
  if (!match) return undefined;
  const date = parseISODate(`${match[1]}-${match[2]}-${match[3]}`);
  const time = parseISOTime(`${match[4]}:${match[5]}:${match[6]}`);
  if (!date || !time) return undefined;

  const resolution = resolveZonedDateTime(date, time, timeZone, "earlier");
  return resolution.kind === "resolved" ? resolution.value : undefined;
}
