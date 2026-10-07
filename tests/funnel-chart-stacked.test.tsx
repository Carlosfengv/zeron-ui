// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FunnelChart, type FunnelSeries } from "@zeron/ui/funnel-chart";

vi.mock("motion/react", async (importOriginal) => ({
  ...await importOriginal<typeof import("motion/react")>(), useReducedMotion: () => true,
}));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 608, height: 300 } } as ResizeObserverEntry], this as unknown as ResizeObserver); }
    disconnect() {}
  });
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const series: FunnelSeries[] = [{ key: "a", label: "Team A", color: "var(--chart-1)" }, { key: "b", label: "Team B", color: "var(--chart-2)" }];
const data = [{ label: "Leads", value: 100, values: { a: 40, b: 60 } }, { label: "Deals", value: 50, values: { a: 30, b: 20 } }];

describe("FunnelChart data stacks", () => {
  it("uses real cumulative values on a common baseline and tapers the final stage", () => {
    const { container } = render(<FunnelChart data={data} series={series} edges="straight" gap={8} />);
    const paths = container.querySelectorAll('[data-slot="funnel-series"]');
    expect(paths).toHaveLength(4);
    expect(paths[0].getAttribute("d")).toBe("M 0 180 L 300 210 L 300 300 L 0 300 Z");
    expect(paths[1].getAttribute("d")).toBe("M 0 0 L 300 150 L 300 210 L 0 180 Z");
    expect(paths[2].getAttribute("d")).toBe("M 0 210 L 300 300 L 300 300 L 0 300 Z");
    expect(paths[0].getAttribute("fill")).toBe("var(--chart-1)");
    expect(container.querySelector("ol")?.textContent).toContain("Team A: 40");
    expect(container.querySelector("ol")?.textContent).toContain("Deals: 50 (50%)");
  });

  it("shares curved boundaries and transposes the baseline for vertical stacks", () => {
    const { container, rerender } = render(<FunnelChart data={data} series={series} gap={8} />);
    const path = container.querySelector('[data-slot="funnel-series"]')!.getAttribute("d")!;
    expect(path).toContain("L 126 180 C 168.00000000000003 180, 258 210, 300 210");
    rerender(<FunnelChart data={data} series={series} edges="straight" orientation="vertical" gap={0} />);
    expect(container.querySelector('[data-slot="funnel-series"]')!.getAttribute("d")).toBe("M 364.8 0 L 425.59999999999997 150 L 608 150 L 608 0 Z");
  });

  it("keeps stacks above 100% inside the first segment's rounded clip in either orientation", () => {
    const growing = [{ label: "Leads", value: 100, values: { a: 40, b: 60 } }, { label: "Deals", value: 200, values: { a: 80, b: 120 } }];
    const { container, rerender } = render(<FunnelChart data={growing} series={series} />);
    let clip = container.querySelector("clipPath rect")!;
    expect(Number(clip.getAttribute("y"))).toBeLessThanOrEqual(-300);
    expect(Number(clip.getAttribute("height"))).toBeGreaterThanOrEqual(600);
    rerender(<FunnelChart data={growing} series={series} orientation="vertical" />);
    clip = container.querySelector("clipPath rect")!;
    expect(Number(clip.getAttribute("x"))).toBeLessThanOrEqual(-608);
    expect(Number(clip.getAttribute("width"))).toBeGreaterThanOrEqual(1216);
  });

  it("uses relative tolerance for fractional totals and accepts floating-point rounding", () => {
    const { container, rerender } = render(<FunnelChart data={[{ label: "Small", value: 1e-10, values: { a: 0, b: 0 } }]} series={series} />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector('[data-slot="funnel-chart"]')?.getAttribute("data-state")).toBe("invalid");
    rerender(<FunnelChart data={[{ label: "Fractional", value: 0.3, values: { a: 0.1, b: 0.2 } }]} series={series} />);
    expect(container.querySelectorAll('[data-slot="funnel-series"]')).toHaveLength(2);
  });

  it.each([
    { name: "missing", stages: [{ label: "Leads", value: 100, values: { a: 40 } }], teams: series },
    { name: "mismatched totals", stages: [{ label: "Leads", value: 101, values: { a: 40, b: 60 } }], teams: series },
    { name: "negative", stages: [{ label: "Leads", value: 100, values: { a: -1, b: 101 } }], teams: series },
    { name: "nonfinite", stages: [{ label: "Leads", value: 100, values: { a: Infinity, b: 60 } }], teams: series },
    { name: "duplicate keys", stages: data, teams: [series[0], series[0]] },
    { name: "no series", stages: data, teams: [] },
  ])("does not draw $name data or invent percentages", ({ stages, teams }) => {
    const { container } = render(<FunnelChart data={stages} series={teams} />);
    expect(container.querySelector('[data-slot="funnel-chart"]')?.getAttribute("data-state")).toBe("invalid");
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelector('[data-slot="funnel-chart"]')?.hasAttribute("tabindex")).toBe(false);
  });

  it("retains controlled keyboard and pointer requests with stacks", () => {
    const onHoverChange = vi.fn();
    const { container } = render(<FunnelChart data={data} series={series} hoveredIndex={null} onHoverChange={onHoverChange} />);
    const chart = container.querySelector('[data-slot="funnel-chart"]')!;
    const scrollIntoView = vi.fn();
    Object.defineProperty(container.querySelectorAll('[data-slot="funnel-stage"]')[1], "scrollIntoView", { value: scrollIntoView });
    fireEvent.keyDown(chart, { key: "End" });
    expect(onHoverChange).toHaveBeenLastCalledWith(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
    fireEvent.mouseEnter(container.querySelector('[data-slot="funnel-stage"]')!);
    expect(onHoverChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(chart, { key: "Escape" });
    expect(onHoverChange).toHaveBeenLastCalledWith(null);
    expect(chart.hasAttribute("data-hovered-index")).toBe(false);
  });
});
