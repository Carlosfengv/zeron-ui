import { describe, expect, it } from "vitest";
import { createSupportAnalyticsDemoData, createSupportAnalyticsDemoRecords, supportAnalyticsDemoChannels } from "../packages/blocks/src/application/support-analytics-01/support-analytics-demo-data";
import { comparison, formatCount, formatMetric, metricTrendPoints, trendSummary } from "../packages/blocks/src/application/support-analytics-01/support-analytics-data";
import type { SupportAnalyticsRange } from "../packages/blocks/src/application/support-analytics-01/support-analytics-types";

describe("support analytics data", () => {
  it.each(["this-week", "last-30-days", "last-12-weeks"] as SupportAnalyticsRange[])("reconciles all channels, status counts, buckets and previews in %s", (range) => {
    const all = createSupportAnalyticsDemoData({ range, channel: "all" });
    let sum = 0;
    for (const channel of supportAnalyticsDemoChannels) {
      const data = createSupportAnalyticsDemoData({ range, channel });
      expect(data.total).toBe(data.counts.open! + data.counts.resolved!);
      expect(trendSummary(data).total).toBe(data.total);
      expect(trendSummary(data).complete).toBe(true);
      if (channel !== "all") sum += data.total!;
      for (const [view, detail] of Object.entries(data.views)) {
        expect(detail.recentTickets.length).toBeLessThanOrEqual(4);
        expect(detail.recentTickets.every((ticket) => (view === "all" || ticket.status === view) && (channel === "all" || ticket.channel === channel))).toBe(true);
      }
    }
    expect(all.total).toBe(sum);
  });
  it("retains video totals and precise averages", () => {
    expect(createSupportAnalyticsDemoData().total).toBe(1318);
    expect(createSupportAnalyticsDemoData({ range: "last-30-days", channel: "all" }).total).toBe(5369);
    expect(createSupportAnalyticsDemoData({ range: "last-12-weeks", channel: "all" }).total).toBe(13511);
    expect(createSupportAnalyticsDemoData({ range: "last-12-weeks", channel: "email" }).total).toBe(4251);
    const live = createSupportAnalyticsDemoData({ range: "this-week", channel: "live-chat" });
    expect(live.counts).toEqual({ open: 47, resolved: 349 });
    expect(trendSummary(live).average).toBeCloseTo(396 / 7);
  });
  it("resolving updates full-set metrics and status while retaining creation volume and dates", () => {
    const query = { range: "this-week", channel: "live-chat" } as const;
    const before = createSupportAnalyticsDemoData(query);
    const id = before.views.open!.recentTickets[0].id;
    const after = createSupportAnalyticsDemoData(query, { resolvedTicketIds: [id], revision: 1 });
    expect(after.counts).toEqual({ open: 46, resolved: 350 });
    expect(after.buckets).toEqual(before.buckets); expect(after.total).toBe(396);
    expect(after.views.open!.recentTickets.some((ticket) => ticket.id === id)).toBe(false);
    expect(after.views.resolved!.recentTickets.some((ticket) => ticket.id === id)).toBe(true);
    expect(after.views.resolved!.metrics.find((metric) => metric.id === "resolution")!.sampleSize).toBe(350);
    expect(after.views.resolved!.metrics.find((metric) => metric.id === "resolution")!.value).not.toBe(before.views.resolved!.metrics.find((metric) => metric.id === "resolution")!.value);
    expect(createSupportAnalyticsDemoRecords(query, { resolvedTicketIds: [id, id] }).filter((ticket) => ticket.status === "resolved")).toHaveLength(350);
  });
  it("does not invent averages for missing, future, irregular or invalid windows", () => {
    const data = createSupportAnalyticsDemoData();
    expect(trendSummary({ ...data, buckets: data.buckets.map((bucket, index) => index === 1 ? { ...bucket, count: null } : bucket) }).average).toBeNull();
    expect(trendSummary({ ...data, window: { ...data.window, observedThrough: data.window.end - 1 } }).average).toBeNull();
    const partial = trendSummary({ ...data, window: { ...data.window, observedThrough: data.buckets[3].start } });
    expect(partial.points.slice(0, 3).every((point) => point.count !== null)).toBe(true);
    expect(partial.points.slice(3).every((point) => point.count === null)).toBe(true);
    expect(trendSummary({ ...data, buckets: data.buckets.slice(1) }).average).toBeNull();
    expect(trendSummary({ ...data, window: { ...data.window, end: NaN } }).points).toEqual([]);
    const empty = createSupportAnalyticsDemoData(undefined, { empty: true });
    expect(empty.total).toBe(0); expect(trendSummary(empty).average).toBe(0);
    expect(empty.views.all!.metrics.every((metric) => metric.value === null && metric.sampleSize === 0)).toBe(true);
  });
  it("preserves unknown values, zero and explicit comparison units", () => {
    expect(formatCount(null, "en")).toBe("—"); expect(formatCount(0, "en")).toBe("0");
    expect(formatCount(-1, "en")).toBe("—"); expect(formatCount(1.2, "en")).toBe("—");
    expect(formatMetric(1.2, "ratio", "en")).toBe("—"); expect(formatMetric(0, "ratio", "en")).toBe("0%");
    expect(formatMetric(413 * 60000, "milliseconds", "en")).toBe("6h 53m");
    expect(comparison(1, 0, "relative")).toBeNull(); expect(comparison(0, 0, "relative")).toBe(0);
    expect(comparison(0.735, 0.7, "percentage-points")).toBeCloseTo(3.5);
  });
  it("keeps invalid metric samples as gaps without changing valid values or timestamps", () => {
    const metric = createSupportAnalyticsDemoData().views.all!.metrics.find((item) => item.id === "first-contact")!;
    const trend = [{ timestamp: 0, value: 0 }, { timestamp: 1000, value: 1.2 }, { timestamp: 5000, value: null },
      { timestamp: 6000, value: -0.1 }, { timestamp: 9000, value: Infinity }, { timestamp: 10000, value: 0.735 }, { timestamp: NaN, value: 0.5 }];
    expect(metricTrendPoints({ ...metric, trend })).toEqual([
      { timestamp: 0, value: 0 }, { timestamp: 1000, value: null }, { timestamp: 5000, value: null },
      { timestamp: 6000, value: null }, { timestamp: 9000, value: null }, { timestamp: 10000, value: 0.735 },
    ]);
    expect(trend[1].value).toBe(1.2);
  });
});
