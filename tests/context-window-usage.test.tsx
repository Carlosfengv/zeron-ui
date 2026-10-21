// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContextWindowUsage, createContextWindowCompactDemoData } from "@zeron/blocks/context-window-02";
import { Button } from "@zeron/ui/button";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }),
  });
});
afterEach(cleanup);

describe("ContextWindowUsage", () => {
  it("uses PieChart for used and remaining tokens and keeps the graphic decorative in a button", () => {
    const data = createContextWindowCompactDemoData();
    const { container } = render(
      <Button variant="ghost" size="sm">
        <span className="sr-only">Context usage: </span>
        <ContextWindowUsage data={data} />
      </Button>,
    );
    expect(screen.getByRole("button", { name: /^Context usage:\s*88%$/ })).toBeTruthy();
    const chart = container.querySelector('[data-slot="pie-chart"]');
    expect(chart).toBeTruthy();
    expect(chart?.closest('[aria-hidden="true"][inert]')).toBeTruthy();
    expect(chart?.querySelector('[data-slot="chart-source-data"]')?.textContent).toContain("175600");
    expect(chart?.querySelector('[data-slot="chart-source-data"]')?.textContent).toContain("24400");
    expect(chart?.querySelectorAll('svg path:not([fill="transparent"])')).toHaveLength(2);
    expect(screen.queryByRole("group")).toBeNull();
  });

  it.each([[0, "0%"], [14000, "7%"], [200000, "100%"], [250000, "125%"]])(
    "uses %i tokens without changing the displayed denominator",
    (used, expected) => {
      const data = { ...createContextWindowCompactDemoData(), systemTokens: used, toolTokens: 0, docs: [], history: [], memory: [] };
      const { container } = render(<ContextWindowUsage data={data} />);
      expect(screen.getByText(expected)).toBeTruthy();
      expect(container.querySelector('[data-slot="pie-chart"]')).toBeTruthy();
    },
  );

  it("updates from the panel snapshot, handles malformed locales, and does not fabricate invalid usage", () => {
    const data = createContextWindowCompactDemoData();
    const { rerender, container } = render(<ContextWindowUsage data={data} locale="invalid_locale" />);
    expect(screen.getByText("88%")).toBeTruthy();
    rerender(<ContextWindowUsage data={{ ...data, capacity: 100000 }} locale="zh-CN" />);
    expect(screen.getByText("176%")).toBeTruthy();
    rerender(<ContextWindowUsage data={{ ...data, capacity: 0 }} />);
    expect(screen.getByText("—")).toBeTruthy();
    expect(container.querySelector('[data-slot="pie-chart"]')).toBeNull();
  });
});
