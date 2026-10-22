// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextWindowCompact, createContextWindowCompactDemoData, contextWindowCompactZhLabels } from "@zeron/blocks/context-window-02";
import { allocateContextWindowCells, getContextWindowUsage } from "../packages/blocks/src/application/context-window-01/context-window-data";

afterEach(cleanup);

describe("ContextWindowCompact", () => {
  it("embeds content in a host surface without nested Container surfaces", () => {
    const onCompact = vi.fn();
    const { container, getByRole, rerender } = render(<ContextWindowCompact embedded data={createContextWindowCompactDemoData()} onCompact={onCompact} />);
    expect(container.querySelector('[data-slot="container"]')).toBeNull();
    expect(container.querySelector('[data-slot="container-body"]')).toBeNull();
    expect(container.querySelector('[data-slot="container-footer"]')).toBeNull();
    expect(getByRole("region", { name: "Context window" }).textContent).toContain("175.6k");
    fireEvent.click(getByRole("button", { name: "Files" }));
    expect(getByRole("list", { name: "Files" }).textContent).toContain("AGENTS.md");
    fireEvent.click(getByRole("button", { name: "Compact" }));
    expect(onCompact).toHaveBeenCalledOnce();
    rerender(<ContextWindowCompact data={createContextWindowCompactDemoData()} />);
    expect(container.querySelector('[data-slot="container"]')).toBeTruthy();
  });

  it("uses the shared snapshot and allocation for exact, empty and over-capacity totals", () => {
    const data = createContextWindowCompactDemoData();
    const usage = getContextWindowUsage(data)!;
    expect(usage.used).toBe(175600);
    expect(usage.totals.free).toBe(24400);
    const { getByRole, container, rerender } = render(<ContextWindowCompact data={data} />);
    expect(getByRole("img").getAttribute("aria-label")).toBe("175,600 of 200,000 tokens used (88%)");
    expect(container.querySelectorAll("[data-context-category]")).toHaveLength(240);
    const cells = allocateContextWindowCells(usage.totals, data.capacity, 240, ["system", "tools", "docs", "history", "memory", "free"]);
    expect(cells.indexOf("docs")).toBeLessThan(cells.indexOf("history"));
    expect(cells.filter((category) => category === "free")).toHaveLength(29);
    rerender(<ContextWindowCompact data={{ ...data, capacity: 100000 }} />);
    expect(getByRole("img").getAttribute("aria-label")).toContain("176%");
    expect(container.querySelectorAll('[data-context-category="free"]')).toHaveLength(0);
    expect(getByRole("region").textContent).toContain("0 left");
    rerender(<ContextWindowCompact data={{ ...data, systemTokens: 0, toolTokens: 0, docs: [], memory: [], history: [] }} />);
    expect(container.querySelectorAll('[data-context-category="free"]')).toHaveLength(240);
  });

  it("expands read-only files, keeps exact accessible counts and reflects host updates", () => {
    const data = createContextWindowCompactDemoData();
    const { getByRole, rerender } = render(<ContextWindowCompact data={data} />);
    const files = getByRole("button", { name: "Files" });
    expect(files.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(files);
    expect(files.getAttribute("aria-expanded")).toBe("true");
    const list = getByRole("list", { name: "Files" });
    expect(list.textContent).toContain("AGENTS.md");
    expect(list.textContent).toContain("6,200 tokens");
    expect(list.querySelector("button")).toBeNull();
    expect(document.getElementById(files.getAttribute("aria-controls")!)?.contains(list)).toBe(true);
    rerender(<ContextWindowCompact data={{ ...data, docs: [] }} />);
    expect(getByRole("region").textContent).toContain("No files in context.");
    expect(getByRole("img").getAttribute("aria-label")).toContain("129,500");
  });

  it("delegates actions without mutating data and prevents compaction races", () => {
    const data = createContextWindowCompactDemoData();
    const before = JSON.stringify(data);
    const compact = vi.fn();
    const { getByRole, queryByRole, rerender } = render(<ContextWindowCompact data={data} onCompact={compact} />);
    fireEvent.click(getByRole("button", { name: "Compact" }));
    expect(compact).toHaveBeenCalledOnce();
    expect(queryByRole("button", { name: "New chat" })).toBeNull();
    expect(JSON.stringify(data)).toBe(before);
    rerender(<ContextWindowCompact data={data} onCompact={compact} compacting />);
    expect((getByRole("button", { name: "Compacting…" }) as HTMLButtonElement).disabled).toBe(true);
    for (const history of [[], data.history.map((item) => ({ ...item, pinned: true })), [{ id: "empty", title: "Empty", tokens: 0 }]]) {
      rerender(<ContextWindowCompact data={{ ...data, history }} onCompact={compact} />);
      expect((getByRole("button", { name: "Compact" }) as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it("omits absent host actions and supports localized quantities", () => {
    const data = createContextWindowCompactDemoData();
    const { getByRole, queryByRole } = render(<ContextWindowCompact data={data} locale="zh-CN" labels={contextWindowCompactZhLabels} />);
    expect(getByRole("region", { name: "上下文窗口" }).textContent).toContain("175.6k");
    expect(getByRole("region").textContent).toContain("剩余 24.4k");
    expect(queryByRole("button", { name: "压缩" })).toBeNull();
    expect(queryByRole("button", { name: "新建对话" })).toBeNull();
  });

  it("hides stale usage and actions during loading, invalid data and recoverable errors", () => {
    const data = createContextWindowCompactDemoData(); const retry = vi.fn();
    const { getByRole, queryByRole, rerender } = render(<ContextWindowCompact data={data} loading onCompact={() => {}} />);
    expect(getByRole("status").textContent).toBe("Loading context…");
    expect(queryByRole("img")).toBeNull();
    expect(queryByRole("button")).toBeNull();
    rerender(<ContextWindowCompact data={data} error="Request failed" onRetry={retry} />);
    expect(getByRole("alert").textContent).toContain("Request failed");
    fireEvent.click(getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
    rerender(<ContextWindowCompact data={{ ...data, docs: [data.docs[0], data.docs[0]] }} />);
    expect(getByRole("alert").textContent).toContain("invalid");
    expect(queryByRole("img")).toBeNull();
  });

  it("only announces success for a ready snapshot with no pending operation", () => {
    const data = createContextWindowCompactDemoData();
    const notice = "Conversation compacted; pinned content preserved.";
    const { getByRole, queryByText, rerender } = render(<ContextWindowCompact data={data} notice={notice} />);
    expect(getByRole("status").textContent).toBe(notice);
    for (const state of [{ loading: true }, { error: "Request failed" }, { compacting: true }, { data: { ...data, capacity: 0 } }]) {
      rerender(<ContextWindowCompact data={data} notice={notice} {...state} />);
      expect(queryByText(notice)).toBeNull();
    }
    rerender(<ContextWindowCompact data={data} notice={notice} />);
    expect(getByRole("status").textContent).toBe(notice);
  });

  it.each(["invalid_locale", ""])("keeps the context usable when locale %j is malformed", (locale) => {
    const { getByRole } = render(<ContextWindowCompact data={createContextWindowCompactDemoData()} locale={locale} />);
    expect(getByRole("img").getAttribute("aria-label")).toBe("175,600 of 200,000 tokens used (88%)");
    expect(getByRole("button", { name: "Files" })).toBeTruthy();
  });

  it("keeps expanded file contents reachable by keyboard", () => {
    const data = createContextWindowCompactDemoData();
    const { getByRole } = render(<ContextWindowCompact data={{ ...data, docs: Array.from({ length: 100 }, (_, index) => ({ id: `file-${index}`, title: `File ${index}`, tokens: 400 })) }} />);
    fireEvent.click(getByRole("button", { name: "Files" }));
    const files = getByRole("list", { name: "Files" });
    files.focus();
    expect(document.activeElement).toBe(files);
    expect(files.textContent).toContain("File 99");
    expect(files.querySelector("button")).toBeNull();
  });

  it("pairs Claude model names with the existing logo and honors a host override", () => {
    const data = createContextWindowCompactDemoData();
    const { container, rerender, getByTestId } = render(<ContextWindowCompact data={data} />);
    expect(container.querySelector('[data-slot="badge-icon"] svg')).toBeTruthy();
    rerender(<ContextWindowCompact data={data} modelIcon={<span data-testid="custom-logo">M</span>} />);
    expect(getByTestId("custom-logo")).toBeTruthy();
    expect(container.querySelector('[data-slot="badge-icon"] svg')).toBeNull();
    rerender(<ContextWindowCompact data={{ ...data, session: { model: "Custom model", turn: 0, name: "Session" } }} />);
    expect(container.querySelector('[data-slot="badge-icon"]')).toBeNull();
  });
});
