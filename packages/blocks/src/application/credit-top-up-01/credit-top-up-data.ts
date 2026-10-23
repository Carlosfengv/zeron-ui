import type { CreditTopUpData } from "./credit-top-up-types";

const DAY = 86_400_000;
const nonnegative = (value: number) => Number.isFinite(value) && value >= 0;
const uniqueIds = (items: readonly { id: string }[]) => items.every(item => item.id.length > 0) && new Set(items.map(item => item.id)).size === items.length;

export function creditTopUpSummary(data: CreditTopUpData) {
  const used = data.usage.reduce((sum, item) => sum + item.periodCredits, 0);
  const remaining = Math.max(0, data.totalCredits - used);
  const runsOutAt = data.averageDailyUsage > 0 ? data.snapshotAt + remaining / data.averageDailyUsage * DAY : null;
  return { used, remaining, runsOutAt, runsOutBeforeReset: runsOutAt !== null && runsOutAt < data.resetsAt };
}

export function creditTopUpCoverage(credits: number, data: Pick<CreditTopUpData, "averageDailyUsage" | "snapshotAt" | "resetsAt">) {
  if (data.averageDailyUsage <= 0) return null;
  const days = credits / data.averageDailyUsage;
  if (!Number.isFinite(days)) return null;
  return { days: days < 1 ? days : Math.round(days), pastReset: data.snapshotAt + days * DAY > data.resetsAt };
}

/** Reject malformed observations instead of silently turning missing usage into zero. */
export function validateCreditTopUpData(data: CreditTopUpData) {
  return nonnegative(data.totalCredits) && nonnegative(data.averageDailyUsage)
    && Number.isFinite(new Date(data.snapshotAt).getTime()) && Number.isFinite(new Date(data.resetsAt).getTime()) && data.resetsAt > data.snapshotAt
    && uniqueIds(data.usage) && uniqueIds(data.packages)
    && data.usage.every(item => nonnegative(item.periodCredits) && nonnegative(item.recentCredits)
      && [1, 2, 3, 4, 5, 6, 7].includes(item.colorIndex) && ["stem", "area", "bar"].includes(item.chart)
      && item.history.every(point => nonnegative(point.value)))
    && Number.isFinite(data.usage.reduce((sum, item) => sum + item.periodCredits, 0))
    && data.packages.every(item => Number.isSafeInteger(item.credits) && item.credits > 0 && nonnegative(item.price) && /^[A-Z]{3}$/.test(item.currency));
}
