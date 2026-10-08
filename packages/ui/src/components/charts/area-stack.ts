import type { LineConfig } from "./chart-context";
import { isFiniteValue } from "./chart-data";
import { normalizeYAxisId } from "./y-axis-scales";

/** Stack only within one axis/group. An incomplete group stays a gap. */
export function areaStackRange(point: Record<string, unknown>, series: LineConfig, lines: readonly LineConfig[]): [number, number] | null {
  const value = point[series.dataKey];
  if (!isFiniteValue(value)) return null;
  if (series.stackId === undefined) return [0, value];
  const group = lines.filter(line => line.stackId !== undefined && String(line.stackId) === String(series.stackId) && normalizeYAxisId(line.yAxisId) === normalizeYAxisId(series.yAxisId));
  if (group.some(line => !isFiniteValue(point[line.dataKey]))) return null;
  let positive = 0;
  let negative = 0;
  let range: [number, number] | null = null;
  for (const line of group) {
    const amount = point[line.dataKey] as number;
    const start = amount < 0 ? negative : positive;
    const end = start + amount;
    if (!Number.isFinite(end)) return null;
    if (amount < 0) negative = end;
    else positive = end;
    if (line === series) range = [start, end];
  }
  return range;
}

/** Geometry uses cumulative endpoints; tooltip observations remain untouched. */
export function seriesYValue(point: Record<string, unknown>, series: LineConfig, lines: readonly LineConfig[]): number | null {
  return areaStackRange(point, series, lines)?.[1] ?? null;
}
