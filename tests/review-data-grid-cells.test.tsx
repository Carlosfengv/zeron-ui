// @vitest-environment jsdom

import * as React from "react";
import type { Cell, TableMeta } from "@tanstack/react-table";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CheckboxCell, DateCell, FileCell, LongTextCell, MultiSelectCell, NumberCell, SelectCell, ShortTextCell, UrlCell } from "../packages/ui/src/components/data-grid/data-grid-cell-variants";
import type { DataGridCellProps, FileCellData } from "../packages/ui/src/system/data-grid-types";

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  }));
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

type RowData = { value: unknown };
function cell(value: unknown, rowId = "0") {
  return { getValue: () => value, column: { id: "value", columnDef: {} },
    row: { id: rowId, original: { value } },
  } as unknown as Cell<RowData, unknown>;
}
function props(value: unknown, tableMeta: TableMeta<RowData> = {}): DataGridCellProps<RowData> {
  return { cell: cell(value), tableMeta, rowIndex: 0, columnId: "value", rowHeight: "short",
    isEditing: true, isFocused: true, isSelected: false, isSearchMatch: false,
    isActiveSearchMatch: false, readOnly: false,
  };
}

const editors = [
  { name: "text", Component: ShortTextCell, initial: "original", draft: "draft", role: "textbox" },
  { name: "number", Component: NumberCell, initial: 12, draft: "34", role: "spinbutton" },
  { name: "URL", Component: UrlCell, initial: "https://example.com", draft: "https://new.example.com", role: "textbox" },
];
function edit(editor: HTMLElement, value: string) {
  editor.focus();
  if (editor instanceof HTMLInputElement) fireEvent.change(editor, { target: { value } });
  else { editor.textContent = value; fireEvent.input(editor); }
}

describe("DataGrid editor cancellation and read-only state", () => {
  it("closes the multi-select editor on Escape from its search input", async () => {
    const onDataUpdate = vi.fn();
    const onExit = vi.fn();
    function Demo() {
      const [editing, setEditing] = React.useState(true);
      const options = props(["design"], { onDataUpdate, onCellEditingStop: () => { onExit(); setEditing(false); } });
      options.cell.column.columnDef.meta = { cell: { variant: "multi-select", options: [{ value: "design", label: "Design" }] } };
      return <MultiSelectCell {...options} isEditing={editing} />;
    }
    render(<Demo />);
    const input = await screen.findByRole("combobox");
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onDataUpdate).not.toHaveBeenCalled();
  });

  it("does not remove a selected tag on an IME Backspace", async () => {
    const onDataUpdate = vi.fn();
    const options = props(["design"], { onDataUpdate });
    options.cell.column.columnDef.meta = { cell: { variant: "multi-select", options: [{ value: "design", label: "Design" }] } };
    render(<MultiSelectCell {...options} />);
    fireEvent.keyDown(await screen.findByRole("combobox"), { key: "Backspace", isComposing: true });
    expect(onDataUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog").textContent).toContain("Design");
  });

  it("toggles a focused checkbox without entering an unsupported editing state", () => {
    const onDataUpdate = vi.fn();
    const onCellEditingStart = vi.fn();
    const { container } = render(<CheckboxCell {...props(false, { onDataUpdate, onCellEditingStart })} />);
    fireEvent.click(container.querySelector('[data-slot="grid-cell-wrapper"]')!);
    expect(onDataUpdate).toHaveBeenCalledExactlyOnceWith({ rowIndex: 0, columnId: "value", value: true });
    expect(onCellEditingStart).not.toHaveBeenCalled();
  });

  it("keeps the table cell object out of DOM attributes", () => {
    const { container } = render(<ShortTextCell {...props("original")} />);
    expect(container.querySelector('[data-slot="grid-cell-wrapper"]')?.hasAttribute("cell")).toBe(false);
  });

  it.each([
    { name: "text", Component: ShortTextCell, key: "Enter", event: { isComposing: true } },
    { name: "URL", Component: UrlCell, key: "Enter", event: { keyCode: 229 } },
    { name: "long text", Component: LongTextCell, key: "Escape", event: { isComposing: true } },
  ])("leaves IME candidate confirmation/cancellation to the $name editor", async ({ Component, key, event }) => {
    const onDataUpdate = vi.fn();
    const onCellEditingStop = vi.fn();
    render(<Component {...props("original", { onDataUpdate, onCellEditingStop })} />);
    const editor = await screen.findByRole("textbox");
    fireEvent.keyDown(editor, { key, ...event });
    expect(onDataUpdate).not.toHaveBeenCalled();
    expect(onCellEditingStop).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toBe(editor);
  });

  it("keeps a select editor open through the rest of its opening gesture", async () => {
    const onDataUpdate = vi.fn();
    const onCellEditingStop = vi.fn();
    const options = props("design", { onDataUpdate, onCellEditingStop });
    options.cell.column.columnDef.meta = { cell: { variant: "select", options: [
      { value: "design", label: "Design" }, { value: "hosting", label: "Hosting" },
    ] } };
    render(<SelectCell {...options} />);
    await screen.findByRole("listbox");
    const trigger = screen.getByRole("combobox");
    fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" });
    fireEvent.mouseDown(trigger, { button: 0, detail: 2 });
    fireEvent.click(trigger, { detail: 2 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(onCellEditingStop).not.toHaveBeenCalled();
    // The portal is in the React event path, but its option remains interactive.
    const option = screen.getByRole("option", { name: "Hosting" });
    act(() => option.focus());
    fireEvent.keyDown(option, { key: "Enter" });
    fireEvent.keyUp(option, { key: "Enter" });
    expect(onDataUpdate).toHaveBeenCalledExactlyOnceWith({ rowIndex: 0, columnId: "value", value: "hosting" });
    await waitFor(() => expect(onCellEditingStop).toHaveBeenCalledTimes(1));
  });

  it("selects a local calendar date from the Dropdown panel", async () => {
    const onDataUpdate = vi.fn();
    const onCellEditingStop = vi.fn();
    render(<DateCell {...props("2026-03-12", { onDataUpdate, onCellEditingStop })} />);
    const panel = await screen.findByRole("dialog");
    const day = within(panel).getByRole("button", { name: /March 20/ });
    expect(panel.getAttribute("data-slot")).toBe("dropdown");
    fireEvent.click(day);
    expect(onDataUpdate).toHaveBeenCalledExactlyOnceWith({ rowIndex: 0, columnId: "value", value: "2026-03-20" });
    expect(onCellEditingStop).toHaveBeenCalled();
  });

  it("closes the date Dropdown on Escape without changing the date", async () => {
    const onDataUpdate = vi.fn();
    function Demo() {
      const [editing, setEditing] = React.useState(true);
      return <DateCell {...props("2026-03-12", { onDataUpdate,
        onCellEditingStop: () => setEditing(false) })} isEditing={editing} />;
    }
    const { container } = render(<Demo />);
    const display = container.querySelector('[data-slot="grid-cell-content"]')!;
    const initialDisplay = display.textContent;
    const panel = await screen.findByRole("dialog");
    const day = within(panel).getByRole("button", { name: /March 20/ });
    fireEvent.keyDown(day, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onDataUpdate).not.toHaveBeenCalled();
    expect(display.textContent).toBe(initialDisplay);
  });

  it("can shorten a URL label without changing its target or editable value", () => {
    const options = props("https://example.com/path");
    options.cell.column.columnDef.meta = { cell: { variant: "url", hideProtocol: true } };
    const { rerender } = render(<UrlCell {...options} isEditing={false} />);
    expect(screen.getByRole("link", { name: "example.com/path" }).getAttribute("href")).toBe("https://example.com/path");
    rerender(<UrlCell {...options} isEditing />);
    expect(screen.getByRole("textbox").textContent).toBe("https://example.com/path");
  });
  it("renders decorative leading content outside the editable value", () => {
    const onDataUpdate = vi.fn();
    const options = props("Figma", { onDataUpdate });
    options.cell.column.columnDef.meta = { leading: (row) => <span>{`Logo ${row.value}`}</span> };
    const { container } = render(<ShortTextCell {...options} />);
    expect(screen.getByText("Logo Figma").closest('[aria-hidden]')).toBeTruthy();
    expect(container.querySelectorAll('[contenteditable="true"]')).toHaveLength(1);
    edit(screen.getByRole("textbox"), "Updated tool");
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onDataUpdate).toHaveBeenCalledWith({ rowIndex: 0, columnId: "value", value: "Updated tool" });
  });
  it.each(editors)("cancels $name changes without a blur commit", ({ Component, initial, draft, role }) => {
    const onDataUpdate = vi.fn();
    const onCellEditingStop = vi.fn();
    render(<Component {...props(initial, { onDataUpdate, onCellEditingStop })} />);
    const editor = screen.getByRole(role);
    edit(editor, draft);
    fireEvent.keyDown(editor, { key: "Escape" });
    expect(onDataUpdate).not.toHaveBeenCalled();
    expect(onCellEditingStop).toHaveBeenCalled();
    expect(editor instanceof HTMLInputElement ? editor.value : editor.textContent).toBe(String(initial));
  });

  it.each(editors)("still saves $name changes on normal blur", ({ Component, initial, draft, role }) => {
    const onDataUpdate = vi.fn();
    render(<Component {...props(initial, { onDataUpdate })} />);
    const editor = screen.getByRole(role);
    edit(editor, draft);
    fireEvent.blur(editor);
    expect(onDataUpdate).toHaveBeenCalledWith({ rowIndex: 0, columnId: "value",
      value: typeof initial === "number" ? Number(draft) : draft,
    });
  });

  it.each(editors)("does not prefill a read-only $name cell", ({ Component, initial }) => {
    const onDataUpdate = vi.fn();
    const { container } = render(<Component {...props(initial, { onDataUpdate })} isEditing={false} readOnly />);
    const wrapper = container.querySelector('[data-slot="grid-cell-wrapper"]')!;
    fireEvent.keyDown(wrapper, { key: "x" });
    fireEvent.keyDown(wrapper, { key: "Backspace" });
    expect(wrapper.textContent).toContain(String(initial));
    expect(onDataUpdate).not.toHaveBeenCalled();
  });

  it("can edit again after cancellation", () => {
    const onDataUpdate = vi.fn();
    const { rerender } = render(<ShortTextCell {...props("original", { onDataUpdate })} />);
    edit(screen.getByRole("textbox"), "cancelled");
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    rerender(<ShortTextCell {...props("original", { onDataUpdate })} isEditing={false} />);
    rerender(<ShortTextCell {...props("original", { onDataUpdate })} />);
    edit(screen.getByRole("textbox"), "saved");
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onDataUpdate).toHaveBeenCalledExactlyOnceWith({ rowIndex: 0, columnId: "value", value: "saved" });
  });
});

describe("DataGrid local attachment URL lifetime", () => {
  it("retains active local URLs across parent synchronization, additional uploads, and virtualized unmount", async () => {
    const revoked = vi.fn();
    URL.revokeObjectURL = revoked;
    URL.createObjectURL = vi.fn().mockReturnValueOnce("blob:first").mockReturnValueOnce("blob:second");
    let currentFiles: FileCellData[] = [];
    function Demo() {
      const [files, setFiles] = React.useState<FileCellData[]>([]);
      currentFiles = files;
      return <FileCell {...props(files, {
        onDataUpdate: (update) => { if (!Array.isArray(update)) setFiles(update.value as FileCellData[]); },
      })} isEditing={false} />;
    }
    const { container, unmount } = render(<Demo />);
    const target = container.querySelector('[data-slot="grid-cell-wrapper"]')!;
    for (const name of ["first.txt", "second.txt"]) {
      await act(async () => fireEvent.drop(target, { dataTransfer: {
        files: [new File([name], name, { type: "text/plain" })], types: ["Files"],
      } }));
    }
    expect(currentFiles.map((file) => file.url)).toEqual(["blob:first", "blob:second"]);
    expect(revoked).not.toHaveBeenCalled();
    unmount();
    expect(revoked).not.toHaveBeenCalled();
  });

  it("revokes only owned URLs removed from the same record", async () => {
    const revoked = vi.fn();
    URL.revokeObjectURL = revoked;
    URL.createObjectURL = vi.fn(() => "blob:local");
    const remoteFile: FileCellData = { id: "remote", name: "remote.txt", size: 1, type: "text/plain", url: "blob:external" };
    let clear: () => void = () => {};
    function Demo() {
      const [files, setFiles] = React.useState<FileCellData[]>([remoteFile]);
      clear = () => setFiles([]);
      return <FileCell {...props(files, { onDataUpdate: (update) => {
        if (!Array.isArray(update)) setFiles(update.value as FileCellData[]);
      } })} isEditing={false} />;
    }
    const { container } = render(<Demo />);
    await act(async () => fireEvent.drop(container.querySelector('[data-slot="grid-cell-wrapper"]')!, {
      dataTransfer: { files: [new File(["x"], "local.txt")], types: ["Files"] },
    }));
    expect(revoked).not.toHaveBeenCalled();
    act(() => clear());
    expect(revoked).toHaveBeenCalledExactlyOnceWith("blob:local");
  });
  it("keeps published attachments when a virtual cell is reused for another row", async () => {
    const revoked = vi.fn();
    URL.revokeObjectURL = revoked;
    URL.createObjectURL = vi.fn(() => "blob:retained-record");
    let changeRow: () => void = () => {};
    const empty: FileCellData[] = [];
    function Demo() {
      const [files, setFiles] = React.useState<FileCellData[]>([]);
      const [rowId, setRowId] = React.useState("first");
      changeRow = () => setRowId("second");
      const displayedFiles = rowId === "first" ? files : empty;
      return <FileCell {...props(displayedFiles, { onDataUpdate: (update) => {
        if (!Array.isArray(update)) setFiles(update.value as FileCellData[]);
      } })} cell={cell(displayedFiles, rowId)} isEditing={false} />;
    }
    const { container } = render(<Demo />);
    await act(async () => fireEvent.drop(container.querySelector('[data-slot="grid-cell-wrapper"]')!, {
      dataTransfer: { files: [new File(["x"], "local.txt")], types: ["Files"] },
    }));
    act(() => changeRow());
    expect(revoked).not.toHaveBeenCalled();
  });

});
