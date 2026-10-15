import type { UsageForecastAccount, UsageForecastProjection, UsageForecastSort } from "./usage-forecast-types";

export const USAGE_FORECAST_DAY = 86_400_000;

export function validateUsageForecast(accounts: readonly UsageForecastAccount[], now: number) {
  if (!Number.isFinite(now) || !Number.isFinite(new Date(now).getTime())) return false;
  const ids = new Set<string>();
  return accounts.every((account) => {
    if (typeof account.id !== "string" || !account.id.trim() || ids.has(account.id)) return false;
    ids.add(account.id);
    const dayIds = new Set<string>();
    return Number.isFinite(account.usedPercent) && account.usedPercent >= 0 && account.usedPercent <= 100
      && Number.isFinite(new Date(account.windowStart).getTime()) && Number.isFinite(new Date(account.resetsAt).getTime())
      && account.windowStart <= now && account.resetsAt > now
      && (account.dailyRate === undefined || (Number.isFinite(account.dailyRate) && account.dailyRate >= 0))
      && (account.history ?? []).every((point) => Number.isFinite(point.timestamp)
        && point.timestamp >= account.windowStart && point.timestamp <= now
        && Number.isFinite(point.usedPercent) && point.usedPercent >= 0 && point.usedPercent <= 100)
      && (account.recentUsage ?? []).every((day) => {
        if (typeof day.id !== "string" || !day.id.trim() || dayIds.has(day.id)) return false;
        dayIds.add(day.id);
        return Number.isFinite(day.usedPercent) && day.usedPercent >= 0;
      });
  });
}

/** A linear estimate for the current window; never forecasts a future window. */
export function projectUsageAccount(account: UsageForecastAccount, now: number): UsageForecastProjection {
  const windowDays = (account.resetsAt - account.windowStart) / USAGE_FORECAST_DAY;
  const elapsedDays = (now - account.windowStart) / USAGE_FORECAST_DAY;
  const remainingDays = (account.resetsAt - now) / USAGE_FORECAST_DAY;
  const ready = !account.status || account.status === "ready";
  const dailyRate = ready ? (account.dailyRate ?? (elapsedDays > 0 ? account.usedPercent / elapsedDays : null)) : null;
  // Exhaustion is already known at 100%, even before a rate can be estimated.
  const available = ready && (dailyRate !== null || account.usedPercent === 100);
  const projectedPercent = dailyRate === null ? (available ? 100 : null) : account.usedPercent + dailyRate * remainingDays;
  const exhaustsAt = !available ? null : account.usedPercent === 100 ? now
    : dailyRate !== null && dailyRate > 0 ? now + (100 - account.usedPercent) / dailyRate * USAGE_FORECAST_DAY : null;
  const runsOutAt = exhaustsAt !== null && exhaustsAt < account.resetsAt ? exhaustsAt : null;
  return {
    account, available, dailyRate, projectedPercent, runsOutAt,
    elapsedPercent: elapsedDays / windowDays * 100,
    pace: dailyRate === null ? null : dailyRate / (100 / windowDays),
    lockedMs: runsOutAt === null ? 0 : account.resetsAt - runsOutAt,
    allowance: (100 - account.usedPercent) / remainingDays,
  };
}

export function sortUsageProjections(items: readonly UsageForecastProjection[], sort: UsageForecastSort, locale: string) {
  const direction = sort.direction === "asc" ? 1 : -1;
  const value = (item: UsageForecastProjection) => sort.key === "used" ? item.account.usedPercent
    : sort.key === "pace" ? item.pace
    : item.account.resetsAt;
  return [...items].sort((a, b) => {
    if (sort.key === "account") return a.account.name.localeCompare(b.account.name, locale) * direction;
    if (sort.key === "outcome") {
      const ap = a.projectedPercent;
      const bp = b.projectedPercent;
      if (ap === null || bp === null) return ap === bp ? 0 : ap === null ? 1 : -1;
      if (a.runsOutAt !== null && b.runsOutAt !== null) return (a.runsOutAt - b.runsOutAt) * direction;
      if (a.runsOutAt !== null || b.runsOutAt !== null) return (a.runsOutAt !== null ? -1 : 1) * direction;
      return (bp - ap) * direction;
    }
    const av = value(a); const bv = value(b);
    // Unknown projections stay last in both directions.
    if (av === null || bv === null) return av === bv ? 0 : av === null ? 1 : -1;
    return (av - bv) * direction;
  });
}
