// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DonutSummary, TimeSeriesChart } from "@zeron/ui/chart";
import { AvailabilityMonitor } from "../packages/blocks/src/application/model-detail-02/model-availability";
import { CostBarChart, ErrorRateChart, LatencyDistributionChart, ProviderCostDonut } from "../packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-charts";
import { InfiniteLogTimingBar } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-timing";
import { TimeRangeHistogram } from "@zeron/ui/time-range-histogram";
import type { AiGatewayTimeSeriesPoint } from "../packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-types";

vi.mock("motion/react", async original => ({ ...await original<typeof import("motion/react")>(), useReducedMotion: () => true }));
beforeEach(() => {
  vi.useFakeTimers();
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 600, height: 300 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    unobserve() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function settle() {
  await act(async () => { vi.advanceTimersByTime(150); });
  await act(async () => { vi.advanceTimersByTime(150); });
}
it("retains timing phase proportions and hides real zero phases without minimum-width inflation", () => {
  const view = render(<InfiniteLogTimingBar latency={100} timing={{ dns: 0, connection: 10, tls: 0, ttfb: 40, transfer: 50 }} />);
  const segments = [...view.container.querySelectorAll<HTMLElement>('[data-slot="segmented-bar-segment"]')];
  expect(segments.map(segment => segment.style.flexGrow)).toEqual(["0", "0.1", "0", "0.4", "0.5"]);
  expect(segments[0].hidden).toBe(true);
  expect(view.container.firstElementChild?.getAttribute("aria-label")).toContain("DNS 0 ms");
  expect(view.container.querySelector('[data-slot="segmented-bar"]')?.getAttribute("data-overflow")).toBe("false");
  view.rerender(<InfiniteLogTimingBar latency={80} timing={{ dns: 0, connection: 10, tls: 0, ttfb: 40, transfer: 50 }} />);
  expect(view.container.querySelector('[data-slot="segmented-bar"]')?.getAttribute("data-overflow")).toBe("true");
});

it("draws range selection with native bars, retains inactive colors and keeps the slider as the keyboard owner", async () => {
  const onValueChange = vi.fn();
  const view = render(<TimeRangeHistogram ariaLabel="Range" data={[{ start: 0, end: 10, label: "First", count: 4 }, { start: 10, end: 20, label: "Second", count: 8 }]} series={[{ dataKey: "count", label: "Requests", color: "var(--chart-1)" }]} value={{ start: 0, end: 10 }} onValueChange={onValueChange} />);
  await settle();
  expect(view.container.querySelector(".recharts-wrapper")).toBeNull();
  expect(view.container.querySelector('[data-slot="bar-chart"]')).toBeTruthy();
  const fills = [...view.container.querySelectorAll('svg rect[fill]')].map(rect => rect.getAttribute("fill"));
  expect(fills).toContain("var(--chart-1)");
  expect(fills).toContain("var(--surface-raised)");
  expect(view.container.querySelector('[data-slot="bar-chart"] [tabindex]')).toBeNull();
  fireEvent.keyDown(view.getByRole("slider", { name: "Range" }), { key: "ArrowRight" });
  expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ start: 10, end: 20 });
});

it("renders shared trends and distributions through native charts while retaining gaps, remainder and public series IDs", async () => {
  const start = Date.UTC(2026, 9, 8, 23);
  const view = render(<TimeSeriesChart data={[{ timestamp: start, values: { timestamp: 0 } }, { timestamp: start + 3600000, values: { timestamp: null } }]} series={[{ id: "timestamp", label: "Requests" }]} locale="en-GB" timeZone="Asia/Shanghai" label="Requests" />);
  await settle();
  expect(view.container.querySelector('[data-slot="area-chart"]')).toBeTruthy();
  expect(view.container.querySelector(".recharts-wrapper")).toBeNull();
  expect([...view.container.querySelectorAll("td")].map(node => node.textContent)).toEqual(["0", "—"]);
  expect(view.container.querySelector("table")!.textContent).toContain("07:00");
  view.rerender(<DonutSummary segments={[{ id: "a", label: "Assigned", value: 60 }]} total={100} center={<span>100</span>} aria-label="60 assigned, 40 unassigned" />);
  await settle();
  expect(view.container.querySelector('[data-slot="pie-chart"]')).toBeTruthy();
  expect(view.container.querySelectorAll('path[fill]:not([fill="transparent"])')).toHaveLength(2);
  expect(view.container.querySelector('path[fill="var(--muted)"]')).toBeTruthy();
  expect(view.getByRole("img").getAttribute("aria-label")).toBe("60 assigned, 40 unassigned");
  expect(view.getByText("100")).toBeTruthy();
});

it("keeps availability legend toggles and original percentage values", async () => {
  const view = render(<AvailabilityMonitor contained={false} chartData={[{ timestamp: Date.UTC(2026, 9, 8), routed: 99.84, direct: null }, { timestamp: Date.UTC(2026, 9, 9), routed: 99.5, direct: 95.58 }]} />);
  await settle();
  expect(view.getByRole("group", { name: "routed, direct" })).toBeTruthy();
  const toggle = view.container.querySelector<HTMLButtonElement>('[data-series="direct"] button')!;
  fireEvent.click(toggle);
  await settle();
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
  expect(view.getByRole("group", { name: "routed" })).toBeTruthy();
  expect([...view.container.querySelectorAll("td")].map(node => node.textContent)).toEqual(["99.84%", "—", "99.50%", "95.58%"]);
  fireEvent.click(toggle);
  await settle();
  expect(view.getByRole("group", { name: "routed, direct" })).toBeTruthy();
});

it("distinguishes provider slices, keeps colors on reorder and preserves an unassigned total", async () => {
  const data = ["openai", "anthropic", "google", "mistral"].map((id, index) => ({ id, name: id, requestCount: 1, costMicros: [46, 29, 16, 9][index] }));
  const view = render(<ProviderCostDonut data={data} total={120} formatCost={String} />);
  await settle();
  const fills = () => [...view.container.querySelectorAll('path[fill]:not([fill="transparent"])')].map(path => path.getAttribute("fill"));
  const colors = fills();
  expect(new Set(colors.slice(0, 4)).size).toBe(4);
  expect(colors.at(-1)).toBe("var(--muted)");
  expect(view.getByRole("img").getAttribute("aria-label")).toContain("Unassigned 20");
  view.rerender(<ProviderCostDonut data={[...data].reverse()} total={120} formatCost={String} />);
  await settle();
  expect(fills()).toEqual([...colors.slice(0, 4).reverse(), "var(--muted)"]);
});

it("preserves gateway currency, percentage denominators and percentile bucket boundaries", async () => {
  const data = [{ timestamp: "2026-10-08T23:00:00Z", costMicros: 1500000, errorRate: 0.125 }, { timestamp: "2026-10-09T00:00:00Z", costMicros: 0, errorRate: null }] as AiGatewayTimeSeriesPoint[];
  const view = render(<CostBarChart data={data} formatCost={value => `$${(value / 1000000).toFixed(2)}`} label="Cost" locale="en-US" timeZone="Asia/Shanghai" />);
  await settle();
  fireEvent.keyDown(view.getByRole("group", { name: "Bar chart. Use arrow keys to inspect data." }), { key: "Home" });
  await settle();
  expect(view.container.textContent).toContain("$1.50");
  expect([...view.container.querySelectorAll("td")].map(node => node.textContent)).toEqual(["$1.50", "$0.00"]);
  view.rerender(<ErrorRateChart data={data} label="Errors" locale="en-US" timeZone="Asia/Shanghai" />);
  await settle();
  expect([...view.container.querySelectorAll("td")].map(node => node.textContent)).toEqual(["12.5%", "—"]);
  view.rerender(<LatencyDistributionChart requestLabel="Requests" buckets={[{ id: "low", lowerMs: 0, upperMs: 100, count: 4 }, { id: "high", lowerMs: 100, upperMs: null, count: 2 }]} percentiles={{ p50: 50, p95: 100, p99: null }} />);
  await settle();
  expect(view.container.querySelectorAll('[data-slot="chart-reference-line"]')).toHaveLength(2);
  expect(view.container.textContent).toContain("100ms–∞ms");
});
