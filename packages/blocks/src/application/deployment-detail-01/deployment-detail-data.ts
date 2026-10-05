import type { DeploymentDetailData } from "./deployment-detail-types";

export function validNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
export function validTimestamp(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 8.64e15;
}
/** Links may navigate locally or to an HTTP(S) host, never to script/data URLs. */
export function deploymentHref(value?: string) {
  if (!value) return undefined;
  if (value.startsWith("/") && !value.startsWith("//") && !/[\\\s]/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch { return undefined; }
}
export function deploymentDuration(ms: number | null | undefined, locale: string) {
  if (!validNumber(ms)) return "—";
  const seconds = Math.floor(ms / 1000);
  const formatter = new Intl.NumberFormat(locale, { style: "unit", unit: "second", unitDisplay: "narrow" });
  if (seconds < 60) return formatter.format(seconds);
  const minutes = Math.floor(seconds / 60);
  const minuteFormatter = new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay: "narrow" });
  return `${minuteFormatter.format(minutes)} ${formatter.format(seconds % 60)}`;
}
export function deploymentDate(at: number | null | undefined, locale: string, timeZone: string, now?: number) {
  if (!validTimestamp(at)) return "—";
  if (!validTimestamp(now)) return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone }).format(at);
  const seconds = (at - now) / 1000;
  const [divisor, unit] = Math.abs(seconds) < 60 ? [1, "second"] as const : Math.abs(seconds) < 3600 ? [60, "minute"] as const : Math.abs(seconds) < 86400 ? [3600, "hour"] as const : [86400, "day"] as const;
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(Math.round(seconds / divisor), unit);
}
export function deploymentIssues(data: DeploymentDetailData) {
  const issues = data.stages.flatMap((stage) => stage.issues ?? []);
  return { issues, errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    complete: data.stages.some((stage) => stage.kind === "checks") && data.stages.filter((stage) => stage.kind === "checks").every((stage) => stage.issues !== undefined && ["success", "warning", "error"].includes(stage.status)),
    passed: data.stages.some((stage) => stage.kind === "checks") && data.stages.filter((stage) => stage.kind === "checks").every((stage) => stage.status === "success" && stage.issues?.length === 0) };
}
