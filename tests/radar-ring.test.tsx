// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { RadarChart, RadarArea, RadarGrid, RadarAxis, RadarLabels, useRadarStable } from "@zeron/ui/radar-chart";
import { RingChart, Ring, RingCenter, useRingStable } from "@zeron/ui/ring-chart";

vi.mock("motion/react", async original => ({ ...await original<typeof import("motion/react")>(), useReducedMotion: () => true }));
const metrics = [{ key: "a", label: "Speed" }, { key: "b", label: "Quality" }, { key: "c", label: "Coverage" }];
const radarData = [{ label: "Current", values: { a: 80, b: 70, c: 60 } }, { label: "Previous", values: { a: 60, b: 40, c: 75 } }];
const ringData = [{ label: "Requests", value: 72, maxValue: 100 }, { label: "Storage", value: 48, maxValue: 80 }];
beforeEach(() => {
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 300, height: 300 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    disconnect() {} unobserve() {}
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function RadarProbe() { const value = useRadarStable(); return <g data-testid="probe" data-radius={value.radius} data-levels={value.levels} data-position={JSON.stringify(value.getPointPosition(0, 200))} />; }
function RingProbe() { const value = useRingStable(); return <g data-testid="probe" data-radii={JSON.stringify(value.getRingRadii(1))} data-total={value.totalValue} data-duration={value.enterTransition?.duration} />; }
const chartPaths = (container: HTMLElement) => Array.from(container.querySelectorAll("path")).map(path => path.getAttribute("d") ?? "");
describe("RadarChart", () => {
  it("preserves unfilled dashed comparisons during hover and reports metric points", () => {
    const onPointHover = vi.fn();
    const view = render(<RadarChart size={300} data={radarData} metrics={metrics} animate={false}><RadarArea index={0} fillOpacity={0} strokeDasharray="4 4" onPointHover={onPointHover} /></RadarChart>);
    const area = view.container.querySelector('[data-slot="radar-area"]')!;
    fireEvent.mouseEnter(area);
    expect(area.querySelector("path")!.getAttribute("fill-opacity")).toBe("0");
    expect(area.querySelector("path")!.getAttribute("stroke-dasharray")).toBe("4 4");
    const point = area.querySelector('[data-metric="a"]')!;
    fireEvent.pointerEnter(point);
    expect(onPointHover.mock.calls.at(-1)![0]).toBe("a");
    fireEvent.pointerLeave(point);
    expect(onPointHover.mock.calls.at(-1)![0]).toBeNull();
  });
  it("hydrates fixed-size radar geometry before applying reduced motion", async () => {
    const element = <RadarChart size={300} data={radarData} metrics={metrics}><RadarGrid /><RadarAxis /><RadarArea index={0} /><RadarLabels /></RadarChart>;
    const container = document.createElement("div"); container.innerHTML = renderToString(element); document.body.append(container);
    const onError = vi.fn(); let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(container, element, { onRecoverableError: onError }); });
    expect(onError).not.toHaveBeenCalled();
    expect(chartPaths(container).every(path => !/NaN|Infinity/.test(path))).toBe(true);
    await act(async () => root!.unmount()); container.remove();
  });
  it("preserves source values while constraining normalized geometry", () => {
    const data = [{ label: "Current", values: { a: 200, b: -50, c: NaN } }];
    const view = render(<RadarChart data={data} metrics={metrics} size={300}><RadarGrid /><RadarAxis /><RadarArea index={0} /><RadarLabels /><RadarProbe /></RadarChart>);
    expect(view.getByTestId("probe").getAttribute("data-position")).toBe(JSON.stringify({ x: 90 * Math.cos(-Math.PI / 2), y: -90 }));
    expect(chartPaths(view.container).every(path => !/NaN|Infinity/.test(path))).toBe(true);
    expect(view.container.querySelector('[data-slot="chart-source-data"]')?.textContent).toContain("200");
    expect(data[0].values.b).toBe(-50);
  });
  it("links mouse hover, callbacks and keyboard with one tab entry", () => {
    const callback = vi.fn();
    const view = render(<RadarChart size={300} data={radarData} metrics={metrics} onHoverChange={callback}><RadarArea index={0} /><RadarArea index={1} /></RadarChart>);
    fireEvent.mouseEnter(view.container.querySelector('[data-index="1"]')!);
    expect(callback).toHaveBeenLastCalledWith(1);
    expect(view.getByRole("status").textContent).toContain("Previous");
    const chart = view.getByRole("group");
    expect(view.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    fireEvent.keyDown(chart, { key: "Home" });
    expect(view.getByRole("status").textContent).toContain("Current");
    fireEvent.keyDown(chart, { key: "End" });
    expect(view.getByRole("status").textContent).toContain("Previous");
    fireEvent.keyDown(chart, { key: "Escape" });
    expect(view.getByRole("status").textContent).toBe("");
  });
  it("keeps controlled hover until its owner updates it", () => {
    const callback = vi.fn();
    const view = render(<RadarChart size={300} data={radarData} metrics={metrics} hoveredIndex={0} onHoverChange={callback}><RadarArea index={1} /></RadarChart>);
    fireEvent.mouseEnter(view.container.querySelector('[data-index="1"]')!);
    expect(callback).toHaveBeenLastCalledWith(1);
    expect(view.getByRole("status").textContent).toContain("Current");
    view.rerender(<RadarChart size={300} data={radarData} metrics={metrics} hoveredIndex={1}><RadarArea index={1} /></RadarChart>);
    expect(view.getByRole("status").textContent).toContain("Previous");
  });
  it("handles empty metrics, excessive margins and invalid grid levels", () => {
    const view = render(<RadarChart size={180} data={[]} metrics={[]} levels={NaN} margin={300}><RadarGrid /><RadarAxis /><RadarLabels /><RadarArea index={0} /><RadarProbe /></RadarChart>);
    expect(chartPaths(view.container)).toEqual([]);
    expect(view.getByTestId("probe").getAttribute("data-radius")).toBe("0");
    expect(view.getByTestId("probe").getAttribute("data-levels")).toBe("5");
    expect(view.getByRole("group").tabIndex).toBe(-1);
  });
  it("updates static paths and clears stale hover after data shrinks", () => {
    const view = render(<RadarChart size={300} data={radarData} metrics={metrics} hoveredIndex={1}><RadarArea index={0} /></RadarChart>);
    const before = chartPaths(view.container)[0];
    view.rerender(<RadarChart size={300} data={[{ label: "Next", values: { a: 20, b: 30, c: 40 } }]} metrics={metrics} hoveredIndex={1}><RadarArea index={0} /></RadarChart>);
    expect(chartPaths(view.container)[0]).not.toBe(before);
    expect(view.getByRole("status").textContent).toBe("");
  });
});

describe("RingChart", () => {
  it("scales the outer ring to reference padding and keeps zero progress tracks", () => {
    const view = render(<RingChart size={180} data={[{ label: "Zero", value: 0, maxValue: 100 }, ringData[1]]}><Ring index={0} /><Ring index={1} /><RingProbe /></RingChart>);
    const radii = JSON.parse(view.getByTestId("probe").getAttribute("data-radii")!);
    expect(radii.outerRadius).toBeCloseTo(82);
    expect(view.container.querySelector('[data-index="0"]')?.querySelectorAll("path")).toHaveLength(1);
  });
  it("ignores invalid maxima and values without creating invalid SVG or totals", () => {
    const data = [{ label: "Invalid", value: 25, maxValue: 0 }, { label: "Infinite", value: Infinity, maxValue: 100 }, { label: "Negative", value: -20, maxValue: 100 }, ringData[0]];
    const view = render(<RingChart size={180} data={data}><Ring index={0} /><Ring index={1} /><Ring index={2} /><Ring index={3} /><RingProbe /><RingCenter>{({ data }) => <span>{data.maxValue}</span>}</RingCenter></RingChart>);
    expect(view.container.querySelectorAll('[data-slot="ring"]')).toHaveLength(1);
    expect(view.getByTestId("probe").getAttribute("data-total")).toBe("72");
    expect(view.container.querySelector('[data-slot="ring-center"]')?.textContent).toBe("100");
    expect(chartPaths(view.container).every(path => !/NaN|Infinity/.test(path))).toBe(true);
    fireEvent.keyDown(view.getByRole("group"), { key: "Home" });
    expect(view.getByRole("status").textContent).toContain("Requests");
  });
  it("clamps over-target geometry but shows the actual observation", () => {
    const view = render(<RingChart size={180} data={[{ label: "Over", value: 125, maxValue: 100 }]}><Ring index={0} /><RingCenter>{({ value }) => <span>{value}</span>}</RingCenter></RingChart>);
    const paths = chartPaths(view.container);
    expect(paths[1]).toBe(paths[0]);
    expect(view.container.querySelector('[data-slot="ring-center"]')?.textContent).toBe("125");
  });
  it("renders custom center HTML outside SVG through fragments in default and hovered states", () => {
    const view = render(<RingChart size={180} data={ringData}><><Ring index={0} /><Ring index={1} /><RingCenter>{({ value, label, isHovered, data }) => <span>{label}:{value}:{String(isHovered)}:{data.maxValue}</span>}</RingCenter></></RingChart>);
    expect(view.container.querySelector("svg div, svg span, foreignObject")).toBeNull();
    expect(view.container.querySelector('[data-slot="ring-center"]')?.textContent).toBe("Total:120:false:180");
    fireEvent.mouseEnter(view.container.querySelector('[data-index="1"]')!);
    expect(view.container.querySelector('[data-slot="ring-center"]')?.textContent).toBe("Storage:48:true:80");
    fireEvent.blur(view.getByRole("group"));
    expect(view.getByRole("status").textContent).toBe("");
  });
  it("keeps per-ring caps, overrides, subset and hover during geometry scrub", () => {
    const callback = vi.fn();
    const view = render(<RingChart size={180} data={ringData} geometryScrubbing onHoverChange={callback}><Ring index={1} color="var(--chart-5)" lineCap="butt" /></RingChart>);
    expect(view.container.querySelectorAll('[data-slot="ring"]')).toHaveLength(1);
    expect(view.container.querySelectorAll("path")[1].getAttribute("fill")).toBe("var(--chart-5)");
    const flat = chartPaths(view.container)[1];
    fireEvent.mouseEnter(view.container.querySelector('[data-index="1"]')!);
    expect(callback).toHaveBeenLastCalledWith(1);
    view.rerender(<RingChart size={180} data={ringData} geometryScrubbing><Ring index={1} color="var(--chart-5)" lineCap="round" /></RingChart>);
    expect(chartPaths(view.container)[1]).not.toBe(flat);
  });
  it("updates geometry without stale paths and honors animationDuration", () => {
    const view = render(<RingChart size={180} data={ringData} animationDuration={500} geometryScrubbing><Ring index={0} /><RingProbe /></RingChart>);
    expect(view.getByTestId("probe").getAttribute("data-duration")).toBe("0.5");
    const previous = chartPaths(view.container)[1];
    view.rerender(<RingChart size={180} data={ringData} animationDuration={500} strokeWidth={16} endAngle={Math.PI / 2} geometryScrubbing><Ring index={0} /><RingProbe /></RingChart>);
    expect(chartPaths(view.container)[1]).not.toBe(previous);
  });
  it("supports controlled keyboard selection with one tab stop", () => {
    const callback = vi.fn();
    const view = render(<RingChart size={180} data={ringData} hoveredIndex={0} onHoverChange={callback}><Ring index={0} /><Ring index={1} /></RingChart>);
    expect(view.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    fireEvent.keyDown(view.getByRole("group"), { key: "End" });
    expect(callback).toHaveBeenLastCalledWith(1);
    expect(view.getByRole("status").textContent).toContain("Requests");
  });
  it("handles empty data, invalid dimensions and reversed arcs", () => {
    const view = render(<RingChart size={180} data={[]} strokeWidth={NaN} ringGap={-10} baseInnerRadius={Infinity}><Ring index={0} /><RingCenter /></RingChart>);
    expect(chartPaths(view.container)).toEqual([]);
    expect(view.getByRole("group").tabIndex).toBe(-1);
    view.rerender(<RingChart size={180} data={ringData} startAngle={Math.PI / 2} endAngle={-Math.PI / 2}><Ring index={0} /></RingChart>);
    expect(chartPaths(view.container)[1]).toBeTruthy();
    expect(chartPaths(view.container).every(path => !/NaN|Infinity/.test(path))).toBe(true);
  });
  it("hydrates its default SVG and mounts center portals without mismatches", async () => {
    const element = <RingChart size={180} data={ringData}><Ring index={0} /><RingCenter /></RingChart>;
    const container = document.createElement("div");
    container.innerHTML = renderToString(element); document.body.append(container);
    const onError = vi.fn(); let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(container, element, { onRecoverableError: onError }); });
    expect(onError).not.toHaveBeenCalled();
    expect(container.querySelector('[data-slot="ring-center"]')).not.toBeNull();
    await act(async () => root!.unmount()); container.remove();
  });
});
