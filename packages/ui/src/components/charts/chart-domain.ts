export type ChartYDomain = [number | "dataMin", number | "dataMax"];

/** Explicit bounds retain out-of-range observations, matching the default overflow policy. */
export function resolveChartYDomain(
  [min, max]: readonly [number, number],
  fallback: [number, number],
  domain?: ChartYDomain
): [number, number] {
  if (!domain) return fallback;
  const low = domain[0] === "dataMin" ? (Number.isFinite(min) ? min : fallback[0]) : domain[0];
  const high = domain[1] === "dataMax" ? (Number.isFinite(max) ? max : fallback[1]) : domain[1];
  if (!Number.isFinite(low) || !Number.isFinite(high) || low > high) return fallback;
  const start = Math.min(low, min);
  const end = Math.max(high, max);
  if (start === end) return [start, start + (Math.abs(start) * 0.1 || 1)];
  return [start, end];
}
