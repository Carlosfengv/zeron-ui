// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Line, LineChart } from "@zeron/ui/line-chart";
import { Area, AreaChart } from "@zeron/ui/area-chart";
import { Bar, BarChart } from "@zeron/ui/bar-chart";
import { ReferenceLine, useChartStable } from "@zeron/ui/chart-core";
import { resolveChartYDomain } from "../packages/ui/src/components/charts/chart-domain";

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
function DomainProbe() {
  const { yScale } = useChartStable();
  return <text data-testid="domain">{JSON.stringify(yScale.domain())}</text>;
}

it("keeps explicit percentage bounds, expands for real outliers and preserves negative and zero observations", async () => {
  const data = [{ date: "2026-10-01", value: 98 }, { date: "2026-10-02", value: 99 }];
  const view = render(<LineChart data={data} yDomain={[75, 100]} animationDuration={0} yDomainTween={false}><Line dataKey="value" animate={false} /><DomainProbe /></LineChart>);
  await settle();
  expect(JSON.parse(view.getByTestId("domain").textContent!)).toEqual([75, 100]);
  expect(resolveChartYDomain([50, 105], [0, 120], [75, 100])).toEqual([50, 105]);
  expect(resolveChartYDomain([-5, 0], [0, 10], ["dataMin", "dataMax"])).toEqual([-5, 0]);
  expect(resolveChartYDomain([0, 0], [0, 10], ["dataMin", "dataMax"])).toEqual([0, 1]);
  expect(resolveChartYDomain([98, 99], [0, 120], [100, 75])).toEqual([0, 120]);
});

it("scales stacked bars to their sum and positions reference annotations on the same scale", async () => {
  const view = render(<BarChart data={[{ name: "A", first: 60, second: 40 }]} stacked animationDuration={0}><Bar dataKey="first" animate={false} /><Bar dataKey="second" animate={false} /><ReferenceLine y={50} /><ReferenceLine x="A" label="P95" /><DomainProbe /></BarChart>);
  await settle();
  const domain = JSON.parse(view.getByTestId("domain").textContent!);
  expect(domain[0]).toBe(0);
  expect(domain[1]).toBeGreaterThanOrEqual(100);
  const lines = view.container.querySelectorAll('[data-slot="chart-reference-line"] line');
  expect(lines).toHaveLength(2);
  expect(Number(lines[0].getAttribute("y1"))).toBeCloseTo(220 * (1 - 50 / domain[1]));
  expect(Number(lines[1].getAttribute("x1"))).toBeCloseTo(260);
});

it("expands explicit area bounds to stacked totals while retaining bounds for missing observations", async () => {
  const chart = (first: number | null, second: number | null) => <AreaChart data={[{ date: "2026-10-01", first, second }]} yDomain={[0, 80]} animationDuration={0} yDomainTween={false}><Area dataKey="first" stackId="total" animate={false} /><Area dataKey="second" stackId="total" animate={false} /><DomainProbe /></AreaChart>;
  const view = render(chart(60, 40));
  await settle();
  expect(JSON.parse(view.getByTestId("domain").textContent!)).toEqual([0, 100]);
  view.rerender(chart(-60, -40));
  await settle();
  expect(JSON.parse(view.getByTestId("domain").textContent!)).toEqual([-100, 80]);
  view.rerender(chart(null, null));
  await settle();
  expect(JSON.parse(view.getByTestId("domain").textContent!)).toEqual([0, 80]);
});

it("places horizontal bar annotations on value and category axes and accepts numeric categories", async () => {
  const view = render(<BarChart data={[{ name: "A", value: 100 }]} orientation="horizontal" animationDuration={0}><Bar dataKey="value" animate={false} /><ReferenceLine y={50} label={0} /><ReferenceLine x="A" /><DomainProbe /></BarChart>);
  await settle();
  const domain = JSON.parse(view.getByTestId("domain").textContent!);
  const lines = view.container.querySelectorAll('[data-slot="chart-reference-line"] line');
  expect(lines).toHaveLength(2);
  expect(Number(lines[0].getAttribute("x1"))).toBeCloseTo(520 * 50 / domain[1]);
  expect(lines[0].getAttribute("x2")).toBe(lines[0].getAttribute("x1"));
  expect(Number(lines[0].getAttribute("y2"))).toBe(220);
  expect(Number(lines[1].getAttribute("y1"))).toBeCloseTo(110);
  expect(Number(lines[1].getAttribute("x2"))).toBe(520);
  expect(view.container.querySelector("foreignObject")?.textContent).toBe("0");
  view.rerender(<BarChart data={[{ name: 0, value: 100 }]} animationDuration={0}><Bar dataKey="value" animate={false} /><ReferenceLine x={0} /></BarChart>);
  await settle();
  expect(view.container.querySelectorAll('[data-slot="chart-reference-line"] line')).toHaveLength(1);
});
