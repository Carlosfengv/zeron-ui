// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RouterFlow } from "../packages/blocks/src/application/model-router-01/router-flow";
import { modelRouterDemoData } from "../packages/blocks/src/application/model-router-01/model-router-demo-data";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("keeps the static chart usable when animation browser APIs are unavailable", () => {
  vi.stubGlobal("matchMedia", undefined);
  vi.stubGlobal("IntersectionObserver", undefined);
  const { container } = render(<RouterFlow routes={modelRouterDemoData.routes} animated gateway="Gateway" locale="en-US" />);
  expect(container.querySelectorAll('[data-slot="router-flow-route"]')).toHaveLength(4);
  expect(container.querySelectorAll("animateMotion")).toHaveLength(0);
});

it("runs only visible, nonzero traffic and stops for reduced motion and explicit pause", () => {
  let visibility!: (entries: { isIntersecting: boolean }[]) => void;
  let motionChange!: () => void;
  const disconnect = vi.fn();
  const media = { matches: false, addEventListener: vi.fn((_, listener) => { motionChange = listener; }), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => media);
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: typeof visibility) { visibility = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const routes = modelRouterDemoData.routes.map((route, index) => index === 0 ? { ...route, requestsPerSecond: 0 } : route);
  const { container, rerender, unmount } = render(<RouterFlow routes={routes} animated gateway="Gateway" locale="en-US" />);
  expect(container.querySelectorAll("animateMotion")).toHaveLength(0);
  act(() => visibility([{ isIntersecting: true }]));
  expect(container.querySelectorAll("animateMotion").length).toBeGreaterThan(0);
  expect(container.querySelector('[data-slot="router-flow-route"]')?.querySelectorAll("animateMotion")).toHaveLength(0);
  act(() => { media.matches = true; motionChange(); });
  expect(container.querySelectorAll("animateMotion")).toHaveLength(0);
  act(() => { media.matches = false; motionChange(); });
  expect(container.querySelectorAll("animateMotion").length).toBeGreaterThan(0);
  act(() => visibility([{ isIntersecting: false }]));
  expect(container.querySelectorAll("animateMotion")).toHaveLength(0);
  act(() => visibility([{ isIntersecting: true }]));
  rerender(<RouterFlow routes={routes} animated={false} gateway="Gateway" locale="en-US" />);
  expect(container.querySelectorAll("animateMotion")).toHaveLength(0);
  act(() => { media.matches = true; motionChange(); });
  rerender(<RouterFlow routes={routes} animated gateway="Gateway" locale="en-US" />);
  expect(container.querySelectorAll("animateMotion")).toHaveLength(0);
  act(() => { media.matches = false; motionChange(); });
  expect(container.querySelectorAll("animateMotion").length).toBeGreaterThan(0);
  expect(container.querySelectorAll('[data-slot="router-flow-route"]')).toHaveLength(4);
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(media.removeEventListener).toHaveBeenCalledOnce();
});

it("uses unique path IDs for multiple router instances", () => {
  const { container } = render(<><RouterFlow routes={modelRouterDemoData.routes} animated={false} gateway="Gateway" locale="en-US" /><RouterFlow routes={modelRouterDemoData.routes} animated={false} gateway="Gateway" locale="en-US" /></>);
  const ids = [...container.querySelectorAll("path[id]")].map((path) => path.id);
  expect(ids).toHaveLength(8);
  expect(new Set(ids).size).toBe(8);
});
