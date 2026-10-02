// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInfiniteLogController } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-controller";
import { createInfiniteLogMetadata, createInfiniteLogPage } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-data-source";
import {
  defaultInfiniteLogFilters,
  type InfiniteLogBaseRecord,
  type InfiniteLogDataSource,
  type InfiniteLogMetadata,
  type InfiniteLogPage,
  type InfiniteLogTableState,
} from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-types";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, decline) => { resolve = accept; reject = decline; });
  return { promise, resolve, reject };
}

const record = (id: string): InfiniteLogBaseRecord => ({ id, timestamp: "2026-08-23T00:00:00.000Z" });
const metadata = (count: number): InfiniteLogMetadata => ({
  ...createInfiniteLogMetadata([], defaultInfiniteLogFilters), totalCount: count, filteredCount: count,
});
const stateFor = (query = ""): InfiniteLogTableState => ({
  filters: { ...defaultInfiniteLogFilters, query }, live: true, sort: { field: "timestamp", direction: "desc" },
});
type Source = InfiniteLogDataSource<InfiniteLogBaseRecord>;
type Page = InfiniteLogPage<InfiniteLogBaseRecord>;
type Subscription = Parameters<NonNullable<Source["subscribeNewer"]>>[0];
function useProbe({ dataSource, state }: { dataSource: Source; state: InfiniteLogTableState }) {
  return useInfiniteLogController({ dataSource, state, enableLive: true, maxLiveRows: 20, pageSize: 1 });
}

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("log query generation isolation", () => {
  it("keeps old rows visible but never sends their cursor with replacement filters", async () => {
    const replacement = deferred<void>();
    const records = [record("old"), { ...record("new"), timestamp: "2026-08-22T00:00:00.000Z" }];
    const loadPage = vi.fn<Source["loadPage"]>(async (request) => {
      if (request.filters.query) await replacement.promise;
      return createInfiniteLogPage(records, request, "same-snapshot");
    });
    const dataSource = { loadPage };
    const { result, rerender } = renderHook(useProbe, { initialProps: { dataSource, state: stateFor() } });
    await waitFor(() => expect(result.current.rows[0]?.id).toBe("old"));
    const staleLoadMore = result.current.loadMore;
    rerender({ dataSource, state: stateFor("new") });
    expect(result.current.refreshing).toBe(true);
    expect(result.current.rows[0]?.id).toBe("old");
    await act(async () => { await result.current.loadMore(); await staleLoadMore(); });
    expect(loadPage).toHaveBeenCalledTimes(2);
    await act(async () => replacement.resolve());
    expect(result.current.rows.map((row) => row.id)).toEqual(["new"]);
    expect(result.current.error).toBeUndefined();
  });

  it("locks repeated pagination synchronously and ignores late pages through A → B → A", async () => {
    const more = deferred<Page>();
    const loadPage = vi.fn<Source["loadPage"]>((request) => request.cursor
      ? more.promise
      : Promise.resolve({ rows: [record(request.filters.query)], snapshotRevision: request.filters.query, nextCursor: "next" }));
    const dataSource = { loadPage };
    const { result, rerender } = renderHook(useProbe, { initialProps: { dataSource, state: stateFor("A") } });
    await waitFor(() => expect(result.current.rows[0]?.id).toBe("A"));
    act(() => { void result.current.loadMore(); void result.current.loadMore(); });
    expect(loadPage).toHaveBeenCalledTimes(2);
    const oldSignal = loadPage.mock.calls[1]![1].signal;
    rerender({ dataSource, state: stateFor("B") });
    await waitFor(() => expect(result.current.rows[0]?.id).toBe("B"));
    rerender({ dataSource, state: stateFor("A") });
    await waitFor(() => expect(result.current.rows[0]?.id).toBe("A"));
    expect(oldSignal.aborted).toBe(true);
    await act(async () => more.resolve({ rows: [record("stale-page")], snapshotRevision: "A" }));
    expect(result.current.rows.map((row) => row.id)).toEqual(["A"]);
    expect(result.current.fetchingMore).toBe(false);
  });

  it.each(["resolve", "reject"] as const)("ignores old metadata %s and late subscription callbacks after A → B → A", async (settlement) => {
    const pending = deferred<InfiniteLogMetadata>();
    const subscriptions: Subscription[] = [];
    const loadMetadata = vi.fn<NonNullable<Source["loadMetadata"]>>(() => pending.promise);
    const dataSource: Source = {
      loadPage: vi.fn(async (request) => ({ rows: [record(request.filters.query)], metadata: metadata(request.filters.query === "A" ? 1 : 2), snapshotRevision: request.filters.query, newerCheckpoint: "c" })),
      loadMetadata,
      subscribeNewer: vi.fn((options) => { subscriptions.push(options); return vi.fn(); }),
    };
    const { result, rerender } = renderHook(useProbe, { initialProps: { dataSource, state: stateFor("A") } });
    await waitFor(() => expect(subscriptions).toHaveLength(1));
    act(() => subscriptions[0]!.onBatch({ rows: [] }));
    await waitFor(() => expect(loadMetadata).toHaveBeenCalledTimes(1));
    const oldSignal = loadMetadata.mock.calls[0]![1].signal;
    rerender({ dataSource, state: stateFor("B") });
    await waitFor(() => expect(result.current.metadata?.filteredCount).toBe(2));
    rerender({ dataSource, state: stateFor("A") });
    await waitFor(() => expect(result.current.metadata?.filteredCount).toBe(1));
    expect(oldSignal.aborted).toBe(true);
    await act(async () => {
      if (settlement === "resolve") pending.resolve(metadata(999));
      else pending.reject(new Error("obsolete metadata failure"));
      subscriptions[0]!.onBatch({ rows: [record("stale-live")], metadata: metadata(888) });
      subscriptions[0]!.onError?.(new Error("obsolete live failure"));
    });
    expect(result.current.rows.map((row) => row.id)).toEqual(["A"]);
    expect(result.current.metadata?.filteredCount).toBe(1);
    expect(result.current.error).toBeUndefined();
  });

  it("cancels queued metadata and suspends Live/pagination until a refresh commits", async () => {
    const refreshed = deferred<Page>();
    const subscriptions: Subscription[] = [];
    const dataSource: Source = {
      loadPage: vi.fn<Source["loadPage"]>().mockResolvedValueOnce({ rows: [record("old")], snapshotRevision: "v1", nextCursor: "old-cursor" }).mockImplementation(() => refreshed.promise),
      loadMetadata: vi.fn(async () => metadata(999)),
      subscribeNewer: vi.fn((options) => { subscriptions.push(options); return vi.fn(); }),
    };
    const { result } = renderHook(useProbe, { initialProps: { dataSource, state: stateFor() } });
    await waitFor(() => expect(subscriptions).toHaveLength(1));
    vi.useFakeTimers();
    act(() => { subscriptions[0]!.onBatch({ rows: [] }); result.current.refresh(); });
    await act(async () => { await result.current.loadMore(); vi.advanceTimersByTime(300); });
    expect(dataSource.loadMetadata).not.toHaveBeenCalled();
    expect(dataSource.loadPage).toHaveBeenCalledTimes(2);
    expect(subscriptions).toHaveLength(1);
    act(() => subscriptions[0]!.onBatch({ rows: [record("stale")], metadata: metadata(999) }));
    expect(result.current.rows.map((row) => row.id)).toEqual(["old"]);
    await act(async () => refreshed.resolve({ rows: [record("fresh")], snapshotRevision: "v1", metadata: metadata(3) }));
    expect(result.current.rows.map((row) => row.id)).toEqual(["fresh"]);
    expect(result.current.metadata?.filteredCount).toBe(3);
    expect(subscriptions).toHaveLength(2);
  });

  it("isolates a replacement data source even when its query and revision are identical", async () => {
    const pending = deferred<InfiniteLogMetadata>();
    let subscription: Subscription | undefined;
    const original: Source = {
      loadPage: vi.fn(async () => ({ rows: [record("original")], snapshotRevision: "same" })),
      loadMetadata: vi.fn(() => pending.promise),
      subscribeNewer: vi.fn((options) => { subscription = options; return vi.fn(); }),
    };
    const replacement: Source = { loadPage: vi.fn(async () => ({ rows: [record("replacement")], metadata: metadata(2), snapshotRevision: "same" })) };
    const state = stateFor();
    const { result, rerender } = renderHook<ReturnType<typeof useProbe>, Parameters<typeof useProbe>[0]>(useProbe, { initialProps: { dataSource: original, state } });
    await waitFor(() => expect(subscription).toBeDefined());
    act(() => subscription!.onBatch({ rows: [] }));
    await waitFor(() => expect(original.loadMetadata).toHaveBeenCalledTimes(1));
    rerender({ dataSource: replacement, state });
    await waitFor(() => expect(result.current.rows[0]?.id).toBe("replacement"));
    await act(async () => pending.resolve(metadata(999)));
    expect(result.current.metadata?.filteredCount).toBe(2);
  });
});
