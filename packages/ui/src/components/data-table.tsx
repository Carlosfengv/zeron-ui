"use client";

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type TableOptions,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { Badge } from "#components/badge";
import { Button } from "#components/button";
import {
  CheckboxGroup,
  CheckboxItem,
} from "#components/checkbox-group";
import {
  DropdownContent,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "#components/dropdown";
import { MenuItem } from "#components/menu-item";
import { Input } from "#components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "#components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#components/table";
import { cn } from "#system/utils";
import { useIcon, type IconComponent } from "#system/icon-context";

export type DataTableColumnMeta = {
  /** Icon shown before the faceted-filter label and selected values. */
  filterIcon?: IconComponent;
  label?: string;
  options?: DataTableFilterOption[];
  placeholder?: string;
  unit?: string;
  variant?: "text" | "number" | "select" | "multiSelect";
};

export type DataTableFilterOption = {
  icon?: IconComponent;
  label: string;
  value: string;
};

declare module "@tanstack/react-table" {
  // TanStack exposes this empty interface specifically for declaration
  // merging; the type parameters must match its upstream declaration.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> extends DataTableColumnMeta {}
}

export type UseDataTableProps<TData> = Omit<
  TableOptions<TData>,
  | "getCoreRowModel"
  | "getFacetedRowModel"
  | "getFacetedUniqueValues"
  | "getFilteredRowModel"
  | "getPaginationRowModel"
  | "getSortedRowModel"
  | "onColumnFiltersChange"
  | "onColumnPinningChange"
  | "onColumnVisibilityChange"
  | "onPaginationChange"
  | "onRowSelectionChange"
  | "onSortingChange"
  | "state"
> & {
  columns: ColumnDef<TData, unknown>[];
  initialState?: TableOptions<TData>["initialState"];
};

function useDataTable<TData>({
  initialState,
  ...options
}: UseDataTableProps<TData>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialState?.columnFilters ?? []
  );
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    initialState?.columnPinning ?? {}
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: initialState?.pagination?.pageIndex ?? 0,
    pageSize: initialState?.pagination?.pageSize ?? 10,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );
  const [sorting, setSorting] = React.useState<SortingState>(
    initialState?.sorting ?? []
  );

  const table = useReactTable({
    ...options,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState,
    onColumnFiltersChange: setColumnFilters,
    onColumnPinningChange: setColumnPinning,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnPinning,
      columnVisibility,
      pagination,
      rowSelection,
      sorting,
    },
  });

  return { table };
}

export type DataTableProps<TData> = React.ComponentProps<"div"> & {
  actionBar?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  table: TanstackTable<TData>;
};

type HorizontalScrollEdges = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
};

const initialHorizontalScrollEdges: HorizontalScrollEdges = {
  canScrollLeft: false,
  canScrollRight: false,
};

function DataTable<TData>({
  actionBar,
  children,
  className,
  emptyMessage = "No results.",
  table,
  ...props
}: DataTableProps<TData>) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const tableElementRef = React.useRef<HTMLTableElement>(null);
  const [scrollEdges, setScrollEdges] =
    React.useState<HorizontalScrollEdges>(initialHorizontalScrollEdges);

  const updateScrollEdges = React.useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const maxScrollLeft = Math.max(
      scrollContainer.scrollWidth - scrollContainer.clientWidth,
      0
    );
    const hasOverflow = maxScrollLeft > 1;
    const nextScrollEdges = {
      canScrollLeft: hasOverflow && scrollContainer.scrollLeft > 1,
      canScrollRight:
        hasOverflow && scrollContainer.scrollLeft < maxScrollLeft - 1,
    };

    setScrollEdges((currentScrollEdges) =>
      currentScrollEdges.canScrollLeft === nextScrollEdges.canScrollLeft &&
      currentScrollEdges.canScrollRight === nextScrollEdges.canScrollRight
        ? currentScrollEdges
        : nextScrollEdges
    );
  }, []);

  React.useEffect(() => {
    updateScrollEdges();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScrollEdges);
      return () => window.removeEventListener("resize", updateScrollEdges);
    }

    const resizeObserver = new ResizeObserver(updateScrollEdges);
    const scrollContainer = scrollContainerRef.current;
    const tableElement = tableElementRef.current;

    if (scrollContainer) resizeObserver.observe(scrollContainer);
    if (tableElement) resizeObserver.observe(tableElement);

    return () => resizeObserver.disconnect();
  }, [updateScrollEdges]);

  return (
    <div
      className={cn("flex w-full min-w-0 flex-col gap-2", className)}
      data-slot="data-table"
      {...props}
    >
      {children}
      <div
        className={cn(
          "overflow-hidden border border-border bg-surface-floating",
          "rounded-xl"
        )}
      >
        <div
          className="overflow-x-auto"
          onScroll={updateScrollEdges}
          ref={scrollContainerRef}
        >
          <Table ref={tableElementRef}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className="h-control-md align-middle whitespace-nowrap [&>[data-slot=checkbox]]:block"
                      colSpan={header.colSpan}
                      key={header.id}
                      style={getCommonPinningStyles(header.column, {
                        showLeftShadow: scrollEdges.canScrollLeft,
                        showRightShadow: scrollEdges.canScrollRight,
                      })}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row, rowIndex) => (
                  <TableRow
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    index={rowIndex}
                    key={row.id}
                    className="data-[state=selected]:bg-selection"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className={cn(
                          "align-middle whitespace-nowrap [&>[data-slot=checkbox]]:block",
                          cell.column.getIsPinned() &&
                            "group-[.is-active]/row:[background-image:linear-gradient(var(--hover),var(--hover))]"
                        )}
                        key={cell.id}
                        style={getCommonPinningStyles(cell.column, {
                          backgroundImage: row.getIsSelected()
                            ? "linear-gradient(var(--selection), var(--selection))"
                            : undefined,
                          showLeftShadow: scrollEdges.canScrollLeft,
                          showRightShadow: scrollEdges.canScrollRight,
                        })}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-24 align-middle text-center text-fg-muted"
                    colSpan={Math.max(table.getVisibleLeafColumns().length, 1)}
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} />
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}

export type DataTableColumnHeaderProps<TData, TValue> =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    column: Column<TData, TValue>;
    label: string;
  };

function DataTableColumnHeader<TData, TValue>({
  className,
  column,
  label,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false);
  const ChevronUp = useIcon("chevron-up");
  const ChevronDown = useIcon("chevron-down");
  const ChevronsUpDown = useIcon("chevrons-up-down");
  const EyeOff = useIcon("eye-off");
  const X = useIcon("x");
  const sorted = column.getIsSorted();
  const canSort = column.getCanSort();
  const canHide = column.getCanHide();
  const SortIcon = !canSort
    ? ChevronDown
    : sorted === "asc"
      ? ChevronUp
      : sorted === "desc"
        ? ChevronDown
        : ChevronsUpDown;

  if (!canSort && !canHide) {
    return <div className={cn(className)}>{label}</div>;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownTrigger
        render={
          <Button
            active={open}
            className={cn("-ml-2 px-2 text-body font-medium text-fg-default", className)}
            size="sm"
            trailingIcon={SortIcon}
            variant="ghost"
            {...props}
          >
            {label}
          </Button>
        }
      />
      <DropdownContent
        align="start"
        checkedIndex={sorted === "asc" ? 0 : sorted === "desc" ? 1 : undefined}
        className="w-40"
      >
        <DropdownLabel>{label}</DropdownLabel>
        {canSort && (
          <>
            <MenuItem
              checked={sorted === "asc"}
              icon={ChevronUp}
              index={0}
              label="Ascending"
              onSelect={() => column.toggleSorting(false)}
            />
            <MenuItem
              checked={sorted === "desc"}
              icon={ChevronDown}
              index={1}
              label="Descending"
              onSelect={() => column.toggleSorting(true)}
            />
            {sorted && (
              <MenuItem
                icon={X}
                index={2}
                label="Reset sorting"
                onSelect={() => column.clearSorting()}
              />
            )}
          </>
        )}
        {canSort && canHide && <DropdownSeparator />}
        {canHide && (
          <MenuItem
            icon={EyeOff}
            index={3}
            label="Hide column"
            onSelect={() => column.toggleVisibility(false)}
          />
        )}
      </DropdownContent>
    </DropdownMenu>
  );
}

export type DataTableToolbarProps<TData> = React.ComponentProps<"div"> & {
  /** Whether to render the column-visibility control beside toolbar actions. */
  showViewOptions?: boolean;
  table: TanstackTable<TData>;
};

function DataTableToolbar<TData>({
  children,
  className,
  showViewOptions = true,
  table,
  ...props
}: DataTableToolbarProps<TData>) {
  const CircleX = useIcon("circle-x");
  const isFiltered = table.getState().columnFilters.length > 0;
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) => column.getCanFilter() && column.columnDef.meta?.variant
        ),
    [table]
  );

  return (
    <div
      aria-orientation="horizontal"
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-2 overflow-visible p-1",
        className
      )}
      role="toolbar"
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter column={column} key={column.id} />
        ))}
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            className="border-dashed"
            leadingIcon={CircleX}
            onClick={() => table.resetColumnFilters()}
            size="md"
            variant="tertiary"
          >
            Reset
          </Button>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children}
        {showViewOptions && <DataTableViewOptions table={table} />}
      </div>
    </div>
  );
}

type DataTableToolbarFilterProps<TData> = {
  column: Column<TData>;
};

function DataTableToolbarFilter<TData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  const meta = column.columnDef.meta;
  const variant = meta?.variant;

  if (!variant) return null;

  if (variant === "select" || variant === "multiSelect") {
    return (
      <DataTableFacetedFilter
        column={column}
        icon={meta?.filterIcon}
        multiple={variant === "multiSelect"}
        options={meta?.options ?? []}
        title={meta?.label ?? column.id}
      />
    );
  }

  if (variant === "number") {
    return (
      <div className="relative shrink-0">
        <Input
          className={cn("w-32", meta?.unit && "pr-10")}
          inputMode="numeric"
          onChange={(event) => column.setFilterValue(event.target.value)}
          placeholder={meta?.placeholder ?? meta?.label ?? column.id}
          size="md"
          type="number"
          value={(column.getFilterValue() as string) ?? ""}
        />
        {meta?.unit && (
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-label text-fg-muted">
            {meta.unit}
          </span>
        )}
      </div>
    );
  }

  return (
    <Input
      className="w-40 lg:w-56"
      onChange={(event) => column.setFilterValue(event.target.value)}
      placeholder={meta?.placeholder ?? meta?.label ?? column.id}
      size="md"
      value={(column.getFilterValue() as string) ?? ""}
    />
  );
}

export type DataTableFacetedFilterProps<TData, TValue> = {
  column: Column<TData, TValue>;
  icon?: IconComponent;
  multiple?: boolean;
  options: DataTableFilterOption[];
  title: string;
};

function DataTableFacetedFilter<TData, TValue>({
  column,
  icon: FilterIcon,
  multiple = false,
  options,
  title,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false);
  const CirclePlus = useIcon("circle-plus");
  const CircleX = useIcon("circle-x");
  const columnFilterValue = column.getFilterValue();
  const selectedValues = new Set(
    Array.isArray(columnFilterValue) ? columnFilterValue : []
  );
  const checkedIndices = new Set(
    options.flatMap((option, index) =>
      selectedValues.has(option.value) ? [index] : []
    )
  );
  const selectedOptions = options.filter((option) =>
    selectedValues.has(option.value)
  );
  const hasSelectedOptions = selectedValues.size > 0;
  // A column can provide a semantic icon (for example, a status dot). Keep it
  // fixed as filters are selected so the control does not imply a rotation or
  // mode change. Existing filters retain the add/clear icon fallback.
  const LeadingIcon = FilterIcon ?? (hasSelectedOptions ? CircleX : CirclePlus);

  const toggleOption = (option: DataTableFilterOption) => {
    const isSelected = selectedValues.has(option.value);
    if (multiple) {
      const nextValues = new Set(selectedValues);
      if (isSelected) nextValues.delete(option.value);
      else nextValues.add(option.value);
      const filterValue = Array.from(nextValues);
      column.setFilterValue(filterValue.length ? filterValue : undefined);
    } else {
      column.setFilterValue(isSelected ? undefined : [option.value]);
      setOpen(false);
    }
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            active={open}
            aria-label={
              selectedOptions.length > 0
                ? `${title}: ${selectedOptions.map((option) => option.label).join(", ")}`
                : title
            }
            className="shrink-0"
            dashed={!hasSelectedOptions}
            leadingIcon={LeadingIcon}
            size="md"
            variant="tertiary"
          >
            {!hasSelectedOptions ? (
              title
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((option) => (
                  <Badge color="gray" key={option.value} size="sm">
                    {option.label}
                  </Badge>
                ))}
                {selectedOptions.length > 2 && (
                  <Badge color="gray" size="sm">
                    +{selectedOptions.length - 2}
                  </Badge>
                )}
              </>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-52 p-1" sideOffset={4}>
        <div className="px-2 py-1.5 text-label text-fg-muted">
          {title}
        </div>
        <div className="-mx-1 my-1 h-px" />
        <CheckboxGroup
          aria-label={title}
          checkedIndices={checkedIndices}
          className="w-full"
        >
          {options.map((option, index) => (
            <CheckboxItem
              checked={selectedValues.has(option.value)}
              icon={option.icon}
              index={index}
              key={option.value}
              label={option.label}
              onToggle={() => toggleOption(option)}
              trailing={column.getFacetedUniqueValues().get(option.value) ?? 0}
            />
          ))}
        </CheckboxGroup>
        {selectedValues.size > 0 && (
          <Button
            className="mt-0.5 w-full border-t border-border"
            onClick={() => {
              column.setFilterValue(undefined);
              setOpen(false);
            }}
            size="md"
            variant="ghost"
          >
            Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export type DataTablePaginationProps<TData> = React.ComponentProps<"div"> & {
  pageSizeOptions?: number[];
  table: TanstackTable<TData>;
};

function DataTablePagination<TData>({
  className,
  pageSizeOptions = [10, 20, 30, 40, 50],
  table,
  ...props
}: DataTablePaginationProps<TData>) {
  const ChevronLeft = useIcon("chevron-left");
  const ChevronRight = useIcon("chevron-right");
  const ChevronsLeft = useIcon("chevrons-left");
  const ChevronsRight = useIcon("chevrons-right");
  const pageSize = table.getState().pagination.pageSize;
  const hasSelectionCheckbox = table
    .getAllLeafColumns()
    .some((column) => column.id === "select");
  const resolvedPageSizeOptions = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((left, right) => left - right);

  return (
    <div
      className={cn(
        "flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 text-body sm:flex-row sm:gap-8",
        !hasSelectionCheckbox && "sm:justify-end",
        className
      )}
      data-slot="data-table-pagination"
      {...props}
    >
      {hasSelectionCheckbox && (
        <div className="flex-1 whitespace-nowrap text-fg-muted">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      )}
      <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-label text-fg-default">Rows per page</span>
          <Select
            itemDensity="compact"
            onValueChange={(value) => table.setPageSize(Number(value))}
            size="sm"
            value={`${pageSize}`}
          >
            <SelectTrigger
              aria-label="Rows per page"
              className="min-w-18 w-18 px-2 text-label"
              placeholder={`${pageSize}`}
            />
            <SelectContent>
            {resolvedPageSizeOptions.map((option) => (
              <SelectItem
                index={resolvedPageSizeOptions.indexOf(option)}
                key={option}
                value={`${option}`}
              >
                {option}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
        <div className="whitespace-nowrap text-label tabular-nums text-fg-default">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(table.getPageCount(), 1)}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            aria-label="Go to first page"
            className="hidden lg:inline-flex"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            iconOnly
            size="sm"
            variant="tertiary"
          >
            <ChevronsLeft />
          </Button>
          <Button
            aria-label="Go to previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            iconOnly
            size="sm"
            variant="tertiary"
          >
            <ChevronLeft />
          </Button>
          <Button
            aria-label="Go to next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            iconOnly
            size="sm"
            variant="tertiary"
          >
            <ChevronRight />
          </Button>
          <Button
            aria-label="Go to last page"
            className="hidden lg:inline-flex"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(Math.max(table.getPageCount() - 1, 0))}
            iconOnly
            size="sm"
            variant="tertiary"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

export type DataTableViewOptionsProps<TData> = {
  className?: string;
  table: TanstackTable<TData>;
};

function DataTableViewOptions<TData>({
  className,
  table,
}: DataTableViewOptionsProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const Settings = useIcon("settings");
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== "undefined" && column.getCanHide()
        ),
    [table]
  );

  if (!columns.length) return null;

  const checkedIndices = new Set(
    columns.flatMap((column, index) => (column.getIsVisible() ? [index] : []))
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            active={open}
            aria-label="Toggle columns"
            className={cn("shrink-0", className)}
            leadingIcon={Settings}
            size="md"
            variant="tertiary"
          >
            View
          </Button>
        }
      />
      <PopoverContent align="end" className="w-48 p-1" sideOffset={4}>
        <div className="px-2 py-1.5 text-label text-fg-muted">
          Toggle columns
        </div>
        <div className="-mx-1 my-1" />
        <CheckboxGroup
          aria-label="Toggle columns"
          checkedIndices={checkedIndices}
          className="w-full"
        >
          {columns.map((column, index) => (
            <CheckboxItem
              checked={column.getIsVisible()}
              index={index}
              key={column.id}
              label={column.columnDef.meta?.label ?? column.id}
              onToggle={() => column.toggleVisibility(!column.getIsVisible())}
            />
          ))}
        </CheckboxGroup>
      </PopoverContent>
    </Popover>
  );
}

function getCommonPinningStyles<TData, TValue>(
  column: Column<TData, TValue>,
  {
    backgroundColor = "var(--surface-floating)",
    backgroundImage,
    showLeftShadow = false,
    showRightShadow = false,
  }: {
    backgroundColor?: string;
    backgroundImage?: string;
    showLeftShadow?: boolean;
    showRightShadow?: boolean;
  } = {}
): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinnedColumn =
    isPinned === "right" && column.getIsFirstColumn("right");

  return {
    backgroundColor: isPinned ? backgroundColor : undefined,
    backgroundImage: isPinned ? backgroundImage : undefined,
    boxShadow: isLastLeftPinnedColumn && showLeftShadow
      ? "-4px 0 4px -4px var(--border) inset"
      : isFirstRightPinnedColumn && showRightShadow
        ? "4px 0 4px -4px var(--border) inset"
        : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    width: column.getSize(),
    zIndex: isPinned ? "var(--layer-control)" : undefined,
  };
}

export {
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
  useDataTable,
};
