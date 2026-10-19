// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UsageBudgetForecast } from "../packages/blocks/src/application/usage-forecast-02/usage-budget-forecast";
import { usageBudgetForecastDemoData as demo } from "../packages/blocks/src/application/usage-forecast-02/usage-budget-forecast-demo-data";
import { findUsageBudgetCrossing, usageBudgetChartData, usageBudgetModel, validateUsageBudgetData } from "../packages/blocks/src/application/usage-forecast-02/usage-budget-forecast-data";
import type { UsageBudgetMetric } from "../packages/blocks/src/application/usage-forecast-02/usage-budget-forecast-types";

const panels = vi.hoisted(() => ({ retain: false }));
vi.mock("@zeron/ui/tabs", async original => {
  const actual = await original<typeof import("@zeron/ui/tabs")>();
  return { ...actual, TabPanel: (props: React.ComponentProps<typeof actual.TabPanel>) => panels.retain
    ? <div role="tabpanel" aria-label={props.value}>{props.children}</div> : <actual.TabPanel {...props} /> };
});
vi.mock("../packages/blocks/src/application/usage-forecast-02/usage-budget-forecast-chart", () => ({ UsageBudgetForecastChart: ({ metric }: { metric: UsageBudgetMetric }) => <figure aria-label={`Chart ${metric.id}`} /> }));
beforeEach(() => {
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); panels.retain = false; });

describe("usage budget forecast data", () => {
  it("models the three reference outcomes and retains independent billing quotes", () => {
    expect(validateUsageBudgetData(demo)).toBe(true);
    expect(demo.metrics.map(metric => usageBudgetModel(metric).status)).toEqual(["expected", "within", "exceeded"]);
    const api = usageBudgetModel(demo.metrics[0]);
    expect(api.expectedCrossing).toBe(Date.UTC(2026, 8, 26));
    expect(api.current.value).toBe(32.3);
    expect(api.projected.value).toBe(45.2);
    expect(usageBudgetModel(demo.metrics[2]).historyCrossing).toBe(Date.UTC(2026, 8, 17));
    expect(demo.metrics.map(metric => metric.overage.amount)).toEqual([1449, 0, 292]);
    expect(usageBudgetModel(demo.metrics[2]).usedPercent).toBe(102);
  });
  it("keeps the storage upper-bound risk separate from its central forecast", () => {
    const storage = usageBudgetModel(demo.metrics[1]);
    expect(storage.expectedCrossing).toBeNull();
    expect(storage.earliestCrossing).not.toBeNull();
    expect(storage.projected.lower).toBe(3.65);
    expect(storage.projected.upper).toBe(4.04);
    expect(demo.metrics[1].history[9].value).toBeLessThan(demo.metrics[1].history[8].value);
  });
  it("retains a current upper-bound risk when the forecast interval already spans the budget", () => {
    const storage = demo.metrics[1];
    const metric = { ...storage, forecast: storage.forecast.map((point, index) => index === 0 ? { ...point, upper: 4.2 } : point) };
    expect(usageBudgetModel(metric).earliestCrossing).toBe(demo.now);
  });
  it("reports a recovered storage metric from its current usage instead of its past peak", () => {
    const storage = demo.metrics[1];
    const recovered = { ...storage, history: storage.history.map((point, index) => index === 10 ? { ...point, value: 4.2 } : point) };
    expect(validateUsageBudgetData({ ...demo, metrics: [recovered] })).toBe(true);
    expect(usageBudgetModel(recovered).historyCrossing).not.toBeNull();
    expect(usageBudgetModel(recovered).status).toBe("within");
  });
  it("does not invent a crossing when the first observation was already above a threshold", () => {
    expect(findUsageBudgetCrossing([{ timestamp: 0, value: 186 }, { timestamp: 10, value: 190 }], 160)).toBeNull();
    expect(findUsageBudgetCrossing([{ timestamp: 0, value: 186 }, { timestamp: 10, value: 150 }, { timestamp: 20, value: 170 }], 160)).toBe(15);
  });
  it("validates a dense history without exceeding the argument-count limit", () => {
    const metric = demo.metrics[0];
    const count = 200_000;
    const history = Array.from({ length: count }, (_, index) => ({ timestamp: demo.periodStart + (demo.now - demo.periodStart) * index / (count - 1), value: 32.3 }));
    expect(validateUsageBudgetData({ ...demo, metrics: [{ ...metric, history }] })).toBe(true);
  });
  it("interpolates the first crossing without mutating or flattening falling observations", () => {
    const points = [{ timestamp: 0, value: 4 }, { timestamp: 10, value: 2 }, { timestamp: 20, value: 6 }, { timestamp: 30, value: 1 }];
    expect(findUsageBudgetCrossing(points, 5)).toBe(17.5);
    expect(findUsageBudgetCrossing(points, 4)).toBe(0);
    expect(findUsageBudgetCrossing(points, 8)).toBeNull();
    expect(points[1].value).toBe(2);
  });
  it("splits actual and forecast at exact budget intersections and stacks only the interval", () => {
    for (const metric of demo.metrics) {
      const rows = usageBudgetChartData(metric);
      expect(rows.map(row => row.date)).toEqual([...rows.map(row => row.date)].sort((a, b) => Number(a) - Number(b)));
      expect(new Set(rows.map(row => row.date)).size).toBe(rows.length);
      for (const row of rows) {
        if (typeof row.actual === "number") expect(row.actual).toBeLessThanOrEqual(metric.budget);
        if (typeof row.actualOver === "number") expect(row.actualOver).toBeGreaterThanOrEqual(metric.budget);
        if (typeof row.forecast === "number") expect(row.forecast).toBeLessThanOrEqual(metric.budget);
        if (typeof row.forecastOver === "number") expect(row.forecastOver).toBeGreaterThanOrEqual(metric.budget);
        if (typeof row.rangeBase === "number") {
          expect(Number(row.rangeBase) + Number(row.rangeWithin) + Number(row.rangeOver)).toBeCloseTo(Number(row.upper));
          expect(Number(row.rangeWithin)).toBeGreaterThanOrEqual(0);
          expect(Number(row.rangeOver)).toBeGreaterThanOrEqual(0);
        }
      }
    }
    const crossing = usageBudgetChartData(demo.metrics[0]).find(row => row.date === Date.UTC(2026, 8, 26))!;
    expect(crossing.forecast).toBe(38);
    expect(crossing.forecastOver).toBe(38);
  });
  it("rejects duplicate IDs, mismatched boundaries, invalid ranges, and clipped chart bounds", () => {
    const metric = demo.metrics[0];
    const invalid = (replacement: Partial<UsageBudgetMetric>) => validateUsageBudgetData({ ...demo, metrics: [{ ...metric, ...replacement }] });
    expect(validateUsageBudgetData({ ...demo, metrics: [metric, metric] })).toBe(false);
    expect(invalid({ budget: 0 })).toBe(false);
    expect(invalid({ domain: [0, 38] })).toBe(false);
    expect(invalid({ history: [] })).toBe(false);
    expect(invalid({ forecast: metric.forecast.map((point, index) => index === 0 ? { ...point, value: point.value + 1 } : point) })).toBe(false);
    expect(invalid({ forecast: metric.forecast.map(point => ({ ...point, lower: point.upper + 1 })) })).toBe(false);
    expect(invalid({ history: metric.history.map((point, index) => index === 2 ? { ...point, value: NaN } : point) })).toBe(false);
    expect(invalid({ ticks: [10, 5] })).toBe(false);
    expect(invalid({ domain: [0] as unknown as [number, number] })).toBe(false);
    expect(invalid({ budget: Number.MIN_VALUE })).toBe(false);
    expect(validateUsageBudgetData({ ...demo, metrics: [] })).toBe(true);
  });
});

describe("usage budget forecast interactions", () => {
  it.each(["__proto__", "constructor", "toString"])("handles a metric ID that matches the object prototype: %s", id => {
    const onAlertsChange = vi.fn();
    render(<UsageBudgetForecast data={{ ...demo, metrics: [{ ...demo.metrics[0], id }] }} onAlertsChange={onAlertsChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Alert at 50% for API calls" }));
    expect(onAlertsChange).toHaveBeenLastCalledWith(id, [50, 80, 100]);
    expect(screen.getByRole("button", { name: "Alert at 80% for API calls" }).getAttribute("aria-pressed")).toBe("true");
  });
  it("binds preferences and callbacks to their own metric when inactive panels remain mounted", () => {
    panels.retain = true;
    const onAlertsChange = vi.fn();
    render(<UsageBudgetForecast data={demo} metricId="storage" defaultAlerts={{ api: [50], storage: [80] }} onAlertsChange={onAlertsChange} />);
    const api = screen.getByRole("button", { name: "Alert at 50% for API calls" });
    expect(api.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Alert at 50% for Storage" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(api);
    expect(onAlertsChange).toHaveBeenLastCalledWith("api", []);
    expect(screen.getByRole("button", { name: "Alert at 80% for Storage" }).getAttribute("aria-pressed")).toBe("true");
  });
  it("distinguishes exactly at budget from a rounded sub-one-percent overage", () => {
    const seats = demo.metrics[2];
    const at = (value: number) => ({ ...demo, metrics: [{ ...seats, history: seats.history.map(point => ({ ...point, value: Math.min(point.value, value) })), forecast: seats.forecast.map((point, index) => index === 0 ? { ...point, value, lower: value, upper: value } : point) }] });
    const view = render(<UsageBudgetForecast data={at(200)} />);
    expect(screen.getByText(/^Usage is at budget today/)).toBeTruthy();
    view.rerender(<UsageBudgetForecast data={at(201)} />);
    expect(screen.getByText(/^Usage is less than 1% over today/)).toBeTruthy();
    expect(screen.queryByText(/^Usage is 0% over/)).toBeNull();
  });
  it("preserves cents in billing quotes and fractional rate amounts", () => {
    const seats = demo.metrics[2];
    render(<UsageBudgetForecast data={{ ...demo, metrics: [{ ...seats, overage: { ...seats.overage, amount: 292.49, rate: 24.5 } }] }} />);
    expect(screen.getByText("$292.49")).toBeTruthy();
    expect(screen.getByText("At $24.5 per seat")).toBeTruthy();
  });
  it("preserves a sub-cent API unit rate", () => {
    const api = demo.metrics[0];
    render(<UsageBudgetForecast data={{ ...demo, metrics: [{ ...api, overage: { ...api.overage, rate: 0.0001 } }] }} />);
    expect(screen.getByText("At $0.0001 per 1000 calls")).toBeTruthy();
  });
  it("keeps recovered usage descriptions within budget", () => {
    const storage = demo.metrics[1];
    render(<UsageBudgetForecast data={{ ...demo, metrics: [{ ...storage, history: storage.history.map((point, index) => index === 10 ? { ...point, value: 4.2 } : point) }] }} />);
    expect(screen.getByRole("heading", { name: "At this pace you stay under budget" })).toBeTruthy();
    expect(screen.queryByText(/Usage is 0% over/)).toBeNull();
    expect(screen.getByRole("button", { name: "Alert at 100% for Storage" }).getAttribute("aria-description")).toContain("Reached");
  });
  it("uses a since heading when a sparse history starts above the budget", () => {
    const seats = demo.metrics[2];
    render(<UsageBudgetForecast data={{ ...demo, metrics: [{ ...seats, history: [seats.history.at(-1)!] }] }} />);
    expect(screen.getByRole("heading", { name: "Usage has been at or above budget since Sep 22" })).toBeTruthy();
  });
  it("does not invent a latest crossing date when the lower forecast stays within budget", () => {
    const api = demo.metrics[0];
    const lower = api.forecast.map(point => ({ ...point, lower: Math.min(point.lower, 37) }));
    render(<UsageBudgetForecast data={{ ...demo, metrics: [{ ...api, forecast: lower }] }} />);
    expect(screen.getByText(/the lower estimate could stay under budget/)).toBeTruthy();
    expect(screen.queryByText(/likely between .* and Sep 30/)).toBeNull();
  });
  it("counts calendar days consistently for an intraday budget crossing", () => {
    const api = demo.metrics[0];
    const crossing = Date.UTC(2026, 8, 26, 18);
    render(<UsageBudgetForecast data={{ ...demo, metrics: [{ ...api, forecast: [api.forecast[0], { timestamp: crossing, value: 38, lower: 38, upper: 38 }, api.forecast.at(-1)!] }] }} />);
    expect(screen.getByRole("heading", { name: "At this pace you reach the budget on Sep 26" })).toBeTruthy();
    expect(screen.getByText(/^4 days before/)).toBeTruthy();
  });
  it("updates conclusion, metrics, and chart when switching through all three scenarios", () => {
    render(<UsageBudgetForecast data={demo} />);
    expect(screen.getByRole("heading", { name: "At this pace you reach the budget on Sep 26" })).toBeTruthy();
    expect(screen.getByText("$1,449")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Storage" }));
    expect(screen.getByRole("heading", { name: "At this pace you stay under budget" })).toBeTruthy();
    expect(screen.getAllByRole("definition").map(element => element.textContent)).toContain("3.81 TB");
    expect(screen.getByRole("figure", { name: "Chart storage" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Seats" }));
    expect(screen.getByRole("heading", { name: "You passed the budget on Sep 17" })).toBeTruthy();
    expect(screen.getByText("$292")).toBeTruthy();
    expect(screen.getByText("102% of budget")).toBeTruthy();
  });
  it("retains independent alert preferences across metric switches", () => {
    const onAlertsChange = vi.fn();
    render(<UsageBudgetForecast data={demo} onAlertsChange={onAlertsChange} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Alert at 50% for API calls/ }));
    expect(onAlertsChange).toHaveBeenLastCalledWith("api", [50, 80, 100]);
    fireEvent.click(screen.getByRole("tab", { name: "Storage" }));
    expect(screen.getByRole("button", { name: /^Alert at 50% for Storage/ }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("tab", { name: "API calls" }));
    expect(screen.getByRole("button", { name: /^Alert at 50% for API calls/ }).getAttribute("aria-pressed")).toBe("true");
  });
  it("emits controlled changes without changing the supplied selection or preferences", () => {
    const onMetricChange = vi.fn(); const onAlertsChange = vi.fn();
    const view = render(<UsageBudgetForecast data={demo} metricId="api" alerts={{ api: [80, 100] }} onMetricChange={onMetricChange} onAlertsChange={onAlertsChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Storage" }));
    expect(onMetricChange).toHaveBeenLastCalledWith("storage");
    expect(screen.getByRole("figure", { name: "Chart api" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Alert at 80% for API calls/ }));
    expect(onAlertsChange).toHaveBeenLastCalledWith("api", [100]);
    expect(screen.getByRole("button", { name: /^Alert at 80% for API calls/ }).getAttribute("aria-pressed")).toBe("true");
    view.rerender(<UsageBudgetForecast data={demo} metricId="storage" alerts={{ storage: [50] }} />);
    expect(screen.getByRole("figure", { name: "Chart storage" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Alert at 50% for Storage/ }).getAttribute("aria-pressed")).toBe("true");
  });
  it("handles loading, empty, error, retry, and invalid input without showing stale charts", () => {
    const retry = vi.fn();
    const view = render(<UsageBudgetForecast data={demo} state="loading" />);
    expect(screen.getByRole("status").textContent).toContain("Loading");
    expect(screen.queryByRole("figure")).toBeNull();
    view.rerender(<UsageBudgetForecast data={{ ...demo, metrics: [] }} />);
    expect(screen.getByText("No usage metrics available.")).toBeTruthy();
    view.rerender(<UsageBudgetForecast data={demo} state="error" onRetry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
    view.rerender(<UsageBudgetForecast data={{ ...demo, now: NaN }} />);
    expect(screen.getByRole("alert").textContent).toContain("invalid");
    expect(screen.queryByRole("figure")).toBeNull();
  });
  it("falls back from stale selection IDs and invalid locale values", () => {
    render(<UsageBudgetForecast data={demo} metricId="removed" locale="invalid_locale" />);
    expect(screen.getByRole("figure", { name: "Chart api" })).toBeTruthy();
    expect(screen.getByText("$1,449")).toBeTruthy();
  });
});
