/** Stable defaults for a reusable component; consumers can opt into local presentation. */
export const DEFAULT_TRACE_TIME_ZONE = "UTC";
export const DEFAULT_TRACE_LOCALE = "en-US";

export type TraceTimePrecision = "minute" | "millisecond";

export function formatTraceTime(
  value: number | undefined,
  {
    locale = DEFAULT_TRACE_LOCALE,
    precision = "minute",
    timeZone = DEFAULT_TRACE_TIME_ZONE,
  }: {
    locale?: string;
    precision?: TraceTimePrecision;
    timeZone?: string;
  } = {}
): string {
  if (value === undefined) return "";

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    ...(precision === "millisecond"
      ? { second: "2-digit" as const, fractionalSecondDigits: 3 as const }
      : {}),
  }).format(date);
}
