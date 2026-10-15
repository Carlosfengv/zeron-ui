// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TabItem, Tabs, TabsList } from "../packages/ui/src/components/tabs";

// Inspect the animation destination without depending on animation timing or
// jsdom layout measurements. Selection still runs through the real Tabs API.
vi.mock("framer-motion", () => ({
  motion: { div: ({ animate, initial: _initial, transition: _transition, exit: _exit, ...props }: HTMLAttributes<HTMLDivElement> & {
    animate?: { left?: number }; initial?: unknown; transition?: unknown; exit?: unknown;
  }) => <div {...props} data-animation-left={animate?.left} /> },
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../packages/ui/src/hooks/use-proximity-hover", () => ({
  useProximityHover: () => ({
    activeIndex: null, setActiveIndex() {}, registerItem() {}, measureItems() {},
    handlers: { onMouseMove() {}, onMouseLeave() {} },
    itemRects: [{ left: 0, top: 0, width: 100, height: 32 }, { left: 100, top: 0, width: 100, height: 32 }],
  }),
}));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function PeriodTabs({ value, onValueChange }: { value?: string; onValueChange?: (value: string) => void }) {
  return <Tabs value={value} defaultValue="weekly" onValueChange={onValueChange}><TabsList>
    <TabItem value="weekly" label="Weekly" /><TabItem value="cycle" label="Cycle" />
  </TabsList></Tabs>;
}

it("keeps the indicator on the accepted controlled value while a request is pending or rejected", () => {
  const onValueChange = vi.fn();
  const { container, rerender } = render(<PeriodTabs value="weekly" onValueChange={onValueChange} />);
  const indicator = () => container.querySelector(".bg-brand")?.getAttribute("data-animation-left");
  expect(indicator()).toBe("0");
  fireEvent.click(screen.getByRole("tab", { name: "Cycle" }));
  expect(onValueChange).toHaveBeenCalledWith("cycle");
  expect(screen.getByRole("tab", { name: "Weekly" }).getAttribute("aria-selected")).toBe("true");
  expect(indicator()).toBe("0");
  rerender(<PeriodTabs value="cycle" onValueChange={onValueChange} />);
  expect(indicator()).toBe("100");
});

it("moves the indicator with an uncontrolled selection", () => {
  const { container } = render(<PeriodTabs />);
  fireEvent.click(screen.getByRole("tab", { name: "Cycle" }));
  expect(screen.getByRole("tab", { name: "Cycle" }).getAttribute("aria-selected")).toBe("true");
  expect(container.querySelector(".bg-brand")?.getAttribute("data-animation-left")).toBe("100");
});
