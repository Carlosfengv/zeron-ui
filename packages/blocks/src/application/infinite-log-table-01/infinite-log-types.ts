import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface InfiniteLogBaseRecord {
  id: string;
  timestamp: string;
  [field: string]: unknown;
}

export type HttpLogOutcome = "success" | "warning" | "error";

export type LogMethod =
  | "GET"
  | "HEAD"
  | "OPTIONS"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export interface LogTiming {
  dns: number;
  connection: number;
  tls: number;
  ttfb: number;
  transfer: number;
}

export interface InfiniteLogRecord extends InfiniteLogBaseRecord {
  outcome: HttpLogOutcome;
  status: number;
  method: LogMethod;
  host: string;
  pathname: string;
  latency: number;
  region: string;
  timing: LogTiming;
  headers: Readonly<Record<string, string>>;
  traceId?: string;
  spanId?: string;
  message?: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface NumericRange {
  min?: number;
  max?: number;
}

export interface InfiniteLogTimeRange {
  from: string;
  to: string;
}

export interface InfiniteLogFilters {
  query: string;
  timeRange?: InfiniteLogTimeRange;
  outcomes: readonly HttpLogOutcome[];
  statuses: readonly number[];
  methods: readonly LogMethod[];
  regions: readonly string[];
  host: string;
  pathname: string;
  latency?: NumericRange;
  timing?: Partial<Record<keyof LogTiming, NumericRange>>;
  /** Field filters used by schema-driven log tables. */
  fields?: Readonly<Record<string, InfiniteLogFieldFilter>>;
}

export type InfiniteLogFieldFilter =
  | { operator: "contains"; value: string }
  | { operator: "isAnyOf"; value: readonly (string | number | boolean)[] }
  | { operator: "isBetween"; value: NumericRange };

export type InfiniteLogFieldType =
  | "text"
  | "number"
  | "boolean"
  | "datetime"
  | "badge"
  | "json";

export type InfiniteLogFieldFilterType =
  | "text"
  | "multiSelect"
  | "numberRange"
  | "none";

export interface InfiniteLogField<TRecord extends InfiniteLogBaseRecord = InfiniteLogBaseRecord> {
  id: string;
  label?: string;
  type?: InfiniteLogFieldType;
  filter?: InfiniteLogFieldFilterType;
  sortable?: boolean;
  hidden?: boolean;
  width?: number;
  minWidth?: number;
  accessor?: (record: TRecord) => unknown;
  renderCell?: (value: unknown, record: TRecord) => ReactNode;
  formatValue?: (value: unknown, record: TRecord) => string;
  badgeTone?: (value: unknown, record: TRecord) => "neutral" | "info" | "success" | "warning" | "danger";
}

export interface InfiniteLogSort {
  field: string;
  direction: "asc" | "desc";
}

export interface InfiniteLogTableState {
  filters: InfiniteLogFilters;
  sort?: InfiniteLogSort;
  live: boolean;
}

export const defaultInfiniteLogFilters: InfiniteLogFilters = {
  query: "",
  outcomes: [],
  statuses: [],
  methods: [],
  regions: [],
  host: "",
  pathname: "",
  fields: {},
};

export const defaultInfiniteLogState: InfiniteLogTableState = {
  filters: defaultInfiniteLogFilters,
  sort: { field: "timestamp", direction: "desc" },
  live: true,
};

export interface LogFacetValue<T extends string | number> {
  value: T;
  count: number;
}

export interface LogValueFacet<T extends string | number> {
  values: readonly LogFacetValue<T>[];
}

export interface LogRangeFacet {
  min?: number;
  max?: number;
}

export interface InfiniteLogTimelineBucket {
  start: string;
  end: string;
  counts: Readonly<Record<string, number>>;
}

export interface InfiniteLogTimeline {
  buckets: readonly InfiniteLogTimelineBucket[];
}

export interface InfiniteLogMetadata {
  totalCount: number;
  filteredCount: number;
  /** Aggregate trend for the current non-time filters. */
  timeline?: InfiniteLogTimeline;
  facets: {
    outcomes: LogValueFacet<HttpLogOutcome>;
    statuses: LogValueFacet<number>;
    methods: LogValueFacet<LogMethod>;
    regions: LogValueFacet<string>;
    hosts?: LogValueFacet<string>;
    pathnames?: LogValueFacet<string>;
    latency: LogRangeFacet;
    timing: Readonly<Record<keyof LogTiming, LogRangeFacet>>;
  };
  fieldFacets?: Readonly<Record<string, InfiniteLogFieldFacet>>;
}

export interface InfiniteLogFieldFacet {
  values?: readonly LogFacetValue<string | number>[];
  min?: number;
  max?: number;
}

export interface InfiniteLogPageRequest {
  cursor?: string;
  pageSize: number;
  filters: InfiniteLogFilters;
  sort?: InfiniteLogSort;
}

export interface InfiniteLogPage<TRecord extends InfiniteLogBaseRecord = InfiniteLogRecord> {
  rows: readonly TRecord[];
  metadata?: InfiniteLogMetadata;
  snapshotRevision: string;
  newerCheckpoint?: string;
  nextCursor?: string;
}

export interface InfiniteLogLiveBatch<TRecord extends InfiniteLogBaseRecord = InfiniteLogRecord> {
  rows: readonly TRecord[];
  metadata?: InfiniteLogMetadata;
  checkpoint?: string;
}

export interface InfiniteLogLiveBoundary {
  recordId: string;
  timestamp: string;
}

export type InfiniteLogMetadataLoader = (
  request: Pick<InfiniteLogPageRequest, "filters" | "sort">,
  options: { signal: AbortSignal },
) => Promise<InfiniteLogMetadata>;

export type InfiniteLogSubscriber<TRecord extends InfiniteLogBaseRecord = InfiniteLogRecord> = (options: {
  after?: string;
  filters: InfiniteLogFilters;
  sort: { field: "timestamp"; direction: "desc" };
  onBatch: (batch: InfiniteLogLiveBatch<TRecord>) => void;
  onError: (error: unknown) => void;
}) => () => void;

export type InfiniteLogDataSource<TRecord extends InfiniteLogBaseRecord = InfiniteLogRecord> = {
  loadPage(
    request: InfiniteLogPageRequest,
    options: { signal: AbortSignal },
  ): Promise<InfiniteLogPage<TRecord>>;
} &
  (
    | {
        subscribeNewer?: undefined;
        loadMetadata?: InfiniteLogMetadataLoader;
      }
    | {
        subscribeNewer: InfiniteLogSubscriber<TRecord>;
        loadMetadata: InfiniteLogMetadataLoader;
      }
  );

export interface InfiniteLogTableLabels {
  filters: string;
  searchPlaceholder: string;
  outcome: string;
  status: string;
  method: string;
  region: string;
  timeRange: string;
  timeRangePlaceholder: string;
  last30Minutes: string;
  lastHour: string;
  last12Hours: string;
  lastDay: string;
  last3Days: string;
  lastWeek: string;
  last2Weeks: string;
  customTimeRange: string;
  host: string;
  pathname: string;
  latency: string;
  timingPhases: string;
  apply: string;
  cancel: string;
  clear: string;
  clearAll: string;
  hideFilters: string;
  showFilters: string;
  refresh: string;
  live: string;
  pauseLive: string;
  loadMore: string;
  noResults: string;
  noMoreRows: string;
  retry: string;
  copyJson: string;
  copySelected: string;
  copied: string;
  previousRecord: string;
  nextRecord: string;
  liveUnavailable: string;
  requestTrend: string;
  timelineAriaLabel: string;
  timelineInstruction: string;
  requestCount: (count: number) => string;
  newRecords: (count: number) => string;
  newRecordsAbove: (count: number) => string;
  selectedCount: (count: number) => string;
  filteredCount: (filtered: number, total: number) => string;
}

export interface InfiniteLogTableDefaultState {
  filters?: Partial<InfiniteLogFilters>;
  sort?: InfiniteLogSort;
  live?: boolean;
}

export type InfiniteLogStateUpdater =
  | InfiniteLogTableState
  | ((previous: InfiniteLogTableState) => InfiniteLogTableState);

export interface InfiniteLogCommandContext {
  state: InfiniteLogTableState;
  updateState: (updater: InfiniteLogStateUpdater) => void;
}

export interface InfiniteLogToolbarContext<TRecord extends InfiniteLogBaseRecord = InfiniteLogRecord> extends InfiniteLogCommandContext {
  selectedRecords: readonly TRecord[];
  refresh: () => void;
  clearSelection: () => void;
  loading: boolean;
}

export interface InfiniteLogErrorContext {
  error: unknown;
  retry: () => void;
}

export interface InfiniteLogTableProps<TRecord extends InfiniteLogBaseRecord = InfiniteLogRecord>
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  tableId?: string;
  dataSource?: InfiniteLogDataSource<TRecord>;
  records?: readonly TRecord[];
  /** Explicit field schema. When omitted for static records, fields are inferred from the data. */
  fields?: readonly InfiniteLogField<TRecord>[];
  state?: InfiniteLogTableState;
  defaultState?: InfiniteLogTableDefaultState;
  onStateChange?: (state: InfiniteLogTableState) => void;
  pageSize?: number;
  maxLiveRows?: number;
  enableLive?: boolean;
  locale?: string;
  timeZone?: string;
  labels?: Partial<InfiniteLogTableLabels>;
  commandSlot?: (context: InfiniteLogCommandContext) => ReactNode;
  toolbarActions?: (context: InfiniteLogToolbarContext<TRecord>) => ReactNode;
  footerSlot?: ReactNode;
  emptyState?: (context: InfiniteLogCommandContext) => ReactNode;
  errorState?: (context: InfiniteLogErrorContext) => ReactNode;
  redactRecord?: (record: TRecord) => TRecord;
  renderDetail?: (record: TRecord) => ReactNode;
  onRecordOpen?: (record: TRecord) => void;
}

export interface MockRegion {
  id: string;
  label: string;
  latencyMultiplier: number;
}

export interface CreateMockLogOptions {
  seed?: number;
  baseTime?: string;
  days?: number;
  regions?: readonly MockRegion[];
}
