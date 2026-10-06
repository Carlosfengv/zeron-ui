// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SupportTotal } from "../packages/blocks/src/application/support-analytics-01/support-analytics-motion";

const { animate } = vi.hoisted(() => ({ animate: vi.fn() }));
vi.mock("framer-motion", async (original) => ({ ...await original<typeof import("framer-motion")>(), animate }));
let reducedMotion = false;
const listeners = new Set<() => void>();
const animations: { from: number; to: number; onUpdate: (value: number) => void; onComplete: () => void; stop: ReturnType<typeof vi.fn> }[] = [];
beforeEach(() => {
  reducedMotion = false;
  listeners.clear(); animations.length = 0;
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reducedMotion; },
    addEventListener: (_: string, callback: () => void) => listeners.add(callback),
    removeEventListener: (_: string, callback: () => void) => listeners.delete(callback),
  }));
  animate.mockReset().mockImplementation((from, to, options) => {
    const stop = vi.fn();
    animations.push({ from, to, ...options, stop });
    return { stop };
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function visibleTotal(container: HTMLElement) { return container.querySelector('[aria-hidden="true"]')!.textContent; }

it("starts at the real total and retargets an interrupted change without jumping", () => {
  const { container, rerender, unmount } = render(<SupportTotal value={3212} locale="en" />);
  expect(animate).not.toHaveBeenCalled();
  rerender(<SupportTotal value={2023} locale="en" />);
  expect(visibleTotal(container)).toBe("3,212");
  expect(screen.getByText("2,023", { selector: ".sr-only" })).toBeTruthy();
  expect(animations[0]).toMatchObject({ from: 3212, to: 2023 });
  act(() => animations[0].onUpdate(2800));
  expect(visibleTotal(container)).toBe("2,800");
  rerender(<SupportTotal value={4000} locale="en" />);
  expect(animations[0].stop).toHaveBeenCalledOnce();
  expect(animations[1]).toMatchObject({ from: 2800, to: 4000 });
  expect(visibleTotal(container)).toBe("2,800");
  act(() => animations[1].onComplete());
  expect(visibleTotal(container)).toBe("4,000");
  unmount();
  expect(animations[1].stop).toHaveBeenCalledOnce();
});

it("stops and shows the exact target when reduced motion is enabled mid-transition", () => {
  const { container, rerender } = render(<SupportTotal value={3212} locale="en" />);
  rerender(<SupportTotal value={2023} locale="en" />);
  act(() => {
    reducedMotion = true;
    listeners.forEach((listener) => listener());
  });
  expect(animations[0].stop).toHaveBeenCalledOnce();
  expect(visibleTotal(container)).toBe("2,023");
  rerender(<SupportTotal value={4000} locale="en" />);
  expect(animate).toHaveBeenCalledTimes(1);
  expect(visibleTotal(container)).toBe("4,000");
});

it("keeps unavailable and newly available totals immediate rather than counting from zero", () => {
  const { container, rerender } = render(<SupportTotal value={3212} locale="en" />);
  rerender(<SupportTotal value={2023} locale="en" />);
  rerender(<SupportTotal value={null} locale="en" />);
  expect(animations[0].stop).toHaveBeenCalledOnce();
  expect(visibleTotal(container)).toBe("—");
  rerender(<SupportTotal value={2023} locale="en" />);
  expect(visibleTotal(container)).toBe("2,023");
  expect(animate).toHaveBeenCalledTimes(1);
});
