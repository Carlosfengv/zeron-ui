// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, renderHook, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import * as motionReact from "motion/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { FunnelChart, type FunnelStage } from "@zeron/ui/funnel-chart";
import { useEnterComplete } from "../packages/ui/src/components/charts/use-enter-complete";
import * as mountProgress from "../packages/ui/src/components/charts/use-mount-progress";

vi.mock("motion/react", async (importOriginal) => ({
  ...await importOriginal<typeof import("motion/react")>(),
  useReducedMotion: () => true,
}));

let width = 604;
let height = 300;
const observers: { callback: ResizeObserverCallback; target?: Element; disconnect: ReturnType<typeof vi.fn> }[] = [];
const data: FunnelStage[] = [{ label: "Visits", value: 100 }, { label: "Paid", value: 50 }];

function resize(observer: typeof observers[number]) {
  const entry = { target: observer.target, contentRect: { width, height } } as ResizeObserverEntry;
  observer.callback([entry], observer as unknown as ResizeObserver);
}

beforeEach(() => {
  width = 604;
  height = 300;
  observers.length = 0;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ width, height, top: 0, left: 0, bottom: height, right: width, x: 0, y: 0, toJSON: () => ({}) }));
  vi.stubGlobal("ResizeObserver", class {
    callback: ResizeObserverCallback;
    target?: Element;
    disconnect = vi.fn();
    observe = vi.fn((target: Element) => { this.target = target; resize(this); });
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      observers.push(this);
    }
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FunnelChart reference contract", () => {
  it("retains reference curves, layer count, spacing, aspect ratio and first-stage percentages", () => {
    const { container } = render(<FunnelChart data={data} />);
    const root = container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!;
    expect(root.style.aspectRatio).toBe("2.2 / 1");
    const segments = container.querySelectorAll('[data-slot="funnel-segment"]');
    expect(segments).toHaveLength(2);
    expect(segments[0].querySelectorAll("path")).toHaveLength(3);
    expect(segments[0].querySelector("path")!.getAttribute("d")).toBe("M 0 18 C 165 18, 135 84, 300 84 L 300 216 C 135 216, 165 282, 0 282 Z");
    expect(segments[0].querySelector("path")!.getAttribute("fill")).toBe("var(--chart-1)");
    expect([...container.querySelectorAll('[data-slot="funnel-percentage"]')].map((node) => node.textContent)).toEqual(["100%", "50%"]);
    expect(container.querySelector("line, rect")).toBeNull();
  });

  it("mirrors straight edges vertically and preserves the last stage width", () => {
    width = 300;
    height = 604;
    const { container } = render(<FunnelChart data={data} orientation="vertical" edges="straight" />);
    expect(container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!.style.aspectRatio).toBe("1 / 1.8");
    const segments = container.querySelectorAll('[data-slot="funnel-segment"]');
    expect(segments[0].querySelector("path")!.getAttribute("d")).toBe("M 18 0 L 84 300 L 216 300 L 282 0 Z");
    expect(segments[1].querySelector("path")!.getAttribute("d")).toBe("M 84 0 L 84 300 L 216 300 L 216 0 Z");
  });

  it("keeps numeric data intact, applies displayValue precedence and independent visibility", () => {
    const stages = [{ label: "Visits", value: 100, displayValue: "One hundred" }, { label: "Trial", value: 25 }, { label: "Paid", value: 0 }];
    const original = JSON.stringify(stages);
    const { container, rerender } = render(<FunnelChart data={stages} formatValue={(value) => `v:${value}`} formatPercentage={(pct) => `p:${pct}`} />);
    expect([...container.querySelectorAll('[data-slot="funnel-value"]')].map((node) => node.textContent)).toEqual(["One hundred", "v:25", "v:0"]);
    expect([...container.querySelectorAll('[data-slot="funnel-percentage"]')].map((node) => node.textContent)).toEqual(["p:100", "p:25", "p:0"]);
    rerender(<FunnelChart data={stages} showValues={false} showPercentage={false} showLabels={false} />);
    expect(container.querySelector('[data-slot="funnel-value"], [data-slot="funnel-label"], [data-slot="funnel-percentage"]')).toBeNull();
    expect(container.querySelector("ol")!.textContent).toContain("Paid: 0 (0%)");
    expect(JSON.stringify(stages)).toBe(original);
  });

  it("isolates instance definitions and gives patterns priority over gradients on the inner ring", () => {
    const stages = data.map((stage) => ({ ...stage, color: "var(--chart-3)", gradient: [{ offset: 0, color: "var(--chart-2)" }, { offset: "100%", color: "var(--chart-4)" }] }));
    const { container } = render(<><FunnelChart data={stages} /><FunnelChart data={stages} renderPattern={(id, color) => <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M 0 6 L 6 0" stroke={color} /></pattern>} /></>);
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    const charts = container.querySelectorAll('[data-slot="funnel-chart"]');
    const gradientSegment = charts[0].querySelector('[data-slot="funnel-segment"]')!;
    const patternSegment = charts[1].querySelector('[data-slot="funnel-segment"]')!;
    expect(gradientSegment.querySelector("stop")!.getAttribute("offset")).toBe("0%");
    expect(gradientSegment.querySelector("svg > path")!.getAttribute("fill")).toBe("var(--chart-2)");
    expect(gradientSegment.querySelector("svg > path:last-child")!.getAttribute("fill")).toBe(`url(#${gradientSegment.querySelector("linearGradient")!.id})`);
    expect(patternSegment.querySelector("svg > path:last-child")!.getAttribute("fill")).toBe(`url(#${patternSegment.querySelector("pattern")!.id})`);
    expect(patternSegment.querySelector("pattern path")!.getAttribute("stroke")).toBe("var(--chart-2)");
  });

  it("handles empty gradients and combines optional grid switches without changing stage placement", () => {
    const { container, rerender } = render(<FunnelChart data={[{ ...data[0], gradient: [], color: "var(--chart-4)" }, data[1]]} grid />);
    expect(container.querySelector("linearGradient")).toBeNull();
    expect(container.querySelector("path")!.getAttribute("fill")).toBe("var(--chart-4)");
    expect(container.querySelector("rect")!.getAttribute("fill")).toBe("var(--muted)");
    const line = container.querySelector("line")!;
    expect(line.getAttribute("x1")).toBe("302");
    expect(line.getAttribute("stroke")).toBe("var(--border)");
    rerender(<FunnelChart data={data} grid={{ bands: false, lineColor: "var(--chart-3)", lineOpacity: 0.5, lineWidth: 2 }} />);
    expect(container.querySelector("rect")).toBeNull();
    expect(container.querySelector("line")!.getAttribute("stroke-width")).toBe("2");
    expect(container.querySelector("line")!.getAttribute("stroke-opacity")).toBe("0.5");
    rerender(<FunnelChart data={data} grid={{ lines: false }} />);
    expect(container.querySelector("line")).toBeNull();
    expect(container.querySelector("rect")).not.toBeNull();
  });

  it("keeps spread positions and uses grouped orientation and alignment only when requested", () => {
    const { container, rerender } = render(<FunnelChart data={data} labelAlign="end" labelOrientation="horizontal" />);
    expect(container.querySelector('[data-slot="funnel-stage"]')!.querySelector(".h-\\[16\\%\\]")).not.toBeNull();
    rerender(<FunnelChart data={data} labelLayout="grouped" labelOrientation="horizontal" labelAlign="end" />);
    const labelRoot = container.querySelector('[data-slot="funnel-stage"] > div')!;
    expect(labelRoot.classList.contains("justify-end")).toBe(true);
    expect(labelRoot.firstElementChild!.classList.contains("flex-row")).toBe(true);
  });
});

describe("FunnelChart interaction and resilience", () => {
  it("measures layout pixels and skips repeated size updates inside transformed containers", () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockImplementation(() => ({ width: width / 2, height: height / 2, top: 0, left: 0, bottom: height / 2, right: width / 2, x: 0, y: 0, toJSON: () => ({}) }));
    const pattern = vi.fn((id: string) => <pattern id={id} width="6" height="6" />);
    const { container } = render(<FunnelChart data={data} renderPattern={pattern} />);
    const firstStage = container.querySelector<HTMLElement>('[data-slot="funnel-stage"]')!;
    expect(firstStage.style.width).toBe("300px");
    const calls = pattern.mock.calls.length;
    act(() => resize(observers[0]));
    expect(pattern).toHaveBeenCalledTimes(calls);
    width = 804;
    act(() => resize(observers[0]));
    expect(firstStage.style.width).toBe("400px");
  });

  it("keeps SVG nodes and pattern definitions mounted when entrance completes and replays", async () => {
    const progress = motionValue(0);
    vi.spyOn(mountProgress, "useMountProgress").mockReturnValue(progress);
    const { container } = render(<FunnelChart data={data} renderPattern={(id) => <pattern id={id} width="6" height="6" />} />);
    const svg = container.querySelector('[data-slot="funnel-segment"] svg');
    const pattern = svg!.querySelector("pattern");
    act(() => progress.set(1));
    expect(container.querySelector('[data-slot="funnel-segment"] svg')).toBe(svg);
    expect(container.querySelector("pattern")).toBe(pattern);
    await waitFor(() => expect(svg!.parentElement!.style.transform).toBe("none"));
    act(() => progress.set(0));
    expect(container.querySelector('[data-slot="funnel-segment"] svg')).toBe(svg);
  });

  it("does not reattach entrance transforms when a spring bounces below its completed target", () => {
    const progress = motionValue(0);
    const { result } = renderHook(() => useEnterComplete(progress));
    expect(result.current).toBe(false);
    act(() => progress.set(1.02));
    expect(result.current).toBe(true);
    act(() => progress.set(0.97));
    expect(result.current).toBe(true);
    act(() => progress.set(0));
    expect(result.current).toBe(false);
  });

  it("stops entrance animation on replay, reduced motion and unmount with the latest transition", () => {
    const stop = vi.fn();
    const animate = vi.spyOn(motionReact, "animate").mockReturnValue({ stop } as unknown as ReturnType<typeof motionReact.animate>);
    const { result, rerender, unmount } = renderHook(({ replay, duration, reduced }) => mountProgress.useMountProgress({ duration }, 0.24, replay, reduced), {
      initialProps: { replay: 0, duration: 1, reduced: false },
    });
    expect(animate).toHaveBeenCalledOnce();
    expect(animate.mock.calls[0][2]).toEqual({ duration: 1, delay: 0.24 });
    rerender({ replay: 0, duration: 2, reduced: false });
    expect(animate).toHaveBeenCalledOnce();
    rerender({ replay: 1, duration: 2, reduced: false });
    expect(stop).toHaveBeenCalledOnce();
    expect(animate.mock.calls[1][2]).toEqual({ duration: 2, delay: 0.24 });
    rerender({ replay: 1, duration: 2, reduced: true });
    expect(stop).toHaveBeenCalledTimes(2);
    expect(result.current.get()).toBe(1);
    rerender({ replay: 1, duration: 2, reduced: false });
    expect(result.current.get()).toBe(0);
    expect(animate).toHaveBeenCalledTimes(3);
    unmount();
    expect(stop).toHaveBeenCalledTimes(3);
  });

  it("cleans entrance animations and size observers under StrictMode", () => {
    const stop = vi.fn();
    const animate = vi.spyOn(motionReact, "animate").mockReturnValue({ stop } as unknown as ReturnType<typeof motionReact.animate>);
    const hook = renderHook(() => mountProgress.useMountProgress(undefined, 0, 0, false), { wrapper: StrictMode });
    expect(animate).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledOnce();
    hook.unmount();
    expect(stop).toHaveBeenCalledTimes(2);
    const chart = render(<StrictMode><FunnelChart data={data} /></StrictMode>);
    expect(observers).toHaveLength(2);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    chart.unmount();
    expect(observers[1].disconnect).toHaveBeenCalledOnce();
  });

  it("maintains internal hover and preserves the reference controlled-only callback contract", () => {
    const onHoverChange = vi.fn();
    const { container } = render(<FunnelChart data={data} onHoverChange={onHoverChange} />);
    const root = container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!;
    const stage = container.querySelector('[data-index="1"]')!;
    fireEvent.mouseEnter(stage);
    expect(root.dataset.hoveredIndex).toBe("1");
    fireEvent.mouseLeave(stage);
    expect(root.dataset.hoveredIndex).toBeUndefined();
    expect(onHoverChange).not.toHaveBeenCalled();
  });

  it("requests controlled hover updates without silently changing host state", () => {
    const onHoverChange = vi.fn();
    const { container, rerender } = render(<FunnelChart data={data} hoveredIndex={null} onHoverChange={onHoverChange} />);
    const stage = container.querySelector('[data-index="1"]')!;
    fireEvent.mouseEnter(stage);
    expect(onHoverChange).toHaveBeenLastCalledWith(1);
    expect(container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!.dataset.hoveredIndex).toBeUndefined();
    rerender(<FunnelChart data={data} hoveredIndex={1} onHoverChange={onHoverChange} />);
    expect(container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!.dataset.hoveredIndex).toBe("1");
    fireEvent.mouseLeave(stage);
    expect(onHoverChange).toHaveBeenLastCalledWith(null);
    rerender(<FunnelChart data={data} hoveredIndex={99} onHoverChange={onHoverChange} />);
    expect(container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!.dataset.hoveredIndex).toBeUndefined();
  });

  it("provides one keyboard stop, directional movement, boundary keys and clearing", () => {
    const { container, rerender } = render(<FunnelChart data={data} />);
    const root = container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!;
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    act(() => root.focus());
    expect(root.dataset.hoveredIndex).toBe("0");
    fireEvent.mouseEnter(container.querySelector('[data-index="1"]')!);
    fireEvent.mouseLeave(container.querySelector('[data-index="1"]')!);
    expect(root.dataset.hoveredIndex).toBe("1");
    fireEvent.keyDown(root, { key: "Home" });
    fireEvent.keyDown(root, { key: "ArrowRight" });
    expect(root.dataset.hoveredIndex).toBe("1");
    expect(container.querySelector('[role="status"]')!.textContent).toBe("Paid: 50 (50%)");
    fireEvent.keyDown(root, { key: "Home" });
    expect(root.dataset.hoveredIndex).toBe("0");
    fireEvent.keyDown(root, { key: "End" });
    expect(root.dataset.hoveredIndex).toBe("1");
    fireEvent.keyDown(root, { key: "Escape" });
    expect(root.dataset.hoveredIndex).toBeUndefined();
    rerender(<FunnelChart data={data} orientation="vertical" />);
    fireEvent.keyDown(root, { key: "ArrowDown" });
    expect(root.dataset.hoveredIndex).toBe("0");
    fireEvent.keyDown(root, { key: "ArrowDown" });
    expect(root.dataset.hoveredIndex).toBe("1");
    fireEvent.keyDown(root, { key: "ArrowUp" });
    expect(root.dataset.hoveredIndex).toBe("0");
    act(() => root.blur());
    expect(root.dataset.hoveredIndex).toBeUndefined();
  });

  it("clears pointer hover after clicking a focused chart and restores keyboard navigation", () => {
    const { container } = render(<FunnelChart data={data} />);
    const root = container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!;
    const stage = container.querySelector('[data-index="1"]')!;
    fireEvent.mouseEnter(stage);
    fireEvent.pointerDown(stage);
    act(() => root.focus());
    fireEvent.pointerUp(stage);
    expect(root.dataset.hoveredIndex).toBe("1");
    fireEvent.mouseLeave(stage);
    expect(root.dataset.hoveredIndex).toBeUndefined();
    fireEvent.keyDown(root, { key: "ArrowRight" });
    expect(root.dataset.hoveredIndex).toBe("0");
    fireEvent.mouseEnter(stage);
    fireEvent.mouseLeave(stage);
    expect(root.dataset.hoveredIndex).toBe("1");
  });

  it("does not resurrect internal highlights after empty, invalid or shorter data", () => {
    const { container, rerender } = render(<FunnelChart data={data} />);
    fireEvent.mouseEnter(container.querySelector('[data-index="1"]')!);
    rerender(<FunnelChart data={[]} />);
    rerender(<FunnelChart data={data} />);
    let root = container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!;
    expect(root.dataset.hoveredIndex).toBeUndefined();
    fireEvent.mouseEnter(container.querySelector('[data-index="1"]')!);
    rerender(<FunnelChart data={[data[0]]} />);
    rerender(<FunnelChart data={data} />);
    expect(root.dataset.hoveredIndex).toBeUndefined();
    fireEvent.mouseEnter(container.querySelector('[data-index="1"]')!);
    rerender(<FunnelChart data={[{ ...data[0], value: 0 }, data[1]]} />);
    root = container.querySelector<HTMLElement>('[data-slot="funnel-chart"]')!;
    expect(root.dataset.hoveredIndex).toBeUndefined();
    expect(root.querySelector('[role="status"]')!.textContent).toBe("");
    rerender(<FunnelChart data={data} />);
    expect(root.dataset.hoveredIndex).toBeUndefined();
  });

  it.each([0, -1, NaN, Infinity])("does not draw or format percentages for an invalid first value %s", (value) => {
    const formatter = vi.fn((pct: number) => String(pct));
    const { container } = render(<FunnelChart data={[{ label: "First", value }, data[1]]} formatPercentage={formatter} />);
    expect(container.querySelector('[data-state="invalid"]')).not.toBeNull();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("ol")!.textContent).toContain("Paid: 50");
    expect(formatter).not.toHaveBeenCalled();
  });

  it("rejects invalid later values while accepting zero and values above the first stage", () => {
    const { container, rerender } = render(<FunnelChart data={[data[0], { label: "Paid", value: -1 }]} />);
    expect(container.querySelector("svg")).toBeNull();
    rerender(<FunnelChart data={[data[0], { label: "Paid", value: Infinity }]} />);
    expect(container.querySelector("svg")).toBeNull();
    rerender(<FunnelChart data={[data[0], { label: "Paid", value: 200 }, { label: "Last", value: 0 }]} />);
    expect([...container.querySelectorAll('[data-slot="funnel-percentage"]')].map((node) => node.textContent)).toEqual(["100%", "200%", "0%"]);
  });

  it("recovers from empty data and zero-size containers and disconnects observation", () => {
    const { container, rerender, unmount } = render(<FunnelChart data={[]} />);
    expect(container.innerHTML).toBe("");
    expect(observers).toHaveLength(0);
    width = 0;
    height = 0;
    rerender(<FunnelChart data={data} />);
    expect(container.querySelector("svg")).toBeNull();
    expect(observers).toHaveLength(1);
    width = 604;
    height = 300;
    act(() => resize(observers[0]));
    expect(container.querySelector("svg")).not.toBeNull();
    width = 0;
    act(() => resize(observers[0]));
    expect(container.querySelector("svg")).toBeNull();
    unmount();
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
  });

  it("bounds invalid layer counts and gaps, accepts repeated labels and skips motion when reduced", async () => {
    const { container } = render(<FunnelChart data={[data[0], { ...data[1], label: "Visits" }]} layers={Infinity} gap={10000} hoveredIndex={1} />);
    expect(container.querySelectorAll('[data-slot="funnel-segment"] svg > path')).toHaveLength(6);
    for (const path of container.querySelectorAll("path")) {
      expect(path.getAttribute("d")).not.toMatch(/NaN|Infinity/);
    }
    const segment = container.querySelector<HTMLElement>('[data-slot="funnel-segment"]')!;
    expect(Number.parseFloat(segment.style.width)).toBeGreaterThan(0);
    await waitFor(() => expect(container.querySelector('svg > path:last-child')!.getAttribute("style")).not.toContain("scale"));
    expect(container.querySelector('[data-slot="funnel-label"]')!.getAttribute("title")).toBe("Visits");
  });

  it("ships a standalone Registry closure without either chart engine", () => {
    const registry = JSON.parse(readFileSync("packages/ui/registry.json", "utf8"));
    const item = registry.items.find((entry: { name: string }) => entry.name === "funnel-chart");
    expect(item.dependencies).toEqual(["motion", "tw-animate-css"]);
    expect([...item.registryDependencies].sort()).toEqual(["chart-motion", "surfaces", "utils"]);
    expect(item.files.map((file: { target: string }) => file.target)).toEqual([
      "components/ui/funnel-chart.tsx", "components/ui/charts/funnel-chart.tsx",
    ]);
  });
});
