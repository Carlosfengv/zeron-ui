import { describe, expect, it } from "vitest";
import { createSecurityOverviewDemoData } from "../packages/blocks/src/application/security-overview-01/security-overview-demo-data";
import { securityCountTotal, securitySortFindings, securityTrendPoints } from "../packages/blocks/src/application/security-overview-01/security-overview-data";

describe("security overview data", () => {
  it("preserves current totals across ranges and matches complete collections", () => {
    for (const after of [false, true]) for (const range of ["7d", "30d", "90d"] as const) {
      const data = createSecurityOverviewDemoData(range, after);
      expect(securityCountTotal(data.openBySeverity)).toBe(after ? 14 : 13);
      expect(data.findings).toHaveLength(securityCountTotal(data.openBySeverity)!);
      expect(data.assets).toHaveLength(data.affectedAssetCount!);
      expect(data.assets!.reduce((sum, asset) => sum + securityCountTotal(asset.findings)!, 0)).toBe(securityCountTotal(data.openBySeverity));
      expect(data.scannedAssetCount).toBe(26);
      expect(securityTrendPoints(data)!.at(-1)!.total).toBe(securityCountTotal(data.openBySeverity));
    }
    expect(createSecurityOverviewDemoData("7d").resolvedInWindow).not.toBe(createSecurityOverviewDemoData("30d").resolvedInWindow);
  });

  it("does not convert missing, fractional, negative or overflowing counts to zero", () => {
    expect(securityCountTotal(null)).toBeNull();
    expect(securityCountTotal({ critical: 0, high: 0, medium: 0, low: 0 })).toBe(0);
    for (const bad of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
      expect(securityCountTotal({ critical: bad, high: 1, medium: 0, low: 0 })).toBeNull();
    }
  });

  it("keeps missing time buckets as gaps and rejects ambiguous timestamps", () => {
    const data = createSecurityOverviewDemoData("7d");
    const trend = data.trend!.map((point, i) => i === 1 ? { ...point, counts: null } : point);
    const points = securityTrendPoints({ ...data, trend })!;
    expect(points[1].high).toBeNull();
    expect(points[1].total).toBeNull();
    expect(securityTrendPoints({ ...data, trend: [data.trend![0], data.trend![0]] })).toBeNull();
    expect(securityTrendPoints({ ...data, trend: [{ at: 1e20, counts: data.openBySeverity }] })).toBeNull();
    expect(securityTrendPoints({ ...data, window: { ...data.window, end: data.window.start } })).toBeNull();
  });

  it("sorts previews by valid score, then time and stable ID without mutating input", () => {
    const finding = createSecurityOverviewDemoData().findings![0];
    const input = [
      { ...finding, id: "unknown", score: null },
      { ...finding, id: "b", score: 9.6, detectedAt: 1 },
      { ...finding, id: "a", score: 9.6, detectedAt: 1 },
      { ...finding, id: "recent", score: 9.6, detectedAt: 2 },
      { ...finding, id: "invalid", score: 200 },
    ];
    expect(securitySortFindings(input).slice(0, 3).map((item) => item.id)).toEqual(["recent", "a", "b"]);
    expect(input[0].id).toBe("unknown");
  });
});
