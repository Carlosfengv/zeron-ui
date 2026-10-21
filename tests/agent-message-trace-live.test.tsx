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
import { AgentMessageTrace } from "@zeron/blocks/agent-message-trace-01";
import { agentMessageTraceLiveDemoData } from "../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-live-demo-data";
import type { AgentMessageTraceData } from "../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-types";

type ScrollAnimation = {
  from: number;
  to: number;
  options: { onUpdate: (value: number) => void; onComplete: () => void };
};
const motionTest = vi.hoisted(() => ({ start: 0, end: Infinity, scroll: null as ScrollAnimation | null }));

vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  // Control imperative scroll updates; component and timeline motion stay real.
  animate: (from: number, to: number, options: ScrollAnimation["options"]) => {
    motionTest.scroll = { from, to, options };
    return { stop: vi.fn() };
  },
}));

// Keep real motion drivers while controlling the virtualized viewport in jsdom.
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({
    count,
    estimateSize,
    getItemKey,
  }: {
    count: number;
    estimateSize: () => number;
    getItemKey: (index: number) => string;
  }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        key: getItemKey(index),
        index,
        start: 40 + index * estimateSize(),
      })).slice(motionTest.start, motionTest.end),
    getTotalSize: () => 40 + count * estimateSize(),
    scrollToIndex: vi.fn(),
  }),
}));

beforeEach(() => {
  Object.assign(motionTest, { start: 0, end: Infinity, scroll: null });
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

describe("live trace workspace", () => {
  it("keeps disclosure key presses from opening row details", () => {
    const onSelect = vi.fn();
    render(<AgentMessageTrace variant="live" data={agentMessageTraceLiveDemoData} onSpanSelect={onSelect} />);
    const button = screen.getByRole("button", { name: "Collapse Researcher" });
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyDown(button, { key: " " });
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("returns focus to the selected row after closing its details", async () => {
    render(<AgentMessageTrace variant="live" data={agentMessageTraceLiveDemoData} />);
    const row = screen.getByRole("row", { name: "Run checkout tests, 8.4s, Failed" });
    row.focus();
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.click(await screen.findByRole("button", { name: "Close span details" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(row));
    expect(row.tabIndex).toBe(0);
  });

  it("makes fading rows inert immediately after a branch is collapsed", async () => {
    const { container } = render(<AgentMessageTrace variant="live" data={agentMessageTraceLiveDemoData} />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse Researcher" }));
    const fadingRow = container.querySelector('[data-span-id="linear-search"]');
    expect(fadingRow?.hasAttribute("inert")).toBe(true);
    expect(fadingRow?.getAttribute("aria-hidden")).toBe("true");
    await waitFor(() => expect(container.querySelector('[data-span-id="linear-search"]')).toBeNull());
  });

  it("mounts rows reached by scrolling at full opacity with their virtual row index", () => {
    motionTest.end = 2;
    const { container, rerender } = render(<AgentMessageTrace variant="live" data={agentMessageTraceLiveDemoData} />);
    motionTest.start = 2;
    motionTest.end = 5;
    rerender(<AgentMessageTrace variant="live" data={agentMessageTraceLiveDemoData} />);
    const row = container.querySelector('[data-span-id="researcher"]');
    expect(row?.parentElement?.style.opacity).toBe("1");
    expect(row?.getAttribute("aria-rowindex")).toBe("4");
    expect(row?.getAttribute("tabindex")).toBe("0");
  });

  it("keeps the collapsed scroll range until the scroll animation completes", () => {
    render(<AgentMessageTrace variant="live" data={agentMessageTraceLiveDemoData} />);
    const grid = screen.getByRole("treegrid");
    const viewport = grid.parentElement!;
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 80 });
    const before = Number.parseFloat(grid.style.height);
    viewport.scrollTop = before - 80;
    fireEvent.click(screen.getByRole("button", { name: "Collapse Researcher" }));
    expect(Number.parseFloat(grid.style.height)).toBe(before);
    const scroll = motionTest.scroll!;
    expect(scroll.from).toBe(before - 80);
    expect(scroll.to).toBe(before - 280);
    expect(viewport.scrollTop).toBe(scroll.from);
    act(() => scroll.options.onUpdate((scroll.from + scroll.to) / 2));
    expect(viewport.scrollTop).toBe(before - 180);
    expect(Number.parseFloat(grid.style.height)).toBe(before);
    act(() => {
      scroll.options.onUpdate(scroll.to);
      scroll.options.onComplete();
    });
    expect(Number.parseFloat(grid.style.height)).toBe(before - 200);
    expect(viewport.scrollTop).toBeCloseTo(before - 280, 1);
  });

  it("derives trace status from the same deduplicated tree as its rows", () => {
    const root = agentMessageTraceLiveDemoData.spans[0];
    render(<AgentMessageTrace variant="live" data={{ id: "duplicates", spans: [root, { ...root, status: "running", durationMs: undefined }] }} />);
    expect(screen.getByRole("status").textContent).toBe("Done");
  });

  it("marks a failed orphan promoted to a root as a failed trace", () => {
    const orphan = { ...agentMessageTraceLiveDemoData.spans[0], parentId: "missing", status: "error" as const };
    render(<AgentMessageTrace variant="live" data={{ id: "orphan", spans: [orphan] }} />);
    expect(screen.getByRole("status").textContent).toBe("Failed");
  });

  it("respects the section label and translated disclosure labels", () => {
    render(<AgentMessageTrace variant="live" data={agentMessageTraceLiveDemoData} aria-label="执行记录" labels={{ collapseAll: "收起", expandAll: "展开" }} />);
    expect(screen.getByRole("region", { name: "执行记录" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "收起 Researcher" })).toBeTruthy();
  });

  it("interpolates streamed time between snapshots before settling on the new scale", async () => {
    const data: AgentMessageTraceData = {
      id: "motion",
      spans: [
        {
          id: "root",
          parentId: null,
          name: "Root",
          kind: "agent",
          status: "running",
          startOffsetMs: 0,
        },
        {
          id: "call",
          parentId: "root",
          name: "Call",
          kind: "tool",
          status: "running",
          startOffsetMs: 2500,
        },
      ],
    };
    const { container, rerender } = render(
      <AgentMessageTrace variant="live" data={data} nowOffsetMs={10_000} />,
    );
    const position = () =>
      Number(
        container
          .querySelector('[data-span-id="call"] [data-live-bar]')
          ?.getAttribute("x"),
      );
    await waitFor(() => expect(position()).toBeGreaterThan(50));
    const initial = position();
    rerender(
      <AgentMessageTrace variant="live" data={data} nowOffsetMs={20_000} />,
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(position()).toBeLessThan(initial);
    expect(position()).toBeGreaterThan(initial / 2 + 1);
    await waitFor(() => expect(position()).toBeCloseTo(initial / 2, 1));
    // Paused backward seeks must update both the clock and its scale atomically.
    rerender(
      <AgentMessageTrace variant="live" data={data} nowOffsetMs={5000} />,
    );
    await waitFor(() => expect(position()).toBeCloseTo(initial * 2, 1));
    const rootWidth = () =>
      parseFloat(
        container
          .querySelector('[data-span-id="root"] [data-live-bar]')
          ?.getAttribute("width") ?? "0",
      );
    // With proportional headroom, a running root always fills the same fraction.
    await waitFor(() =>
      expect(rootWidth()).toBeCloseTo((620 * 2) / 3.05 / 1.35, 1),
    );
    const tickX = () =>
      parseFloat(
        screen
          .getByText("2s", { exact: true })
          .style.transform.match(/translateX\(([^)]+)px\)/)?.[1] ?? "0",
      );
    await waitFor(() =>
      expect(tickX()).toBeCloseTo(((2000 / 6750) * 620 * 2) / 3.05, 1),
    );
  });

  it("opens error details, closes without selecting a fallback, and collapses a branch", async () => {
    render(
      <AgentMessageTrace data={agentMessageTraceLiveDemoData} variant="live" />,
    );
    fireEvent.click(
      screen.getByRole("row", { name: "Run checkout tests, 8.4s, Failed" }),
    );
    expect(
      await screen.findByText(
        "2 of 14 checkout tests fail – coupon codes aren't applied to seat prices",
      ),
    ).toBeTruthy();
    expect(screen.getByText("pnpm test checkout")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close span details" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse Researcher" }),
    );
    expect(screen.queryByRole("row", { name: /web_search/ })).toBeNull();
    expect(screen.getByText("+5")).toBeTruthy();
  });

  it("honors controlled disclosure and selection until the host commits them", () => {
    const onExpand = vi.fn();
    const onSelect = vi.fn();
    const { rerender } = render(
      <AgentMessageTrace
        variant="live"
        data={agentMessageTraceLiveDemoData}
        expandedSpanIds={["orchestrator"]}
        onExpandedSpanIdsChange={onExpand}
        selectedSpanId={null}
        onSelectedSpanIdChange={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Expand Researcher" }));
    expect(onExpand).toHaveBeenCalledWith(["orchestrator", "researcher"]);
    expect(screen.queryByRole("row", { name: /web_search/ })).toBeNull();
    fireEvent.click(screen.getByRole("row", { name: /Plan the launch/ }));
    expect(onSelect).toHaveBeenCalledWith("plan");
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <AgentMessageTrace
        variant="live"
        data={agentMessageTraceLiveDemoData}
        expandedSpanIds={["orchestrator", "researcher"]}
        selectedSpanId={null}
      />,
    );
    expect(screen.getAllByRole("row", { name: /web_search/ })).toHaveLength(2);
  });

  it("preserves an intentional collapse while new branches stream in", async () => {
    const initial: AgentMessageTraceData = {
      id: "stream",
      spans: agentMessageTraceLiveDemoData.spans.filter((span) =>
        ["orchestrator", "plan"].includes(span.id),
      ),
    };
    const { rerender } = render(
      <AgentMessageTrace variant="live" data={initial} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse Orchestrator" }),
    );
    rerender(
      <AgentMessageTrace
        variant="live"
        data={{ ...agentMessageTraceLiveDemoData, id: "stream" }}
      />,
    );
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));
    fireEvent.click(
      screen.getByRole("button", { name: "Expand Orchestrator" }),
    );
    expect(screen.getAllByRole("row", { name: /web_search/ })).toHaveLength(2);
    fireEvent.keyDown(screen.getByRole("row", { name: /Orchestrator/ }), {
      key: "ArrowRight",
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(document.activeElement?.getAttribute("data-span-id")).toBe("plan");
  });

  it("renders loading, errors and filtered empty states without completed status", () => {
    const { rerender } = render(
      <AgentMessageTrace
        variant="live"
        data={{ id: "empty", spans: [] }}
        state="loading"
      />,
    );
    expect(screen.getByRole("status", { name: "Loading trace" })).toBeTruthy();
    expect(screen.queryByText("Done")).toBeNull();
    rerender(
      <AgentMessageTrace
        variant="live"
        data={{ id: "empty", spans: [] }}
        state="error"
        errorMessage="Trace unavailable"
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe("Trace unavailable");
    rerender(
      <AgentMessageTrace
        variant="live"
        data={agentMessageTraceLiveDemoData}
        visibleKinds={[]}
      />,
    );
    expect(screen.getByText("No spans match the selected types.")).toBeTruthy();
  });
});
