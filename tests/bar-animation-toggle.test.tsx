// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BarChart, Bar, BarSquares } from "@zeron/ui/bar-chart";

vi.hoisted(() => {
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 600, height: 300 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    disconnect() {}
    unobserve() {}
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("bar animation controls", () => {
  it.each([["Bar", Bar], ["BarSquares", BarSquares]] as const)("keeps %s mounted when animation is toggled", async (_name, Series) => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const chart = (animate: boolean) => <BarChart data={[{ name: "First", value: 10 }, { name: "Second", value: 20 }]} animationDuration={0}><Series dataKey="value" animate={animate} /></BarChart>;
    const view = render(chart(true));
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(view.container.querySelector('rect[fill="var(--chart-1)"]')).not.toBeNull();

    expect(() => view.rerender(chart(false))).not.toThrow();
    expect(() => view.rerender(chart(true))).not.toThrow();
    await act(async () => { vi.advanceTimersByTime(100); });
    fireEvent.keyDown(view.getByRole("group"), { key: "End" });
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(view.getByRole("status").textContent).toContain("20");
    expect(errors).not.toHaveBeenCalled();
  });
});
