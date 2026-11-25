// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MiniChart } from "@zeron/ui/mini-chart";
import { chartExamples } from "../app/[locale]/docs/components/mini-chart/chart-examples";

beforeEach(() => {
  const width = 264;
  const height = 96;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
    width, height, top: 0, left: 0, bottom: height, right: width, x: 0, y: 0, toJSON: () => ({}),
  }));
  vi.stubGlobal("ResizeObserver", class {
    callback: ResizeObserverCallback;
    disconnect = vi.fn();
    observe = vi.fn((target: Element) => {
      this.callback([{ target, contentRect: { width, height } } as ResizeObserverEntry], this as unknown as ResizeObserver);
    });
    unobserve = vi.fn();
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MiniChart component & 76-example gallery contract", () => {
  it("provides 76 bilingual examples across all 19 chart kinds with finite headline metrics", () => {
    const en = chartExamples("en");
    const zh = chartExamples("zh-CN");
    expect(en).toHaveLength(76);
    expect(zh).toHaveLength(76);
    expect(en.map((item) => item.id)).toEqual(zh.map((item) => item.id));
    expect(new Set(en.map((item) => item.spec.kind)).size).toBe(19);
    for (const item of [...en, ...zh]) {
      expect(Number.isFinite(item.value), `${item.id} value`).toBe(true);
      expect(item.title.length, `${item.id} title`).toBeGreaterThan(0);
      expect(item.context.length, `${item.id} context`).toBeGreaterThan(0);
    }
  });

  it("reverses zone polarity for high-is-good health scores while preserving error-rate polarity", () => {
    const { container: health } = render(
      <MiniChart label="Node health" spec={{ kind: "meter", mode: "zones", value: 84, max: 100, color: 4, reverseZones: true }} />,
    );
    const healthRects = health.querySelectorAll("svg rect");
    expect(healthRects[1]?.getAttribute("fill")).toBe("var(--chart-7)");
    expect(healthRects[3]?.getAttribute("fill")).toBe("var(--chart-4)");

    const { container: risk } = render(
      <MiniChart label="Error rate" spec={{ kind: "meter", mode: "zones", value: 1.2, max: 3, color: 3 }} />,
    );
    const riskRects = risk.querySelectorAll("svg rect");
    expect(riskRects[1]?.getAttribute("fill")).toBe("var(--chart-4)");
    expect(riskRects[3]?.getAttribute("fill")).toBe("var(--chart-7)");
  });

  it("renders left-aligned compact radial layout and appends remainder item for single-part progress donuts", () => {
    const { container, getByText } = render(
      <MiniChart
        label="Weight prewarm"
        locale="zh-CN"
        spec={{ kind: "radial", mode: "donut", parts: [{ label: "已预热", value: 18, color: 5 }], total: 24, center: "75%" }}
      />,
    );
    expect(container.querySelector(".w-24")).not.toBeNull();
    expect(getByText("已预热")).not.toBeNull();
    expect(getByText("剩余")).not.toBeNull();
    expect(getByText("6")).not.toBeNull();
  });

  it("highlights regressed dumbbell rows in semantic danger color and supports keyboard navigation", () => {
    const { container, getByText } = render(
      <MiniChart
        label="Latency before and after"
        unit="ms"
        spec={{
          kind: "dumbbell",
          beforeLabel: "Before",
          afterLabel: "After",
          lowerIsBetter: true,
          rows: [
            { label: "Chat", before: 176, after: 133 },
            { label: "Vision", before: 146, after: 163 },
          ],
        }}
      />,
    );
    expect(getByText("Before")).not.toBeNull();
    expect(getByText("After")).not.toBeNull();
    const lines = container.querySelectorAll("svg g > line");
    const strokes = Array.from(lines).map((line) => line.getAttribute("stroke"));
    expect(strokes).toContain("var(--chart-7)");

    const svg = container.querySelector("svg[tabindex='0']")!;
    fireEvent.keyDown(svg, { key: "ArrowRight" });
    expect(container.querySelector("[data-mini-reading]")?.textContent).toContain("Chat");
  });

  it("renders accessible empty status when spec contains no finite observations", () => {
    const { getByRole } = render(
      <MiniChart label="Empty metric" locale="zh-CN" spec={{ kind: "line", data: [{ label: "10:00", value: null }] }} />,
    );
    expect(getByRole("status").textContent).toBe("暂无数据");
  });
});
