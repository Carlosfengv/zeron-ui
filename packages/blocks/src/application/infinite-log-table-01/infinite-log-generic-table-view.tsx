"use client";

import { type ColumnDef, type ColumnSizingState, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Alert, AlertAction, AlertTitle } from "@zeron/ui/alert";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import { DropdownContent, DropdownLabel, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Empty, EmptyHeader, EmptyTitle } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { SortableCollection, type SortableCollectionItem } from "@zeron/ui/sortable-collection";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { TimeRangeHistogram, type TimeRangeHistogramRange, type TimeRangeHistogramSeries } from "@zeron/ui/time-range-histogram";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getInfiniteLogFieldValue } from "./infinite-log-fields";
import { formatInfiniteLogDateTime } from "./infinite-log-time-range";
import type {
  InfiniteLogBaseRecord,
  InfiniteLogField,
  InfiniteLogLiveBoundary,
  InfiniteLogMetadata,
  InfiniteLogSort,
  InfiniteLogTableLabels,
  InfiniteLogTimeRange,
} from "./infinite-log-types";

const LOG_ROW_HEIGHT = 32;
const stickyCellInteractionClassName = "isolate before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-hover before:opacity-0 before:content-[''] group-hover/log-row:before:opacity-100 group-focus-visible/log-row:before:bg-selection group-focus-visible/log-row:before:opacity-100 [&>*]:relative [&>*]:z-content";

interface ColumnItem extends SortableCollectionItem {
  id: string;
  title: string;
}

interface GenericInfiniteLogTableViewProps<TRecord extends InfiniteLogBaseRecord> {
  tableId: string;
  activeRecordId?: string;
  rows: readonly TRecord[];
  fields: readonly InfiniteLogField<TRecord>[];
  metadata?: InfiniteLogMetadata;
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
  redactRecord: (record: TRecord) => TRecord;
  onSortChange: (sort?: InfiniteLogSort) => void;
  onTimeRangeChange: (range: TimeRangeHistogramRange) => void;
  onToggleRecord: (record: TRecord) => void;
  onToggleAllLoaded: () => void;
  onClearSelection: () => void;
  onOpenRecord: (record: TRecord, trigger: HTMLElement) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onApplyPending: () => void;
  onAtTopChange: (atTop: boolean) => void;
  emptyContent?: ReactNode;
  errorContent?: ReactNode;
}

function badgeColor(tone: ReturnType<NonNullable<InfiniteLogField["badgeTone"]>>) {
  if (tone === "success") return "green" as const;
  if (tone === "warning") return "yellow" as const;
  if (tone === "danger") return "red" as const;
  if (tone === "info") return "blue" as const;
  return "gray" as const;
}

function renderValue<TRecord extends InfiniteLogBaseRecord>(
  field: InfiniteLogField<TRecord>,
  record: TRecord,
  locale: string,
  timeZone: string,
) {
  const value = getInfiniteLogFieldValue(record, field);
  if (field.renderCell) return field.renderCell(value, record);
  if (field.formatValue) return field.formatValue(value, record);
  if (value === null || value === undefined || value === "") return <span className="text-fg-subtle">—</span>;
  if (field.type === "datetime") {
    return <time className="block truncate font-mono text-label tabular-nums text-fg-muted" dateTime={String(value)} title={String(value)}>{formatInfiniteLogDateTime(String(value), timeZone)}</time>;
  }
  if (field.type === "badge") {
    const tone = field.badgeTone?.(value, record) ?? "neutral";
    return <Badge color={badgeColor(tone)} size="sm">{String(value)}</Badge>;
  }
  if (field.type === "boolean") return <Badge color={value ? "green" : "gray"} size="sm">{String(value)}</Badge>;
  if (field.type === "number") return <span className="font-mono text-label tabular-nums text-fg-default">{new Intl.NumberFormat(locale).format(Number(value))}</span>;
  if (field.type === "json" || typeof value === "object") {
    const serialized = JSON.stringify(value);
    return <span className="block truncate font-mono text-label text-fg-muted" title={serialized}>{serialized}</span>;
  }
  return <span className="block truncate text-body text-fg-default" title={String(value)}>{String(value)}</span>;
}

export const GenericInfiniteLogTableView = memo(function GenericInfiniteLogTableView<
  TRecord extends InfiniteLogBaseRecord,
>({
  tableId: _tableId,
  activeRecordId,
  rows,
  fields,
  metadata,
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
  redactRecord,
  onSortChange,
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
}: GenericInfiniteLogTableViewProps<TRecord>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const Copy = useIcon("copy");
  const Check = useIcon("check");
  const Columns = useIcon("settings");
  const ChevronUp = useIcon("chevron-up");
  const ChevronDown = useIcon("chevron-down");
  const ChevronsUpDown = useIcon("chevrons-up-down");
  const fieldIds = useMemo(() => fields.map((field) => field.id), [fields]);
  const fieldById = useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);
  const [columnOrder, setColumnOrder] = useState<string[]>(fieldIds);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => Object.fromEntries(fields.map((field) => [field.id, !field.hidden])));
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setColumnOrder((current) => [
      ...current.filter((id) => fieldIds.includes(id)),
      ...fieldIds.filter((id) => !current.includes(id)),
    ]);
    setColumnVisibility((current) => ({
      ...Object.fromEntries(fields.map((field) => [field.id, current[field.id] ?? !field.hidden])),
    }));
  }, [fieldIds, fields]);

  const columns = useMemo<ColumnDef<TRecord>[]>(() => fields.map((field) => ({
    id: field.id,
    accessorFn: (record) => getInfiniteLogFieldValue(record, field),
    enableResizing: true,
    minSize: field.minWidth ?? 88,
    size: field.width ?? 180,
  })), [fields]);
  const table = useReactTable({
    columns,
    data: rows as TRecord[],
    getCoreRowModel: getCoreRowModel(),
    getRowId: (record) => record.id,
    manualSorting: true,
    onColumnOrderChange: (updater) => setColumnOrder((current) => typeof updater === "function" ? updater(current) : updater),
    onColumnVisibilityChange: (updater) => setColumnVisibility((current) => typeof updater === "function" ? updater(current) : updater),
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange",
    state: { columnOrder, columnSizing, columnVisibility },
  });
  const visibleFields = table.getVisibleLeafColumns().map((column) => fieldById.get(column.id)).filter((field): field is InfiniteLogField<TRecord> => Boolean(field));
  const fluidFieldId = visibleFields.at(-1)?.id;
  const gridTemplateColumns = `44px ${visibleFields.map((field) => {
    const size = table.getColumn(field.id)?.getSize() ?? field.width ?? 180;
    return field.id === fluidFieldId ? `minmax(${size}px, 1fr)` : `${size}px`;
  }).join(" ")}`;
  const columnItems = columnOrder.flatMap((id) => {
    const field = fieldById.get(id);
    return field ? [{ id, title: field.label ?? id, removable: false } satisfies ColumnItem] : [];
  });

  const timelineDateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit", month: "short", timeZone,
  }), [locale, timeZone]);
  const seriesKeys = useMemo(() => [...new Set((metadata?.timeline?.buckets ?? []).flatMap((bucket) => Object.keys(bucket.counts)))], [metadata?.timeline?.buckets]);
  const series = useMemo<readonly TimeRangeHistogramSeries[]>(() => seriesKeys.map((key, index) => ({
    dataKey: key,
    label: key === "records" ? "Records" : key,
    color: ["var(--brand)", "var(--warning-border)", "var(--danger-border)", "var(--info-border)"][index % 4]!,
    inactiveColor: "var(--surface-raised)",
  })), [seriesKeys]);
  const timelineData = useMemo(() => (metadata?.timeline?.buckets ?? []).flatMap((bucket) => {
    const start = Date.parse(bucket.start);
    const end = Date.parse(bucket.end);
    return Number.isFinite(start) && Number.isFinite(end) && end > start
      ? [{ start, end, label: `${timelineDateFormatter.format(start)} – ${timelineDateFormatter.format(end)}`, ...bucket.counts }]
      : [];
  }), [metadata?.timeline?.buckets, timelineDateFormatter]);
  const timelineValue = useMemo<TimeRangeHistogramRange>(() => {
    const domain = { start: timelineData[0]?.start ?? 0, end: timelineData.at(-1)?.end ?? 0 };
    if (!timeRange) return domain;
    const start = Date.parse(timeRange.from);
    const end = Date.parse(timeRange.to);
    return Number.isFinite(start) && Number.isFinite(end) && start < end ? { start, end } : domain;
  }, [timeRange, timelineData]);

  const liveBoundaryRecordIndex = useMemo(() => {
    if (!liveBoundary) return -1;
    const exact = rows.findIndex((record) => record.id === liveBoundary.recordId);
    if (exact >= 0) return exact;
    const boundaryTime = Date.parse(liveBoundary.timestamp);
    return Number.isFinite(boundaryTime) ? rows.findIndex((record) => Date.parse(record.timestamp) <= boundaryTime) : -1;
  }, [liveBoundary, rows]);
  const hasLiveBoundary = liveBoundaryRecordIndex > 0;
  const virtualCount = rows.length + (hasLiveBoundary ? 1 : 0);
  const recordIndexForVirtualIndex = useCallback((index: number) => {
    if (hasLiveBoundary && index === liveBoundaryRecordIndex) return null;
    return hasLiveBoundary && index > liveBoundaryRecordIndex ? index - 1 : index;
  }, [hasLiveBoundary, liveBoundaryRecordIndex]);
  const virtualizer = useVirtualizer({
    count: virtualCount,
    estimateSize: () => LOG_ROW_HEIGHT,
    getItemKey: (index) => {
      if (hasLiveBoundary && index === liveBoundaryRecordIndex) return `live-boundary:${liveBoundary?.recordId}`;
      const recordIndex = recordIndexForVirtualIndex(index);
      return recordIndex === null ? index : rows[recordIndex]?.id ?? index;
    },
    getScrollElement: () => viewportRef.current,
    initialRect: { height: 480, width: 1 },
    overscan: 10,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const renderedRows = virtualRows.length > 0 ? virtualRows : Array.from({ length: Math.min(virtualCount, 20) }, (_, index) => ({ index, size: LOG_ROW_HEIGHT, start: index * LOG_ROW_HEIGHT }));
  const allSelected = rows.length > 0 && rows.every((record) => selectedIds.has(record.id));
  const someSelected = rows.some((record) => selectedIds.has(record.id));

  useEffect(() => {
    const last = virtualRows.at(-1);
    const recordIndex = last ? recordIndexForVirtualIndex(last.index) : null;
    if (recordIndex !== null && hasNextPage && !loading && !fetchingMore && recordIndex >= rows.length - 9) onLoadMore();
  }, [fetchingMore, hasNextPage, loading, onLoadMore, recordIndexForVirtualIndex, rows.length, virtualRows]);

  const copySelected = async () => {
    try {
      const selected = rows.filter((record) => selectedIds.has(record.id)).map(redactRecord);
      await navigator.clipboard?.writeText(JSON.stringify(selected, null, 2));
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2_000);
    } catch { setCopied(false); }
  };

  return (
    <section aria-label="Log results" className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border-subtle bg-surface-floating">
      <div className="flex min-h-control-lg items-center justify-between gap-2 border-b border-border-subtle bg-surface-raised px-3 py-1.5">
        <span aria-live="polite" className="text-label text-fg-muted">{metadata ? labels.filteredCount(metadata.filteredCount, metadata.totalCount) : loading ? "Loading logs…" : labels.noResults}</span>
        {updating && <span className="text-label text-fg-subtle" role="status">Updating results…</span>}
        <DropdownMenu onOpenChange={setColumnsOpen} open={columnsOpen}>
          <DropdownTrigger render={<Button active={columnsOpen} aria-label="Customize columns" leadingIcon={Columns} size="sm" type="button" variant="ghost">Columns</Button>} />
          <DropdownContent align="end" className="w-72 p-1.5">
            <DropdownLabel className="px-1 pb-1.5 pt-0.5">Drag to reorder columns</DropdownLabel>
            <SortableCollection<ColumnItem>
              className="border-0 bg-transparent p-0"
              items={columnItems}
              onItemsChange={(items) => setColumnOrder(items.map((item) => item.id))}
              renderActions={(item) => <Checkbox aria-label={`Show ${item.title} column`} checked={columnVisibility[item.id] !== false} onCheckedChange={(checked) => setColumnVisibility((current) => ({ ...current, [item.id]: checked === true }))} />}
            />
          </DropdownContent>
        </DropdownMenu>
      </div>

      {timelineData.length > 0 && series.length > 0 && (
        <div className="border-b border-border-subtle bg-surface-floating px-3 py-2">
          <div className="mb-1 flex items-center gap-4"><span className="text-label font-medium text-fg-default">{labels.requestTrend}</span></div>
          <TimeRangeHistogram
            ariaLabel={labels.timelineAriaLabel}
            chartClassName="h-14"
            data={timelineData}
            formatRange={(range) => `${timelineDateFormatter.format(range.start)} – ${timelineDateFormatter.format(range.end)}`}
            formatValue={(value) => labels.requestCount(value)}
            instruction={labels.timelineInstruction}
            onValueChange={onTimeRangeChange}
            rangeEndLabel={timelineDateFormatter.format(timelineData.at(-1)!.end)}
            rangeStartLabel={timelineDateFormatter.format(timelineData[0]!.start)}
            series={series}
            value={timelineValue}
          />
        </div>
      )}

      {pendingLiveCount > 0 && <div className="absolute left-1/2 top-14 z-action -translate-x-1/2"><Button onClick={() => { onApplyPending(); requestAnimationFrame(() => viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" })); }} size="sm" type="button" variant="secondary">{labels.newRecords(pendingLiveCount)}</Button></div>}

      <div aria-colcount={visibleFields.length + 1} aria-busy={loading || updating || undefined} aria-label="Log table" aria-rowcount={(metadata?.filteredCount ?? rows.length) + 1} className="relative min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" onScroll={() => onAtTopChange((viewportRef.current?.scrollTop ?? 0) < 8)} ref={viewportRef} role="grid" tabIndex={0}>
        <div className="sticky top-0 z-raised grid h-control-md min-w-max border-b border-border bg-surface-floating" role="row" style={{ gridTemplateColumns }}>
          <div className="sticky left-0 z-control flex items-center justify-center border-e border-border-subtle bg-surface-floating" data-sticky-column="select" role="columnheader"><Checkbox aria-label="Select all loaded logs" checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={onToggleAllLoaded} /></div>
          {visibleFields.map((field, index) => {
            const direction = sort?.field === field.id ? sort.direction : undefined;
            const SortIcon = direction === "asc" ? ChevronUp : direction === "desc" ? ChevronDown : ChevronsUpDown;
            const header = table.getFlatHeaders().find((candidate) => candidate.column.id === field.id);
            return (
              <div aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : field.sortable ? "none" : undefined} className={cn("relative flex h-full min-w-0 items-center border-e border-border-subtle px-3", index === 0 && "sticky left-[44px] z-control bg-surface-floating shadow-[1px_0_0_var(--border-subtle)]")} data-sticky-column={index === 0 ? field.id : undefined} key={field.id} role="columnheader">
                {field.sortable ? <Button className="-ml-2 whitespace-nowrap px-2 text-body font-medium text-fg-default" onClick={() => onSortChange(sort?.field === field.id ? { field: field.id, direction: sort.direction === "desc" ? "asc" : "desc" } : { field: field.id, direction: "desc" })} size="sm" trailingIcon={SortIcon} type="button" variant="ghost">{field.label ?? field.id}</Button> : <span className="truncate text-body font-medium text-fg-default">{field.label ?? field.id}</span>}
                <div aria-label={`Resize ${field.label ?? field.id} column`} className="absolute inset-y-0 right-0 w-1 cursor-col-resize touch-none hover:bg-border-strong" onDoubleClick={() => table.getColumn(field.id)?.resetSize()} onMouseDown={header?.getResizeHandler()} onTouchStart={header?.getResizeHandler()} role="separator" />
              </div>
            );
          })}
        </div>

        {loading ? <div className="grid min-h-48 place-items-center text-body text-fg-muted" role="status">Loading logs…</div> : error && rows.length === 0 ? errorContent ?? <div className="grid min-h-48 place-items-center p-3"><Alert className="w-full max-w-md" status="danger"><AlertTitle>Unable to load logs.</AlertTitle><AlertAction><Button onClick={onRetry} size="sm" type="button" variant="secondary">{labels.retry}</Button></AlertAction></Alert></div> : rows.length === 0 ? emptyContent ?? <Empty announce className="min-h-48" density="compact" reason="no-results" scope="inline"><EmptyHeader><EmptyTitle>{labels.noResults}</EmptyTitle></EmptyHeader></Empty> : (
          <div className="relative min-w-max" role="rowgroup" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {renderedRows.map((virtualRow) => {
              if (hasLiveBoundary && virtualRow.index === liveBoundaryRecordIndex) {
                const label = labels.newRecordsAbove(liveBoundaryRecordIndex);
                return <div aria-label={label} aria-rowindex={virtualRow.index + 2} className="absolute left-0 flex min-w-full items-center border-y border-border bg-surface-raised px-3" key={`boundary:${liveBoundary?.recordId}`} role="row" style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}>{label}</div>;
              }
              const recordIndex = recordIndexForVirtualIndex(virtualRow.index);
              const record = recordIndex === null ? undefined : rows[recordIndex];
              if (!record) return null;
              const isActiveRecord = activeRecordId === record.id;
              return (
                <div aria-rowindex={virtualRow.index + 2} aria-selected={isActiveRecord || undefined} className={cn("group/log-row absolute left-0 grid min-w-full cursor-pointer border-b border-border-subtle/70 outline-none transition-colors hover:bg-hover focus-visible:bg-selection focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring", isActiveRecord && "z-content shadow-[inset_2px_0_0_var(--brand)]")} data-detail-active={isActiveRecord ? "" : undefined} key={record.id} onClick={(event) => onOpenRecord(record, event.currentTarget)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpenRecord(record, event.currentTarget); } }} role="row" style={{ gridTemplateColumns, height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }} tabIndex={0}>
                  <div className={cn("sticky left-0 z-content flex items-center justify-center border-e border-border-subtle bg-surface-floating", stickyCellInteractionClassName, isActiveRecord && "shadow-[inset_2px_0_0_var(--brand)]")} data-sticky-column="select" role="gridcell"><Checkbox aria-label={`Select ${record.id}`} checked={selectedIds.has(record.id)} onCheckedChange={() => onToggleRecord(record)} onClick={(event) => event.stopPropagation()} /></div>
                  {visibleFields.map((field, index) => <div className={cn("flex min-w-0 items-center overflow-hidden border-e border-border-subtle px-3", index === 0 && ["sticky left-[44px] z-content bg-surface-floating shadow-[1px_0_0_var(--border-subtle)]", stickyCellInteractionClassName])} data-sticky-column={index === 0 ? field.id : undefined} key={field.id} role="gridcell">{renderValue(field, record, locale, timeZone)}</div>)}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex min-h-control-lg items-center justify-center gap-2 border-t border-border-subtle p-2">{Boolean(error) && rows.length > 0 && <InlineNotice tone="danger" variant="emphasized"><InlineNoticeContent>Could not load more logs.</InlineNoticeContent></InlineNotice>}{hasNextPage ? <Button disabled={fetchingMore} onClick={onLoadMore} size="sm" type="button" variant="tertiary">{fetchingMore ? "Loading…" : labels.loadMore}</Button> : rows.length > 0 ? <span className="text-label text-fg-subtle">{labels.noMoreRows}</span> : null}</div>
      </div>

      {selectedIds.size > 0 && <div aria-label="Selected log actions" className="absolute bottom-3 left-1/2 z-action flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-surface-overlay px-3 py-2"><span className="text-label text-fg-default">{labels.selectedCount(selectedIds.size)}</span><Button aria-label={copied ? labels.copied : labels.copySelected} iconOnly onClick={() => void copySelected()} size="sm" type="button" variant="ghost"><Copy aria-hidden /></Button><Button onClick={onClearSelection} size="sm" type="button" variant="tertiary">{labels.clear}</Button><Check aria-hidden className="size-3.5 text-fg-success" /></div>}
    </section>
  );
}) as <TRecord extends InfiniteLogBaseRecord>(props: GenericInfiniteLogTableViewProps<TRecord>) => ReactNode;
