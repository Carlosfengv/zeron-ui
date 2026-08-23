// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TimeRangeHistogram,
  type TimeRangeHistogramDatum,
  type TimeRangeHistogramSeries,
} from "../packages/ui/src/components/time-range-histogram";

class TestResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback([{ contentRect: { height: 100, width: 400 }, target } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { value: TestResizeObserver, writable: true });
Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn(), writable: true });
Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", { configurable: true, value: vi.fn(() => true), writable: true });
Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", { configurable: true, value: vi.fn(), writable: true });

const data: readonly TimeRangeHistogramDatum[] = [
  { start: 0, end: 10, label: "00:00", requests: 4 },
  { start: 10, end: 20, label: "01:00", requests: 8 },
  { start: 20, end: 30, label: "02:00", requests: 6 },
  { start: 30, end: 40, label: "03:00", requests: 10 },
];
const series: readonly TimeRangeHistogramSeries[] = [
  { dataKey: "requests", label: "Requests", color: "var(--brand)" },
];

afterEach(cleanup);

describe("TimeRangeHistogram", () => {
  it("moves the controlled range by bucket with the keyboard", () => {
    const onValueChange = vi.fn();
    render(
      <TimeRangeHistogram
        ariaLabel="Request time range"
        data={data}
        onValueChange={onValueChange}
        series={series}
        value={{ start: 10, end: 30 }}
      />,
    );

    const slider = screen.getByRole("slider", { name: "Request time range" });
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onValueChange).toHaveBeenLastCalledWith({ start: 0, end: 20 });

    fireEvent.keyDown(slider, { key: "End" });
    expect(onValueChange).toHaveBeenLastCalledWith({ start: 20, end: 40 });
  });

  it("creates and moves a bucket-aligned range with pointer input", () => {
    const onValueChange = vi.fn();
    render(
      <TimeRangeHistogram
        ariaLabel="Request time range"
        data={data}
        onValueChange={onValueChange}
        series={series}
        value={{ start: 10, end: 30 }}
      />,
    );

    const slider = screen.getByRole("slider", { name: "Request time range" });
    Object.defineProperty(slider, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 68, height: 68, left: 0, right: 400, top: 0, width: 400, x: 0, y: 0, toJSON: () => ({}) }),
    });

    fireEvent.pointerDown(slider, { button: 0, clientX: 10, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 390, pointerId: 1 });
    fireEvent.pointerUp(slider, { clientX: 390, pointerId: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith({ start: 0, end: 40 });

    fireEvent.pointerDown(slider, { button: 0, clientX: 150, pointerId: 2 });
    fireEvent.pointerMove(slider, { clientX: 250, pointerId: 2 });
    fireEvent.pointerUp(slider, { clientX: 250, pointerId: 2 });
    expect(onValueChange).toHaveBeenLastCalledWith({ start: 20, end: 40 });
  });

  it("prioritizes the enlarged boundary hit areas for range resizing", () => {
    const onValueChange = vi.fn();
    render(
      <TimeRangeHistogram
        ariaLabel="Request time range"
        data={data}
        onValueChange={onValueChange}
        series={series}
        value={{ start: 10, end: 30 }}
      />,
    );

    const slider = screen.getByRole("slider", { name: "Request time range" });
    Object.defineProperty(slider, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 68, height: 68, left: 0, right: 400, top: 0, width: 400, x: 0, y: 0, toJSON: () => ({}) }),
    });
    const hitAreas = document.querySelectorAll('[data-slot="time-range-histogram-hit-area"]');

    fireEvent.pointerDown(hitAreas[0]!, { button: 0, clientX: 107, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 10, pointerId: 1 });
    fireEvent.pointerUp(slider, { clientX: 10, pointerId: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith({ start: 0, end: 30 });

    fireEvent.pointerDown(hitAreas[1]!, { button: 0, clientX: 293, pointerId: 2 });
    fireEvent.pointerMove(slider, { clientX: 390, pointerId: 2 });
    fireEvent.pointerUp(slider, { clientX: 390, pointerId: 2 });
    expect(onValueChange).toHaveBeenLastCalledWith({ start: 10, end: 40 });
  });

  it("keeps disabled histograms out of the tab order", () => {
    render(
      <TimeRangeHistogram
        ariaLabel="Request time range"
        data={data}
        disabled
        onValueChange={vi.fn()}
        series={series}
        value={{ start: 10, end: 30 }}
      />,
    );

    const slider = screen.getByRole("slider", { name: "Request time range" });
    expect(slider.getAttribute("aria-disabled")).toBe("true");
    expect(slider.getAttribute("tabindex")).toBe("-1");
  });

  it("anchors an out-of-domain range to the nearest bucket instead of selecting every bucket", () => {
    const { rerender } = render(
      <TimeRangeHistogram
        ariaLabel="Request time range"
        data={data}
        onValueChange={vi.fn()}
        series={series}
        value={{ start: 50, end: 60 }}
      />,
    );

    const selection = document.querySelector<HTMLElement>('[data-slot="time-range-histogram-selection"]');
    expect(selection?.style.left).toBe("75%");
    expect(selection?.style.width).toBe("25%");

    rerender(
      <TimeRangeHistogram
        ariaLabel="Request time range"
        data={data}
        onValueChange={vi.fn()}
        series={series}
        value={{ start: -20, end: -10 }}
      />,
    );
    expect(selection?.style.left).toBe("0%");
    expect(selection?.style.width).toBe("25%");
  });

  it("renders square side boundaries with centered drag handles", () => {
    render(
      <TimeRangeHistogram
        ariaLabel="Request time range"
        data={data}
        onValueChange={vi.fn()}
        series={series}
        value={{ start: 10, end: 30 }}
      />,
    );

    const selection = document.querySelector('[data-slot="time-range-histogram-selection"]');
    const boundaries = document.querySelectorAll('[data-slot="time-range-histogram-boundary"]');
    const handles = document.querySelectorAll('[data-slot="time-range-histogram-handle"]');
    const hitAreas = document.querySelectorAll('[data-slot="time-range-histogram-hit-area"]');
    expect(selection?.classList.contains("rounded-sm")).toBe(false);
    expect(selection?.classList.contains("border")).toBe(false);
    expect(boundaries).toHaveLength(2);
    expect([...boundaries].every((boundary) => boundary.classList.contains("w-0.5"))).toBe(true);
    expect(handles).toHaveLength(2);
    expect([...handles].every((handle) => handle.classList.contains("h-2") && handle.classList.contains("w-1"))).toBe(true);
    expect(hitAreas).toHaveLength(2);
    expect([...hitAreas].every((hitArea) => hitArea.classList.contains("w-4"))).toBe(true);
  });
});
