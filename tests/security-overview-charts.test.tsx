// @vitest-environment jsdom
import { act, cleanup, fireEvent, render as testingRender } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecurityScore, SecurityTrend, SecurityPostureRadar } from "../packages/blocks/src/application/security-overview-01/security-overview-charts";
import { SecurityPosture, SecurityFindings } from "../packages/blocks/src/application/security-overview-01/security-overview-views";
import { createSecurityOverviewDemoData } from "../packages/blocks/src/application/security-overview-01/security-overview-demo-data";
import { securityOverviewLabels as labels } from "../packages/blocks/src/application/security-overview-01/security-overview-data";

vi.mock("motion/react", async original => ({ ...await original<typeof import("motion/react")>(), useReducedMotion: () => true }));
const data = createSecurityOverviewDemoData();
const props = { data, labels, locale: "zh-CN", timeZone: "Asia/Shanghai" };
beforeEach(() => {
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(element: Element) { this.callback([{ target: element, contentRect: { width: 540, height: 192 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    disconnect() {}
    unobserve() {}
  });
  Object.defineProperty(SVGElement.prototype, "getTotalLength", { configurable: true, value: () => 100 });
  Object.defineProperty(SVGElement.prototype, "getPointAtLength", { configurable: true, value: (length: number) => ({ x: length, y: 100 }) });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); Reflect.deleteProperty(SVGElement.prototype, "getTotalLength"); Reflect.deleteProperty(SVGElement.prototype, "getPointAtLength"); });
async function render(node: import("react").ReactNode) {
  const view = testingRender(node);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 40)); });
  return view;
}

describe("security overview native charts", () => {
  it("keeps snapshot score/grade while scans run and represents unknown separately from zero", async () => {
    const view = await render(<SecurityScore {...props} scan={{ status: "running", jobId: "job", completed: 100, total: 100 }} />);
    expect(view.container.querySelector('[data-slot="ring-chart"]')).toBeTruthy();
    expect(view.getByText("B")).toBeTruthy();
    expect(view.container.textContent).toContain("77");
    expect(view.container.querySelector('[aria-label*="上次扫描"]')).toBeTruthy();
    view.rerender(<SecurityScore {...props} data={{ ...data, score: null }} scan={{ status: "idle" }} />);
    expect(view.container.querySelector('[data-slot="ring-chart"]')).toBeNull();
    expect(view.getByRole("img").getAttribute("aria-label")).toContain("— / 100");
    view.rerender(<SecurityScore {...props} data={{ ...data, score: 0 }} scan={{ status: "idle" }} />);
    expect(view.container.querySelector('[data-slot="ring-chart"]')).toBeTruthy();
  });

  it("renders a native stacked trend with raw severity counts in its keyboard tooltip", async () => {
    const view = await render(<SecurityTrend {...props} />);
    expect(view.container.querySelector('[data-slot="area-chart"]')).toBeTruthy();
    expect(view.container.querySelector(".recharts-wrapper")).toBeNull();
    const group = view.container.querySelector('[data-slot="area-chart"] [tabindex="0"]')!;
    fireEvent.focus(group); fireEvent.keyDown(group, { key: "End" });
    const source = view.container.querySelector('[data-slot="chart-source-data"]')!;
    expect(source.textContent).toContain("critical");
    expect(view.container.querySelector('[role="status"]')!.textContent).toContain("high: 5");
    expect([...view.container.querySelectorAll("svg path")].every(path => !/NaN|Infinity/.test(path.getAttribute("d") ?? ""))).toBe(true);
    expect(view.container.querySelector('[data-slot="chart-data-table"] tbody tr:last-child')!.textContent).toContain("2542");
  });

  it("shows empty state for invalid trend windows and all-missing buckets", async () => {
    const view = await render(<SecurityTrend {...props} data={{ ...data, trend: data.trend!.map(point => ({ ...point, counts: null })) }} />);
    expect(view.getByText(labels.noData)).toBeTruthy();
    view.rerender(<SecurityTrend {...props} data={{ ...data, window: { ...data.window, end: data.window.start } }} />);
    expect(view.container.querySelector('[data-slot="area-chart"]')).toBeNull();
  });

  it("groups radar and data table in one grid cell beside the metric list", async () => {
    const view = await render(<SecurityPosture {...props} />);
    const chart = view.container.querySelector('[data-slot="security-posture-chart"]')!;
    expect(chart.querySelector('[data-slot="radar-chart"]')).toBeTruthy();
    expect(chart.querySelector('[data-slot="chart-data-table"]')).toBeTruthy();
    expect(chart.parentElement!.children).toHaveLength(2);
    expect(chart.nextElementSibling!.tagName).toBe("DL");
    const previous = chart.querySelector('[data-slot="radar-area"][data-index="1"] path')!;
    expect(previous.getAttribute("fill-opacity")).toBe("0");
    expect(previous.getAttribute("stroke-dasharray")).toBe("4 4");
  });

  it("does not replace unknown posture with zero or draw incomplete historical comparisons", async () => {
    const view = await render(<SecurityPostureRadar {...props} data={{ ...data, posture: data.posture!.map((area, i) => i === 0 ? { ...area, previousScore: null } : area) }} />);
    expect(view.container.querySelectorAll('[data-slot="radar-area"]')).toHaveLength(1);
    view.rerender(<SecurityPostureRadar {...props} data={{ ...data, posture: data.posture!.map((area, i) => i === 0 ? { ...area, score: null } : area) }} />);
    expect(view.container.querySelector('[data-slot="radar-chart"]')).toBeNull();
    expect(view.getByText(labels.noData)).toBeTruthy();
  });

  it("uses the shared distribution bar with authoritative severity counts", async () => {
    const view = await render(<SecurityFindings {...props} />);
    const bar = view.container.querySelector('[data-slot="segmented-bar"]')!;
    expect(bar.getAttribute("role")).toBe("img");
    expect(bar.getAttribute("aria-label")).toBe("未解决 13");
    expect(bar.querySelectorAll('[data-slot="segmented-bar-segment"]')).toHaveLength(4);
  });
});
