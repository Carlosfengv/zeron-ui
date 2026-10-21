// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AgentMessageTraceTimeline,
  type AgentMessageTraceData,
} from "@zeron/blocks/agent-message-trace-01";

type ScrollAnimation = {
  from: number;
  to: number;
  options: { onUpdate: (value: number) => void; onComplete: () => void };
};
const motionTest = vi.hoisted(() => ({
  start: 0,
  end: Infinity,
  reduced: false,
  scroll: null as ScrollAnimation | null,
}));
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => motionTest.reduced,
  animate: (from: number, to: number, options: ScrollAnimation["options"]) => {
    motionTest.scroll = { from, to, options };
    return { stop: vi.fn() };
  },
}));
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({
    count,
    estimateSize,
    paddingStart,
    getItemKey,
  }: {
    count: number;
    estimateSize: () => number;
    paddingStart: number;
    getItemKey: (index: number) => string;
  }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: getItemKey(index),
        size: estimateSize(),
        start: paddingStart + index * estimateSize(),
      })).slice(motionTest.start, motionTest.end),
    getTotalSize: () => paddingStart + count * estimateSize(),
    scrollToIndex: vi.fn(),
  }),
}));

const data: AgentMessageTraceData = {
  id: "inspector-motion",
  spans: [
    {
      id: "a",
      parentId: null,
      name: "Root A",
      kind: "agent",
      startOffsetMs: 0,
      durationMs: 1000,
      status: "success",
    },
    {
      id: "a1",
      parentId: "a",
      name: "Child one",
      kind: "tool",
      startOffsetMs: 0,
      durationMs: 100,
      status: "success",
    },
    {
      id: "a2",
      parentId: "a",
      name: "Child two",
      kind: "tool",
      startOffsetMs: 100,
      durationMs: 100,
      status: "success",
    },
    {
      id: "b",
      parentId: null,
      name: "Root B",
      kind: "agent",
      startOffsetMs: 1000,
      durationMs: 1000,
      status: "success",
    },
    {
      id: "c",
      parentId: null,
      name: "Root C",
      kind: "agent",
      startOffsetMs: 2000,
      durationMs: 1000,
      status: "success",
    },
  ],
};

beforeEach(() => {
  Object.assign(motionTest, { start: 0, end: Infinity, reduced: false, scroll: null });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (media: string) => ({
      matches: false,
      media,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }),
  });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", {
    configurable: true,
    value: () => [],
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function row(container: HTMLElement, id: string) {
  return container.querySelector<HTMLElement>(`[data-span-id="${id}"]`);
}
function y(container: HTMLElement, id: string) {
  return parseFloat(
    row(container, id)?.style.transform.match(/translateY\(([^)]+)px\)/)?.[1] ??
      "0",
  );
}

describe("inspector disclosure motion", () => {
  it("keeps the bottom scroll range until the scroll animation completes", async () => {
    const { container } = render(<AgentMessageTraceTimeline data={data} />);
    const grid = screen.getByRole("treegrid");
    const viewport = grid.parentElement!;
    Object.defineProperty(viewport, "clientHeight", {
      configurable: true,
      value: 80,
    });
    viewport.scrollTop = 160;
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse all spans: Root A" }),
    );
    expect(grid.style.height).toBe("240px");
    const scroll = motionTest.scroll!;
    expect(scroll.from).toBe(160);
    expect(scroll.to).toBe(80);
    expect(viewport.scrollTop).toBe(160);
    act(() => scroll.options.onUpdate(120));
    expect(viewport.scrollTop).toBe(120);
    expect(grid.style.height).toBe("240px");
    act(() => {
      scroll.options.onUpdate(scroll.to);
      scroll.options.onComplete();
    });
    expect(grid.style.height).toBe("160px");
    expect(viewport.scrollTop).toBeCloseTo(80, 1);
    await waitFor(() => expect(y(container, "b")).toBeCloseTo(80, 1));
  });

  it("fades removed children while surviving rows move through intermediate positions", async () => {
    const { container } = render(<AgentMessageTraceTimeline data={data} />);
    await waitFor(() => expect(y(container, "b")).toBe(160));
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse all spans: Root A" }),
    );
    expect(row(container, "a1")?.getAttribute("aria-hidden")).toBe("true");
    expect(row(container, "a1")?.hasAttribute("inert")).toBe(true);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 45));
    });
    expect(y(container, "b")).toBeGreaterThan(80);
    expect(y(container, "b")).toBeLessThan(160);
    await waitFor(() => expect(row(container, "a1")).toBeNull());
    await waitFor(() => expect(y(container, "b")).toBeCloseTo(80, 1));
    fireEvent.click(
      screen.getByRole("button", { name: "Expand all spans: Root A" }),
    );
    await waitFor(() => expect(y(container, "b")).toBeCloseTo(160, 1));
    expect(row(container, "a1")?.getAttribute("aria-hidden")).toBeNull();
  });

  it("reverses an unfinished collapse without duplicating rows or losing selection", async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <AgentMessageTraceTimeline
        data={data}
        onSelectedSpanIdChange={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("row", { name: /^Root B,/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse all spans: Root A" }),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Expand all spans: Root A" }),
    );
    await waitFor(() => expect(y(container, "b")).toBeCloseTo(160, 1));
    expect(container.querySelectorAll('[data-span-id="a1"]')).toHaveLength(1);
    expect(row(container, "b")?.getAttribute("aria-selected")).toBe("true");
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("mounts rows revealed by scrolling at full opacity without a disclosure entrance", async () => {
    motionTest.end = 2;
    const { container, rerender } = render(
      <AgentMessageTraceTimeline data={data} />,
    );
    motionTest.start = 2;
    motionTest.end = 5;
    rerender(<AgentMessageTraceTimeline data={data} />);
    expect(row(container, "b")?.style.opacity).toBe("1");
    expect(y(container, "b")).toBe(160);
    await waitFor(() => expect(row(container, "a")).toBeNull());
  });

  it("respects controlled disclosure and reduced motion", async () => {
    motionTest.reduced = true;
    const onExpand = vi.fn();
    const { container, rerender } = render(
      <AgentMessageTraceTimeline
        data={data}
        expandedSpanIds={["a"]}
        onExpandedSpanIdsChange={onExpand}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse all spans: Root A" }),
    );
    expect(onExpand).toHaveBeenCalledWith([]);
    expect(row(container, "a1")).toBeTruthy();
    rerender(<AgentMessageTraceTimeline data={data} expandedSpanIds={[]} />);
    await waitFor(() => expect(y(container, "b")).toBe(80));
    await waitFor(() => expect(row(container, "a1")).toBeNull());
  });
});
