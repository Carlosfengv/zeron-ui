import type { SupportAnalyticsBucket, SupportAnalyticsMetric, SupportAnalyticsSnapshot } from "./support-analytics-types";

export function validValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
export function validCount(value: unknown): value is number { return validValue(value) && Number.isSafeInteger(value); }
export function validMetricValue(value: unknown, unit: SupportAnalyticsMetric["unit"]): value is number {
  return validValue(value) && (unit !== "ratio" || value <= 1);
}
export function formatCount(value: unknown, locale: string) {
  return validCount(value) ? new Intl.NumberFormat(locale).format(value) : "—";
}
export function formatMetric(value: unknown, unit: SupportAnalyticsMetric["unit"], locale: string) {
  if (!validMetricValue(value, unit)) return "—";
  if (unit === "ratio") return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value);
  const minutes = Math.round(value / 60000);
  const zh = locale.startsWith("zh");
  if (value < 60000) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value / 1000)}${zh ? "秒" : "s"}`;
  if (minutes < 60) return `${minutes}${zh ? "分钟" : "m"}`;
  return `${Math.floor(minutes / 60)}${zh ? "小时" : "h"}${minutes % 60 ? ` ${minutes % 60}${zh ? "分钟" : "m"}` : ""}`;
}
export function metricTrendPoints(metric: SupportAnalyticsMetric) {
  return metric.trend.filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(new Date(point.timestamp).getTime()))
    .map((point) => ({ ...point, value: validMetricValue(point.value, metric.unit) ? point.value : null }));
}
export function comparison(value: unknown, previous: unknown, method: SupportAnalyticsMetric["comparison"]) {
  if (!validValue(value) || !validValue(previous)) return null;
  if (method === "percentage-points") return (value - previous) * 100;
  if (previous === 0) return value === 0 ? 0 : null;
  return (value - previous) / previous * 100;
}
export function comparisonText(delta: number | null, locale: string, suffix: string) {
  return delta === null ? "—" : `${delta > 0 ? "+" : ""}${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(delta)}${suffix}`;
}
export function trendSummary(data: SupportAnalyticsSnapshot) {
  const { start, end, observedThrough, bucketMs } = data.window;
  const windowValid = [start, end, observedThrough].every((value) => Number.isFinite(value) && Number.isFinite(new Date(value).getTime())) && start < end && observedThrough >= start && observedThrough <= end && validValue(bucketMs) && bucketMs > 0;
  const bucketsValid = windowValid && data.buckets.every((point, index) => Number.isFinite(point.start) && Number.isFinite(point.end) && point.end - point.start === bucketMs && point.start >= start && point.end <= end && (index === 0 || point.start === data.buckets[index - 1].end));
  const points: SupportAnalyticsBucket[] = bucketsValid ? data.buckets.map((point) => ({ ...point, count: point.start < observedThrough && validCount(point.count) ? point.count : null })) : [];
  const complete = bucketsValid && observedThrough === end && points.length > 0 && points[0].start === start && points.at(-1)!.end === end && points.every((point) => validCount(point.count));
  const total = complete ? points.reduce((sum, point) => sum + point.count!, 0) : null;
  return { points, complete, total, average: total !== null && validCount(total) ? total / points.length : null };
}
export function formatDate(timestamp: number, locale: string, timeZone: string, weekday = false) {
  return Number.isFinite(new Date(timestamp).getTime()) ? new Intl.DateTimeFormat(locale, { timeZone, ...(weekday ? { weekday: "short" } : { month: "short", day: "numeric" }) }).format(timestamp) : "—";
}
export function formatUpdated(timestamp: number, locale: string, timeZone: string, now?: number) {
  if (!Number.isFinite(new Date(timestamp).getTime())) return "—";
  if (now === undefined || !Number.isFinite(now) || now < timestamp) return new Intl.DateTimeFormat(locale, { timeZone, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(timestamp);
  const seconds = Math.floor((timestamp - now) / 1000);
  const unit = Math.abs(seconds) < 60 ? "second" : Math.abs(seconds) < 3600 ? "minute" : "hour";
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(unit === "second" ? seconds : Math.trunc(seconds / (unit === "minute" ? 60 : 3600)), unit);
}
