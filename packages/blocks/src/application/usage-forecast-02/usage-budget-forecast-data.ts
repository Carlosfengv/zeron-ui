import type { UsageBudgetForecastData, UsageBudgetMetric, UsageBudgetPoint, UsageBudgetProjectionPoint } from "./usage-budget-forecast-types";

export const USAGE_BUDGET_DAY = 86_400_000;

/** First upward intersection. An initial observation above the threshold is not a known crossing. */
export function findUsageBudgetCrossing(points: readonly UsageBudgetPoint[], target: number): number | null {
  if (points[0]?.value === target) return points[0].timestamp;
  for (let index = 1; index < points.length; index++) {
    const point = points[index];
    const previous = points[index - 1];
    if (previous.value >= target || point.value < target) continue;
    return previous.timestamp + (point.timestamp - previous.timestamp) * (target - previous.value) / (point.value - previous.value);
  }
  return null;
}

export function usageBudgetModel(metric: UsageBudgetMetric) {
  const current = metric.history.at(-1)!;
  const projected = metric.forecast.at(-1)!;
  const historyCrossing = findUsageBudgetCrossing(metric.history, metric.budget);
  const expectedCrossing = findUsageBudgetCrossing(metric.forecast, metric.budget);
  const earliestCrossing = metric.forecast[0].upper >= metric.budget ? metric.forecast[0].timestamp
    : findUsageBudgetCrossing(metric.forecast.map(point => ({ ...point, value: point.upper })), metric.budget);
  const latestCrossing = findUsageBudgetCrossing(metric.forecast.map(point => ({ ...point, value: point.lower })), metric.budget);
  return { current, projected, historyCrossing, expectedCrossing, earliestCrossing, latestCrossing,
    status: current.value >= metric.budget ? "exceeded" as const : expectedCrossing !== null ? "expected" as const : "within" as const,
    usedPercent: Math.floor(current.value / metric.budget * 100), projectedPercent: Math.floor(projected.value / metric.budget * 100) };
}

/** Streaming bounds avoid argument-count limits on dense histories. */
export function usageBudgetExtent(metric: UsageBudgetMetric): [number, number] {
  let minimum = metric.budget;
  let maximum = metric.budget;
  for (const point of metric.history) {
    minimum = Math.min(minimum, point.value);
    maximum = Math.max(maximum, point.value);
  }
  for (const point of metric.forecast) {
    minimum = Math.min(minimum, point.lower);
    maximum = Math.max(maximum, point.upper);
  }
  return [minimum, maximum];
}

/** Add exact intersections so line colors and interval fills meet the budget without gaps. */
function withBudgetIntersections<T extends UsageBudgetPoint>(points: readonly T[], budget: number, keys: readonly (keyof T)[]): T[] {
  return points.flatMap((point, index) => {
    const next = points[index + 1];
    if (!next) return [point];
    const fractions = new Set<number>();
    for (const key of keys) {
      const a = Number(point[key]); const b = Number(next[key]);
      if ((a < budget && b > budget) || (a > budget && b < budget)) fractions.add((budget - a) / (b - a));
    }
    return [point, ...[...fractions].sort((a, b) => a - b).map(fraction => {
      const interpolated = { ...point, timestamp: point.timestamp + (next.timestamp - point.timestamp) * fraction };
      for (const key of keys) {
        const a = Number(point[key]); const b = Number(next[key]);
        const value = a + (b - a) * fraction;
        Object.assign(interpolated, { [key]: Math.abs(value - budget) < 1e-9 ? budget : value });
      }
      return interpolated;
    })];
  });
}

export function usageBudgetChartData(metric: UsageBudgetMetric): Record<string, unknown>[] {
  const rows = new Map<number, Record<string, unknown>>();
  const add = (timestamp: number, values: Record<string, unknown>) => rows.set(timestamp, { ...rows.get(timestamp), date: timestamp, ...values });
  for (const point of withBudgetIntersections(metric.history, metric.budget, ["value"])) {
    add(point.timestamp, { actual: point.value <= metric.budget ? point.value : null, actualOver: point.value >= metric.budget ? point.value : null, observed: point.value });
  }
  for (const point of withBudgetIntersections<UsageBudgetProjectionPoint>(metric.forecast, metric.budget, ["value", "lower", "upper"])) {
    add(point.timestamp, { forecast: point.value <= metric.budget ? point.value : null, forecastOver: point.value >= metric.budget ? point.value : null,
      projected: point.value, lower: point.lower, upper: point.upper, rangeBase: point.lower,
      rangeWithin: Math.max(0, Math.min(point.upper, metric.budget) - point.lower), rangeOver: Math.max(0, point.upper - Math.max(point.lower, metric.budget)) });
  }
  return [...rows.values()].sort((a, b) => Number(a.date) - Number(b.date));
}

export function validateUsageBudgetData(data: UsageBudgetForecastData): boolean {
  const finite = (value: number) => Number.isFinite(value);
  const validTime = (value: number) => finite(value) && Math.abs(value) <= 8.64e15;
  if (![data.periodStart, data.periodEnd, data.renewsAt, data.now].every(validTime) || data.periodStart > data.now || data.now >= data.periodEnd || data.renewsAt < data.periodEnd) return false;
  const ids = new Set<string>();
  return data.metrics.every(metric => {
    if (!metric.id.trim() || ids.has(metric.id) || !finite(metric.budget) || metric.budget <= 0 || !Number.isInteger(metric.fractionDigits) || metric.fractionDigits < 0 || metric.fractionDigits > 6) return false;
    ids.add(metric.id);
    if (!/^[A-Z]{3}$/.test(metric.overage.currency) || ![metric.overage.amount, metric.overage.rate, metric.overage.per].every(value => finite(value) && value >= 0) || metric.overage.per === 0) return false;
    const validPoints = (points: readonly UsageBudgetPoint[], start: number, end: number) => points.length > 0 && points.every((point, index) => validTime(point.timestamp) && point.timestamp >= start && point.timestamp <= end && finite(point.value) && point.value >= 0 && (!index || point.timestamp > points[index - 1].timestamp));
    if (!validPoints(metric.history, data.periodStart, data.now) || !validPoints(metric.forecast, data.now, data.periodEnd)) return false;
    if (metric.history.at(-1)!.timestamp !== data.now || metric.forecast[0].timestamp !== data.now || metric.forecast.at(-1)!.timestamp !== data.periodEnd || metric.history.at(-1)!.value !== metric.forecast[0].value) return false;
    if (!metric.forecast.every(point => finite(point.lower) && finite(point.upper) && point.lower >= 0 && point.lower <= point.value && point.value <= point.upper)) return false;
    const [minimum, maximum] = usageBudgetExtent(metric);
    if (![metric.history.at(-1)!.value, metric.forecast.at(-1)!.value].every(value => finite(value / metric.budget * 100))) return false;
    if (metric.domain && (metric.domain.length !== 2 || !metric.domain.every(finite) || !finite(metric.domain[1] - metric.domain[0]) || metric.domain[0] >= metric.domain[1] || minimum < metric.domain[0] || maximum > metric.domain[1])) return false;
    if (!metric.domain && !finite(maximum * 1.12)) return false;
    return !metric.ticks || metric.ticks.every((tick, index) => finite(tick) && (!index || tick > metric.ticks![index - 1]) && (!metric.domain || tick >= metric.domain[0] && tick <= metric.domain[1]));
  });
}
