// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentRun, type AgentRunNode } from "@zeron/blocks/agent-run-01";
import { AgentRunDemo } from "@docs/components/blocks/AgentRunDemo";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("../packages/blocks/src/application/agent-run-01/agent-run.module.css", () => ({ default: {} }));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", (media: string) => ({ matches: true, media, addEventListener() {}, removeEventListener() {} }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AgentRun", () => {
  it("keeps the open node details current and dismisses them when that node disappears", () => {
    const child: AgentRunNode = { id: "child", name: "Researcher", status: "idle", summary: "Waiting" };
    const lead: AgentRunNode = { id: "lead", name: "Lead", status: "working", summary: "Planning", children: [child] };
    const run = { id: "test-run", title: "Run", root: lead };
    const { rerender } = render(<AgentRun run={run} />);

    fireEvent.click(screen.getByRole("button", { name: "Researcher Idle" }));
    expect(within(screen.getByRole("dialog")).getByText("Waiting")).toBeTruthy();

    rerender(<AgentRun run={{ ...run, root: { ...lead, children: [
      { ...child, status: "working", summary: "Reading the report", usage: { tokens: 2000, limit: 4000 } },
    ] } }} />);
    expect(within(screen.getByRole("dialog")).getByText("Reading the report")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2000");
    expect(screen.getByRole("status").textContent).toContain("2 working");

    rerender(<AgentRun run={{ ...run, root: { ...lead, children: [] } }} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<AgentRun run={run} />);
    expect(screen.getByRole("button", { name: "Researcher Idle" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("renders a static cover and starts a fresh interactive run on replay", () => {
    vi.useFakeTimers();
    const cover = render(<AgentRunDemo catalog />);
    expect(screen.queryByRole("button", { name: /switch run/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Replay run" })).toBeNull();
    const coverStatus = screen.getByRole("status").textContent;
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole("status").textContent).toBe(coverStatus);
    cover.unmount();

    render(<AgentRunDemo />);
    const replay = screen.getByRole("button", { name: "Replay run" });
    const openLead = () => fireEvent.click(screen.getByRole("button", { name: "Lead Working" }));
    act(() => vi.advanceTimersByTime(1350));
    fireEvent.click(replay);
    openLead();
    act(() => vi.advanceTimersByTime(1350));
    expect(within(screen.getByRole("dialog")).getByText("Planning the fix")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1350));
    expect(within(screen.getByRole("dialog")).getByText("Delegating")).toBeTruthy();

    fireEvent.click(replay);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Replay run" })).toBe(replay);
    openLead();
    expect(within(screen.getByRole("dialog")).getByText("Planning the fix")).toBeTruthy();
  });
});
