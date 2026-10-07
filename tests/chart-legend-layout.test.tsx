// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartLegend, Legend, LegendItem, LegendLabel, LegendMarker, LegendValue } from "@zeron/ui/chart-core";
import { fitLegendItems } from "../packages/ui/src/components/charts/legend/legend-layout";

const items = [
  { label: "Requests", value: 340, color: "var(--chart-1)" },
  { label: "Comparison", value: 240, color: "var(--chart-2)" },
  { label: "Latency", value: 44, color: "var(--chart-3)" },
];
let available = 500;
const resizeCallbacks: ResizeObserverCallback[] = [];
beforeEach(() => {
  available = 500;
  resizeCallbacks.length = 0;
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) {
    if (this.dataset.slot === "legend-layout-item") return 120;
    return 40;
  });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => available);
  const original = window.getComputedStyle;
  vi.stubGlobal("getComputedStyle", (element: Element) => element.getAttribute("data-slot") === "legend-layout" ? { columnGap: "16px" } : original(element));
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { resizeCallbacks.push(callback); }
    observe() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function visible(container: HTMLElement) {
  return [...container.querySelectorAll('[data-slot="legend-layout-item"]:not([aria-hidden="true"])')];
}
function resize(width: number) {
  available = width;
  act(() => resizeCallbacks.forEach(callback => callback([], {} as ResizeObserver)));
}

describe("chart legend layout", () => {
  it("admits complete pairs and reserves the disclosure without hiding an item unnecessarily", () => {
    expect(fitLegendItems([120, 120, 120], 400, 40, 16)).toBe(3);
    expect(fitLegendItems([120, 120, 120], 340, 40, 16)).toBe(2);
    expect(fitLegendItems([120, 120, 120], 250, 40, 16)).toBe(1);
    expect(fitLegendItems([120, 120, 120], 100, 40, 16)).toBe(0);
    expect(fitLegendItems([120, 120, 120], 500, 40, 16, 1)).toBe(1);
    expect(fitLegendItems([], 0, 40, 16)).toBe(0);
  });

  it("preserves the default vertical layout and formatted values", () => {
    const { container, getByText, queryByRole } = render(<ChartLegend items={items} formatValue={value => `${value} units`} />);
    expect(container.querySelector('[data-slot="legend-layout"]')?.getAttribute("data-layout")).toBe("stack");
    expect(visible(container)).toHaveLength(3);
    expect(getByText("340 units")).toBeTruthy();
    expect(queryByRole("button")).toBeNull();
  });

  it("reveals and collapses complete label/value pairs using a localized disclosure", () => {
    available = 250;
    const { container, getByRole } = render(<ChartLegend items={items} layout="inline" overflow="collapse" renderOverflowLabel={(count, expanded) => expanded ? "收起" : `更多（${count}）`} />);
    expect(visible(container)).toHaveLength(1);
    expect(visible(container)[0].textContent).toContain("Requests340");
    const more = getByRole("button", { name: "更多（2）" });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(more);
    expect(visible(container)).toHaveLength(3);
    const less = getByRole("button", { name: "收起" });
    expect(less.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(less);
    expect(visible(container)).toHaveLength(1);
  });

  it("recalculates on resize and value updates and restores focus before hiding a custom control", () => {
    const { container, rerender, getByRole } = render(<ChartLegend items={items} layout="inline" overflow="collapse" renderItem={({ item }) => <button>{item.label} {item.value}</button>} />);
    getByRole("button", { name: "Latency 44" }).focus();
    resize(250);
    expect(visible(container)).toHaveLength(1);
    expect(document.activeElement).toBe(getByRole("button", { name: "+2 more" }));
    expect(container.querySelectorAll('[data-slot="legend-layout-item"][inert]')).toHaveLength(2);
    expect(() => getByRole("button", { name: "Latency 44" })).toThrow();
    rerender(<ChartLegend items={items.map(item => ({ ...item, value: item.value + 1 }))} layout="inline" overflow="collapse" />);
    expect(visible(container)[0].textContent).toContain("341");
    resize(500);
    expect(visible(container)).toHaveLength(3);
    expect(container.querySelector('[data-slot="legend-overflow-button"]')).toBeNull();
  });

  it("keeps wrap mode accessible and honors an explicit collapsed item limit", () => {
    const { container, rerender } = render(<ChartLegend items={items} layout="inline" overflow="wrap" maxVisibleItems={1} />);
    expect(visible(container)).toHaveLength(3);
    rerender(<ChartLegend items={items} layout="inline" overflow="collapse" maxVisibleItems={1} />);
    expect(visible(container)).toHaveLength(1);
    rerender(<ChartLegend items={[]} layout="inline" overflow="collapse" />);
    expect(visible(container)).toHaveLength(0);
    expect(container.querySelector('[data-slot="legend-overflow-button"]')).toBeNull();
  });

  it.each([false, true])("keeps keyboard focus when a wider container removes the disclosure (expanded=%s)", expanded => {
    available = 250;
    const { container, getByRole } = render(<ChartLegend items={items} layout="inline" overflow="collapse" />);
    if (expanded) fireEvent.click(getByRole("button", { name: "+2 more" }));
    getByRole("button", { name: expanded ? "Show less" : "+2 more" }).focus();
    resize(500);
    expect(visible(container)).toHaveLength(3);
    expect(container.querySelector('[data-slot="legend-overflow-button"]')).toBeNull();
    expect(document.activeElement).toBe(container.querySelector('[data-slot="legend-layout"]'));
  });

  it("supports the compound legend with original hover indexes after expansion", () => {
    available = 250;
    const onHoverChange = vi.fn();
    const { container, getByRole } = render(<Legend items={items} hoveredIndex={null} onHoverChange={onHoverChange} layout="inline" overflow="collapse">
      <LegendItem><LegendMarker /><LegendLabel /><LegendValue /></LegendItem>
    </Legend>);
    expect(visible(container)).toHaveLength(1);
    fireEvent.click(getByRole("button", { name: "+2 more" }));
    expect(visible(container)).toHaveLength(3);
    fireEvent.mouseEnter(visible(container)[2].firstElementChild!);
    expect(onHoverChange).toHaveBeenLastCalledWith(2);
    expect(visible(container)[2].textContent).toContain("Latency44");
  });
});
