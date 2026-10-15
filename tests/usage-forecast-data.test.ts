import { describe, expect, it } from "vitest";
import { projectUsageAccount, sortUsageProjections, USAGE_FORECAST_DAY as DAY, validateUsageForecast } from "../packages/blocks/src/application/usage-forecast-01/usage-forecast-data";
import type { UsageForecastAccount } from "../packages/blocks/src/application/usage-forecast-01/usage-forecast-types";

const now = Date.UTC(2026, 9, 15);
const base: UsageForecastAccount = { id: "a", name: "Account", usedPercent: 80, windowStart: now - 2 * DAY, resetsAt: now + 3 * DAY };

describe("quota window forecasts", () => {
  it("derives depletion, lockout, pace and remaining allowance from the snapshot", () => {
    const result = projectUsageAccount(base, now);
    expect(result.runsOutAt).toBe(now + DAY / 2);
    expect(result.lockedMs).toBe(2.5 * DAY);
    expect(result.projectedPercent).toBe(200);
    expect(result.pace).toBe(2);
    expect(result.allowance).toBeCloseTo(20 / 3);
  });
  it("uses an explicit recent rate and preserves idle, zero and reset-boundary values", () => {
    expect(projectUsageAccount({ ...base, dailyRate: 0 }, now).projectedPercent).toBe(80);
    expect(projectUsageAccount({ ...base, dailyRate: 0 }, now).runsOutAt).toBeNull();
    expect(projectUsageAccount({ ...base, usedPercent: 100, dailyRate: 0 }, now).runsOutAt).toBe(now);
    expect(projectUsageAccount({ ...base, usedPercent: 40, dailyRate: 20 }, now).runsOutAt).toBeNull();
    expect(projectUsageAccount({ ...base, usedPercent: 0, dailyRate: 0 }, now).pace).toBe(0);
  });
  it("keeps disconnected, new and zero-elapsed accounts unknown", () => {
    for (const status of ["new", "disconnected"] as const) {
      const result = projectUsageAccount({ ...base, status, dailyRate: 100 }, now);
      expect(result.available).toBe(false); expect(result.runsOutAt).toBeNull(); expect(result.pace).toBeNull();
    }
    expect(projectUsageAccount({ ...base, windowStart: now }, now).available).toBe(false);
  });
  it("reports a full quota as exhausted even before an average rate is available", () => {
    const result = projectUsageAccount({ ...base, usedPercent: 100, windowStart: now }, now);
    expect(result.available).toBe(true);
    expect(result.runsOutAt).toBe(now);
    expect(result.lockedMs).toBe(3 * DAY);
    expect(result.projectedPercent).toBe(100);
    expect(result.dailyRate).toBeNull();
    expect(result.pace).toBeNull();
    expect(projectUsageAccount({ ...base, usedPercent: 100, windowStart: now, status: "disconnected" }, now).available).toBe(false);
  });
  it("rejects stale windows, duplicates, invalid percentages and rates", () => {
    expect(validateUsageForecast([base], now)).toBe(true);
    for (const account of [{ ...base, resetsAt: now }, { ...base, windowStart: now + 1 }, { ...base, usedPercent: NaN }, { ...base, usedPercent: 101 }, { ...base, dailyRate: -1 }])
      expect(validateUsageForecast([account], now)).toBe(false);
    expect(validateUsageForecast([base, base], now)).toBe(false);
  });
  it("rejects missing or duplicate daily category IDs without rejecting repeated display labels", () => {
    const first = { id: "day-1", label: "Monday", usedPercent: 4 };
    expect(validateUsageForecast([{ ...base, recentUsage: [first, { ...first, id: "day-2" }] }], now)).toBe(true);
    for (const id of ["day-1", "", "  "]) {
      expect(validateUsageForecast([{ ...base, recentUsage: [first, { ...first, id }] }], now)).toBe(false);
    }
  });
  it("sorts each numeric column and keeps unknown estimates last in either direction", () => {
    const items = [projectUsageAccount(base, now), projectUsageAccount({ ...base, id: "b", usedPercent: 20 }, now), projectUsageAccount({ ...base, id: "c", status: "new" }, now)];
    expect(sortUsageProjections(items, { key: "used", direction: "asc" }, "en").map((item) => item.account.id)).toEqual(["b", "a", "c"]);
    for (const direction of ["asc", "desc"] as const) expect(sortUsageProjections(items, { key: "outcome", direction }, "en").at(-1)?.account.id).toBe("c");
    expect(sortUsageProjections(items, { key: "pace", direction: "desc" }, "en")[0].account.id).toBe("a");
  });
  it("orders depletion times before remaining reset percentages without mixing their units", () => {
    const items = [
      projectUsageAccount({ ...base, id: "later", dailyRate: 10 }, now),
      projectUsageAccount({ ...base, id: "soon", dailyRate: 20 }, now),
      projectUsageAccount({ ...base, id: "safe-high", usedPercent: 50, dailyRate: 5 }, now),
      projectUsageAccount({ ...base, id: "safe-low", usedPercent: 10, dailyRate: 0 }, now),
      projectUsageAccount({ ...base, id: "unknown", status: "new" }, now),
    ];
    expect(sortUsageProjections(items, { key: "outcome", direction: "asc" }, "en").map((item) => item.account.id)).toEqual(["soon", "later", "safe-high", "safe-low", "unknown"]);
    expect(sortUsageProjections(items, { key: "outcome", direction: "desc" }, "en").map((item) => item.account.id)).toEqual(["safe-low", "safe-high", "later", "soon", "unknown"]);
    expect(items.map((item) => item.account.id)).toEqual(["later", "soon", "safe-high", "safe-low", "unknown"]);
  });
});
