// @vitest-environment jsdom

import type { ColumnDef } from "@tanstack/react-table";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useDataGrid } from "../packages/ui/src/hooks/use-data-grid";

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  }));
  globalThis.ResizeObserver = class {
    observe() {} unobserve() {} disconnect() {}
  };
});
afterEach(cleanup);

type Item = { name: string };
const columns: ColumnDef<Item>[] = [{ accessorKey: "name" }];
function clipboard(initial = "pasted") {
  let text = initial;
  const api = {
    writeText: vi.fn(async (value: string) => { text = value; }),
    readText: vi.fn(async () => text),
  };
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: api });
  return api;
}
function deferred() {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((accept) => { resolve = accept; });
  return { promise, resolve };
}

describe("DataGrid duplicate source reference identity", () => {
  it.each([0, 1])("pastes into occurrence %s without changing its sibling", async (target) => {
    clipboard();
    const same = { name: "A" };
    const items = [same, same];
    const onDataChange = vi.fn();
    const { result } = renderHook(() => useDataGrid({ columns, data: items, onDataChange, enablePaste: true }));
    expect(result.current.table.getRowModel().rows.map((row) => row.id)).toEqual(["0", "1"]);
    act(() => result.current.tableMeta.onCellClick?.(target, "name"));
    await act(async () => { await result.current.tableMeta.onCellsPaste?.(); });
    expect(onDataChange).toHaveBeenCalledWith(items.map((item, index) => index === target ? { name: "pasted" } : item));
    expect(onDataChange.mock.calls[0][0][1 - target]).toBe(same);
    expect(same.name).toBe("A");
  });

  it("pastes separate clipboard rows into separate occurrences", async () => {
    clipboard("first\nsecond");
    const same = { name: "A" };
    const onDataChange = vi.fn();
    const items = [same, same];
    const { result } = renderHook(() => useDataGrid({ columns, data: items, onDataChange, enablePaste: true }));
    act(() => result.current.tableMeta.onCellClick?.(0, "name"));
    await act(async () => { await result.current.tableMeta.onCellsPaste?.(); });
    expect(onDataChange).toHaveBeenCalledWith([{ name: "first" }, { name: "second" }]);
  });

  it.each([0, 1])("cuts only occurrence %s when moving into its sibling", async (source) => {
    clipboard();
    const same = { name: "A" };
    const items = [same, same];
    const onDataChange = vi.fn();
    const { result } = renderHook(() => useDataGrid({ columns, data: items, onDataChange, enablePaste: true }));
    act(() => result.current.tableMeta.onCellClick?.(source, "name"));
    await act(async () => { await result.current.tableMeta.onCellsCut?.(); });
    act(() => result.current.tableMeta.onCellClick?.(1 - source, "name"));
    await act(async () => { await result.current.tableMeta.onCellsPaste?.(); });
    expect(onDataChange).toHaveBeenCalledWith(items.map((item, index) => index === source ? { name: "" } : item));
  });

  for (const stage of ["clipboard", "callback"] as const) {
    it.each(["unchanged", "copied-array", "view-sorted"])(`preserves duplicate occurrences with %s data during ${stage} wait`, async (change) => {
      const wait = deferred();
      const api = clipboard();
      if (stage === "clipboard") api.readText.mockImplementation(() => wait.promise);
      const same = { name: "A" };
      const other = { name: "Z" };
      const items = [same, same, other];
      const onDataChange = vi.fn();
      const { result, rerender } = renderHook(({ data }) => useDataGrid({
        columns, data, onDataChange, enablePaste: true,
        onPaste: stage === "callback" ? async () => { await wait.promise; } : undefined,
      }), { initialProps: { data: items } });
      act(() => result.current.tableMeta.onCellClick?.(0, "name"));
      let pending: Promise<void> | undefined;
      await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
      if (change === "copied-array") rerender({ data: [...items] });
      if (change === "view-sorted") await act(async () => result.current.table.setSorting([{ id: "name", desc: true }]));
      await act(async () => { wait.resolve("pasted"); await pending; });
      expect(onDataChange).toHaveBeenCalledWith([{ name: "pasted" }, same, other]);
    });

    it.each(["reordered", "deleted", "replaced"])(`cancels an ambiguous duplicate target when %s during ${stage} wait`, async (change) => {
      const wait = deferred();
      const api = clipboard();
      if (stage === "clipboard") api.readText.mockImplementation(() => wait.promise);
      const same = { name: "A" };
      const other = { name: "Z" };
      const onDataChange = vi.fn();
      const { result, rerender } = renderHook(({ data }) => useDataGrid({
        columns, data, onDataChange, enablePaste: true,
        onPaste: stage === "callback" ? async () => { await wait.promise; } : undefined,
      }), { initialProps: { data: [same, same, other] } });
      act(() => result.current.tableMeta.onCellClick?.(0, "name"));
      let pending: Promise<void> | undefined;
      await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
      rerender({ data: change === "reordered" ? [other, same, same] : change === "deleted" ? [same, other] : [{ name: "new" }, same, other] });
      await act(async () => { wait.resolve("pasted"); await pending; });
      expect(onDataChange).not.toHaveBeenCalled();
    });

    it.each(["reordered", "deleted", "replaced", "duplicated"])(`handles a unique target when %s during ${stage} wait`, async (change) => {
      const wait = deferred();
      const api = clipboard();
      if (stage === "clipboard") api.readText.mockImplementation(() => wait.promise);
      const target = { name: "A" };
      const other = { name: "Z" };
      const onDataChange = vi.fn();
      const { result, rerender } = renderHook(({ data }) => useDataGrid({
        columns, data, onDataChange, enablePaste: true,
        onPaste: stage === "callback" ? async () => { await wait.promise; } : undefined,
      }), { initialProps: { data: [target, other] } });
      act(() => result.current.tableMeta.onCellClick?.(0, "name"));
      let pending: Promise<void> | undefined;
      await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
      rerender({ data: change === "reordered" ? [other, target] : change === "deleted" ? [other] : change === "replaced" ? [{ name: "new" }, other] : [target, target, other] });
      await act(async () => { wait.resolve("pasted"); await pending; });
      if (change === "reordered") expect(onDataChange).toHaveBeenCalledWith([other, { name: "pasted" }]);
      else expect(onDataChange).not.toHaveBeenCalled();
    });
  }

  it("rebases a unique target even when unrelated rows share a reference", async () => {
    clipboard();
    const wait = deferred();
    const same = { name: "A" };
    const target = { name: "Z" };
    const onDataChange = vi.fn();
    const { result, rerender } = renderHook(({ data }) => useDataGrid({
      columns, data, onDataChange, enablePaste: true, onPaste: async () => { await wait.promise; },
    }), { initialProps: { data: [target, same, same] } });
    act(() => result.current.tableMeta.onCellClick?.(0, "name"));
    let pending: Promise<void> | undefined;
    await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
    rerender({ data: [same, target, same] });
    await act(async () => { wait.resolve("pasted"); await pending; });
    expect(onDataChange).toHaveBeenCalledWith([same, { name: "pasted" }, same]);
  });

  it("preserves a duplicate cut occurrence across view-only sorting", async () => {
    clipboard();
    const wait = deferred();
    const same = { name: "A" };
    const target = { name: "Z" };
    const items = [same, same, target];
    const onDataChange = vi.fn();
    const { result } = renderHook(() => useDataGrid({
      columns, data: items, onDataChange, enablePaste: true, onPaste: async () => { await wait.promise; },
    }));
    act(() => result.current.tableMeta.onCellClick?.(0, "name"));
    await act(async () => { await result.current.tableMeta.onCellsCut?.(); });
    act(() => result.current.tableMeta.onCellClick?.(2, "name"));
    let pending: Promise<void> | undefined;
    await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
    await act(async () => result.current.table.setSorting([{ id: "name", desc: true }]));
    await act(async () => { wait.resolve("A"); await pending; });
    expect(onDataChange).toHaveBeenCalledWith([{ name: "" }, same, { name: "A" }]);
  });

  it.each(["reordered", "deleted", "replaced"])("does not clear another duplicate cut source when %s during callback", async (change) => {
    clipboard();
    const wait = deferred();
    const same = { name: "A" };
    const target = { name: "Z" };
    const onDataChange = vi.fn();
    const { result, rerender } = renderHook(({ data }) => useDataGrid({
      columns, data, onDataChange, enablePaste: true, onPaste: async () => { await wait.promise; },
    }), { initialProps: { data: [same, same, target] } });
    act(() => result.current.tableMeta.onCellClick?.(0, "name"));
    await act(async () => { await result.current.tableMeta.onCellsCut?.(); });
    act(() => result.current.tableMeta.onCellClick?.(2, "name"));
    let pending: Promise<void> | undefined;
    await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
    rerender({ data: change === "reordered" ? [target, same, same] : change === "deleted" ? [same, target] : [{ name: "new" }, same, target] });
    await act(async () => { wait.resolve("A"); await pending; });
    expect(onDataChange).not.toHaveBeenCalled();
  });
});
