"use client";

import { Button } from "@zeron/ui/button";
import { FilterQueryInput, useFilterQueryHistory } from "@zeron/ui/filter-query-input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@zeron/ui/input-group";
import { MobileDrawer } from "@zeron/ui/mobile-drawer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@zeron/ui/resizable";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import type { TimeRangeHistogramRange } from "@zeron/ui/time-range-histogram";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createInfiniteLogMetadata,
  createStaticInfiniteLogDataSource,
  isInfiniteLogLiveDataSource,
  redactInfiniteLogRecord,
} from "./infinite-log-data-source";
import { useInfiniteLogController } from "./infinite-log-controller";
import { InfiniteLogDetail } from "./infinite-log-detail";
import { InfiniteLogFilters } from "./infinite-log-filters";
import { GenericInfiniteLogDetail } from "./infinite-log-generic-detail";
import { GenericInfiniteLogFilters } from "./infinite-log-generic-filters";
import { GenericInfiniteLogTableView } from "./infinite-log-generic-table-view";
import { isHttpInfiniteLogRecord, resolveInfiniteLogFields } from "./infinite-log-fields";
import { createMockLogDataSource } from "./infinite-log-mocks";
import { InfiniteLogTableView } from "./infinite-log-table-view";
import {
  createInfiniteLogFilterFields,
  createInfiniteLogQueryFields,
  fromInfiniteLogFilters,
  infiniteLogFreeText,
  toInfiniteLogFilters,
} from "./infinite-log-query-adapter";
import {
  defaultInfiniteLogFilters,
  defaultInfiniteLogState,
  type InfiniteLogBaseRecord,
  type InfiniteLogCommandContext,
  type InfiniteLogDataSource,
  type InfiniteLogRecord,
  type InfiniteLogStateUpdater,
  type InfiniteLogTableState,
  type InfiniteLogTableDefaultState,
  type InfiniteLogTableLabels,
  type InfiniteLogTableProps,
  type InfiniteLogToolbarContext,
} from "./infinite-log-types";

const defaultLabels: InfiniteLogTableLabels = {
  filters: "Filters",
  searchPlaceholder: "Search request ID, host, path, status, or message",
  outcome: "Outcome",
  status: "Status",
  method: "Method",
  region: "Region",
  timeRange: "Time range",
  timeRangePlaceholder: "Select time range",
  last30Minutes: "Last 30 minutes",
  lastHour: "Last hour",
  last12Hours: "Last 12 hours",
  lastDay: "Last day",
  last3Days: "Last 3 days",
  lastWeek: "Last week",
  last2Weeks: "Last 2 weeks",
  customTimeRange: "Custom",
  host: "Host",
  pathname: "Pathname",
  latency: "Latency",
  timingPhases: "Timing phases",
  apply: "Apply",
  cancel: "Cancel",
  clear: "Clear",
  clearAll: "Clear all",
  hideFilters: "Hide filters",
  showFilters: "Show filters",
  refresh: "Refresh",
  live: "Live",
  pauseLive: "Pause",
  loadMore: "Load more",
  noResults: "No request logs match these filters.",
  noMoreRows: "End of request log",
  retry: "Retry",
  copyJson: "Copy JSON",
  copySelected: "Copy selected JSON",
  copied: "Copied",
  previousRecord: "Previous request",
  nextRecord: "Next request",
  liveUnavailable: "Live updates are unavailable for this data source.",
  requestTrend: "Request trend",
  timelineAriaLabel: "Request trend time range",
  timelineInstruction: "Drag to select a time range",
  requestCount: (count) => `${count.toLocaleString()} ${count === 1 ? "request" : "requests"}`,
  newRecords: (count) => `${count} new ${count === 1 ? "request" : "requests"}`,
  newRecordsAbove: (count) => `${count} new ${count === 1 ? "request" : "requests"} above`,
  selectedCount: (count) => `${count} selected`,
  filteredCount: (filtered, total) => `${filtered.toLocaleString()} of ${total.toLocaleString()} requests`,
};

const genericLabelOverrides: Partial<InfiniteLogTableLabels> = {
  searchPlaceholder: "Search logs",
  noResults: "No logs match these filters.",
  noMoreRows: "End of log",
  requestTrend: "Log trend",
  timelineAriaLabel: "Log trend time range",
  previousRecord: "Previous record",
  nextRecord: "Next record",
  requestCount: (count) => `${count.toLocaleString()} ${count === 1 ? "record" : "records"}`,
  newRecords: (count) => `${count} new ${count === 1 ? "record" : "records"}`,
  newRecordsAbove: (count) => `${count} new ${count === 1 ? "record" : "records"} above`,
  filteredCount: (filtered, total) => `${filtered.toLocaleString()} of ${total.toLocaleString()} records`,
};

const filterCommitDelay = 200;

function filterKey(filters: InfiniteLogTableState["filters"]) {
  return JSON.stringify(filters);
}

function createInitialState(defaultState?: InfiniteLogTableDefaultState) {
  return {
    filters: {
      ...defaultInfiniteLogFilters,
      ...defaultState?.filters,
      timing: defaultState?.filters?.timing
        ? { ...defaultState?.filters.timing }
        : undefined,
    },
    sort: defaultState?.sort ?? defaultInfiniteLogState.sort,
    live: defaultState?.live ?? defaultInfiniteLogState.live,
  };
}

export function InfiniteLogTable<TRecord extends InfiniteLogBaseRecord = InfiniteLogRecord>({
  tableId = "infinite-log-table",
  dataSource: dataSourceProp,
  records,
  fields: fieldsProp,
  state: controlledState,
  defaultState,
  onStateChange,
  pageSize = 40,
  maxLiveRows = 2_000,
  enableLive = true,
  locale = "en-US",
  timeZone = "UTC",
  labels: labelsProp,
  commandSlot,
  toolbarActions,
  footerSlot,
  emptyState,
  errorState,
  redactRecord = redactInfiniteLogRecord,
  renderDetail,
  onRecordOpen,
  className,
  ...sectionProps
}: InfiniteLogTableProps<TRecord>) {
  if (records && dataSourceProp) {
    throw new Error("InfiniteLogTable accepts either records or dataSource, not both.");
  }

  const configuredFields = useMemo(
    () => fieldsProp ? resolveInfiniteLogFields([] as TRecord[], fieldsProp) : records ? resolveInfiniteLogFields(records) : undefined,
    [fieldsProp, records],
  );
  const defaultSource = useMemo(
    () => createMockLogDataSource() as unknown as InfiniteLogDataSource<TRecord>,
    [],
  );
  const recordSource = useMemo(
    () => (records ? createStaticInfiniteLogDataSource(records, configuredFields) : undefined),
    [configuredFields, records],
  );
  const dataSource = dataSourceProp ?? recordSource ?? defaultSource;
  const queryHistory = useFilterQueryHistory({ storageKey: `${tableId}:filter-query-history` });
  const [internalState, setInternalState] = useState<InfiniteLogTableState>(() => createInitialState(defaultState));
  const state = useMemo<InfiniteLogTableState>(() => {
    const candidate = controlledState ?? internalState;
    return candidate.sort ? candidate : { ...candidate, sort: defaultInfiniteLogState.sort };
  }, [controlledState, internalState]);
  const stateRef = useRef(state);
  const [filterDraft, setFilterDraft] = useState(state.filters);
  const filterDraftRef = useRef(filterDraft);
  const appliedFilterKey = useMemo(() => filterKey(state.filters), [state.filters]);
  const draftFilterKey = useMemo(() => filterKey(filterDraft), [filterDraft]);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<TRecord>();
  const [detailOpen, setDetailOpen] = useState(false);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const Refresh = useIcon("rotate-ccw");
  const Play = useIcon("play");
  const Pause = useIcon("pause");
  const Settings = useIcon("settings");
  const Search = useIcon("search");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = useCallback(
    (updater: InfiniteLogStateUpdater) => {
      const current = stateRef.current;
      const next = typeof updater === "function" ? updater(current) : updater;
      if (!controlledState) setInternalState(next);
      onStateChange?.(next);
    },
    [controlledState, onStateChange],
  );

  useEffect(() => {
    setFilterDraft((current) => filterKey(current) === appliedFilterKey ? current : state.filters);
  }, [appliedFilterKey, state.filters]);

  useEffect(() => {
    filterDraftRef.current = filterDraft;
  }, [filterDraft]);

  const updateFilters = useCallback((filters: typeof state.filters) => {
    setFilterDraft((current) => filterKey(current) === filterKey(filters) ? current : filters);
  }, []);

  const applyFilters = useCallback((filters: typeof state.filters) => {
    updateState((current) => {
      const filtersChanged = filterKey(current.filters) !== filterKey(filters);
      const shouldPauseLive = Boolean(filters.timeRange && current.live);
      if (!filtersChanged && !shouldPauseLive) return current;
      return { ...current, filters, live: shouldPauseLive ? false : current.live };
    });
  }, [updateState]);

  useEffect(() => {
    if (draftFilterKey === appliedFilterKey) return;
    const timer = globalThis.setTimeout(() => applyFilters(filterDraft), filterCommitDelay);
    return () => globalThis.clearTimeout(timer);
  }, [appliedFilterKey, applyFilters, draftFilterKey, filterDraft]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const onQueryReset = clearSelection;
  const controller = useInfiniteLogController({
    dataSource,
    enableLive: enableLive && Boolean(!records),
    fields: configuredFields,
    maxLiveRows,
    onQueryReset,
    pageSize,
    state,
  });
  const genericMode = Boolean(fieldsProp) || Boolean((records?.[0] ?? controller.rows[0]) && !isHttpInfiniteLogRecord(records?.[0] ?? controller.rows[0]));
  const fields = useMemo(
    () => resolveInfiniteLogFields(records ?? controller.rows, fieldsProp),
    [controller.rows, fieldsProp, records],
  );
  const labels = useMemo(
    () => ({ ...defaultLabels, ...(genericMode ? genericLabelOverrides : {}), ...labelsProp }),
    [genericMode, labelsProp],
  );
  const genericMetadata = useMemo(() => {
    if (!genericMode) return controller.metadata;
    const inferred = createInfiniteLogMetadata(controller.rows, state.filters, fields);
    return controller.metadata
      ? { ...inferred, ...controller.metadata, fieldFacets: controller.metadata.fieldFacets ?? inferred.fieldFacets }
      : inferred;
  }, [controller.metadata, controller.rows, fields, genericMode, state.filters]);
  const liveAvailable = enableLive && !records && isInfiniteLogLiveDataSource(dataSource);
  const liveActive = controller.liveEligible;
  const selectedRecords = useMemo(
    () => controller.rows.filter((record) => selectedIds.has(record.id)).map(redactRecord),
    [controller.rows, redactRecord, selectedIds],
  );
  const commandContext = useMemo<InfiniteLogCommandContext>(
    () => ({ state, updateState }),
    [state, updateState],
  );
  const toolbarContext = useMemo<InfiniteLogToolbarContext<TRecord>>(
    () => ({
      ...commandContext,
      clearSelection,
      loading: controller.loading || controller.refreshing,
      refresh: controller.refresh,
      selectedRecords,
    }),
    [clearSelection, commandContext, controller.loading, controller.refresh, controller.refreshing, selectedRecords],
  );

  const updateSort = useCallback((sort: typeof state.sort) => {
    updateState((current) => ({
      ...current,
      live: sort?.field === "timestamp" && sort.direction === "desc" ? current.live : false,
      sort,
    }));
  }, [updateState]);
  const toggleLive = useCallback(() => {
    if (!liveAvailable) return;
    updateState((current) => (
      liveActive
        ? { ...current, live: false }
        : {
            ...current,
            filters: { ...current.filters, timeRange: undefined },
            live: true,
            sort: { field: "timestamp", direction: "desc" },
      }
    ));
  }, [liveActive, liveAvailable, updateState]);
  const updateTimelineRange = useCallback((range: TimeRangeHistogramRange) => {
    const filters = {
      ...filterDraftRef.current,
      timeRange: {
        from: new Date(range.start).toISOString(),
        to: new Date(range.end).toISOString(),
      },
    };
    setFilterDraft(filters);
    updateState((current) => ({ ...current, filters, live: false }));
  }, [updateState]);
  const toggleRecord = useCallback((record: TRecord) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(record.id)) next.delete(record.id);
      else next.add(record.id);
      return next;
    });
  }, []);
  const toggleAllLoaded = useCallback(() => {
    setSelectedIds((current) => {
      const allSelected = controller.rows.length > 0 && controller.rows.every((record) => current.has(record.id));
      if (allSelected) return new Set();
      return new Set(controller.rows.map((record) => record.id));
    });
  }, [controller.rows]);
  const openRecord = useCallback((record: TRecord, trigger: HTMLElement) => {
    detailTrigger.current = trigger;
    const safeRecord = redactRecord(record);
    setDetailRecord(safeRecord);
    setDetailOpen(true);
    onRecordOpen?.(safeRecord);
  }, [onRecordOpen, redactRecord]);
  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailRecord(undefined);
    requestAnimationFrame(() => detailTrigger.current?.focus());
  }, []);
  const detailRecordIndex = detailRecord
    ? controller.rows.findIndex((record) => record.id === detailRecord.id)
    : -1;
  const navigateDetail = useCallback((offset: -1 | 1) => {
    if (!detailRecord) return;
    const currentIndex = controller.rows.findIndex((record) => record.id === detailRecord.id);
    const nextRecord = controller.rows[currentIndex + offset];
    if (!nextRecord) return;
    const safeRecord = redactRecord(nextRecord);
    setDetailRecord(safeRecord);
    onRecordOpen?.(safeRecord);
  }, [controller.rows, detailRecord, onRecordOpen, redactRecord]);
  const previousDetailDisabled = detailRecordIndex <= 0;
  const nextDetailDisabled = detailRecordIndex < 0 || detailRecordIndex >= controller.rows.length - 1;
  const emptyContent = useMemo(() => emptyState?.(commandContext), [commandContext, emptyState]);
  const errorContent = useMemo(
    () => errorState?.({ error: controller.error, retry: controller.retry }),
    [controller.error, controller.retry, errorState],
  );
  const queryFields = useMemo(() => createInfiniteLogFilterFields(controller.metadata), [controller.metadata]);
  const queryFieldConfigs = useMemo(() => createInfiniteLogQueryFields(timeZone, controller.metadata), [controller.metadata, timeZone]);
  const queryClauses = useMemo(() => fromInfiniteLogFilters(filterDraft), [filterDraft]);
  const activeRecordId = detailOpen ? detailRecord?.id : undefined;

  const tableView = genericMode ? <GenericInfiniteLogTableView
    activeRecordId={activeRecordId}
    error={controller.error}
    errorContent={errorContent}
    fetchingMore={controller.fetchingMore}
    fields={fields}
    hasNextPage={controller.hasNextPage}
    labels={labels}
    liveBoundary={controller.liveBoundary}
    loading={controller.loading}
    locale={locale}
    metadata={genericMetadata}
    onApplyPending={controller.applyPendingLiveRows}
    onAtTopChange={controller.setAtTop}
    onClearSelection={clearSelection}
    onLoadMore={controller.loadMore}
    onOpenRecord={openRecord}
    onRetry={controller.retry}
    onSortChange={updateSort}
    onTimeRangeChange={updateTimelineRange}
    onToggleAllLoaded={toggleAllLoaded}
    onToggleRecord={toggleRecord}
    emptyContent={emptyContent}
    pendingLiveCount={controller.pendingLiveCount}
    redactRecord={redactRecord}
    rows={controller.rows}
    selectedIds={selectedIds}
    sort={state.sort}
    tableId={tableId}
    timeZone={timeZone}
    timeRange={state.filters.timeRange}
    updating={controller.refreshing}
  /> : <InfiniteLogTableView
    activeRecordId={activeRecordId}
    error={controller.error}
    errorContent={errorContent}
    fetchingMore={controller.fetchingMore}
    hasNextPage={controller.hasNextPage}
    labels={labels}
    liveBoundary={controller.liveBoundary}
    loading={controller.loading}
    locale={locale}
    metadata={controller.metadata}
    onApplyPending={controller.applyPendingLiveRows}
    onAtTopChange={controller.setAtTop}
    onClearSelection={clearSelection}
    onLoadMore={controller.loadMore}
    onOpenRecord={openRecord as unknown as (record: InfiniteLogRecord, trigger: HTMLElement) => void}
    onRetry={controller.retry}
    onSortChange={updateSort}
    onTimeRangeChange={updateTimelineRange}
    onToggleAllLoaded={toggleAllLoaded}
    onToggleRecord={toggleRecord as unknown as (record: InfiniteLogRecord) => void}
    emptyContent={emptyContent}
    pendingLiveCount={controller.pendingLiveCount}
    redactRecord={redactRecord as unknown as (record: InfiniteLogRecord) => InfiniteLogRecord}
    rows={controller.rows as unknown as readonly InfiniteLogRecord[]}
    selectedIds={selectedIds}
    sort={state.sort}
    tableId={tableId}
    timeZone={timeZone}
    timeRange={state.filters.timeRange}
    updating={controller.refreshing}
  />;

  const detailView = detailRecord ? genericMode ? (
    <GenericInfiniteLogDetail
      fields={fields}
      labels={labels}
      locale={locale}
      nextDisabled={nextDetailDisabled}
      onClose={closeDetail}
      onNext={() => navigateDetail(1)}
      onPrevious={() => navigateDetail(-1)}
      previousDisabled={previousDetailDisabled}
      record={detailRecord}
      renderDetail={renderDetail}
      timeZone={timeZone}
    />
  ) : (
    <InfiniteLogDetail
      labels={labels}
      locale={locale}
      nextDisabled={nextDetailDisabled}
      onClose={closeDetail}
      onNext={() => navigateDetail(1)}
      onPrevious={() => navigateDetail(-1)}
      previousDisabled={previousDetailDisabled}
      record={detailRecord as unknown as InfiniteLogRecord}
      renderDetail={renderDetail as ((record: InfiniteLogRecord) => React.ReactNode) | undefined}
      timeZone={timeZone}
    />
  ) : null;

  return (
    <section
      {...sectionProps}
      className={cn("relative flex h-full min-h-0 w-full overflow-hidden border border-border bg-surface-base", className)}
    >
      <div className="hidden min-h-0 w-64 shrink-0 border-e border-border-subtle lg:flex">
        {genericMode ? (
          <GenericInfiniteLogFilters fields={fields} filters={filterDraft} labels={labels} locale={locale} metadata={genericMetadata} onChange={updateFilters} timeZone={timeZone} />
        ) : (
          <InfiniteLogFilters filters={filterDraft} labels={labels} locale={locale} metadata={controller.metadata} onChange={updateFilters} timeZone={timeZone} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-nowrap items-center gap-2 border-b border-border-subtle bg-surface-base px-3 py-2">
          <Button aria-label={filtersOpen ? labels.hideFilters : labels.showFilters} className="lg:hidden" iconOnly onClick={() => setFiltersOpen(true)} ref={filterTrigger} size="sm" type="button" variant="ghost"><Settings aria-hidden /></Button>
          {commandSlot ? commandSlot(commandContext) : genericMode ? (
            <InputGroup className="min-w-0" size="md">
              <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
              <InputGroupInput
                aria-label={labels.filters}
                onChange={(event) => updateFilters({ ...filterDraftRef.current, query: event.target.value })}
                placeholder={labels.searchPlaceholder}
                value={filterDraft.query}
              />
            </InputGroup>
          ) : (
            <FilterQueryInput
              className="min-w-0 border-border hover:border-border"
              commitMode="submit"
              fields={queryFields}
              filters={queryClauses}
              freeText={infiniteLogFreeText}
              historySchemaVersion="infinite-log-v1"
              loading={controller.loading || controller.refreshing}
              locale={locale}
              messages={{ filters: labels.filters, placeholder: labels.searchPlaceholder }}
              onFiltersChange={(clauses) => updateFilters(toInfiniteLogFilters(clauses, filterDraftRef.current))}
              queryFields={queryFieldConfigs}
              size="md"
              {...queryHistory}
            />
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button aria-label={labels.refresh} disabled={controller.refreshing} iconOnly onClick={controller.refresh} size="sm" type="button" variant="tertiary"><Refresh aria-hidden /></Button>
            <Button aria-describedby={!liveAvailable ? "infinite-log-live-unavailable" : undefined} className="shrink-0 whitespace-nowrap" disabled={!liveAvailable} leadingIcon={liveActive ? Pause : Play} onClick={toggleLive} size="sm" type="button" variant={liveActive ? "neutral" : "primary"}>
              {liveActive ? labels.pauseLive : labels.live}
            </Button>
            {!liveAvailable && <span className="sr-only" id="infinite-log-live-unavailable">{labels.liveUnavailable}</span>}
            {toolbarActions?.(toolbarContext)}
          </div>
        </header>
        <ResizablePanelGroup
          className="min-h-0 flex-1"
          id={`${tableId}-workspace`}
          orientation="horizontal"
          resizeTargetMinimumSize={{ coarse: 32, fine: 12 }}
        >
          <ResizablePanel className="size-full min-w-0" id={`${tableId}-results`} minSize="16rem">
            <div className="flex h-full w-full min-h-0 min-w-0 flex-col">
              {tableView}
              {footerSlot}
            </div>
          </ResizablePanel>
          {detailOpen && detailView ? (
            <>
              <ResizableHandle aria-label="Resize log details" id={`${tableId}-detail-handle`} withHandle />
              <ResizablePanel
                className="size-full"
                defaultSize="320px"
                groupResizeBehavior="preserve-pixel-size"
                id={`${tableId}-detail`}
                maxSize="50%"
                minSize="15rem"
              >
                {detailView}
              </ResizablePanel>
            </>
          ) : null}
        </ResizablePanelGroup>
      </div>

      <MobileDrawer
        ariaLabel={labels.filters}
        onClose={() => setFiltersOpen(false)}
        open={filtersOpen}
        panelClassName="w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden p-0"
        side="start"
        triggerRef={filterTrigger}
      >
        <div className="h-full w-full bg-surface-base">
          {genericMode ? (
            <GenericInfiniteLogFilters fields={fields} filters={filterDraft} labels={labels} locale={locale} metadata={genericMetadata} onChange={updateFilters} timeZone={timeZone} />
          ) : (
            <InfiniteLogFilters filters={filterDraft} labels={labels} locale={locale} metadata={controller.metadata} onChange={updateFilters} timeZone={timeZone} />
          )}
        </div>
      </MobileDrawer>
    </section>
  );
}
