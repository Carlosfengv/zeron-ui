// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextWindow, createContextWindowDemoData, contextWindowZhLabels } from "@zeron/blocks/context-window-01";
import { allocateContextWindowCells, getContextWindowUsage } from "../packages/blocks/src/application/context-window-01/context-window-data";

beforeEach(() => vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("ContextWindow", () => {
  it("derives summaries from the records and allocates exactly 400 cells, including zero and over-capacity snapshots", () => {
    const data = createContextWindowDemoData();
    const usage = getContextWindowUsage(data)!;
    expect(usage.used).toBe(142699);
    expect(usage.totals.docs).toBe(52200);
    expect(usage.totals.free).toBe(57301);
    expect(allocateContextWindowCells(usage.totals, data.capacity)).toHaveLength(400);
    const empty = getContextWindowUsage({ ...data, systemTokens: 0, toolTokens: 0, docs: [], memory: [], history: [] })!;
    expect(empty.used).toBe(0);
    expect(allocateContextWindowCells(empty.totals, data.capacity).every((cell) => cell === "free")).toBe(true);
    const full = getContextWindowUsage({ ...data, capacity: 100000 })!;
    expect(full.ratio).toBeGreaterThan(1);
    expect(full.totals.free).toBe(0);
    expect(full.status).toBe("danger");
    expect(allocateContextWindowCells(full.totals, 100000)).toHaveLength(400);
    expect(allocateContextWindowCells(full.totals, 100000)).not.toContain("free");
  });

  it("rejects invalid input without fabricating a zero-valued snapshot", () => {
    const data = createContextWindowDemoData();
    expect(getContextWindowUsage({ ...data, capacity: 0 })).toBeNull();
    expect(getContextWindowUsage({ ...data, systemTokens: NaN })).toBeNull();
    expect(getContextWindowUsage({ ...data, docs: [{ ...data.docs[0], tokens: -1 }] })).toBeNull();
    expect(getContextWindowUsage({ ...data, docs: [data.docs[0], data.docs[0]] })).toBeNull();
    expect(getContextWindowUsage({ ...data, systemTokens: Number.MAX_VALUE, toolTokens: Number.MAX_VALUE })).toBeNull();
    expect(getContextWindowUsage({ ...data, capacity: Number.MIN_VALUE })).toBeNull();
    const { getByRole, queryByRole } = render(<ContextWindow data={{ ...data, capacity: Infinity }} />);
    expect(getByRole("alert").textContent).toContain("invalid");
    expect(queryByRole("img", { name: "Context token allocation" })).toBeNull();
  });

  it("only estimates headroom from positive, representable tokens per turn", () => {
    const data = createContextWindowDemoData();
    for (const tokensPerTurn of [undefined, 0, -1, NaN, Infinity, Number.MIN_VALUE]) {
      expect(getContextWindowUsage({ ...data, tokensPerTurn })!.headroom).toBeNull();
    }
    expect(getContextWindowUsage({ ...data, tokensPerTurn: 1000 })!.headroom).toBe(57);
    expect(getContextWindowUsage({ ...data, capacity: 100000, tokensPerTurn: 1000 })!.headroom).toBe(0);
    const { getByRole } = render(<ContextWindow data={{ ...data, tokensPerTurn: 0 }} />);
    expect(getByRole("region").textContent).not.toContain("turns of headroom");
  });

  it("uses k/M/B token units in both languages while preserving exact accessible counts", () => {
    const data = {
      ...createContextWindowDemoData(),
      capacity: 4_000_000_000,
      systemTokens: 3200,
      toolTokens: 1_200_000,
      docs: [{ id: "large-doc", title: "Large document", tokens: 2_400_000_000 }],
      memory: [],
      history: [],
    };
    for (const locale of ["en-US", "zh-CN"]) {
      const zh = locale === "zh-CN";
      const { getByRole, unmount } = render(<ContextWindow data={data} locale={locale} labels={zh ? contextWindowZhLabels : undefined} />);
      expect(getByRole("button", { name: new RegExp(`^${zh ? "系统" : "System"}: 3,200 tokens,`) }).textContent).toContain("3.2k");
      expect(getByRole("button", { name: new RegExp(`^${zh ? "工具" : "Tools"}: 1,200,000 tokens,`) }).textContent).toContain("1.2M");
      expect(getByRole("button", { name: new RegExp(`^${zh ? "文档" : "Docs"}: 2,400,000,000 tokens,`) }).textContent).toContain("2.4B");
      expect(getByRole("region").textContent).toContain("/ 4B tokens");
      unmount();
    }
  });

  it("displays pinned records as read-only content and leaves data unchanged", () => {
    const data = createContextWindowDemoData(); data.docs = data.docs.map((item, index) => ({ ...item, pinned: index === 0 }));
    const before = JSON.stringify(data);
    const { getByRole, getByLabelText } = render(<ContextWindow data={data} />);
    expect(getByLabelText("Pinned")).toBeTruthy();
    expect(getByRole("tabpanel").querySelectorAll("button")).toHaveLength(0);
    expect(getByRole("tabpanel").textContent).toContain("ledger_v3_migration.sql");
    expect(JSON.stringify(data)).toBe(before);
  });

  it("supports local and controlled tabs and updates totals when host records change", async () => {
    const data = createContextWindowDemoData(); const change = vi.fn();
    const { getByRole, rerender, container } = render(<ContextWindow data={data} onTabChange={change} />);
    fireEvent.click(getByRole("tab", { name: "Memory" }));
    await waitFor(() => expect(getByRole("tab", { name: "Memory" }).getAttribute("aria-selected")).toBe("true"));
    expect(change).toHaveBeenLastCalledWith("memory");
    rerender(<ContextWindow data={data} tab="docs" onTabChange={change} />);
    fireEvent.click(getByRole("tab", { name: "History" }));
    expect(change).toHaveBeenLastCalledWith("history");
    expect(getByRole("tab", { name: "Docs" }).getAttribute("aria-selected")).toBe("true");
    rerender(<ContextWindow data={{ ...data, docs: [] }} tab="docs" />);
    expect(getByRole("tabpanel").textContent).toContain("No items");
    expect(container.querySelectorAll('[data-context-category="docs"]')).toHaveLength(0);
  });

  it("disables repeated compaction and compaction when all history is pinned", () => {
    const data = createContextWindowDemoData(); const compact = vi.fn();
    const { getByRole, rerender } = render(<ContextWindow data={data} onCompact={compact} />);
    fireEvent.click(getByRole("button", { name: "Compact history" })); expect(compact).toHaveBeenCalledOnce();
    rerender(<ContextWindow data={data} onCompact={compact} compacting />);
    expect((getByRole("button", { name: "Compacting history…" }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<ContextWindow data={{ ...data, history: data.history.map((item) => ({ ...item, pinned: true })) }} onCompact={compact} />);
    expect((getByRole("button", { name: "Compact history" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(getByRole("button", { name: "Compact history" })); expect(compact).toHaveBeenCalledOnce();
  });

  it("keeps absent actions hidden, unknown cache values visible and localized states usable", () => {
    const data = createContextWindowDemoData(); data.cache = { hitRate: null, saved: null, cachedTokens: null, newTokens: null };
    const { queryByRole, getByRole } = render(<ContextWindow data={data} labels={contextWindowZhLabels} locale="zh-CN" />);
    expect(queryByRole("button", { name: "压缩历史" })).toBeNull();
    expect(queryByRole("button", { name: "上下文设置" })).toBeNull();
    expect(queryByRole("meter")).toBeNull();
    expect(getByRole("region", { name: "上下文窗口" }).textContent).toContain("命中 —");
    expect(getByRole("region", { name: "上下文窗口" }).textContent).toContain("已节省");
  });

  it("shows loading and retry states without leaving stale mutation controls active", () => {
    const retry = vi.fn(); const data = createContextWindowDemoData();
    const { getByRole, queryByRole, rerender } = render(<ContextWindow data={data} loading onCompact={() => {}} />);
    expect(getByRole("status").textContent).toBe("Loading context…");
    expect((getByRole("button", { name: "Compact history" }) as HTMLButtonElement).disabled).toBe(true);
    expect(queryByRole("tab")).toBeNull();
    rerender(<ContextWindow data={data} error="Request failed" onRetry={retry} />);
    expect(getByRole("alert").textContent).toBe("Request failed");
    fireEvent.click(getByRole("button", { name: "Retry" })); expect(retry).toHaveBeenCalledOnce();
  });
});
