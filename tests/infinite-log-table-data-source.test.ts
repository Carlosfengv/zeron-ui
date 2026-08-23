import { describe, expect, it } from "vitest";
import {
  createInfiniteLogMetadata,
  createStaticInfiniteLogDataSource,
  filterInfiniteLogRecords,
  redactInfiniteLogRecord,
  sortInfiniteLogRecords,
} from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-data-source";
import { createMockLogDataSource, createMockLogRecords } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-mocks";
import { inferInfiniteLogFields } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-fields";
import {
  defaultInfiniteLogFilters,
  type InfiniteLogSort,
} from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-types";

const signal = () => new AbortController().signal;

describe("Infinite log table data source", () => {
  it("infers fields and applies schema-driven filters to arbitrary log records", async () => {
    const records = [
      { id: "audit-1", timestamp: "2026-08-22T00:00:00.000Z", actor: "carlos", action: "login", duration: 18, allowed: true },
      { id: "audit-2", timestamp: "2026-08-22T00:01:00.000Z", actor: "mei", action: "export", duration: 82, allowed: false },
      { id: "audit-3", timestamp: "2026-08-22T00:02:00.000Z", actor: "carlos", action: "export", duration: 44, allowed: true },
    ];
    const fields = inferInfiniteLogFields(records);
    expect(fields.map((field) => field.id)).toEqual(["timestamp", "actor", "action", "duration", "allowed", "id"]);
    expect(fields.find((field) => field.id === "duration")).toMatchObject({ filter: "numberRange", type: "number" });

    const filters = {
      ...defaultInfiniteLogFilters,
      fields: {
        action: { operator: "isAnyOf" as const, value: ["export"] },
        duration: { operator: "isBetween" as const, value: { max: 50 } },
      },
    };
    const source = createStaticInfiniteLogDataSource(records, fields);
    const page = await source.loadPage({ filters, pageSize: 20 }, { signal: signal() });

    expect(page.rows.map((record) => record.id)).toEqual(["audit-3"]);
    expect(page.metadata?.fieldFacets?.action.values).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "login" }),
      expect.objectContaining({ value: "export" }),
    ]));
    expect(page.metadata?.timeline?.buckets.some((bucket) => "records" in bucket.counts)).toBe(true);
  });

  it("creates deterministic, safe HTTP request logs", () => {
    const first = createMockLogRecords({ seed: 17 });
    const second = createMockLogRecords({ seed: 17 });

    expect(first).toEqual(second);
    expect(first).toHaveLength(2940);
    expect(new Set(first.map((record) => record.id)).size).toBe(first.length);
    expect(first.every((record) => record.headers.authorization === undefined)).toBe(true);
    expect(
      first.every(
        (record) =>
          Math.abs(
            record.latency -
              (record.timing.dns +
                record.timing.connection +
                record.timing.tls +
                record.timing.ttfb +
                record.timing.transfer),
          ) <= 1,
      ),
    ).toBe(true);
  });

  it("applies complete-result facets without self-filtering", () => {
    const records = createMockLogRecords({ seed: 19, days: 2 });
    const filters = {
      ...defaultInfiniteLogFilters,
      statuses: [404],
      timeRange: {
        from: "2026-08-21T00:00:00.000Z",
        to: "2026-08-22T00:00:00.000Z",
      },
    };
    const metadata = createInfiniteLogMetadata(records, filters);
    expect(metadata.facets.statuses.values.some((entry) => entry.value === 200)).toBe(true);
    expect(metadata.facets.hosts?.values.length).toBeGreaterThan(0);
    expect(metadata.facets.pathnames?.values.length).toBeGreaterThan(0);
    expect(metadata.filteredCount).toBeLessThanOrEqual(metadata.totalCount);
    expect(metadata.timeline?.buckets).toHaveLength(60);
    const timelineCount = metadata.timeline?.buckets.reduce(
      (total, bucket) => total + bucket.counts.success + bucket.counts.warning + bucket.counts.error,
      0,
    );
    expect(timelineCount).toBe(filterInfiniteLogRecords(records, { ...filters, timeRange: undefined }).length);
  });

  it.each<InfiniteLogSort>([
    { field: "timestamp", direction: "desc" },
    { field: "status", direction: "asc" },
    { field: "latency", direction: "desc" },
    { field: "timing.dns", direction: "asc" },
    { field: "timing.connection", direction: "desc" },
    { field: "timing.tls", direction: "asc" },
    { field: "timing.ttfb", direction: "asc" },
    { field: "timing.transfer", direction: "desc" },
  ])("paginates %o with a stable seek cursor", async (sort) => {
    const records = createMockLogRecords({ seed: 21, days: 2 });
    const source = createStaticInfiniteLogDataSource(records);
    const rows = [] as (typeof records)[number][];
    let cursor: string | undefined;

    do {
      const page = await source.loadPage(
        { cursor, filters: defaultInfiniteLogFilters, pageSize: 7, sort },
        { signal: signal() },
      );
      rows.push(...page.rows);
      cursor = page.nextCursor;
    } while (cursor);

    expect(rows.map((record) => record.id)).toEqual(
      sortInfiniteLogRecords(records, sort).map((record) => record.id),
    );
    expect(new Set(rows.map((record) => record.id)).size).toBe(rows.length);
    expect(cursor).toBeUndefined();
  });

  it("applies documented text, enum, range, and UTC half-open time filters without reading headers", () => {
    const [source] = createMockLogRecords({ seed: 71, days: 1 });
    const record = {
      ...source!,
      headers: { authorization: "should-not-match", "x-debug": "header-only" },
      id: "traceable-request",
      latency: 0,
      message: "retry exhausted",
      region: "Test region",
      spanId: "span-1",
      status: 418,
      timestamp: "2026-08-22T00:00:00.000Z",
      traceId: "trace-1",
    };
    const next = { ...record, id: "outside", spanId: undefined, timestamp: "2026-08-22T01:00:00.000Z", traceId: undefined };
    const records = [record, next];

    expect(filterInfiniteLogRecords(records, { ...defaultInfiniteLogFilters, query: "trace-1" })).toEqual([record]);
    expect(filterInfiniteLogRecords(records, { ...defaultInfiniteLogFilters, query: "header-only" })).toEqual([]);
    expect(filterInfiniteLogRecords(records, {
      ...defaultInfiniteLogFilters,
      latency: { max: 0, min: 0 },
      regions: ["Test region"],
      statuses: [418],
      timeRange: { from: "2026-08-22T00:00:00.000Z", to: "2026-08-22T01:00:00.000Z" },
    })).toEqual([record]);
  });

  it("redacts sensitive headers case-insensitively without mutating ordinary headers", () => {
    const record = createMockLogRecords({ days: 1 })[0]!;
    const redacted = redactInfiniteLogRecord({
      ...record,
      headers: { Authorization: "secret", Cookie: "session", "X-Api-Key": "key", accept: "application/json" },
    });
    expect(redacted.headers).toEqual({ Authorization: "[REDACTED]", Cookie: "[REDACTED]", "X-Api-Key": "[REDACTED]", accept: "application/json" });
  });

  it("rejects a cursor when the query sort changes", async () => {
    const source = createStaticInfiniteLogDataSource(createMockLogRecords({ seed: 23, days: 1 }));
    const first = await source.loadPage(
      {
        filters: defaultInfiniteLogFilters,
        pageSize: 5,
        sort: { field: "timestamp", direction: "desc" },
      },
      { signal: signal() },
    );

    await expect(
      source.loadPage(
        {
          cursor: first.nextCursor,
          filters: defaultInfiniteLogFilters,
          pageSize: 5,
          sort: { field: "latency", direction: "desc" },
        },
        { signal: signal() },
      ),
    ).rejects.toThrow("does not belong to this query");
  });

  it("rejects an aborted page request before it reads the records", async () => {
    const source = createStaticInfiniteLogDataSource(createMockLogRecords({ days: 1 }));
    const controller = new AbortController();
    controller.abort();
    await expect(source.loadPage({ filters: defaultInfiniteLogFilters, pageSize: 5 }, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
  });

  it("returns metadata and a checkpoint from the mock live source", async () => {
    const source = createMockLogDataSource({ seed: 29 });
    const page = await source.loadPage(
      { filters: defaultInfiniteLogFilters, pageSize: 10 },
      { signal: signal() },
    );

    expect(page.metadata?.filteredCount).toBeGreaterThan(0);
    expect(page.metadata?.timeline?.buckets).toHaveLength(60);
    expect(page.newerCheckpoint).toMatch(/^live:/);
    expect(source.loadMetadata).toBeTypeOf("function");
    expect(source.subscribeNewer).toBeTypeOf("function");
  });
});
