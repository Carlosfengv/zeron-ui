// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { UsageBudgetForecast } from "../packages/blocks/src/application/usage-forecast-02/usage-budget-forecast";
import { usageBudgetForecastDemoData as demo } from "../packages/blocks/src/application/usage-forecast-02/usage-budget-forecast-demo-data";

vi.mock("motion/react", async original => ({ ...await original<typeof import("motion/react")>(), useReducedMotion: () => true }));
beforeEach(() => {
  Object.defineProperty(SVGElement.prototype, "getTotalLength", { configurable: true, value: () => 100 });
  Object.defineProperty(SVGElement.prototype, "getPointAtLength", { configurable: true, value: (length: number) => ({ x: length * 5, y: 100 }) });
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 600, height: 320 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    unobserve() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); Reflect.deleteProperty(SVGElement.prototype, "getTotalLength"); Reflect.deleteProperty(SVGElement.prototype, "getPointAtLength"); });
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); }); }

it("uses original units in accessible observations and keyboard tooltips after shifting the plot origin", async () => {
  const view = render(<UsageBudgetForecast data={demo} defaultMetricId="seats" />);
  await settle();
  const source = view.container.querySelector('[data-slot="chart-source-data"]')!;
  expect(source.textContent).toContain("Actual: 186 seats");
  expect(source.textContent).not.toContain("rangeBase");
  expect(source.textContent).not.toContain("actual: 46");
  expect(source.querySelectorAll("p")).toHaveLength(30);
  const control = view.container.querySelector('[data-slot="area-chart"] [role="group"][tabindex="0"]')!;
  fireEvent.focus(control);
  fireEvent.keyDown(control, { key: "End" });
  await settle();
  expect(view.baseElement.querySelector('[data-slot="chart-tooltip-box"]')?.textContent).toContain("212 seats");
});

it("does not annotate a new 80% crossing when the period starts above that threshold", async () => {
  const view = render(<UsageBudgetForecast data={demo} defaultMetricId="seats" />);
  await settle();
  const annotations = [...view.container.querySelectorAll("svg text")].map(element => element.textContent);
  expect(annotations).not.toContain("80%");
  expect(annotations).toContain("100% · Sep 17");
});

it("does not invent a 100% intersection when sparse history begins above budget", async () => {
  const seats = demo.metrics[2];
  const view = render(<UsageBudgetForecast data={{ ...demo, metrics: [{ ...seats, history: [seats.history.at(-1)!] }] }} />);
  await settle();
  const annotations = [...view.container.querySelectorAll("svg text")].map(element => element.textContent);
  expect(annotations.some(text => text?.startsWith("100%"))).toBe(false);
});
