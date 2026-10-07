"use client";

import { useCallback, useEffect, useMemo, useRef, type ComponentProps, type KeyboardEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@zeron/ui/avatar";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import { Container, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { DataGrid, useDataGrid } from "@zeron/ui/data-grid";
import { createIconSlot } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { designStackBrandIcons } from "./design-stack-brand-icons";
import { designStackCategories, designStackLabels } from "./design-stack-demo-data";
import type { DesignStackItem, DesignStackProps } from "./design-stack-types";

const Sheet = createIconSlot("file-spreadsheet");
const Undo = createIconSlot("rotate-ccw");
const Plus = createIconSlot("plus");
const Trash = createIconSlot("trash");
function Redo(props: ComponentProps<typeof Undo>) {
  return <Undo {...props} className={cn("-scale-x-100", props.className)} />;
}

function ToolAvatar({ item }: { item: DesignStackItem }) {
  const key = item.tool.trim().toLowerCase();
  const svg = Object.prototype.hasOwnProperty.call(designStackBrandIcons, key) ? designStackBrandIcons[key] : undefined;
  return <Avatar size="sm" shape="rounded">
    {item.logoSrc || !svg ? <><AvatarImage src={item.logoSrc} alt="" /><AvatarFallback>{item.tool.slice(0, 2).toUpperCase()}</AvatarFallback></> : (
      <span aria-hidden className="flex size-full items-center justify-center text-fg-default [&>svg]:size-4"
        dangerouslySetInnerHTML={{ __html: svg }} />
    )}
  </Avatar>;
}

export function DesignStack({ items, onItemsChange, title = "Design Stack", categories = designStackCategories, labels: overrides, history, height = 420, className }: DesignStackProps) {
  const labels = useMemo(() => ({ ...designStackLabels, ...overrides }), [overrides]);
  const readOnly = !onItemsChange;
  const addedId = useRef<string | null>(null);
  const interactionRef = useRef<HTMLDivElement>(null);
  const columns = useMemo<ColumnDef<DesignStackItem>[]>(() => [
    {
      id: "select", size: 48, minSize: 48, maxSize: 48, enableSorting: false, enableResizing: false, enableHiding: false,
      header: ({ table }) => <div className="flex h-full items-center justify-center"><Checkbox aria-label={labels.selectAll}
        checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? "indeterminate" : false}
        disabled={table.getRowModel().rows.length === 0} onCheckedChange={(checked) => table.toggleAllRowsSelected(!!checked)} /></div>,
      cell: ({ row }) => <div className="flex h-full items-center justify-center"><Checkbox aria-label={labels.selectRow(row.original.tool)}
        checked={row.getIsSelected()} onCheckedChange={(checked) => row.toggleSelected(!!checked)} /></div>,
    },
    { id: "tool", accessorKey: "tool", header: labels.tool, size: 240, minSize: 180,
      meta: { cell: { variant: "short-text" }, leading: (item) => <ToolAvatar item={item} /> } },
    { id: "category", accessorKey: "category", header: labels.category, size: 190, minSize: 160, meta: { cell: { variant: "select", options: categories } } },
    { id: "website", accessorKey: "website", header: labels.website, size: 190, minSize: 160, meta: { cell: { variant: "url", hideProtocol: true } } },
    { id: "renews", accessorKey: "renews", header: labels.renews, size: 170, minSize: 160, meta: { cell: { variant: "date" } } },
  ], [labels, categories]);

  const deleteRows = useCallback((rows: DesignStackItem[]) => {
    const ids = new Set(rows.map((row) => row.id));
    onItemsChange?.(items.filter((item) => !ids.has(item.id)));
  }, [items, onItemsChange]);
  const grid = useDataGrid({ data: items, columns, getRowId: (item) => item.id, interactionRef,
    onDataChange: onItemsChange, onRowsDelete: readOnly ? undefined : deleteRows,
    enableSearch: true, enablePaste: !readOnly, readOnly, rowHeight: "short", autoFocus: false });
  const selectedRows = grid.table.getSelectedRowModel().rows;
  const selectedIds = Object.keys(grid.table.getState().rowSelection);
  const focused = grid.focusedCell;
  const coordinate = focused ? `${String.fromCharCode(65 + Math.max(0, grid.table.getVisibleLeafColumns().filter((column) => column.id !== "select").findIndex((column) => column.id === focused.columnId)))}${focused.rowIndex + 1}` : labels.editHint;

  // Reconcile host replacements/undo so removed IDs cannot remain selected.
  useEffect(() => {
    const ids = new Set(items.map((item) => item.id));
    if (selectedIds.some((id) => !ids.has(id))) {
      grid.table.setRowSelection((selection) => Object.fromEntries(Object.entries(selection).filter(([id]) => ids.has(id))));
    }
  }, [items, selectedIds, grid.table]);

  useEffect(() => {
    if (!addedId.current) return;
    const index = grid.table.getRowModel().rows.findIndex((row) => row.id === addedId.current);
    if (index < 0) return;
    addedId.current = null;
    grid.tableMeta.onCellEditingStart?.(index, "tool");
  }, [items, grid.table, grid.tableMeta]);

  function addRow() {
    if (!onItemsChange) return;
    const row: DesignStackItem = { id: crypto.randomUUID(), tool: labels.newTool, category: "", website: "", renews: "" };
    addedId.current = row.id;
    onItemsChange([...items, row]);
    clearSelection();
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (!history || readOnly || grid.editingCell || target.isContentEditable || target.closest("input, textarea, select, [contenteditable=true]")) return;
    if ((event.metaKey || event.ctrlKey) && !event.altKey) {
      const undo = event.key.toLowerCase() === "z" && !event.shiftKey;
      const redo = (event.key.toLowerCase() === "z" && event.shiftKey) || event.key.toLowerCase() === "y";
      if ((undo && history.canUndo) || (redo && history.canRedo)) {
        event.preventDefault();
        event.stopPropagation();
        restore(undo ? "undo" : "redo");
      }
    }
  }
  function clearSelection() {
    grid.tableMeta.onSelectionClear?.();
  }
  function restore(direction: "undo" | "redo") {
    clearSelection();
    history?.[direction === "undo" ? "onUndo" : "onRedo"]();
  }
  function deleteSelectedRows() {
    const selectedRowIds = new Set(selectedRows.map((row) => row.id));
    const rowIndices = grid.table.getRowModel().rows.flatMap((row, index) =>
      selectedRowIds.has(row.id) ? [index] : []);
    void grid.tableMeta.onRowsDelete?.(rowIndices);
  }

  return <Container ref={interactionRef} className={cn("w-full max-w-4xl", className)} onKeyDownCapture={onKeyDown}>
    <ContainerHeader>
      <div className="flex min-w-0 items-center gap-3 py-2"><Badge color="blue" variant="strong" aria-hidden><Sheet className="size-4" /></Badge><h2 className="truncate text-body font-medium text-fg-default">{title}</h2></div>
      {history && <div className="flex items-center gap-1">
        <Button iconOnly variant="ghost" aria-label={labels.undo} disabled={readOnly || !history.canUndo} onClick={() => restore("undo")}><Undo aria-hidden /></Button>
        <Button iconOnly variant="ghost" aria-label={labels.redo} disabled={readOnly || !history.canRedo} onClick={() => restore("redo")}><Redo aria-hidden /></Button>
      </div>}
    </ContainerHeader>
    <DataGrid {...grid} height={height} stretchColumns />
    <ContainerFooter className="px-2 py-0">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {selectedRows.length > 0 ? <>
          <span className="text-body text-fg-default" aria-live="polite">{labels.selected(selectedRows.length)}</span>
          {!readOnly && <Button variant="destructive" leadingIcon={Trash} onClick={deleteSelectedRows}>{labels.delete}</Button>}
          <Button variant="ghost" onClick={clearSelection}>{labels.clear}</Button>
        </> : !readOnly && <Button variant="ghost" leadingIcon={Plus} onClick={addRow}>{labels.addRow}</Button>}
      </div>
      <span className="text-label text-fg-muted" aria-live="polite">{readOnly ? "" : coordinate}</span>
    </ContainerFooter>
  </Container>;
}
