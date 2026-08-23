import type {
  HttpLogOutcome,
  InfiniteLogBaseRecord,
  InfiniteLogDataSource,
  InfiniteLogField,
  InfiniteLogFilters,
  InfiniteLogMetadata,
  InfiniteLogPage,
  InfiniteLogPageRequest,
  InfiniteLogRecord,
  InfiniteLogSort,
  LogFacetValue,
  LogMethod,
  LogRangeFacet,
  LogValueFacet,
  NumericRange,
} from "./infinite-log-types";
import {
  getInfiniteLogFieldValue,
  isHttpInfiniteLogRecord,
  resolveInfiniteLogFields,
} from "./infinite-log-fields";

const textCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const outcomes: readonly HttpLogOutcome[] = ["success", "warning", "error"];
const timingKeys = ["dns", "connection", "tls", "ttfb", "transfer"] as const;
const timelineBucketCount = 60;
const timelineDurations = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000,
  12 * 60 * 60_000,
  24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
] as const;

type SortValue = number | string;

interface CursorPayload {
  version: 1;
  snapshotRevision: string;
  field: InfiniteLogSort["field"];
  direction: InfiniteLogSort["direction"];
  value: SortValue;
  id: string;
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    throw new DOMException("The request was aborted.", "AbortError");
  }
}

function toLower(value: string | undefined) {
  return value?.toLocaleLowerCase() ?? "";
}

function matchesText(value: string, query: string) {
  return toLower(value).includes(toLower(query.trim()));
}

function includesAny<T>(values: readonly T[], value: T) {
  return values.length === 0 || values.includes(value);
}

function matchesRange(value: number, range?: NumericRange) {
  if (!range) return true;
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;
  return true;
}

function toTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

export function matchesInfiniteLogRecord<TRecord extends InfiniteLogBaseRecord>(
  record: TRecord,
  filters: InfiniteLogFilters,
  fields?: readonly InfiniteLogField<TRecord>[],
) {
  const query = filters.query.trim();
  const searchableValues = fields
    ? fields
        .filter((field) => field.type !== "json")
        .map((field) => getInfiniteLogFieldValue(record, field))
    : Object.values(record).filter((value) =>
        typeof value === "string" || typeof value === "number" || typeof value === "boolean",
      );
  if (
    query &&
    !searchableValues.some((candidate) => matchesText(String(candidate ?? ""), query))
  ) {
    return false;
  }

  if (isHttpInfiniteLogRecord(record)) {
    const httpRecord = record as unknown as InfiniteLogRecord;
    if (!matchesText(httpRecord.host, filters.host)) return false;
    if (!matchesText(httpRecord.pathname, filters.pathname)) return false;
    if (!includesAny(filters.outcomes, httpRecord.outcome)) return false;
    if (!includesAny(filters.statuses, httpRecord.status)) return false;
    if (!includesAny(filters.methods, httpRecord.method)) return false;
    if (!includesAny(filters.regions, httpRecord.region)) return false;
    if (!matchesRange(httpRecord.latency, filters.latency)) return false;
    for (const key of timingKeys) {
      if (!matchesRange(httpRecord.timing[key], filters.timing?.[key])) return false;
    }
  }

  if (filters.timeRange) {
    const timestamp = toTimestamp(record.timestamp);
    const from = toTimestamp(filters.timeRange.from);
    const to = toTimestamp(filters.timeRange.to);
    if (
      timestamp === undefined ||
      from === undefined ||
      to === undefined ||
      timestamp < from ||
      timestamp >= to
    ) {
      return false;
    }
  }

  const fieldById = new Map(fields?.map((field) => [field.id, field]));
  for (const [fieldId, filter] of Object.entries(filters.fields ?? {})) {
    const value = getInfiniteLogFieldValue(record, fieldById.get(fieldId) ?? fieldId);
    if (filter.operator === "contains" && !matchesText(String(value ?? ""), filter.value)) return false;
    if (filter.operator === "isAnyOf" && !filter.value.some((candidate) => String(candidate) === String(value))) return false;
    if (filter.operator === "isBetween") {
      if (typeof value !== "number" || !matchesRange(value, filter.value)) return false;
    }
  }

  return true;
}

export function filterInfiniteLogRecords<TRecord extends InfiniteLogBaseRecord>(
  records: readonly TRecord[],
  filters: InfiniteLogFilters,
  fields?: readonly InfiniteLogField<TRecord>[],
) {
  return records.filter((record) => matchesInfiniteLogRecord(record, filters, fields));
}

export function getInfiniteLogSortValue<TRecord extends InfiniteLogBaseRecord>(
  record: TRecord,
  field: InfiniteLogSort["field"],
  fields?: readonly InfiniteLogField<TRecord>[],
): SortValue {
  const definition = fields?.find((candidate) => candidate.id === field);
  const value = getInfiniteLogFieldValue(record, definition ?? field);
  if (field === "timestamp") return Date.parse(String(value));
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return JSON.stringify(value ?? "");
}

export function compareInfiniteLogRecords<TRecord extends InfiniteLogBaseRecord>(
  left: TRecord,
  right: TRecord,
  sort: InfiniteLogSort = { field: "timestamp", direction: "desc" },
  fields?: readonly InfiniteLogField<TRecord>[],
) {
  const leftValue = getInfiniteLogSortValue(left, sort.field, fields);
  const rightValue = getInfiniteLogSortValue(right, sort.field, fields);
  const valueComparison =
    typeof leftValue === "number" && typeof rightValue === "number"
      ? leftValue - rightValue
      : textCollator.compare(String(leftValue), String(rightValue));
  const withDirection = sort.direction === "desc" ? -valueComparison : valueComparison;
  if (withDirection !== 0) return withDirection;
  const idComparison = textCollator.compare(left.id, right.id);
  return sort.direction === "desc" ? -idComparison : idComparison;
}

export function sortInfiniteLogRecords<TRecord extends InfiniteLogBaseRecord>(
  records: readonly TRecord[],
  sort?: InfiniteLogSort,
  fields?: readonly InfiniteLogField<TRecord>[],
) {
  return [...records].sort((left, right) => compareInfiniteLogRecords(left, right, sort, fields));
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createInfiniteLogSnapshotRevision(records: readonly InfiniteLogBaseRecord[]) {
  return `logs-${hashText(records.map((record) => `${record.id}:${record.timestamp}`).join("|"))}`;
}

function encodeCursor(payload: CursorPayload) {
  return btoa(JSON.stringify(payload));
}

function decodeCursor(cursor: string): CursorPayload {
  try {
    const payload = JSON.parse(atob(cursor)) as CursorPayload;
    if (payload.version !== 1 || !payload.id || payload.value === undefined) {
      throw new Error("Malformed cursor");
    }
    return payload;
  } catch {
    throw new Error("The log page cursor is invalid or expired.");
  }
}

export function getInfiniteLogCursorSnapshotRevision(cursor: string) {
  return decodeCursor(cursor).snapshotRevision;
}

function cursorForRecord<TRecord extends InfiniteLogBaseRecord>(
  record: TRecord,
  snapshotRevision: string,
  sort: InfiniteLogSort,
  fields?: readonly InfiniteLogField<TRecord>[],
) {
  return encodeCursor({
    version: 1,
    snapshotRevision,
    field: sort.field,
    direction: sort.direction,
    value: getInfiniteLogSortValue(record, sort.field, fields),
    id: record.id,
  });
}

function getCursorStartIndex<TRecord extends InfiniteLogBaseRecord>(
  records: readonly TRecord[],
  cursor: string | undefined,
  snapshotRevision: string,
  sort: InfiniteLogSort,
  fields?: readonly InfiniteLogField<TRecord>[],
) {
  if (!cursor) return 0;
  const payload = decodeCursor(cursor);
  if (
    payload.snapshotRevision !== snapshotRevision ||
    payload.field !== sort.field ||
    payload.direction !== sort.direction
  ) {
    throw new Error("The log page cursor does not belong to this query.");
  }

  const cursorIndex = records.findIndex(
    (record) =>
      record.id === payload.id &&
      getInfiniteLogSortValue(record, sort.field, fields) === payload.value,
  );
  if (cursorIndex < 0) {
    throw new Error("The log page cursor no longer points to this snapshot.");
  }
  return cursorIndex + 1;
}

function withoutOwnFacetFilter(
  filters: InfiniteLogFilters,
  key: "outcomes" | "statuses" | "methods" | "regions" | "host" | "pathname" | "latency",
) {
  if (key === "host" || key === "pathname") return { ...filters, [key]: "" };
  return { ...filters, [key]: key === "latency" ? undefined : [] };
}

function withoutOwnTimingFilter(filters: InfiniteLogFilters, key: keyof InfiniteLogRecord["timing"]) {
  const { [key]: _removed, ...remainingTiming } = filters.timing ?? {};
  return {
    ...filters,
    timing: Object.keys(remainingTiming).length > 0 ? remainingTiming : undefined,
  };
}

function createValueFacet<T extends string | number>(
  records: readonly InfiniteLogRecord[],
  valueForRecord: (record: InfiniteLogRecord) => T,
  compare: (left: T, right: T) => number,
): LogValueFacet<T> {
  const counts = new Map<T, number>();
  for (const record of records) {
    const value = valueForRecord(record);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const values: LogFacetValue<T>[] = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => compare(left.value, right.value));
  return { values };
}

function createRangeFacet(
  records: readonly InfiniteLogRecord[],
  valueForRecord: (record: InfiniteLogRecord) => number,
): LogRangeFacet {
  if (records.length === 0) return {};
  const values = records.map(valueForRecord);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function createTimeline<TRecord extends InfiniteLogBaseRecord>(records: readonly TRecord[]) {
  const datedRecords = records
    .map((record) => ({ record, timestamp: toTimestamp(record.timestamp) }))
    .filter((entry): entry is { record: TRecord; timestamp: number } => entry.timestamp !== undefined);
  if (datedRecords.length === 0) return { buckets: [] };
  const httpTimeline = datedRecords.every(({ record }) => isHttpInfiniteLogRecord(record));

  const earliest = Math.min(...datedRecords.map((entry) => entry.timestamp));
  const latest = Math.max(...datedRecords.map((entry) => entry.timestamp));
  const minimumDuration = Math.max(1, Math.ceil((latest - earliest + 1) / timelineBucketCount));
  let duration = timelineDurations.find((candidate) => candidate >= minimumDuration) ?? minimumDuration;
  let contextEnd = Math.ceil((latest + 1) / duration) * duration;

  while (contextEnd - timelineBucketCount * duration > earliest) {
    const largerDuration = timelineDurations.find((candidate) => candidate > duration);
    duration = largerDuration ?? duration * 2;
    contextEnd = Math.ceil((latest + 1) / duration) * duration;
  }

  const contextStart = contextEnd - timelineBucketCount * duration;
  const buckets = Array.from({ length: timelineBucketCount }, (_, index) => {
    const start = contextStart + index * duration;
    return {
      start,
      end: start + duration,
      counts: (httpTimeline
        ? { success: 0, warning: 0, error: 0 }
        : { records: 0 }) as Record<string, number>,
    };
  });

  for (const { record, timestamp } of datedRecords) {
    const index = Math.floor((timestamp - contextStart) / duration);
    const bucket = buckets[index];
    if (!bucket) continue;
    if (httpTimeline && isHttpInfiniteLogRecord(record) && typeof record.outcome === "string") {
      bucket.counts[record.outcome] = (bucket.counts[record.outcome] ?? 0) + 1;
    } else {
      bucket.counts.records = (bucket.counts.records ?? 0) + 1;
    }
  }

  return {
    buckets: buckets.map((bucket) => ({
      start: new Date(bucket.start).toISOString(),
      end: new Date(bucket.end).toISOString(),
      counts: bucket.counts,
    })),
  };
}

export function createInfiniteLogMetadata<TRecord extends InfiniteLogBaseRecord>(
  records: readonly TRecord[],
  filters: InfiniteLogFilters,
  fields?: readonly InfiniteLogField<TRecord>[],
): InfiniteLogMetadata {
  const httpRecords = records.filter((record): record is TRecord & InfiniteLogRecord => isHttpInfiniteLogRecord(record));
  const outcomesForFacet = filterInfiniteLogRecords(httpRecords, withoutOwnFacetFilter(filters, "outcomes"));
  const statusesForFacet = filterInfiniteLogRecords(httpRecords, withoutOwnFacetFilter(filters, "statuses"));
  const methodsForFacet = filterInfiniteLogRecords(httpRecords, withoutOwnFacetFilter(filters, "methods"));
  const regionsForFacet = filterInfiniteLogRecords(httpRecords, withoutOwnFacetFilter(filters, "regions"));
  const hostsForFacet = filterInfiniteLogRecords(httpRecords, withoutOwnFacetFilter(filters, "host"));
  const pathnamesForFacet = filterInfiniteLogRecords(httpRecords, withoutOwnFacetFilter(filters, "pathname"));
  const latencyForFacet = filterInfiniteLogRecords(httpRecords, withoutOwnFacetFilter(filters, "latency"));
  const filteredRecords = filterInfiniteLogRecords(records, filters, fields);
  const timelineRecords = filterInfiniteLogRecords(records, { ...filters, timeRange: undefined }, fields);
  const resolvedFields = resolveInfiniteLogFields(records, fields);
  const fieldFacets = Object.fromEntries(resolvedFields.map((field) => {
    const fieldFilters = { ...(filters.fields ?? {}) };
    delete fieldFilters[field.id];
    const facetRecords = filterInfiniteLogRecords(records, { ...filters, fields: fieldFilters }, fields);
    const values = facetRecords.map((record) => getInfiniteLogFieldValue(record, field));
    if (field.filter === "numberRange") {
      const numericValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
      return [field.id, numericValues.length > 0 ? { min: Math.min(...numericValues), max: Math.max(...numericValues) } : {}];
    }
    if (field.filter === "multiSelect") {
      const counts = new Map<string | number, number>();
      for (const value of values) {
        if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") continue;
        const normalized = typeof value === "boolean" ? String(value) : value;
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
      return [field.id, {
        values: [...counts.entries()]
          .map(([value, count]) => ({ value, count }))
          .sort((left, right) => textCollator.compare(String(left.value), String(right.value))),
      }];
    }
    return [field.id, {}];
  }));

  return {
    totalCount: records.length,
    filteredCount: filteredRecords.length,
    timeline: createTimeline(timelineRecords),
    fieldFacets,
    facets: {
      outcomes: createValueFacet(
        outcomesForFacet,
        (record) => record.outcome,
        (left, right) => outcomes.indexOf(left) - outcomes.indexOf(right),
      ),
      statuses: createValueFacet(statusesForFacet, (record) => record.status, (left, right) => left - right),
      methods: createValueFacet(methodsForFacet, (record) => record.method, (left, right) => textCollator.compare(left, right)),
      regions: createValueFacet(regionsForFacet, (record) => record.region, (left, right) => textCollator.compare(left, right)),
      hosts: createValueFacet(hostsForFacet, (record) => record.host, (left, right) => textCollator.compare(left, right)),
      pathnames: createValueFacet(pathnamesForFacet, (record) => record.pathname, (left, right) => textCollator.compare(left, right)),
      latency: createRangeFacet(latencyForFacet, (record) => record.latency),
      timing: Object.fromEntries(
        timingKeys.map((key) => [
          key,
          createRangeFacet(
            filterInfiniteLogRecords(httpRecords, withoutOwnTimingFilter(filters, key)),
            (record) => record.timing[key],
          ),
        ]),
      ) as InfiniteLogMetadata["facets"]["timing"],
    },
  };
}

export function createStaticInfiniteLogDataSource<TRecord extends InfiniteLogBaseRecord>(
  records: readonly TRecord[],
  fields?: readonly InfiniteLogField<TRecord>[],
): InfiniteLogDataSource<TRecord> {
  const snapshotRevision = createInfiniteLogSnapshotRevision(records);

  return {
    async loadPage(request, { signal }): Promise<InfiniteLogPage<TRecord>> {
      throwIfAborted(signal);
      const page = createInfiniteLogPage(records, request, snapshotRevision, fields);
      throwIfAborted(signal);
      return page;
    },
  };
}

export function createInfiniteLogPage<TRecord extends InfiniteLogBaseRecord>(
  records: readonly TRecord[],
  request: InfiniteLogPageRequest,
  snapshotRevision: string,
  fields?: readonly InfiniteLogField<TRecord>[],
): InfiniteLogPage<TRecord> {
  const sort = request.sort ?? { field: "timestamp", direction: "desc" };
  const filtered = filterInfiniteLogRecords(records, request.filters, fields);
  const sorted = sortInfiniteLogRecords(filtered, sort, fields);
  const start = getCursorStartIndex(sorted, request.cursor, snapshotRevision, sort, fields);
  const pageSize = Math.max(1, Math.floor(request.pageSize));
  const rows = sorted.slice(start, start + pageSize);
  const last = rows.at(-1);

  return {
    rows,
    metadata: request.cursor ? undefined : createInfiniteLogMetadata(records, request.filters, fields),
    snapshotRevision,
    nextCursor:
      last && start + rows.length < sorted.length
        ? cursorForRecord(last, snapshotRevision, sort, fields)
        : undefined,
  };
}

export const isInfiniteLogLiveDataSource = <TRecord extends InfiniteLogBaseRecord>(
  dataSource: InfiniteLogDataSource<TRecord>,
): dataSource is InfiniteLogDataSource<TRecord> & {
  subscribeNewer: NonNullable<InfiniteLogDataSource<TRecord>["subscribeNewer"]>;
  loadMetadata: NonNullable<InfiniteLogDataSource<TRecord>["loadMetadata"]>;
} =>
  typeof dataSource.subscribeNewer === "function" &&
  typeof dataSource.loadMetadata === "function";

export function redactInfiniteLogRecord<TRecord extends InfiniteLogBaseRecord>(record: TRecord): TRecord {
  if (!record.headers || typeof record.headers !== "object" || Array.isArray(record.headers)) return record;
  const sensitiveHeader = /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key)$/i;
  const headers = Object.fromEntries(
    Object.entries(record.headers as Record<string, unknown>).map(([key, value]) => [key, sensitiveHeader.test(key) ? "[REDACTED]" : value]),
  );
  return { ...record, headers } as TRecord;
}

export const defaultLogMethods: readonly LogMethod[] = [
  "GET",
  "HEAD",
  "OPTIONS",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];
