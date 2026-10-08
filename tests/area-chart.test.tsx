// @vitest-environment jsdom

import { cleanup, fireEvent, render as testingRender, renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { readFileSync } from "node:fs";
import { AreaChart, Area, PatternArea } from "@zeron/ui/area-chart";
import { ChartTooltip, useChartStable, useChartHover, PatternLines, XAxis, YAxis } from "@zeron/ui/chart-core";
import { ChartBrush, type ChartBrushSelection } from "@zeron/ui/chart-brush";
import { chartDate, timeSeriesData, tooltipPosition } from "../packages/ui/src/components/charts/chart-data";
import { decimateTimeSeries } from "../packages/ui/src/components/charts/decimate-time-series";
import { useChartPhaseOrchestrator } from "../packages/ui/src/components/charts/use-chart-phase-orchestrator";

const size = vi.hoisted(() => {
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  return { width: 600, height: 300 };
});

vi.mock("motion/react", async importOriginal => ({ ...await importOriginal<typeof import("motion/react")>(), useReducedMotion: () => true }));

const data = [
  { date: "2026-10-01", value: 100 }, { date: "2026-10-02", value: 200 },
  { date: "2026-10-03", value: 120 }, { date: "2026-10-04", value: 300 },
];
const observers: (() => void)[] = [];
beforeEach(() => {
  size.width = 600; size.height = 300; observers.length = 0;
  Object.defineProperty(SVGElement.prototype, "getTotalLength", { configurable: true, value: () => 100 });
  Object.defineProperty(SVGElement.prototype, "getPointAtLength", { configurable: true, value: (length: number) => ({ x: length * 5, y: 100 }) });
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(element: Element) { const resize = () => this.callback([{ target: element, contentRect: size } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); observers.push(resize); resize(); }
    disconnect() {}
    unobserve() {}
  });
});
async function render(node: import("react").ReactNode) {
  const result = testingRender(node);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
  return result;
}
async function resize() { await act(async () => { observers.forEach(callback => callback()); await new Promise(resolve => setTimeout(resolve, 30)); }); }

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); Reflect.deleteProperty(SVGElement.prototype, "getTotalLength"); Reflect.deleteProperty(SVGElement.prototype, "getPointAtLength"); });

function DomainProbe() {
  const { yScale } = useChartStable();
  return <text data-testid="domain">{yScale.domain().join(",")}</text>;
}

function StackProbe() {
  const { yScale, lines } = useChartStable();
  const { tooltipData } = useChartHover();
  return <text data-testid="stack-probe">{JSON.stringify({ domain: yScale.domain(), group: lines[1]?.stackId, y: tooltipData?.yPositions.b, expectedY: yScale(7), point: tooltipData?.point })}</text>;
}

describe("area chart observations and geometry", () => {
  it("uses stacked totals for scales and keyboard dots while keeping raw tooltip values", async () => {
    const rows = [{ date: "2026-10-01", a: 2, b: 5 }, { date: "2026-10-02", a: 3, b: 4 }];
    const view = await render(<AreaChart data={rows} animationDuration={0} yDomainTween={false}><Area dataKey="a" stackId="total" /><Area dataKey="b" stackId="total" showMarkers /><ChartTooltip /><StackProbe /></AreaChart>);
    const group = view.container.querySelector('[tabindex="0"]')!;
    fireEvent.focus(group);
    const result = JSON.parse(view.getByTestId("stack-probe").textContent!);
    expect(result.group).toBe("total");
    expect(result.domain[1]).toBeGreaterThanOrEqual(7);
    expect(result.y).toBeCloseTo(result.expectedY);
    expect(result.point).toEqual(rows[0]);
    expect(view.getByText("5")).toBeTruthy();
    const paths = [...view.container.querySelectorAll("path")].map(path => path.getAttribute("d") ?? "");
    expect(paths.join(" ")).not.toMatch(/NaN|Infinity/);
  });

  it("preserves stacked gap boundaries and host time-zone labels", async () => {
    const rows = [{ date: "2026-10-01T23:30:00Z", a: 2, b: 5 }, { date: "2026-10-02T23:30:00Z", a: null, b: 4 }, { date: "2026-10-03T23:30:00Z", a: 3, b: 6 }];
    const format = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "Asia/Shanghai" });
    const view = await render(<AreaChart data={rows} animationDuration={0}><Area dataKey="a" stackId="total" /><Area dataKey="b" stackId="total" /><><XAxis formatDate={date => format.format(date)} /></></AreaChart>);
    expect(view.getByText("Oct 2")).toBeTruthy();
    expect(view.getByText("Oct 4")).toBeTruthy();
    expect([...view.container.querySelectorAll("path")].some(path => (path.getAttribute("d")?.match(/M/g) ?? []).length === 2)).toBe(true);
    const chart = view.getByRole("group");
    fireEvent.focus(chart);
    expect(view.getByRole("status").textContent).toBe("Oct 2: a: 2, b: 5");
    fireEvent.keyDown(chart, { key: "End" });
    expect(view.getByRole("status").textContent).toBe("Oct 4: a: 3, b: 6");
  });
  it("orders a plotting view, excludes invalid dates and leaves original rows unchanged", async () => {
    const rows = [data[2], { date: null, value: 3 }, data[0], { date: "bad", value: 4 }];
    expect(timeSeriesData(rows, "date")).toEqual([data[0], data[2]]);
    expect(rows[0]).toBe(data[2]);
    expect(Number.isNaN(chartDate(null).getTime())).toBe(true);
  });

  it("retains missing observations and adjacent points during decimation", async () => {
    const rows = Array.from({ length: 100 }, (_, index) => ({ date: index, value: index === 35 ? null : index }));
    const sampled = decimateTimeSeries(rows, 8, ["value"]);
    expect(sampled).toEqual(expect.arrayContaining([rows[0], rows[34], rows[35], rows[36], rows[99]]));
    expect(sampled.every((row, index) => index === 0 || row.date > sampled[index - 1].date)).toBe(true);
  });

  it("bounds long missing runs without losing either gap boundary", () => {
    const rows = Array.from({ length: 1000 }, (_, index) => ({ date: index, value: index > 100 && index < 900 ? null : index }));
    const sampled = decimateTimeSeries(rows, 16, ["value"]);
    expect(sampled.length).toBeLessThan(30);
    expect(sampled).toEqual(expect.arrayContaining([rows[100], rows[101], rows[899], rows[900]]));
  });

  it("samples the first interior bucket and keeps the requested number of distinct observations", () => {
    const rows = Array.from({ length: 100 }, (_, index) => ({ date: index, value: index === 5 ? 10000 : 0 }));
    const sampled = decimateTimeSeries(rows, 8, ["value"]);
    expect(sampled).toContain(rows[5]);
    expect(sampled).toHaveLength(8);
    expect(sampled[0]).toBe(rows[0]);
    expect(sampled.at(-1)).toBe(rows[99]);
  });

  it("keeps area and stroke gaps without plotting NaN or infinity", async () => {
    const rows = [...data.slice(0, 2), { date: "2026-10-02T12:00:00Z", value: null }, ...data.slice(2), { date: "2026-10-05", value: Infinity }];
    const { container, getByTestId } = await render(<AreaChart data={rows}><Area dataKey="value" showMarkers /><DomainProbe /></AreaChart>);
    const paths = [...container.querySelectorAll("path")].map(path => path.getAttribute("d") ?? "");
    expect(paths.some(path => (path.match(/M/g) ?? []).length === 2)).toBe(true);
    expect(paths.join(" ")).not.toMatch(/NaN|Infinity/);
    expect(getByTestId("domain").textContent).not.toMatch(/NaN|Infinity/);
    expect(container.textContent).toContain("Infinity");
  });

  it("preserves gaps in pattern fills", async () => {
    const rows = [data[0], { ...data[1], value: null }, ...data.slice(2)];
    const { container } = await render(<AreaChart data={rows}><PatternLines id="area-test-pattern" width={6} height={6} stroke="var(--chart-1)" /><PatternArea dataKey="value" fill="url(#area-test-pattern)" /><Area dataKey="value" fillOpacity={0} /></AreaChart>);
    const patternArea = container.querySelector('path[fill="url(#area-test-pattern)"]');
    expect((patternArea?.getAttribute("d")?.match(/M/g) ?? []).length).toBe(2);
  });

  it("flattens fragments and supports a single focus stop with keyboard tooltip navigation", async () => {
    const { getByRole, container } = await render(<AreaChart data={data}><><Area dataKey="value" /><ChartTooltip /></></AreaChart>);
    const root = getByRole("group");
    expect(root.tabIndex).toBe(0);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    fireEvent.focus(root);
    expect(getByRole("status").textContent).toContain("100");
    fireEvent.keyDown(root, { key: "End" });
    expect(getByRole("status").textContent).toContain("300");
    fireEvent.keyDown(root, { key: "ArrowLeft" });
    expect(getByRole("status").textContent).toContain("120");
    fireEvent.keyDown(root, { key: "Home" });
    expect(getByRole("status").textContent).toContain("100");
    fireEvent.keyDown(root, { key: "Escape" });
    expect(getByRole("status").textContent).toBe("");
  });

  it("does not fabricate a tooltip value for a missing observation", async () => {
    const { getByRole, container } = await render(<AreaChart data={[data[0], { ...data[1], value: null }]}><Area dataKey="value" /><ChartTooltip /></AreaChart>);
    fireEvent.focus(getByRole("group"));
    fireEvent.keyDown(getByRole("group"), { key: "End" });
    expect(container.querySelector('[data-slot="chart-tooltip-box"]')?.textContent).toContain("—");
  });

  it("refreshes a keyboard tooltip after data changes and clears it while loading", async () => {
    const { getByRole, rerender } = await render(<AreaChart data={data}><Area dataKey="value" /><ChartTooltip /></AreaChart>);
    fireEvent.focus(getByRole("group"));
    rerender(<AreaChart data={data.map(row => ({ ...row, value: row.value + 5 }))}><Area dataKey="value" /><ChartTooltip /></AreaChart>);
    expect(getByRole("status").textContent).toContain("105");
    rerender(<AreaChart data={data} status="loading"><Area dataKey="value" /><ChartTooltip /></AreaChart>);
    expect(getByRole("status").textContent).toBe("");
  });

  it("cancels a drag when loading interrupts it and resumes normal hover", async () => {
    const example = (status: "ready" | "loading") => <AreaChart data={data} status={status}><Area dataKey="value" /><ChartTooltip /></AreaChart>;
    const { container, rerender, getByRole } = await render(example("ready"));
    const plot = () => container.querySelector('svg > g[transform]')!;
    fireEvent.mouseDown(plot(), { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(plot(), { clientX: 200, clientY: 100 });
    rerender(example("loading"));
    fireEvent.mouseUp(plot());
    rerender(example("ready"));
    fireEvent.mouseMove(plot(), { clientX: 240, clientY: 100 });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
    expect(getByRole("status").textContent).not.toBe("");
  });

  it("isolates SVG definitions between charts with the same data key", async () => {
    const { container } = await render(<><AreaChart data={data}><Area dataKey="value" fadeEdges /></AreaChart><AreaChart data={data}><Area dataKey="value" fadeEdges /></AreaChart></>);
    const ids = [...container.querySelectorAll("svg [id]")].map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps a dashed stroke aligned with the area when height changes", async () => {
    const { container } = await render(<AreaChart data={data}><Area dataKey="value" dashFromIndex={1} /></AreaChart>);
    const base = () => container.querySelector('path[stroke="transparent"]')?.getAttribute("d");
    const dashed = () => container.querySelector('path[stroke-dasharray="6,4"]')?.getAttribute("d");
    expect(dashed()).toBe(base());
    const previous = base();
    size.height = 400;
    await resize();
    expect(base()).not.toBe(previous);
    expect(dashed()).toBe(base());
  });

  it("disables positional axis transitions for reduced motion", async () => {
    const { container } = await render(<AreaChart data={data}><Area dataKey="value" /><XAxis /><YAxis /></AreaChart>);
    const labels = container.querySelectorAll<HTMLElement>('[data-slot="chart-x-axis-label"], [data-slot="chart-y-axis-label"]');
    expect(labels.length).toBeGreaterThan(0);
    expect([...labels].every(label => label.style.transition === "none")).toBe(true);
  });

  it("omits an empty plot and resumes drawing when an undersized container grows", async () => {
    const { container, rerender } = await render(<AreaChart data={[]}><Area dataKey="value" /></AreaChart>);
    expect(container.querySelector("svg")).toBeNull();
    size.width = 40;
    await resize();
    rerender(<AreaChart data={data}><Area dataKey="value" /></AreaChart>);
    expect(container.querySelector("svg")).toBeNull();
    size.width = 600;
    await resize();
    rerender(<AreaChart data={data}><Area dataKey="value" /></AreaChart>);
    expect(container.querySelector("svg path")).not.toBeNull();
  });

  it("clamps wide and tall tooltips to both container edges", async () => {
    expect(tooltipPosition(30, 20, 180, 90, 190, 100, 16)).toMatchObject({ left: 0, top: 10 });
    expect(tooltipPosition(300, 300, 500, 500, 200, 100, 16)).toMatchObject({ left: 0, top: 0 });
  });
});

describe("controlled brush", () => {
  const first = { start: new Date(data[0].date), end: new Date(data[2].date) };
  const second = { start: new Date(data[1].date), end: new Date(data[3].date) };
  const brush = (selection: ChartBrushSelection | null | undefined, onChange: (selection: ChartBrushSelection | null) => void = vi.fn()) => <AreaChart data={data}><Area dataKey="value" /><ChartBrush initialSelection={first} selection={selection} onSelectionChange={onChange} /></AreaChart>;

  it("synchronizes native handles and clears them when controlled selection becomes null", async () => {
    const onChange = vi.fn();
    const { getByRole, queryAllByRole, rerender } = await render(brush(first, onChange));
    expect(getByRole("slider", { name: "Range start" }).getAttribute("aria-valuenow")).toBe(String(first.start.getTime()));
    rerender(brush(second, onChange));
    expect(getByRole("slider", { name: "Range start" }).getAttribute("aria-valuenow")).toBe(String(second.start.getTime()));
    rerender(brush(null, onChange));
    expect(queryAllByRole("slider")).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("updates an uncontrolled native handle through the keyboard and notifies preview and commit", async () => {
    const onChange = vi.fn();
    const { getByRole } = await render(brush(undefined, onChange));
    fireEvent.keyDown(getByRole("slider", { name: "Range start" }), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledTimes(2);
    const selection = onChange.mock.calls[0][0];
    expect(selection.start.getTime()).toBeGreaterThan(first.start.getTime());
    expect(getByRole("slider", { name: "Range start" }).getAttribute("aria-valuenow")).toBe(String(selection.start.getTime()));
  });

  it("accepts keyboard selection requests from a controlled host", async () => {
    function Host() { const [selection, setSelection] = useState<ChartBrushSelection | null>(first); return brush(selection, setSelection); }
    const { getByRole, queryAllByRole } = await render(<Host />);
    fireEvent.keyDown(getByRole("slider", { name: "Range end" }), { key: "End" });
    expect(getByRole("slider", { name: "Range end" }).getAttribute("aria-valuenow")).toBe(String(second.end.getTime()));
    fireEvent.keyDown(getByRole("slider", { name: "Range end" }), { key: "Escape" });
    expect(queryAllByRole("slider")).toHaveLength(0);
    fireEvent.keyDown(getByRole("button", { name: "Select full range" }), { key: "Enter" });
    expect(queryAllByRole("slider")).toHaveLength(2);
  });

  it("restores an uncontrolled selection and native keyboard handles after clearing", async () => {
    const { getByRole, queryAllByRole, container } = await render(brush(undefined));
    getByRole("slider", { name: "Range start" }).focus();
    fireEvent.keyDown(getByRole("slider", { name: "Range start" }), { key: "Escape" });
    expect(queryAllByRole("slider")).toHaveLength(0);
    const empty = getByRole("button", { name: "Select full range" });
    expect(document.activeElement).toBe(empty);
    fireEvent.keyDown(empty, { key: "Enter" });
    expect(queryAllByRole("slider")).toHaveLength(2);
    expect(Number(container.querySelector(".visx-brush-selection")?.getAttribute("width"))).toBe(size.width - 80);
    expect(document.activeElement).toBe(getByRole("slider", { name: "Range start" }));
  });

  it("repositions an uncontrolled native selection when its time scale changes", async () => {
    const example = (xDomain?: [Date, Date]) => <AreaChart data={data} xDomain={xDomain}><Area dataKey="value" /><ChartBrush initialSelection={first} /></AreaChart>;
    const { container, getByRole, rerender } = await render(example());
    fireEvent.keyDown(getByRole("slider", { name: "Range start" }), { key: "ArrowRight" });
    const selectedStart = Number(getByRole("slider", { name: "Range start" }).getAttribute("aria-valuenow"));
    rerender(example([first.start, first.end]));
    const fraction = (selectedStart - first.start.getTime()) / (first.end.getTime() - first.start.getTime());
    expect(Number(container.querySelector(".visx-brush-selection")?.getAttribute("x"))).toBeCloseTo(fraction * (size.width - 80));
  });

  it("keeps the native selection idle for invalid or entirely off-track controlled ranges", async () => {
    const onChange = vi.fn();
    const { container, queryAllByRole, rerender } = await render(brush(first, onChange));
    for (const selection of [
      { start: new Date(NaN), end: first.end },
      { start: new Date("2026-11-01"), end: new Date("2026-11-02") },
    ]) {
      rerender(brush(selection, onChange));
      expect(queryAllByRole("slider")).toHaveLength(0);
      expect(Number(container.querySelector(".visx-brush-selection")?.getAttribute("width") ?? 0)).toBe(0);
    }
    rerender(brush(first, onChange));
    expect(queryAllByRole("slider")).toHaveLength(2);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps native and visible handles aligned when uncontrolled mode resizes", async () => {
    const { getByRole } = await render(brush(undefined));
    fireEvent.keyDown(getByRole("slider", { name: "Range start" }), { key: "ArrowRight" });
    const date = getByRole("slider", { name: "Range start" }).getAttribute("aria-valuenow");
    size.width = 900;
    await resize();
    expect(getByRole("slider", { name: "Range start" }).getAttribute("aria-valuenow")).toBe(date);
    expect(Number(getByRole("slider", { name: "Range start" }).getAttribute("x"))).toBeGreaterThan(0);
  });

  it("keeps a cleared selection when switching back to uncontrolled mode", async () => {
    const { queryAllByRole, rerender } = await render(brush(null));
    rerender(brush(undefined));
    expect(queryAllByRole("slider")).toHaveLength(0);
  });
});

describe("loading completion and installation", () => {
  it("settles reduced-motion status transitions", async () => {
    const onPhaseChange = vi.fn();
    const { rerender, getByRole } = await render(<AreaChart data={data} status="loading" onPhaseChange={onPhaseChange}><Area dataKey="value" /></AreaChart>);
    rerender(<AreaChart data={data} status="ready" onPhaseChange={onPhaseChange}><Area dataKey="value" /></AreaChart>);
    expect(onPhaseChange).toHaveBeenLastCalledWith("ready");
    expect(getByRole("group").tabIndex).toBe(0);
  });

  it("completes exit when no loading overlay can signal it, and cancels its fallback on unmount", async () => {
    vi.useFakeTimers();
    const options = { chartStatus: "loading" as "loading" | "ready", targetData: data, skeletonData: data, animationDuration: 1100, yDomainTweenDuration: 500, skipEnterReveal: true };
    const { result, rerender, unmount } = renderHook(props => useChartPhaseOrchestrator(props), { initialProps: options });
    rerender({ ...options, chartStatus: "ready" });
    expect(result.current.chartPhase).toBe("exiting");
    act(() => vi.advanceTimersByTime(2200));
    expect(result.current.chartPhase).toBe("gridTweenReady");
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("gives each canonical file a single Registry owner and keeps Funnel independent of Visx", async () => {
    const registry = JSON.parse(readFileSync("packages/ui/registry.json", "utf8"));
    const names = ["chart-motion", "chart-core", "chart-brush", "area-chart", "funnel-chart"];
    const items = registry.items.filter((item: { name: string }) => names.includes(item.name));
    const files = items.flatMap((item: { files: { target: string }[] }) => item.files.map(file => file.target));
    expect(new Set(files).size).toBe(files.length);
    const funnel = items.find((item: { name: string }) => item.name === "funnel-chart");
    expect(funnel.registryDependencies).not.toContain("chart-core");
    expect(funnel.dependencies.join(" ")).not.toMatch(/visx|recharts/);
  });
});
