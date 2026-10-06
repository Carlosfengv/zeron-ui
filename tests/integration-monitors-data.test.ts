import { describe, expect, it } from "vitest";
import { createIntegrationMonitorsDemoData } from "../packages/blocks/src/application/integration-monitors-01/integration-monitors-demo-data";
import { defaultIntegrationMonitorsQuery, filterIntegrationMonitors, integrationMonitorsCsv, monitorCategory, monitorCategoryCounts, monitorCheckCounts, monitorFormatDate, monitorFormatNumber, monitorPageNumbers, monitorShareHref, normalizeMonitorPagination } from "../packages/blocks/src/application/integration-monitors-01/integration-monitors-data";

const data = createIntegrationMonitorsDemoData();
describe("integration monitor data", () => {
  it("counts integrations independently from their checks", () => {
    expect(monitorCategoryCounts(data.items)).toEqual({ all: 18, failing: 6, compliant: 8, inactive: 4, unclassified: 0 });
    expect(monitorCheckCounts(data.items[1])).toMatchObject({ total: 73, failed: 3 });
  });
  it("never classifies empty, missing, warning or unknown results as compliant", () => {
    for (const checks of [null, [], [{ id: "check", name: "Check", checkedAt: null, result: "warning" as const }], [{ id: "check", name: "Check", checkedAt: null, result: "unknown" as const }]]) expect(monitorCategory({ ...data.items[0], checks })).toBe("unclassified");
    expect(monitorCategory({ ...data.items[1], lifecycle: "paused" })).toBe("inactive");
    expect(monitorCheckCounts({ ...data.items[0], checks: null })).toBeNull();
  });
  it("searches both names and descriptions, intersects filters and preserves snapshot counts", () => {
    expect(filterIntegrationMonitors(data.items, { ...defaultIntegrationMonitorsQuery, search: " MERC " }).map((item) => item.name)).toEqual(["Mercury", "Square"]);
    expect(filterIntegrationMonitors(data.items, { ...defaultIntegrationMonitorsQuery, category: "failing", lifecycle: "paused" })).toEqual([]);
    expect(filterIntegrationMonitors(data.items, { ...defaultIntegrationMonitorsQuery, integrationId: "github" })).toHaveLength(1);
    expect(monitorCategoryCounts(data.items).all).toBe(18);
  });
  it("clamps pagination after deletion and handles malformed query values", () => {
    expect(normalizeMonitorPagination({ ...defaultIntegrationMonitorsQuery, pageIndex: 5 }, 15)).toEqual({ pageIndex: 4, pageSize: 3, pageCount: 5 });
    expect(normalizeMonitorPagination({ ...defaultIntegrationMonitorsQuery, pageSize: 0, pageIndex: NaN }, 0)).toEqual({ pageIndex: 0, pageSize: 3, pageCount: 1 });
    expect(monitorPageNumbers(5, 12)).toEqual([0, "gap-start", 4, 5, 6, "gap-end", 11]);
  });
  it("exports the matched collection and escapes quotes, newlines and spreadsheet formulas", () => {
    const csv = integrationMonitorsCsv([{ ...data.items[0], name: '=SUM(A1:A2)', description: 'hello,"world"\nline' }, { ...data.items[2], assetCount: null, checks: null }]);
    expect(csv).toContain("'=SUM(A1:A2)"); expect(csv).toContain('"hello,""world""\nline"');
    expect(csv).not.toContain('"null"'); expect(csv.startsWith("\uFEFF")).toBe(true);
  });
  it("keeps missing numbers and dates unknown and limits copyable URL schemes", () => {
    expect(monitorFormatNumber(null, "en")).toBe("—"); expect(monitorFormatNumber(-1, "en")).toBe("—");
    expect(monitorFormatDate(NaN, "en", "UTC")).toBe("—");
    expect(monitorShareHref("javascript:alert(1)")).toBeNull(); expect(monitorShareHref("//evil.example")).toBeNull();
    expect(monitorShareHref("/monitors?scope=1")).toBe("/monitors?scope=1");
  });
  it("rejects paths that browsers interpret as protocol-relative links", () => {
    for (const value of ["/\\evil.example", "/\t/evil.example", "/\n/evil.example", "/\r/evil.example"]) {
      expect(monitorShareHref(value)).toBeNull();
    }
  });
});
