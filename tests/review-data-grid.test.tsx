// @vitest-environment jsdom

import * as React from "react";
import type { ColumnDef, OnChangeFn, RowSelectionState, SortingState, TableState } from "@tanstack/react-table";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useDataGrid } from "../packages/ui/src/hooks/use-data-grid";
import { DataGrid } from "../packages/ui/src/components/data-grid/data-grid";

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
const columns: ColumnDef<Item>[] = [{ accessorKey: "name", header: "Name" }];
const data = [{ name: "hidden A" }, { name: "hidden B" }, { name: "target" }];
function clipboard(initial = "") {
  let text = initial;
  const api = {
    writeText: vi.fn(async (value: string) => { text = value; }),
    readText: vi.fn(async () => text),
  };
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: api });
  return api;
}

describe("DataGrid source data integrity", () => {
  it.each([{ isComposing: true }, { keyCode: 229 }])("does not intercept IME keys in global/native grid handlers: %j", (composition) => {
    let grid: ReturnType<typeof useDataGrid<Item>>;
    function Demo() {
      grid = useDataGrid({ columns, data, enableSearch: true });
      return <div ref={grid.dataGridRef} data-testid="grid" tabIndex={0}><input aria-label="Editor" /></div>;
    }
    render(<Demo />);
    act(() => grid.tableMeta.onCellClick?.(0, "name"));
    fireEvent.keyDown(screen.getByTestId("grid"), { key: "a", ctrlKey: true });
    expect(grid!.tableMeta.selectionState?.selectedCells.size).toBe(3);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape", ...composition });
    expect(grid!.tableMeta.selectionState?.selectedCells.size).toBe(3);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "f", ctrlKey: true, ...composition });
    expect(grid!.tableMeta.searchOpen).toBe(false);
    fireEvent.keyDown(screen.getByTestId("grid"), { key: "Escape" });
    expect(grid!.tableMeta.selectionState?.selectedCells.size).toBe(0);
    fireEvent.keyDown(screen.getByTestId("grid"), { key: "f", ctrlKey: true });
    expect(grid!.tableMeta.searchOpen).toBe(true);
  });

  it("writes an aliased column back to its accessor key", () => {
    const onDataChange = vi.fn();
    const definitions: ColumnDef<Item>[] = [{ id: "display", accessorKey: "name" }];
    const { result } = renderHook(() => useDataGrid({ columns: definitions, data: [{ name: "Old" }], onDataChange }));
    act(() => result.current.tableMeta.onDataUpdate?.({ rowIndex: 0, columnId: "display", value: "New" }));
    expect(onDataChange).toHaveBeenCalledExactlyOnceWith([{ name: "New" }]);
  });

  it("preserves the ID-based write contract for computed accessors", () => {
    const onDataChange = vi.fn();
    const definitions: ColumnDef<Item>[] = [{ id: "display", accessorFn: (item) => item.name.toUpperCase() }];
    const { result } = renderHook(() => useDataGrid({ columns: definitions, data: [{ name: "Old" }], onDataChange }));
    act(() => result.current.tableMeta.onDataUpdate?.({ rowIndex: 0, columnId: "display", value: "New" }));
    expect(onDataChange).toHaveBeenCalledExactlyOnceWith([{ name: "Old", display: "New" }]);
  });

  it("preserves arrays and untouched entries when writing a nested accessor", () => {
    const values = [{ members: [{ name: "Old" }, { name: "Untouched" }] }];
    const definitions: ColumnDef<(typeof values)[number]>[] = [{ id: "first", accessorKey: "members.0.name" }];
    const onDataChange = vi.fn();
    const { result } = renderHook(() => useDataGrid({ columns: definitions, data: values, onDataChange }));
    act(() => result.current.tableMeta.onDataUpdate?.({ rowIndex: 0, columnId: "first", value: "New" }));
    const next = onDataChange.mock.calls[0][0] as typeof values;
    expect(next[0].members).toEqual([{ name: "New" }, { name: "Untouched" }]);
    expect(next[0].members).not.toBe(values[0].members);
    expect(next[0].members[1]).toBe(values[0].members[1]);
    expect(values[0].members[0].name).toBe("Old");
  });

  it("writes an own __proto__ field without changing the record's prototype", () => {
    type RecordData = { settings: Record<string, string> };
    const values: RecordData[] = [{ settings: JSON.parse('{"__proto__":"Old"}') }];
    const definitions: ColumnDef<RecordData>[] = [{ id: "setting", accessorKey: "settings.__proto__" }];
    const onDataChange = vi.fn();
    const { result } = renderHook(() => useDataGrid({ columns: definitions, data: values, onDataChange }));
    act(() => result.current.tableMeta.onDataUpdate?.({ rowIndex: 0, columnId: "setting", value: "New" }));
    const next = onDataChange.mock.calls[0][0] as RecordData[];
    expect(Object.hasOwn(next[0].settings, "__proto__")).toBe(true);
    expect(next[0].settings["__proto__"]).toBe("New");
    expect(Object.getPrototypeOf(next[0].settings)).toBe(Object.prototype);
    expect(values[0].settings["__proto__"]).toBe("Old");
  });

  it("immutably updates nested accessor paths without losing sibling fields", () => {
    type Person = { profile: { name: string; role: string }; other: { active: boolean } };
    const onDataChange = vi.fn();
    const values = [{ profile: { name: "Old", role: "Designer" }, other: { active: true } }];
    const definitions: ColumnDef<Person>[] = [
      { id: "display", accessorKey: "profile.name" }, { id: "role", accessorKey: "profile.role" },
    ];
    const { result } = renderHook(() => useDataGrid({ columns: definitions, data: values, onDataChange }));
    act(() => result.current.tableMeta.onDataUpdate?.([
      { rowIndex: 0, columnId: "display", value: "New" },
      { rowIndex: 0, columnId: "role", value: "Engineer" },
    ]));
    const next = onDataChange.mock.calls[0][0] as Person[];
    expect(next).toEqual([{ profile: { name: "New", role: "Engineer" }, other: { active: true } }]);
    expect(next[0].profile).not.toBe(values[0].profile);
    expect(next[0].other).toBe(values[0].other);
    expect(values[0].profile).toEqual({ name: "Old", role: "Designer" });
  });

  it("keeps checkbox cells out of editing even when activated through grid metadata", () => {
    const definitions: ColumnDef<{ checked: boolean }>[] = [{
      accessorKey: "checked", meta: { cell: { variant: "checkbox" } },
    }];
    const { result } = renderHook(() => useDataGrid({ columns: definitions, data: [{ checked: false }] }));
    act(() => result.current.tableMeta.onCellClick?.(0, "checked"));
    act(() => result.current.tableMeta.onCellEditingStart?.(0, "checked"));
    expect(result.current.editingCell).toBeNull();
    act(() => result.current.tableMeta.onCellDoubleClick?.(0, "checked"));
    expect(result.current.editingCell).toBeNull();
    expect(result.current.focusedCell).toEqual({ rowIndex: 0, columnId: "checked" });
  });

  it.each(["alias", "computed"])("refreshes a %s accessor cell when its source fields change", (kind) => {
    type Person = { first: string; last: string };
    const definitions: ColumnDef<Person>[] = [kind === "alias"
      ? { id: "display", accessorKey: "first", header: "Name" }
      : { id: "display", accessorFn: (person) => `${person.first} ${person.last}`, header: "Name" }];
    function Demo({ values }: { values: Person[] }) {
      const grid = useDataGrid({ columns: definitions, data: values });
      return <DataGrid {...grid} virtualItems={[{ index: 0, key: 0, start: 0, end: 36, size: 36, lane: 0 }]} virtualTotalSize={36} />;
    }
    const { rerender } = render(<Demo values={[{ first: "Old", last: "Name" }]} />);
    expect(screen.getByRole("textbox").textContent).toBe(kind === "alias" ? "Old" : "Old Name");
    rerender(<Demo values={[{ first: "New", last: "Name" }]} />);
    expect(screen.getByRole("textbox").textContent).toBe(kind === "alias" ? "New" : "New Name");
  });

  it.each([
    { readOnly: false, addRow: false },
    { readOnly: false, addRow: true },
    { readOnly: true, addRow: false },
    { readOnly: true, addRow: true },
  ])("reports accessible row counts including only rendered header and footer: $readOnly/$addRow", ({ readOnly, addRow }) => {
    function Demo() {
      const grid = useDataGrid({ columns, data: data.slice(0, 1), readOnly });
      return <DataGrid {...grid} onRowAdd={addRow ? async () => undefined : undefined}
        virtualItems={[{ index: 0, key: 0, start: 0, end: 36, size: 36, lane: 0 }]} virtualTotalSize={36} />;
    }
    render(<Demo />);
    const rows = screen.getAllByRole("row");
    expect(Number(screen.getByRole("grid").getAttribute("aria-rowcount"))).toBe(rows.length);
    expect(Number(rows.at(-1)?.getAttribute("aria-rowindex"))).toBe(rows.length);
  });

  it("updates cell metadata when the host replaces column definitions", () => {
    const values = [{ category: "design" }];
    function Demo({ label }: { label: string }) {
      const definitions = React.useMemo<ColumnDef<(typeof values)[number]>[]>(() => [{
        accessorKey: "category", header: "Category",
        meta: { cell: { variant: "select", options: [{ value: "design", label }] } },
      }], [label]);
      const grid = useDataGrid({ columns: definitions, data: values });
      return <DataGrid {...grid} virtualItems={[{ index: 0, key: 0, start: 0, end: 36, size: 36, lane: 0 }]} virtualTotalSize={36} />;
    }
    const { rerender } = render(<Demo label="Design" />);
    expect(screen.getByText("Design")).toBeTruthy();
    rerender(<Demo label="Creative tools" />);
    expect(screen.getByText("Creative tools")).toBeTruthy();
    expect(screen.queryByText("Design")).toBeNull();
  });

  it("updates leading content when another field changes while the cell value stays the same", () => {
    type Tool = { name: string; logo: string };
    const definitions: ColumnDef<Tool>[] = [{
      accessorKey: "name", header: "Tool",
      meta: { cell: { variant: "short-text" }, leading: (row) => <span>{row.logo}</span> },
    }];
    function Demo({ values }: { values: Tool[] }) {
      const grid = useDataGrid({ columns: definitions, data: values });
      return <DataGrid {...grid} virtualItems={[{ index: 0, key: 0, start: 0, end: 36, size: 36, lane: 0 }]} virtualTotalSize={36} />;
    }
    const { rerender } = render(<Demo values={[{ name: "Figma", logo: "Old logo" }]} />);
    expect(screen.getByText("Old logo")).toBeTruthy();
    rerender(<Demo values={[{ name: "Figma", logo: "Updated logo" }]} />);
    expect(screen.getByText("Updated logo")).toBeTruthy();
    expect(screen.queryByText("Old logo")).toBeNull();
    expect(screen.getByRole("textbox").textContent).toBe("Figma");
  });

  it("does not let delayed cell focus blur an editor started by a second click", () => {
    const callbacks: FrameRequestCallback[] = [];
    const raf = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((callback) => { callbacks.push(callback); return callbacks.length; });
    const wrapper = document.createElement("div"); wrapper.tabIndex = 0;
    const editor = document.createElement("input"); wrapper.append(editor); document.body.append(wrapper);
    try {
      const { result } = renderHook(() => useDataGrid({ columns, data }));
      result.current.tableMeta.cellMapRef?.current.set("0:name", wrapper);
      act(() => result.current.tableMeta.onCellClick?.(0, "name"));
      act(() => result.current.tableMeta.onCellEditingStart?.(0, "name"));
      editor.focus();
      act(() => { for (const callback of callbacks.splice(0)) callback(0); });
      expect(document.activeElement).toBe(editor);
      expect(result.current.editingCell).toEqual({ rowIndex: 0, columnId: "name" });
    } finally { raf.mockRestore(); wrapper.remove(); }
  });
  it.each(["column", "global"])("preserves all source rows when editing a %s-filtered row", (filter) => {
    const onDataChange = vi.fn();
    const { result } = renderHook(() => useDataGrid({
      columns, data, onDataChange,
      initialState: filter === "column"
        ? { columnFilters: [{ id: "name", value: "target" }] }
        : { globalFilter: "target" },
    }));
    expect(result.current.table.getRowModel().rows.map((row) => row.original.name)).toEqual(["target"]);
    act(() => result.current.tableMeta.onDataUpdate?.({ rowIndex: 0, columnId: "name", value: "edited" }));
    const next = onDataChange.mock.calls[0][0] as Item[];
    expect(next).toEqual([{ name: "hidden A" }, { name: "hidden B" }, { name: "edited" }]);
    expect(next[0]).toBe(data[0]);
    expect(next[1]).toBe(data[1]);
    expect(data[2].name).toBe("target");
  });

  it("maps sorted edits back to original records and keeps untouched rows", () => {
    const onDataChange = vi.fn();
    const sortedData = [{ name: "B" }, { name: "A" }];
    const { result } = renderHook(() => useDataGrid({ columns, data: sortedData, onDataChange,
      initialState: { sorting: [{ id: "name", desc: false }] },
    }));
    act(() => result.current.tableMeta.onDataUpdate?.({ rowIndex: 0, columnId: "name", value: "edited A" }));
    expect(onDataChange).toHaveBeenCalledWith([{ name: "B" }, { name: "edited A" }]);
  });

  it.each(["Delete", "Backspace"])("deletes the selected visible record after sorting with %s", async (key) => {
    const onRowsDelete = vi.fn();
    const sortedData = [{ name: "B" }, { name: "A" }];
    let grid: ReturnType<typeof useDataGrid<Item>>;
    function Demo() {
      grid = useDataGrid({ columns, data: sortedData, onRowsDelete,
        initialState: { sorting: [{ id: "name", desc: false }] },
      });
      return <div data-testid="grid" ref={grid.dataGridRef} tabIndex={0} />;
    }
    render(<Demo />);
    await act(async () => grid.table.setRowSelection({ "0": true }));
    await act(async () => fireEvent.keyDown(screen.getByTestId("grid"), { key, ctrlKey: true }));
    expect(onRowsDelete).toHaveBeenCalledWith([{ name: "B" }], [1]);
  });

  it("keeps data when cutting and pasting onto the same cell", async () => {
    const api = clipboard();
    const onDataChange = vi.fn();
    const values = [{ name: "original" }];
    const { result } = renderHook(() => useDataGrid({ columns, data: values, onDataChange, enablePaste: true }));
    act(() => result.current.tableMeta.onCellClick?.(0, "name"));
    await act(async () => { await result.current.tableMeta.onCellsCut?.(); });
    expect(api.writeText).toHaveBeenCalledWith("original");
    await act(async () => { await result.current.tableMeta.onCellsPaste?.(); });
    expect(onDataChange).toHaveBeenLastCalledWith(values);
  });

  it("moves an overlapping rectangular cut without erasing destination cells", async () => {
    clipboard();
    const onDataChange = vi.fn();
    const values = [{ a: "A", b: "B", c: "C" }];
    const gridColumns: ColumnDef<(typeof values)[number]>[] = [{ accessorKey: "a" }, { accessorKey: "b" }, { accessorKey: "c" }];
    const { result } = renderHook(() => useDataGrid({ columns: gridColumns, data: values, onDataChange, enablePaste: true }));
    act(() => {
      result.current.tableMeta.onCellClick?.(0, "a");
      result.current.tableMeta.onCellClick?.(0, "b", { shiftKey: true, preventDefault() {} } as React.MouseEvent);
    });
    await act(async () => { await result.current.tableMeta.onCellsCut?.(); });
    act(() => result.current.tableMeta.onCellClick?.(0, "b"));
    await act(async () => { await result.current.tableMeta.onCellsPaste?.(); });
    expect(onDataChange).toHaveBeenLastCalledWith([{ a: "", b: "A", c: "B" }]);
  });

  it("retains cut values whose paste destination rejects them", async () => {
    clipboard();
    const onDataChange = vi.fn();
    const values = [{ a: "valid", b: "not-a-number", c: "old", d: 4 }];
    const gridColumns: ColumnDef<(typeof values)[number]>[] = [
      { accessorKey: "a" }, { accessorKey: "b" }, { accessorKey: "c" },
      { accessorKey: "d", meta: { cell: { variant: "number" } } },
    ];
    const { result } = renderHook(() => useDataGrid({ columns: gridColumns, data: values, onDataChange, enablePaste: true }));
    act(() => {
      result.current.tableMeta.onCellClick?.(0, "a");
      result.current.tableMeta.onCellClick?.(0, "b", { shiftKey: true, preventDefault() {} } as React.MouseEvent);
    });
    await act(async () => { await result.current.tableMeta.onCellsCut?.(); });
    act(() => result.current.tableMeta.onCellClick?.(0, "c"));
    await act(async () => { await result.current.tableMeta.onCellsPaste?.(); });
    expect(onDataChange).toHaveBeenLastCalledWith([{ a: "", b: "not-a-number", c: "valid", d: 4 }]);
  });
});

describe("DataGrid visual columns", () => {
  const values = [{ a: "old-a", b: "secret", c: "old-c" }];
  const gridColumns: ColumnDef<(typeof values)[number]>[] = [{ accessorKey: "a" }, { accessorKey: "b" }, { accessorKey: "c" }];
  it.each([
    { state: { columnVisibility: { b: false } }, start: "a", expected: { a: "first", b: "secret", c: "second" } },
    { state: { columnOrder: ["c", "a", "b"] }, start: "c", expected: { a: "second", b: "secret", c: "first" } },
    { state: { columnPinning: { left: ["c"] } }, start: "c", expected: { a: "second", b: "secret", c: "first" } },
  ])("pastes using current visible leaf order: $start", async ({ state, start, expected }) => {
    clipboard("first\tsecond");
    const onDataChange = vi.fn();
    const { result } = renderHook(() => useDataGrid({ columns: gridColumns, data: values, onDataChange, enablePaste: true }));
    await act(async () => {
      if (state.columnVisibility) result.current.table.setColumnVisibility(state.columnVisibility);
      if (state.columnOrder) result.current.table.setColumnOrder(state.columnOrder);
      if (state.columnPinning) result.current.table.setColumnPinning(state.columnPinning);
    });
    act(() => result.current.tableMeta.onCellClick?.(0, start));
    await act(async () => { await result.current.tableMeta.onCellsPaste?.(); });
    expect(onDataChange).toHaveBeenLastCalledWith([expected]);
  });

  it("navigates across visible columns after hiding a middle column", async () => {
    let grid: ReturnType<typeof useDataGrid<(typeof values)[number]>>;
    function Demo() {
      grid = useDataGrid({ columns: gridColumns, data: values });
      return <div data-testid="grid" ref={grid.dataGridRef} tabIndex={0} />;
    }
    render(<Demo />);
    await act(async () => grid.table.setColumnVisibility({ b: false }));
    act(() => grid.tableMeta.onCellClick?.(0, "a"));
    await act(async () => fireEvent.keyDown(screen.getByTestId("grid"), { key: "ArrowRight" }));
    expect(grid!.tableMeta.focusedCell).toEqual({ rowIndex: 0, columnId: "c" });
  });

  it("copies range selections in visible order without hidden columns", async () => {
    const api = clipboard();
    const { result } = renderHook(() => useDataGrid({ columns: gridColumns, data: values,
      initialState: { columnVisibility: { b: false }, columnOrder: ["c", "b", "a"] },
    }));
    act(() => {
      result.current.tableMeta.onCellClick?.(0, "a");
      result.current.tableMeta.onCellClick?.(0, "c", { shiftKey: true, preventDefault() {} } as React.MouseEvent);
    });
    await act(async () => { await result.current.tableMeta.onCellsCopy?.(); });
    expect(api.writeText).toHaveBeenCalledWith("old-c\told-a");
  });
});

describe("DataGrid controlled table state", () => {
  const values = [{ name: "B" }, { name: "A" }];
  it("honors external state, forwards requests, and accepts later parent updates", async () => {
    const onRowSelectionChange = vi.fn();
    const onSortingChange = vi.fn();
    const onColumnFiltersChange = vi.fn();
    const initial: Partial<TableState> = {
      sorting: [{ id: "name", desc: false }], rowSelection: { "1": true },
      columnFilters: [{ id: "name", value: "A" }],
    };
    const { result, rerender } = renderHook(({ state }) => useDataGrid({
      columns, data: values, state, onRowSelectionChange, onSortingChange, onColumnFiltersChange,
    }), { initialProps: { state: initial } });
    expect(result.current.table.getState().sorting).toEqual(initial.sorting);
    expect(result.current.table.getState().rowSelection).toEqual(initial.rowSelection);
    expect(result.current.table.getRowModel().rows.map((row) => row.original.name)).toEqual(["A"]);
    await act(async () => {
      result.current.table.setRowSelection((old) => ({ ...old, "0": true }));
      result.current.table.setSorting([{ id: "name", desc: true }]);
      result.current.table.setColumnFilters([]);
    });
    expect(onRowSelectionChange).toHaveBeenCalledWith({ "0": true, "1": true });
    expect(onSortingChange).toHaveBeenCalledWith([{ id: "name", desc: true }]);
    expect(onColumnFiltersChange).toHaveBeenCalledWith([]);
    expect(result.current.table.getState().rowSelection).toEqual({ "1": true });
    expect(result.current.table.getState().sorting).toEqual(initial.sorting);
    expect(result.current.table.getState().columnFilters).toEqual(initial.columnFilters);
    rerender({ state: { rowSelection: { "0": true }, sorting: [{ id: "name", desc: true }], columnFilters: [] } });
    expect(result.current.table.getState().rowSelection).toEqual({ "0": true });
    expect(result.current.table.getRowModel().rows.map((row) => row.original.name)).toEqual(["B", "A"]);
    expect(result.current.tableMeta.selectionState?.selectedCells.has("0:name")).toBe(true);
  });

  it("keeps uncontrolled state and notifies selection clears", async () => {
    const onRowSelectionChange = vi.fn<OnChangeFn<RowSelectionState>>();
    const onSortingChange = vi.fn<OnChangeFn<SortingState>>();
    const { result } = renderHook(() => useDataGrid({ columns, data: values, onRowSelectionChange, onSortingChange }));
    await act(async () => {
      result.current.table.setRowSelection({ "0": true });
      result.current.table.setSorting([{ id: "name", desc: false }]);
    });
    expect(result.current.table.getState().rowSelection).toEqual({ "0": true });
    expect(result.current.table.getState().sorting).toEqual([{ id: "name", desc: false }]);
    await act(async () => { result.current.tableMeta.onSelectionClear?.(); });
    expect(onRowSelectionChange).toHaveBeenLastCalledWith({});
    expect(result.current.table.getState().rowSelection).toEqual({});
  });
});


function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => { resolve = accept; });
  return { promise, resolve };
}

describe("DataGrid asynchronous paste identity", () => {
  it.each(["clipboard", "callback"])("targets original records after sorting during %s wait", async (stage) => {
    const wait = deferred<string>();
    const api = clipboard("pasted");
    if (stage === "clipboard") api.readText.mockImplementation(() => wait.promise);
    const onDataChange = vi.fn();
    const values = [{ name: "A" }, { name: "B" }];
    const { result } = renderHook(() => useDataGrid({
      columns, data: values, onDataChange, enablePaste: true,
      onPaste: stage === "callback" ? async () => { await wait.promise; } : undefined,
    }));
    act(() => result.current.tableMeta.onCellClick?.(0, "name"));
    let pending: Promise<void> | undefined;
    await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
    await act(async () => result.current.table.setSorting([{ id: "name", desc: true }]));
    await act(async () => { wait.resolve("pasted"); await pending; });
    expect(onDataChange).toHaveBeenLastCalledWith([{ name: "pasted" }, { name: "B" }]);
  });

  it("rebases cut sources as well as destinations after a delayed callback", async () => {
    clipboard();
    const wait = deferred<void>();
    const onDataChange = vi.fn();
    const values = [{ name: "A" }, { name: "B" }, { name: "C" }];
    const { result } = renderHook(() => useDataGrid({ columns, data: values, onDataChange,
      enablePaste: true, onPaste: () => wait.promise,
    }));
    act(() => result.current.tableMeta.onCellClick?.(0, "name"));
    await act(async () => { await result.current.tableMeta.onCellsCut?.(); });
    act(() => result.current.tableMeta.onCellClick?.(1, "name"));
    let pending: Promise<void> | undefined;
    await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
    await act(async () => result.current.table.setSorting([{ id: "name", desc: true }]));
    await act(async () => { wait.resolve(); await pending; });
    expect(onDataChange).toHaveBeenLastCalledWith([{ name: "" }, { name: "A" }, { name: "C" }]);
  });

  it.each(["removed", "unmounted", "readonly"])("cancels pending paste when %s", async (reason) => {
    clipboard("pasted");
    const wait = deferred<void>();
    const onDataChange = vi.fn();
    const values = [{ name: "A" }, { name: "B" }];
    const { result, rerender, unmount } = renderHook(({ items, readOnly }) => useDataGrid({
      columns, data: items, readOnly, onDataChange, enablePaste: true, onPaste: () => wait.promise,
    }), { initialProps: { items: values, readOnly: false } });
    act(() => result.current.tableMeta.onCellClick?.(0, "name"));
    let pending: Promise<void> | undefined;
    await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
    if (reason === "removed") rerender({ items: [values[1]], readOnly: false });
    if (reason === "readonly") rerender({ items: values, readOnly: true });
    if (reason === "unmounted") unmount();
    await act(async () => { wait.resolve(); await pending; });
    expect(onDataChange).not.toHaveBeenCalled();
  });

  it("ignores an older paste when a newer paste completes first", async () => {
    const api = clipboard("old");
    const wait = deferred<void>();
    const onPaste = vi.fn().mockImplementationOnce(() => wait.promise).mockResolvedValue(undefined);
    const onDataChange = vi.fn();
    const values = [{ name: "A" }];
    const { result } = renderHook(() => useDataGrid({ columns, data: values, onDataChange, onPaste, enablePaste: true }));
    act(() => result.current.tableMeta.onCellClick?.(0, "name"));
    let pending: Promise<void> | undefined;
    await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
    api.readText.mockResolvedValue("new");
    await act(async () => { await result.current.tableMeta.onCellsPaste?.(); });
    await act(async () => { wait.resolve(); await pending; });
    expect(onDataChange).toHaveBeenCalledTimes(1);
    expect(onDataChange).toHaveBeenCalledWith([{ name: "new" }]);
  });
});


it("rebases a pending paste by getRowId across immutable source reordering", async () => {
  clipboard("pasted");
  const wait = deferred<void>();
  const onDataChange = vi.fn();
  const { result, rerender } = renderHook(({ items }) => useDataGrid({
    columns: [{ accessorKey: "name" }], data: items, getRowId: (row) => row.id,
    onDataChange, enablePaste: true, onPaste: () => wait.promise,
  }), { initialProps: { items: [{ id: "a", name: "A" }, { id: "b", name: "B" }] } });
  act(() => result.current.tableMeta.onCellClick?.(0, "name"));
  let pending: Promise<void> | undefined;
  await act(async () => { pending = Promise.resolve(result.current.tableMeta.onCellsPaste?.()); });
  rerender({ items: [{ id: "b", name: "B updated" }, { id: "a", name: "A updated" }] });
  await act(async () => { wait.resolve(); await pending; });
  expect(onDataChange).toHaveBeenCalledWith([{ id: "b", name: "B updated" }, { id: "a", name: "pasted" }]);
});
