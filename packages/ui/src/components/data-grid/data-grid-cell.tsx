"use client";

import * as React from "react";
import type { DataGridCellProps } from "#system/data-grid-types";
import {
  CheckboxCell,
  DateCell,
  FileCell,
  LongTextCell,
  MultiSelectCell,
  NumberCell,
  SelectCell,
  ShortTextCell,
  UrlCell,
} from "./data-grid-cell-variants";

export const DataGridCell = React.memo(DataGridCellImpl, (prev, next) => {
  // Fast path: check stable primitive props first
  if (prev.isFocused !== next.isFocused) return false;
  if (prev.isEditing !== next.isEditing) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isSearchMatch !== next.isSearchMatch) return false;
  if (prev.isActiveSearchMatch !== next.isActiveSearchMatch) return false;
  if (prev.readOnly !== next.readOnly) return false;
  if (prev.rowIndex !== next.rowIndex) return false;
  if (prev.columnId !== next.columnId) return false;
  if (prev.rowHeight !== next.rowHeight) return false;

  // Column definitions own editor options and decorative content. Leading
  // content can also depend on fields outside this cell's own value.
  if (prev.cell.column.columnDef !== next.cell.column.columnDef) return false;
  if (next.cell.column.columnDef.meta?.leading && prev.cell.row.original !== next.cell.row.original) return false;

  // IDs can differ from accessor keys, and accessorFn values may depend on
  // several fields. Compare TanStack's cached accessor results, not raw ID keys.
  if (!Object.is(prev.cell.getValue(), next.cell.getValue())) {
    return false;
  }

  // Check cell/row identity
  if (prev.cell.row.id !== next.cell.row.id) return false;

  return true;
}) as typeof DataGridCellImpl;

function DataGridCellImpl<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
  rowHeight,
}: DataGridCellProps<TData>) {
  const cellOpts = cell.column.columnDef.meta?.cell;
  const variant = cellOpts?.variant ?? "text";

  let Comp: React.ComponentType<DataGridCellProps<TData>>;

  switch (variant) {
    case "short-text":
      Comp = ShortTextCell;
      break;
    case "long-text":
      Comp = LongTextCell;
      break;
    case "number":
      Comp = NumberCell;
      break;
    case "url":
      Comp = UrlCell;
      break;
    case "checkbox":
      Comp = CheckboxCell;
      break;
    case "select":
      Comp = SelectCell;
      break;
    case "multi-select":
      Comp = MultiSelectCell;
      break;
    case "date":
      Comp = DateCell;
      break;
    case "file":
      Comp = FileCell;
      break;

    default:
      Comp = ShortTextCell;
      break;
  }

  return (
    <Comp
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      rowHeight={rowHeight}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
    />
  );
}
