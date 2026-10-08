// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WebsiteAnalytics, createWebsiteAnalyticsDemoData } from "@zeron/blocks/website-analytics-01";

vi.hoisted(() => {
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
});
vi.mock("@zeron/ui/area-chart", () => ({ AreaChart: () => null, Area: () => null }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 600, height: 300 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    disconnect() {}
    unobserve() {}
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it("aligns inverse labels to actual Bar geometry and retains zero and unknown rankings", async () => {
  const data = { ...createWebsiteAnalyticsDemoData(), pages: [
    { id: "missing", label: "Missing", visitors: null },
    { id: "zero", label: "Zero", visitors: 0 },
    { id: "valid", label: "Valid", visitors: 20 },
    { id: "negative", label: "Invalid", visitors: -4 },
  ], sources: [] };
  const original = [...data.pages];
  const view = render(<WebsiteAnalytics data={data} site="example.com" range="30d" />);
  await act(async () => { vi.advanceTimersByTime(100); });
  const section = view.getByRole("heading", { name: "Top pages" }).closest("section")!;
  expect([...section.querySelectorAll("ol li")].map(row => row.textContent)).toEqual(["Valid: 20", "Zero: 0", "Missing: —", "Invalid: —"]);
  expect(data.pages).toEqual(original);

  const bars = section.querySelectorAll('rect[fill="var(--chart-1)"]');
  expect(bars).toHaveLength(2);
  const labels = [...section.querySelectorAll("foreignObject")].filter(element => element.querySelector('[aria-hidden="true"]'));
  expect(labels).toHaveLength(4);
  for (const [index, label] of labels.entries()) {
    const width = Number(label.getAttribute("width"));
    const inset = label.querySelector<HTMLElement>('[aria-hidden="true"]')!.style.clipPath.match(/inset\(0 ([\d.]+)px/)!;
    expect(inset).not.toBeNull();
    expect(width - Number(inset[1])).toBeCloseTo(index < 2 ? Number(bars[index].getAttribute("width")) : 0);
    if (index < 2) {
      expect(Number(label.getAttribute("y"))).toBeCloseTo(Number(bars[index].getAttribute("y")));
      expect(Number(label.getAttribute("height"))).toBeCloseTo(Number(bars[index].getAttribute("height")));
    }
  }
});
