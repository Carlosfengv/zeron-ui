/* biome-ignore-all lint/a11y/useSemanticElements: The resize handle is a focusable ARIA separator, not a document hr. */

"use client";

import type {
  ColumnSort,
  Header,
  SortDirection,
  SortingState,
  Table,
} from "@tanstack/react-table";
import * as React from "react";
import { getColumnVariant } from "#system/data-grid";
import { cn } from "#system/utils";
import { createIconSlot } from "#system/icon-context";
import {
  DropdownContent,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "../dropdown";
import { MenuItem } from "../menu-item";
import { Tooltip, TooltipContent, TooltipTrigger } from "./data-grid-tooltip";

const ChevronDownIcon = createIconSlot("chevron-down");
const ChevronUpIcon = createIconSlot("chevron-up");
const EyeOffIcon = createIconSlot("eye-off");
const PinIcon = createIconSlot("pin");
const PinOffIcon = createIconSlot("pin-off");
const XIcon = createIconSlot("x");

interface DataGridColumnHeaderProps<TData, TValue>
  extends React.ComponentProps<"button"> {
  header: Header<TData, TValue>;
  table: Table<TData>;
}

// TanStack mutates the table instance in place. Snapshot the state used by the
// header before memoizing its menu, so cell navigation skips this subtree while
// sorting, pinning, sizing and host option changes still update it.
export function DataGridColumnHeader<TData, TValue>(props: DataGridColumnHeaderProps<TData, TValue>) {
  const { header, table } = props;
  const column = header.column;
  const defaults = table._getDefaultColumnDef();
  return <MemoizedColumnHeader
    {...props}
    label={column.columnDef.meta?.label || (typeof column.columnDef.header === "string" ? column.columnDef.header : column.id)}
    variant={column.columnDef.meta?.cell?.variant}
    sorted={column.getIsSorted()}
    pinnedPosition={column.getIsPinned()}
    canSort={column.getCanSort()}
    canPin={column.getCanPin()}
    canHide={column.getCanHide()}
    canResize={column.getCanResize()}
    isAnyColumnResizing={!!table.getState().columnSizingInfo.isResizingColumn}
    isResizing={column.getIsResizing()}
    size={column.getSize()}
    minSize={defaults.minSize}
    maxSize={defaults.maxSize}
  />;
}

interface ColumnHeaderSnapshotProps<TData, TValue> extends DataGridColumnHeaderProps<TData, TValue> {
  label: string;
  variant: Parameters<typeof getColumnVariant>[0];
  sorted: false | SortDirection;
  pinnedPosition: false | "left" | "right";
  canSort: boolean;
  canPin: boolean;
  canHide: boolean;
  canResize: boolean;
  isAnyColumnResizing: boolean;
  isResizing: boolean;
  size: number;
  minSize?: number;
  maxSize?: number;
}

const MemoizedColumnHeader = React.memo(ColumnHeaderImpl) as typeof ColumnHeaderImpl;

function ColumnHeaderImpl<TData, TValue>({
  header,
  table,
  label,
  variant,
  sorted,
  pinnedPosition,
  canSort,
  canPin,
  canHide,
  canResize,
  isAnyColumnResizing,
  isResizing,
  size,
  minSize,
  maxSize,
  className,
  onPointerDown,
  ...props
}: ColumnHeaderSnapshotProps<TData, TValue>) {
  const column = header.column;
  const columnVariant = getColumnVariant(variant);
  const isPinnedLeft = pinnedPosition === "left";
  const isPinnedRight = pinnedPosition === "right";
  const pinStartIndex = canSort ? (sorted ? 3 : 2) : 0;
  const hideIndex = pinStartIndex + (canPin ? 2 : 0);

  const onSortingChange = React.useCallback(
    (direction: SortDirection) => {
      table.setSorting((prev: SortingState) => {
        const existingSortIndex = prev.findIndex(
          (sort) => sort.id === column.id,
        );
        const newSort: ColumnSort = {
          id: column.id,
          desc: direction === "desc",
        };

        if (existingSortIndex >= 0) {
          const updated = [...prev];
          updated[existingSortIndex] = newSort;
          return updated;
        } else {
          return [...prev, newSort];
        }
      });
    },
    [column.id, table],
  );

  const onSortRemove = React.useCallback(() => {
    table.setSorting((prev: SortingState) =>
      prev.filter((sort) => sort.id !== column.id),
    );
  }, [column.id, table]);

  const onLeftPin = React.useCallback(() => {
    column.pin("left");
  }, [column]);

  const onRightPin = React.useCallback(() => {
    column.pin("right");
  }, [column]);

  const onUnpin = React.useCallback(() => {
    column.pin(false);
  }, [column]);

  const onTriggerPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(
        event as Parameters<NonNullable<typeof onPointerDown>>[0],
      );
      if (event.defaultPrevented) return;

      if (event.button !== 0) {
        return;
      }
      table.options.meta?.onColumnClick?.(column.id);
    },
    [table.options.meta, column.id, onPointerDown],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex size-full items-center justify-between gap-2 p-2 text-body font-medium hover:bg-hover data-popup-open:bg-active",
                isAnyColumnResizing && "pointer-events-none",
                className,
              )}
              onPointerDown={onTriggerPointerDown}
              {...props}
            >
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {columnVariant && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <columnVariant.icon className="size-3.5 shrink-0 text-fg-muted" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{columnVariant.label}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <span className="truncate">{label}</span>
              </div>
              <ChevronDownIcon className="size-4 shrink-0 text-fg-muted" />
            </button>
          }
        />
        <DropdownContent
          data-grid-popover=""
          align="start"
          sideOffset={0}
          checkedIndex={sorted === "asc" ? 0 : sorted === "desc" ? 1 : undefined}
          className="w-60"
        >
          {canSort && (
            <>
              <MenuItem
                checked={sorted === "asc"}
                icon={ChevronUpIcon}
                index={0}
                label="Sort asc"
                onSelect={() => onSortingChange("asc")}
              />
              <MenuItem
                checked={sorted === "desc"}
                icon={ChevronDownIcon}
                index={1}
                label="Sort desc"
                onSelect={() => onSortingChange("desc")}
              />
              {sorted && (
                <MenuItem
                  icon={XIcon}
                  index={2}
                  label="Remove sort"
                  onSelect={onSortRemove}
                />
              )}
            </>
          )}
          {canPin && (
            <>
              {canSort && <DropdownSeparator />}

              {isPinnedLeft ? (
                <MenuItem
                  icon={PinOffIcon}
                  index={pinStartIndex}
                  label="Unpin from left"
                  onSelect={onUnpin}
                />
              ) : (
                <MenuItem
                  icon={PinIcon}
                  index={pinStartIndex}
                  label="Pin to left"
                  onSelect={onLeftPin}
                />
              )}
              {isPinnedRight ? (
                <MenuItem
                  icon={PinOffIcon}
                  index={pinStartIndex + 1}
                  label="Unpin from right"
                  onSelect={onUnpin}
                />
              ) : (
                <MenuItem
                  icon={PinIcon}
                  index={pinStartIndex + 1}
                  label="Pin to right"
                  onSelect={onRightPin}
                />
              )}
            </>
          )}
          {canHide && (
            <>
              <DropdownSeparator />
              <MenuItem
                icon={EyeOffIcon}
                index={hideIndex}
                label="Hide column"
                onSelect={() => column.toggleVisibility(false)}
              />
            </>
          )}
        </DropdownContent>
      </DropdownMenu>
      {canResize && (
        <DataGridColumnResizer header={header} label={label} size={size} isResizing={isResizing} minSize={minSize} maxSize={maxSize} />
      )}
    </>
  );
}

const DataGridColumnResizer = React.memo(DataGridColumnResizerImpl) as typeof DataGridColumnResizerImpl;

interface DataGridColumnResizerProps<TData, TValue> {
  header: Header<TData, TValue>;
  label: string;
  size: number;
  isResizing: boolean;
  minSize?: number;
  maxSize?: number;
}

function DataGridColumnResizerImpl<TData, TValue>({
  header,
  label,
  size,
  isResizing,
  minSize,
  maxSize,
}: DataGridColumnResizerProps<TData, TValue>) {
  const onDoubleClick = React.useCallback(() => {
    header.column.resetSize();
  }, [header.column]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      aria-valuenow={size}
      aria-valuemin={minSize}
      aria-valuemax={maxSize}
      tabIndex={0}
      className={cn(
        "absolute -end-px top-0 z-raised h-full w-0.5 cursor-ew-resize touch-none select-none bg-border transition-opacity after:absolute after:inset-y-0 after:start-1/2 after:h-full after:w-[18px] after:-translate-x-1/2 after:content-[''] hover:bg-inverse-background focus:bg-inverse-background focus:outline-none",
        isResizing
          ? "bg-inverse-background"
          : "opacity-0 hover:opacity-100",
      )}
      onDoubleClick={onDoubleClick}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
    />
  );
}
