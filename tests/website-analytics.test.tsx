// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WebsiteAnalytics, createWebsiteAnalyticsDemoData } from "@zeron/blocks/website-analytics-01";

vi.mock("@zeron/ui/area-chart", () => ({
  AreaChart: ({ data, status }: { data: unknown[]; status: string }) => <div data-testid="trend" data-status={status}>{JSON.stringify(data)}</div>,
  Area: () => null,
}));
vi.mock("@zeron/ui/bar-chart", () => ({ BarChart: () => null, Bar: () => null }));
vi.mock("@zeron/ui/chart-core", async (importOriginal) => ({
  ...await importOriginal<typeof import("@zeron/ui/chart-core")>(),
  Grid: () => null, XAxis: () => null, YAxis: () => null, ChartTooltip: () => null, TooltipContent: () => null,
}));
afterEach(cleanup);

const data = createWebsiteAnalyticsDemoData();
const base = { data, site: "example.com", range: "30d" as const };

describe("website analytics", () => {
  it("uses consistent demo aggregates and actual dates for each period", () => {
    expect(data.metrics.visitors.value).toBe(36686);
    expect(data.metrics.signups.value).toBe(1746);
    expect(data.metrics.conversion.value).toBe(1746 / 36686);
    for (const [range, length] of [["7d", 7], ["30d", 30], ["90d", 90]] as const) {
      const snapshot = createWebsiteAnalyticsDemoData(range);
      expect(snapshot.range).toBe(range);
      expect(snapshot.trend).toHaveLength(length);
      expect(new Set(snapshot.trend.map((point) => point.date)).size).toBe(length);
      expect(snapshot.trend.at(-1)?.date).toBe("2026-09-30T00:00:00.000Z");
      expect(snapshot.metrics.visitors.value).toBe(snapshot.trend.reduce((total, point) => total + point.visitors!, 0));
    }
  });

  it("switches the metric and exports the active comparison context", () => {
    const onExport = vi.fn();
    render(<WebsiteAnalytics {...base} onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: "Signups" }));
    expect(JSON.parse(screen.getByTestId("trend").textContent!)[0].current).toBe(data.trend[0].signups);
    fireEvent.click(screen.getByRole("checkbox", { name: "Compare" }));
    expect(screen.getAllByText("Previous period").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(onExport).toHaveBeenCalledWith({ range: "30d", metric: "signups", compare: true });
  });

  it("preserves controlled metric selection and exposes range changes to the host", () => {
    const onMetricChange = vi.fn();
    const onRangeChange = vi.fn();
    render(<WebsiteAnalytics {...base} metric="visitors" onMetricChange={onMetricChange} onRangeChange={onRangeChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Signups" }));
    expect(onMetricChange).toHaveBeenCalledWith("signups");
    expect(JSON.parse(screen.getByTestId("trend").textContent!)[0].current).toBe(data.trend[0].visitors);
    fireEvent.click(screen.getByRole("tab", { name: "7D" }));
    expect(onRangeChange).toHaveBeenCalledWith("7d");
  });

  it("does not render an older range as current or allow exporting it", () => {
    render(<WebsiteAnalytics {...base} range="7d" onExport={vi.fn()} />);
    expect(screen.getByTestId("trend").getAttribute("data-status")).toBe("loading");
    expect(screen.getByTestId("trend").textContent).toBe("[]");
    expect(screen.queryByText("36,686")).toBeNull();
    expect(screen.getByRole("button", { name: "Export" }).hasAttribute("disabled")).toBe(true);
  });

  it("keeps missing observations as gaps and disables unavailable comparison", () => {
    const snapshot = { ...data, trend: [{ ...data.trend[0], visitors: null, comparison: undefined }, { ...data.trend[1], visitors: 0, comparison: undefined }] };
    render(<WebsiteAnalytics {...base} data={snapshot} compare />);
    expect(JSON.parse(screen.getByTestId("trend").textContent!)).toEqual([
      { date: data.trend[0].date, current: null, previous: null },
      { date: data.trend[1].date, current: 0, previous: null },
    ]);
    expect(screen.getByRole("checkbox", { name: "Compare" }).getAttribute("aria-disabled")).toBe("true");
    expect(screen.queryByText("Previous period")).toBeNull();
  });

  it("keeps invalid count values out of plotted observations and comparison", () => {
    const snapshot = { ...data, trend: [
      { ...data.trend[0], visitors: -1, comparison: { visitors: -2 } },
      { ...data.trend[1], visitors: Infinity, comparison: { visitors: NaN } },
      { ...data.trend[2], visitors: 0, comparison: { visitors: Infinity } },
    ] };
    render(<WebsiteAnalytics {...base} data={snapshot} compare />);
    expect(JSON.parse(screen.getByTestId("trend").textContent!)).toEqual([
      { date: data.trend[0].date, current: null, previous: null },
      { date: data.trend[1].date, current: null, previous: null },
      { date: data.trend[2].date, current: 0, previous: null },
    ]);
    expect(screen.getByRole("checkbox", { name: "Compare" }).getAttribute("aria-disabled")).toBe("true");
  });

  it("treats out-of-range rates as gaps and excludes invalid dates consistently", () => {
    const snapshot = { ...data, trend: [
      { ...data.trend[0], conversion: 2, comparison: { conversion: -1 } },
      { ...data.trend[1], conversion: 0, comparison: { conversion: 1 } },
      { ...data.trend[2], date: "invalid-date", conversion: 0.5, comparison: { conversion: 0.4 } },
    ] };
    render(<WebsiteAnalytics {...base} data={snapshot} metric="conversion" compare />);
    expect(JSON.parse(screen.getByTestId("trend").textContent!)).toEqual([
      { date: data.trend[0].date, current: null, previous: null },
      { date: data.trend[1].date, current: 0, previous: 1 },
    ]);
    fireEvent.click(screen.getByText("View data"));
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("shows empty/error states, invokes retry and does not add a no-op export", () => {
    const onRetry = vi.fn();
    const { rerender } = render(<WebsiteAnalytics {...base} data={null} />);
    expect(screen.getAllByText("No data for this period").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Export" })).toBeNull();
    rerender(<WebsiteAnalytics {...base} state="error" onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toBe("Analytics could not be loaded");
    expect(screen.queryByTestId("trend")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
