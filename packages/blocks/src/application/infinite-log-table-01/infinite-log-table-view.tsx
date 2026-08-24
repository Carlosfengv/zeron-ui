"use client";

import {
  type ColumnDef,
  type ColumnSizingState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import { DropdownContent, DropdownLabel, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Alert, AlertAction, AlertTitle } from "@zeron/ui/alert";
import { Empty, EmptyHeader, EmptyTitle } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { SortableCollection, type SortableCollectionItem } from "@zeron/ui/sortable-collection";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import {
  TimeRangeHistogram,
  type TimeRangeHistogramRange,
  type TimeRangeHistogramSeries,
} from "@zeron/ui/time-range-histogram";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { redactInfiniteLogRecord } from "./infinite-log-data-source";
import { infiniteLogFieldIcons } from "./infinite-log-field-icons";
import { InfiniteLogHeaderFilter } from "./infinite-log-header-filter";
import { infiniteLogOutcomeVisuals } from "./infinite-log-outcome";
import { formatInfiniteLogDateTime } from "./infinite-log-time-range";
import { formatMilliseconds, InfiniteLogTimingBar } from "./infinite-log-timing";
import type {
  InfiniteLogMetadata,
  InfiniteLogLiveBoundary,
  InfiniteLogFilters,
  InfiniteLogRecord,
  InfiniteLogSort,
  InfiniteLogTableLabels,
  InfiniteLogTimeRange,
} from "./infinite-log-types";

const LOG_ROW_HEIGHT = 32;

type ColumnId =
  | "select"
  | "timestamp"
  | "outcome"
  | "status"
  | "method"
  | "host"
  | "pathname"
  | "region"
  | "latency"
  | "timing"
  | "id";

type CustomizableColumnId = Exclude<ColumnId, "select">;

interface ColumnCollectionItem extends SortableCollectionItem {
  id: CustomizableColumnId;
  title: string;
}

const defaultColumnOrder: readonly ColumnId[] = [
  "select",
  "timestamp",
  "outcome",
  "status",
  "method",
  "host",
  "pathname",
  "region",
  "latency",
  "timing",
  "id",
];

const defaultColumnSize: Record<ColumnId, number> = {
  select: 44,
  timestamp: 176,
  outcome: 120,
  status: 120,
  method: 120,
  host: 180,
  pathname: 280,
  region: 150,
  latency: 120,
  timing: 220,
  id: 176,
};

const columnLabels: Record<ColumnId, keyof InfiniteLogTableLabels | "requestId"> = {
  select: "filters",
  timestamp: "timeRange",
  outcome: "outcome",
  status: "status",
  method: "method",
  host: "host",
  pathname: "pathname",
  region: "region",
  latency: "latency",
  timing: "timingPhases",
  id: "requestId",
};

const headerTitleClassName = "text-body font-medium text-fg-default";
const stickyCellInteractionClassName = "transition-colors group-hover/log-row:bg-hover group-focus-visible/log-row:bg-selection";
const newLiveRowBackgroundClassName = "bg-[color-mix(in_oklch,var(--info-surface)_50%,var(--surface-floating))]";
const newLiveRowHoverClassName = "hover:bg-[color-mix(in_oklch,var(--info-surface)_70%,var(--surface-floating))]";
const stickyNewLiveRowHoverClassName = "group-hover/log-row:bg-[color-mix(in_oklch,var(--info-surface)_70%,var(--surface-floating))]";
const timelineSeries = [
  { dataKey: "success", label: "Success", color: infiniteLogOutcomeVisuals.success.chartColor, inactiveColor: "var(--surface-raised)" },
  { dataKey: "warning", label: "Warning", color: infiniteLogOutcomeVisuals.warning.chartColor, inactiveColor: "var(--surface-base)" },
  { dataKey: "error", label: "Error", color: infiniteLogOutcomeVisuals.error.chartColor, inactiveColor: "var(--surface-raised)" },
] satisfies readonly TimeRangeHistogramSeries[];

function sortForColumn(id: ColumnId): InfiniteLogSort["field"] | undefined {
  if (id === "timestamp" || id === "status" || id === "latency") return id;
  return undefined;
}

function getColumnLabel(id: ColumnId, labels: InfiniteLogTableLabels) {
  if (id === "id") return "Request ID";
  if (id === "select") return "Select";
  return labels[columnLabels[id] as keyof InfiniteLogTableLabels] as string;
}

function ColumnHeaderIcon({ column }: { column: Exclude<ColumnId, "select"> }) {
  const Icon = infiniteLogFieldIcons[column];
  return (
    <span aria-hidden className="flex size-3.5 shrink-0 items-center justify-center text-fg-muted" data-slot="infinite-log-column-icon">
      <Icon className="size-3.5" />
    </span>
  );
}

interface InfiniteLogTableViewProps {
  tableId: string;
  activeRecordId?: string;
  rows: readonly InfiniteLogRecord[];
  metadata?: InfiniteLogMetadata;
  filters: InfiniteLogFilters;
  timeRange?: InfiniteLogTimeRange;
  sort?: InfiniteLogSort;
  selectedIds: ReadonlySet<string>;
  labels: InfiniteLogTableLabels;
  locale: string;
  timeZone: string;
  loading: boolean;
  updating: boolean;
  fetchingMore: boolean;
  hasNextPage: boolean;
  error?: unknown;
  liveBoundary?: InfiniteLogLiveBoundary;
  pendingLiveCount: number;
  redactRecord?: (record: InfiniteLogRecord) => InfiniteLogRecord;
  onSortChange: (sort?: InfiniteLogSort) => void;
  onFiltersChange: (filters: InfiniteLogFilters) => void;
  onTimeRangeChange: (range: TimeRangeHistogramRange) => void;
  onToggleRecord: (record: InfiniteLogRecord) => void;
  onToggleAllLoaded: () => void;
  onClearSelection: () => void;
  onOpenRecord: (record: InfiniteLogRecord, trigger: HTMLElement) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onApplyPending: () => void;
  onAtTopChange: (atTop: boolean) => void;
  emptyContent?: React.ReactNode;
  errorContent?: React.ReactNode;
}

export const InfiniteLogTableView = memo(function InfiniteLogTableView({
  tableId,
  activeRecordId,
  rows,
  metadata,
  filters,
  timeRange,
  sort,
  selectedIds,
  labels,
  locale,
  timeZone,
  loading,
  updating,
  fetchingMore,
  hasNextPage,
  error,
  liveBoundary,
  pendingLiveCount,
  redactRecord = redactInfiniteLogRecord,
  onSortChange,
  onFiltersChange,
  onTimeRangeChange,
  onToggleRecord,
  onToggleAllLoaded,
  onClearSelection,
  onOpenRecord,
  onLoadMore,
  onRetry,
  onApplyPending,
  onAtTopChange,
  emptyContent,
  errorContent,
}: InfiniteLogTableViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const Check = useIcon("check");
  const Copy = useIcon("copy");
  const ChevronUp = useIcon("chevron-up");
  const ChevronDown = useIcon("chevron-down");
  const ChevronsUpDown = useIcon("chevrons-up-down");
  const Columns = useIcon("settings");
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(() => [...defaultColumnOrder]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({ id: false });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const timelineDateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone,
  }), [locale, timeZone]);
  const timelineData = useMemo(() => (metadata?.timeline?.buckets ?? []).flatMap((bucket) => {
    const start = Date.parse(bucket.start);
    const end = Date.parse(bucket.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    return [{
      start,
      end,
      label: `${timelineDateFormatter.format(start)} – ${timelineDateFormatter.format(end)}`,
      success: bucket.counts.success,
      warning: bucket.counts.warning,
      error: bucket.counts.error,
    }];
  }), [metadata?.timeline?.buckets, timelineDateFormatter]);
  const timelineValue = useMemo<TimeRangeHistogramRange>(() => {
    const first = timelineData[0];
    const last = timelineData.at(-1);
    const domain = { start: first?.start ?? 0, end: last?.end ?? 0 };
    if (!timeRange) return domain;
    const start = Date.parse(timeRange.from);
    const end = Date.parse(timeRange.to);
    return Number.isFinite(start) && Number.isFinite(end) && start < end ? { start, end } : domain;
  }, [timeRange, timelineData]);
  const formatTimelineRange = useCallback((range: TimeRangeHistogramRange) => (
    `${timelineDateFormatter.format(range.start)} – ${timelineDateFormatter.format(range.end)}`
  ), [timelineDateFormatter]);

  const columns = useMemo<ColumnDef<InfiniteLogRecord>[]>(
    () => defaultColumnOrder.map((id) => ({
      id,
      accessorFn: (record) => record[id as keyof InfiniteLogRecord],
      enableResizing: id !== "select",
      size: defaultColumnSize[id],
      minSize: id === "select" ? 44 : 120,
    })),
    [],
  );
  const table = useReactTable({
    columns,
    data: rows as InfiniteLogRecord[],
    getCoreRowModel: getCoreRowModel(),
    getRowId: (record) => record.id,
    manualSorting: true,
    onColumnOrderChange: (updater) =>
      setColumnOrder((current) =>
        typeof updater === "function" ? (updater(current) as ColumnId[]) : (updater as ColumnId[]),
      ),
    onColumnVisibilityChange: (updater) =>
      setColumnVisibility((current) => (typeof updater === "function" ? updater(current) : updater)),
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange",
    state: { columnOrder, columnVisibility, columnSizing },
  });
  const visibleColumns = table.getVisibleLeafColumns().map((column) => column.id as ColumnId);
  const firstDataColumn = visibleColumns.find((column) => column !== "select");
  const fluidColumn = visibleColumns.includes("pathname")
    ? "pathname"
    : visibleColumns.findLast((column) => column !== "select");
  const gridTemplateColumns = visibleColumns.map((column) => {
    const size = table.getColumn(column)?.getSize() ?? defaultColumnSize[column];
    return column === fluidColumn ? `minmax(${size}px, 1fr)` : `${size}px`;
  }).join(" ");
  const columnItems = useMemo<ColumnCollectionItem[]>(
    () => columnOrder
      .filter((column): column is CustomizableColumnId => column !== "select")
      .map((column) => ({
        id: column,
        title: getColumnLabel(column, labels),
        removable: false,
      })),
    [columnOrder, labels],
  );
  const liveBoundaryRecordIndex = useMemo(() => {
    if (!liveBoundary) return -1;
    const exactIndex = rows.findIndex((record) => record.id === liveBoundary.recordId);
    if (exactIndex >= 0) return exactIndex;

    const boundaryTime = Date.parse(liveBoundary.timestamp);
    if (!Number.isFinite(boundaryTime)) return -1;
    return rows.findIndex((record) => Date.parse(record.timestamp) <= boundaryTime);
  }, [liveBoundary, rows]);
  const hasLiveBoundary = liveBoundaryRecordIndex > 0;
  const virtualItemCount = rows.length + (hasLiveBoundary ? 1 : 0);
  const recordIndexForVirtualIndex = useCallback(
    (virtualIndex: number) => {
      if (hasLiveBoundary && virtualIndex === liveBoundaryRecordIndex) return null;
      return hasLiveBoundary && virtualIndex > liveBoundaryRecordIndex
        ? virtualIndex - 1
        : virtualIndex;
    },
    [hasLiveBoundary, liveBoundaryRecordIndex],
  );
  const virtualizer = useVirtualizer({
    count: virtualItemCount,
    estimateSize: () => LOG_ROW_HEIGHT,
    getItemKey: (index) => {
      if (hasLiveBoundary && index === liveBoundaryRecordIndex) {
        return `live-boundary:${liveBoundary?.recordId ?? "unknown"}`;
      }
      const recordIndex = recordIndexForVirtualIndex(index);
      return recordIndex === null ? index : rows[recordIndex]?.id ?? index;
    },
    getScrollElement: () => viewportRef.current,
    initialRect: { height: 480, width: 1 },
    overscan: 10,
  });
  const virtualRows = virtualizer.getVirtualItems();
  // An observer can temporarily report a zero-height scrollport (for example
  // while a hidden tab becomes visible). Keep a small, keyboard-operable
  // prefix available until TanStack Virtual receives the real measurement.
  const renderedVirtualRows = virtualRows.length > 0
    ? virtualRows
    : Array.from({ length: Math.min(virtualItemCount, 20) }, (_, index) => ({
        index,
        size: LOG_ROW_HEIGHT,
        start: index * LOG_ROW_HEIGHT,
      }));
  const allLoadedSelected = rows.length > 0 && rows.every((record) => selectedIds.has(record.id));
  const someLoadedSelected = rows.some((record) => selectedIds.has(record.id));

  useEffect(() => {
    const orderKey = `zeron:infinite-log-table:v1:${tableId}:column-order`;
    const visibilityKey = `zeron:infinite-log-table:v1:${tableId}:column-visibility`;
    try {
      const savedOrder = JSON.parse(localStorage.getItem(orderKey) ?? "null") as unknown;
      if (
        Array.isArray(savedOrder) &&
        savedOrder.length === defaultColumnOrder.length &&
        savedOrder.every((column) => defaultColumnOrder.includes(column as ColumnId))
      ) {
        setColumnOrder(savedOrder as ColumnId[]);
      }
      const savedVisibility = JSON.parse(localStorage.getItem(visibilityKey) ?? "null") as unknown;
      if (savedVisibility && typeof savedVisibility === "object") {
        const valid = Object.fromEntries(
          Object.entries(savedVisibility as Record<string, unknown>).filter(
            ([column, value]) => defaultColumnOrder.includes(column as ColumnId) && typeof value === "boolean",
          ),
        );
        setColumnVisibility(valid as Record<string, boolean>);
      }
    } catch {
      // A blocked or malformed localStorage entry is non-fatal.
    }
  }, [tableId]);

  useEffect(() => {
    try {
      localStorage.setItem(`zeron:infinite-log-table:v1:${tableId}:column-order`, JSON.stringify(columnOrder));
      localStorage.setItem(`zeron:infinite-log-table:v1:${tableId}:column-visibility`, JSON.stringify(columnVisibility));
    } catch {
      // Persisting preference must never prevent log observation.
    }
  }, [columnOrder, columnVisibility, tableId]);

  useEffect(() => {
    const last = virtualRows.at(-1);
    const lastRecordIndex = last ? recordIndexForVirtualIndex(last.index) : null;
    if (lastRecordIndex !== null && hasNextPage && !loading && !fetchingMore && lastRecordIndex >= rows.length - 9) {
      onLoadMore();
    }
  }, [fetchingMore, hasNextPage, loading, onLoadMore, recordIndexForVirtualIndex, rows.length, virtualRows]);

  const onScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    onAtTopChange(viewport.scrollTop < 8);
  }, [onAtTopChange]);

  const applyPending = () => {
    onApplyPending();
    requestAnimationFrame(() => viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const copySelected = async () => {
    const selected = rows.filter((record) => selectedIds.has(record.id)).map(redactRecord);
    try {
      await navigator.clipboard?.writeText(JSON.stringify(selected, null, 2));
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  };

  const renderHeaderFilter = (column: ColumnId) => {
    if (column === "outcome") {
      const options = metadata?.facets.outcomes.values.map(({ count, value }) => ({ count, label: value, value })) ?? [];
      if (options.length === 0) return null;
      return <InfiniteLogHeaderFilter
        clearLabel={labels.clear}
        label={getColumnLabel(column, labels)}
        onSelectedValuesChange={(outcomes) => onFiltersChange({ ...filters, outcomes: outcomes as InfiniteLogFilters["outcomes"] })}
        options={options}
        selectedValues={[...filters.outcomes]}
      />;
    }
    if (column === "status") {
      const options = metadata?.facets.statuses.values.map(({ count, value }) => ({ count, label: String(value), value: String(value) })) ?? [];
      if (options.length === 0) return null;
      return <InfiniteLogHeaderFilter
        clearLabel={labels.clear}
        label={getColumnLabel(column, labels)}
        onSelectedValuesChange={(statuses) => onFiltersChange({ ...filters, statuses: statuses.map(Number) })}
        options={options}
        selectedValues={filters.statuses.map(String)}
        sort={{
          direction: sort?.field === "status" ? sort.direction : undefined,
          onChange: (direction) => onSortChange({ field: "status", direction }),
        }}
      />;
    }
    if (column === "method") {
      const options = metadata?.facets.methods.values.map(({ count, value }) => ({ count, label: value, value })) ?? [];
      if (options.length === 0) return null;
      return <InfiniteLogHeaderFilter
        clearLabel={labels.clear}
        label={getColumnLabel(column, labels)}
        onSelectedValuesChange={(methods) => onFiltersChange({ ...filters, methods: methods as InfiniteLogFilters["methods"] })}
        options={options}
        selectedValues={[...filters.methods]}
      />;
    }
    if (column === "region") {
      const options = metadata?.facets.regions.values.map(({ count, value }) => ({ count, label: value, value })) ?? [];
      if (options.length === 0) return null;
      return <InfiniteLogHeaderFilter
        clearLabel={labels.clear}
        label={getColumnLabel(column, labels)}
        onSelectedValuesChange={(regions) => onFiltersChange({ ...filters, regions })}
        options={options}
        selectedValues={[...filters.regions]}
      />;
    }
    return null;
  };

  const updateSort = (column: ColumnId) => {
    const field = sortForColumn(column);
    if (!field) return;
    onSortChange(
      sort?.field === field
        ? { field, direction: sort.direction === "desc" ? "asc" : "desc" }
        : { field, direction: "desc" },
    );
  };

  const renderCell = (record: InfiniteLogRecord, column: ColumnId) => {
    switch (column) {
      case "select":
        return (
          <Checkbox
            aria-label={`Select ${record.id}`}
            checked={selectedIds.has(record.id)}
            onCheckedChange={() => onToggleRecord(record)}
            onClick={(event) => event.stopPropagation()}
          />
        );
      case "timestamp":
        return <time className="block truncate font-mono text-label tabular-nums text-fg-muted" dateTime={record.timestamp} title={record.timestamp}>{formatInfiniteLogDateTime(record.timestamp, timeZone)}</time>;
      case "outcome":
        return <Badge color={infiniteLogOutcomeVisuals[record.outcome].badgeColor} data-outcome={record.outcome} size="sm">{record.outcome}</Badge>;
      case "status":
        return <span className="font-mono text-label tabular-nums text-fg-default">{record.status}</span>;
      case "method":
        return <span className="font-mono text-label text-fg-default">{record.method}</span>;
      case "host":
        return <span className="block truncate text-label text-fg-muted" title={record.host}>{record.host}</span>;
      case "pathname":
        return <span className="block truncate text-body text-fg-default" title={record.pathname}>{record.pathname}</span>;
      case "region":
        return <span className="block truncate text-label text-fg-muted" title={record.region}>{record.region}</span>;
      case "latency":
        return <span className="font-mono text-label tabular-nums text-fg-default">{formatMilliseconds(record.latency)}</span>;
      case "timing":
        return <InfiniteLogTimingBar latency={record.latency} timing={record.timing} />;
      case "id":
        return <span className="block truncate font-mono text-label text-fg-muted" title={record.id}>{record.id}</span>;
    }
  };

  return (
    <section aria-label="HTTP request log results" className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border-subtle bg-surface-floating">
      <div className="flex min-h-control-lg items-center justify-between gap-2 border-b border-border-subtle bg-surface-raised px-3 py-1.5">
        <span aria-live="polite" className="text-label text-fg-muted">
          {metadata ? labels.filteredCount(metadata.filteredCount, metadata.totalCount) : loading ? "Loading logs…" : labels.noResults}
        </span>
        {updating && <span className="text-label text-fg-subtle" role="status">Updating results…</span>}
        <DropdownMenu onOpenChange={setColumnsOpen} open={columnsOpen}>
          <DropdownTrigger
            render={
              <Button active={columnsOpen} aria-label="Customize columns" leadingIcon={Columns} size="sm" type="button" variant="ghost">
                Columns
              </Button>
            }
          />
          <DropdownContent align="end" className="w-72 p-1.5">
            <DropdownLabel className="px-1 pb-1.5 pt-0.5">Drag to reorder columns</DropdownLabel>
            <SortableCollection<ColumnCollectionItem>
              className="border-0 bg-transparent p-0 [&_[data-slot=sortable-collection-item]]:px-1 [&_[data-slot=sortable-collection-item]]:py-1"
              items={columnItems}
              onItemsChange={(items) => setColumnOrder(["select", ...items.map((item) => item.id)])}
              renderActions={(item) => (
                <Checkbox
                  aria-label={`Show ${item.title} column`}
                  checked={columnVisibility[item.id] !== false}
                  onCheckedChange={(checked) => setColumnVisibility((current) => ({ ...current, [item.id]: checked === true }))}
                />
              )}
            />
          </DropdownContent>
        </DropdownMenu>
      </div>

      {timelineData.length > 0 && (
        <div className="relative z-tooltip border-b border-border-subtle bg-surface-floating px-3 py-2">
          <div className="mb-1 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-label font-medium text-fg-default">{labels.requestTrend}</span>
            <div aria-hidden className="flex items-center gap-3 text-label text-fg-muted">
              {timelineSeries.map((series) => (
                <span className="flex items-center gap-1.5" key={series.dataKey}>
                  <span className="size-1.5 rounded-sm" style={{ backgroundColor: series.color }} />
                  {series.label}
                </span>
              ))}
            </div>
          </div>
          <TimeRangeHistogram
            ariaLabel={labels.timelineAriaLabel}
            chartClassName="h-14"
            data={timelineData}
            formatRange={formatTimelineRange}
            formatValue={(value) => labels.requestCount(value)}
            instruction={labels.timelineInstruction}
            onValueChange={onTimeRangeChange}
            rangeEndLabel={timelineDateFormatter.format(timelineData.at(-1)!.end)}
            rangeStartLabel={timelineDateFormatter.format(timelineData[0]!.start)}
            series={timelineSeries}
            value={timelineValue}
          />
        </div>
      )}

      {pendingLiveCount > 0 && (
        <div className={cn("absolute left-1/2 z-action -translate-x-1/2", timelineData.length > 0 ? "top-[9.5rem]" : "top-14")}>
          <Button onClick={applyPending} size="sm" type="button" variant="secondary">{labels.newRecords(pendingLiveCount)}</Button>
        </div>
      )}

      <div
        aria-colcount={visibleColumns.length}
        aria-busy={loading || updating || undefined}
        aria-label="HTTP request log table"
        aria-rowcount={(metadata?.filteredCount ?? rows.length) + 1 + (hasLiveBoundary ? 1 : 0)}
        className="relative min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        onScroll={onScroll}
        ref={viewportRef}
        role="grid"
        tabIndex={0}
      >
        <div className="sticky top-0 z-raised h-control-md min-w-max border-b border-border bg-surface-floating" role="row">
          <div className="grid h-full min-w-full" style={{ gridTemplateColumns }}>
            {visibleColumns.map((column) => {
              const field = sortForColumn(column);
              const direction = sort?.field === field ? sort?.direction : undefined;
              const SortIcon = direction === "asc" ? ChevronUp : direction === "desc" ? ChevronDown : ChevronsUpDown;
              const header = table.getFlatHeaders().find((candidate) => candidate.column.id === column);
              const headerFilter = renderHeaderFilter(column);
              return (
                <div
                  aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : field ? "none" : undefined}
                  className={cn(
                    "relative flex h-full min-w-0 items-center border-e border-border-subtle px-3 last:border-e-0",
                    column === "select" && "sticky left-0 z-control justify-center bg-surface-floating px-0",
                    column === firstDataColumn && "sticky left-[44px] z-control bg-surface-floating shadow-[1px_0_0_var(--border-subtle)]",
                  )}
                  data-sticky-column={column === "select" || column === firstDataColumn ? column : undefined}
                  key={column}
                  role="columnheader"
                >
                  {column === "select" ? (
                    <Checkbox aria-label="Select all loaded logs" checked={allLoadedSelected ? true : someLoadedSelected ? "indeterminate" : false} onCheckedChange={onToggleAllLoaded} />
                  ) : field && !headerFilter ? (
                    <div className="flex min-w-0 flex-1 items-center">
                      <Button className={cn("-ml-2 min-w-0 flex-1 whitespace-nowrap px-2", headerTitleClassName)} leadingIcon={infiniteLogFieldIcons[column]} onClick={() => updateSort(column)} size="sm" trailingIcon={SortIcon} type="button" variant="ghost">
                        {getColumnLabel(column, labels)}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center">
                      <span className={cn("flex min-w-0 flex-1 items-center gap-1.5", headerTitleClassName)}>
                        <ColumnHeaderIcon column={column} />
                        <span className="truncate">{getColumnLabel(column, labels)}</span>
                        {field && !headerFilter && <SortIcon aria-hidden className="size-3.5 shrink-0 text-fg-muted" />}
                      </span>
                      {headerFilter}
                    </div>
                  )}
                  {column !== "select" && (
                    <div
                      aria-label={`Resize ${getColumnLabel(column, labels)} column`}
                      className={cn("absolute inset-y-0 right-0 w-1 cursor-col-resize touch-none bg-transparent hover:bg-border-strong", table.getColumn(column)?.getIsResizing() && "bg-focus-ring")}
                      onDoubleClick={() => table.getColumn(column)?.resetSize()}
                      onMouseDown={header?.getResizeHandler()}
                      onTouchStart={header?.getResizeHandler()}
                      role="separator"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-48 place-items-center text-body text-fg-muted" role="status">Loading request logs…</div>
        ) : error && rows.length === 0 ? (
          errorContent ?? (
            <div className="grid min-h-48 place-items-center p-3">
              <Alert className="w-full max-w-md" status="danger">
                <AlertTitle>Unable to load logs.</AlertTitle>
                <AlertAction><Button onClick={onRetry} size="sm" type="button" variant="secondary">{labels.retry}</Button></AlertAction>
              </Alert>
            </div>
          )
        ) : rows.length === 0 ? (
          emptyContent ?? (
            <Empty announce className="min-h-48" density="compact" reason="no-results" scope="inline">
              <EmptyHeader><EmptyTitle>{labels.noResults}</EmptyTitle></EmptyHeader>
            </Empty>
          )
        ) : (
          <div className="relative min-w-max" role="rowgroup" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {renderedVirtualRows.map((virtualRow) => {
              if (hasLiveBoundary && virtualRow.index === liveBoundaryRecordIndex) {
                const label = labels.newRecordsAbove(liveBoundaryRecordIndex);
                return (
                  <div
                    aria-label={label}
                    aria-rowindex={virtualRow.index + 2}
                    className="absolute left-0 flex min-w-full items-center border-y border-border bg-surface-raised"
                    key={`live-boundary:${liveBoundary?.recordId ?? "unknown"}`}
                    role="row"
                    style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <div aria-colspan={visibleColumns.length} className="sticky left-0 flex h-full w-[min(32rem,100vw)] items-center gap-2 px-3" role="gridcell">
                      <span aria-hidden className="h-px w-6 shrink-0 bg-border-strong" />
                      <span aria-live="polite" className="whitespace-nowrap text-label font-medium text-fg-default">{label}</span>
                      <span aria-hidden className="h-px min-w-8 flex-1 bg-border-strong" />
                    </div>
                  </div>
                );
              }

              const recordIndex = recordIndexForVirtualIndex(virtualRow.index);
              const record = recordIndex === null ? undefined : rows[recordIndex];
              if (!record) return null;
              const isNewLiveRecord = hasLiveBoundary && recordIndex !== null && recordIndex < liveBoundaryRecordIndex;
              const isActiveRecord = activeRecordId === record.id;
              return (
                <div
                  aria-selected={isActiveRecord || undefined}
                  aria-rowindex={virtualRow.index + 2}
                  className={cn(
                    "group/log-row absolute left-0 grid min-w-full cursor-pointer border-b border-border-subtle/70 text-left outline-none transition-colors hover:bg-hover focus-visible:z-raised focus-visible:bg-selection focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
                    isNewLiveRecord && [newLiveRowBackgroundClassName, newLiveRowHoverClassName],
                    isActiveRecord && "z-content shadow-[inset_2px_0_0_var(--brand)]",
                  )}
                  data-detail-active={isActiveRecord ? "" : undefined}
                  data-live-new={isNewLiveRecord ? "" : undefined}
                  key={record.id}
                  onClick={(event) => onOpenRecord(record, event.currentTarget)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenRecord(record, event.currentTarget);
                    }
                  }}
                  role="row"
                  style={{ gridTemplateColumns, height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                  tabIndex={0}
                >
                  {visibleColumns.map((column) => (
                    <div
                      className={cn(
                        "flex min-w-0 items-center overflow-hidden border-e border-border-subtle px-3 last:border-e-0",
                        (column === "select" || column === firstDataColumn) && [
                          "sticky z-content",
                          stickyCellInteractionClassName,
                          column === "select" ? "left-0 justify-center px-0" : "left-[44px] shadow-[1px_0_0_var(--border-subtle)]",
                          isNewLiveRecord
                            ? [newLiveRowBackgroundClassName, stickyNewLiveRowHoverClassName]
                            : "bg-surface-floating",
                          column === "select" && isActiveRecord && "shadow-[inset_2px_0_0_var(--brand)]",
                        ],
                      )}
                      data-sticky-column={column === "select" || column === firstDataColumn ? column : undefined}
                      key={column}
                      role="gridcell"
                    >{renderCell(record, column)}</div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex min-h-control-lg items-center justify-center gap-2 border-t border-border-subtle p-2">
          {Boolean(error) && rows.length > 0 && <InlineNotice tone="danger" variant="emphasized"><InlineNoticeContent>Could not load more logs.</InlineNoticeContent></InlineNotice>}
          {hasNextPage ? <Button disabled={fetchingMore} onClick={onLoadMore} size="sm" type="button" variant="tertiary">{fetchingMore ? "Loading…" : labels.loadMore}</Button> : rows.length > 0 ? <span className="text-label text-fg-subtle">{labels.noMoreRows}</span> : null}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div aria-label="Selected log actions" className="absolute bottom-3 left-1/2 z-action flex items-center gap-2 rounded-xl border border-border bg-surface-overlay px-3 py-2 -translate-x-1/2">
          <span className="text-label text-fg-default">{labels.selectedCount(selectedIds.size)}</span>
          <Button iconOnly onClick={() => void copySelected()} size="sm" type="button" variant="ghost" aria-label={copied ? labels.copied : labels.copySelected}><Copy aria-hidden /></Button>
          <Button onClick={onClearSelection} size="sm" type="button" variant="tertiary">{labels.clear}</Button>
          <Check aria-hidden className="size-3.5 text-fg-success" />
          {copied && <span aria-live="polite" className="text-label text-fg-success">{labels.copied}</span>}
        </div>
      )}
    </section>
  );
});
