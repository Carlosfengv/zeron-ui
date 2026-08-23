"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isInfiniteLogLiveDataSource,
  sortInfiniteLogRecords,
} from "./infinite-log-data-source";
import type {
  InfiniteLogBaseRecord,
  InfiniteLogDataSource,
  InfiniteLogField,
  InfiniteLogLiveBoundary,
  InfiniteLogMetadata,
  InfiniteLogTableState,
} from "./infinite-log-types";

type LogErrorPhase = "initial" | "more" | "refresh" | "live";

interface ControllerError {
  error: unknown;
  phase: LogErrorPhase;
}

interface UseInfiniteLogControllerOptions<TRecord extends InfiniteLogBaseRecord> {
  dataSource: InfiniteLogDataSource<TRecord>;
  fields?: readonly InfiniteLogField<TRecord>[];
  state: InfiniteLogTableState;
  pageSize: number;
  maxLiveRows: number;
  enableLive: boolean;
  onQueryReset?: () => void;
}

function mergeRecords<TRecord extends InfiniteLogBaseRecord>(
  current: readonly TRecord[],
  incoming: readonly TRecord[],
  state: InfiniteLogTableState,
  fields?: readonly InfiniteLogField<TRecord>[],
) {
  const byId = new Map(current.map((record) => [record.id, record]));
  for (const record of incoming) byId.set(record.id, record);
  return sortInfiniteLogRecords([...byId.values()], state.sort, fields);
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useInfiniteLogController<TRecord extends InfiniteLogBaseRecord>({
  dataSource,
  fields,
  state,
  pageSize,
  maxLiveRows,
  enableLive,
  onQueryReset,
}: UseInfiniteLogControllerOptions<TRecord>) {
  const [rows, setRows] = useState<readonly TRecord[]>([]);
  const [metadata, setMetadata] = useState<InfiniteLogMetadata>();
  const [nextCursor, setNextCursor] = useState<string>();
  const [snapshotRevision, setSnapshotRevision] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState<ControllerError>();
  const [pendingLiveRows, setPendingLiveRows] = useState<readonly TRecord[]>([]);
  const [liveBoundary, setLiveBoundary] = useState<InfiniteLogLiveBoundary>();
  const [atTop, setAtTop] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const requestSequence = useRef(0);
  const requestAbort = useRef<AbortController | undefined>(undefined);
  const pageAbort = useRef<AbortController | undefined>(undefined);
  const metadataAbort = useRef<AbortController | undefined>(undefined);
  const checkpointRef = useRef<string | undefined>(undefined);
  const rowsRef = useRef(rows);
  const canonicalIds = useRef(new Set<string>());
  const liveOnlyIds = useRef(new Set<string>());
  const atTopRef = useRef(atTop);
  const metadataTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasLoadedInitialPage = useRef(false);

  const queryKey = useMemo(
    () => JSON.stringify({ filters: state.filters, sort: state.sort }),
    [state.filters, state.sort],
  );
  const liveSupported = enableLive && isInfiniteLogLiveDataSource(dataSource);
  const liveEligible =
    liveSupported &&
    state.live &&
    !state.filters.timeRange &&
    state.sort?.field === "timestamp" &&
    state.sort.direction === "desc";

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    atTopRef.current = atTop;
  }, [atTop]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const resetRows = useCallback(() => {
    canonicalIds.current = new Set();
    liveOnlyIds.current = new Set();
    checkpointRef.current = undefined;
    setRows([]);
    setMetadata(undefined);
    setNextCursor(undefined);
    setSnapshotRevision(undefined);
    setPendingLiveRows([]);
    setLiveBoundary(undefined);
  }, []);

  const loadInitial = useCallback(
    async (phase: "initial" | "refresh") => {
      requestAbort.current?.abort();
      pageAbort.current?.abort();
      setFetchingMore(false);
      const abort = new AbortController();
      requestAbort.current = abort;
      const sequence = requestSequence.current + 1;
      requestSequence.current = sequence;
      setPendingLiveRows([]);
      setLiveBoundary(undefined);

      if (phase === "initial") {
        if (hasLoadedInitialPage.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
          resetRows();
        }
      } else {
        setRefreshing(true);
      }
      setError(undefined);

      try {
        const page = await dataSource.loadPage(
          { filters: state.filters, pageSize, sort: state.sort },
          { signal: abort.signal },
        );
        if (sequence !== requestSequence.current || abort.signal.aborted) return;
        canonicalIds.current = new Set(page.rows.map((record) => record.id));
        liveOnlyIds.current = new Set();
        checkpointRef.current = page.newerCheckpoint;
        setRows(page.rows);
        setMetadata(page.metadata);
        setNextCursor(page.nextCursor);
        setSnapshotRevision(page.snapshotRevision);
        setPendingLiveRows([]);
        hasLoadedInitialPage.current = true;
        onQueryReset?.();
      } catch (loadError) {
        if (!isAbortError(loadError) && sequence === requestSequence.current) {
          setError({ error: loadError, phase });
        }
      } finally {
        if (sequence === requestSequence.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [dataSource, onQueryReset, pageSize, resetRows, state.filters, state.sort],
  );

  useEffect(() => {
    void loadInitial("initial");
    return () => requestAbort.current?.abort();
  }, [loadInitial, queryKey]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading || fetchingMore) return;
    const sequence = requestSequence.current;
    const abort = new AbortController();
    pageAbort.current = abort;
    setFetchingMore(true);
    setError(undefined);

    try {
      const page = await dataSource.loadPage(
        { cursor: nextCursor, filters: state.filters, pageSize, sort: state.sort },
        { signal: abort.signal },
      );
      if (sequence !== requestSequence.current || abort.signal.aborted) return;
      if (snapshotRevision && page.snapshotRevision !== snapshotRevision) {
        throw new Error("The log page changed while loading more rows. Refresh and try again.");
      }
      for (const record of page.rows) canonicalIds.current.add(record.id);
      setRows((current) => mergeRecords(current, page.rows, state, fields));
      setMetadata((current) => page.metadata ?? current);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      if (!isAbortError(loadError) && sequence === requestSequence.current) {
        setError({ error: loadError, phase: "more" });
      }
    } finally {
      if (sequence === requestSequence.current) setFetchingMore(false);
    }
  }, [dataSource, fetchingMore, fields, loading, nextCursor, pageSize, snapshotRevision, state]);

  const refresh = useCallback(() => {
    void loadInitial("refresh");
  }, [loadInitial]);

  const retry = useCallback(() => {
    if (error?.phase === "more") {
      void loadMore();
      return;
    }
    if (error?.phase === "live") {
      setError(undefined);
      return;
    }
    void loadInitial(error?.phase === "refresh" ? "refresh" : "initial");
  }, [error?.phase, loadInitial, loadMore]);

  const refreshMetadata = useCallback(() => {
    if (!isInfiniteLogLiveDataSource(dataSource)) return;
    if (metadataTimer.current) globalThis.clearTimeout(metadataTimer.current);
    metadataTimer.current = globalThis.setTimeout(() => {
      metadataAbort.current?.abort();
      const abort = new AbortController();
      metadataAbort.current = abort;
      void dataSource
        .loadMetadata({ filters: state.filters, sort: state.sort }, { signal: abort.signal })
        .then((nextMetadata) => {
          if (!abort.signal.aborted) setMetadata(nextMetadata);
        })
        .catch((metadataError) => {
          if (!isAbortError(metadataError)) setError({ error: metadataError, phase: "live" });
        });
    }, 250);
  }, [dataSource, state.filters, state.sort]);

  const mergeLiveRows = useCallback(
    (incoming: readonly TRecord[]) => {
      if (incoming.length === 0) return;
      for (const record of incoming) {
        if (!canonicalIds.current.has(record.id)) liveOnlyIds.current.add(record.id);
      }

      setRows((current) => {
        const merged = mergeRecords(current, incoming, state, fields);
        const liveRows = merged.filter((record) => liveOnlyIds.current.has(record.id));
        if (liveRows.length <= maxLiveRows) return merged;
        const removableIds = new Set(
          liveRows
            .slice(maxLiveRows)
            .filter((record) => !canonicalIds.current.has(record.id))
            .map((record) => record.id),
        );
        for (const id of removableIds) liveOnlyIds.current.delete(id);
        return merged.filter((record) => !removableIds.has(record.id));
      });
    },
    [fields, maxLiveRows, state],
  );

  const captureLiveBoundary = useCallback(() => {
    const lastSeenRecord = rowsRef.current[0];
    if (!lastSeenRecord) return;
    setLiveBoundary((current) => current ?? {
      recordId: lastSeenRecord.id,
      timestamp: lastSeenRecord.timestamp,
    });
  }, []);

  useEffect(() => {
    if (!liveEligible || !snapshotRevision || !pageVisible || !isInfiniteLogLiveDataSource(dataSource)) {
      return;
    }
    const unsubscribe = dataSource.subscribeNewer({
      after: checkpointRef.current,
      filters: state.filters,
      sort: { field: "timestamp", direction: "desc" },
      onBatch: (batch) => {
        checkpointRef.current = batch.checkpoint ?? checkpointRef.current;
        if (batch.metadata) setMetadata(batch.metadata);
        else refreshMetadata();

        if (atTopRef.current) {
          captureLiveBoundary();
          mergeLiveRows(batch.rows);
        } else {
          setPendingLiveRows((current) => mergeRecords(current, batch.rows, state, fields));
        }
      },
      onError: (liveError) => setError({ error: liveError, phase: "live" }),
    });
    return () => unsubscribe();
  }, [captureLiveBoundary, dataSource, fields, liveEligible, mergeLiveRows, pageVisible, refreshMetadata, snapshotRevision, state]);

  const applyPendingLiveRows = useCallback(() => {
    if (pendingLiveRows.length === 0) return 0;
    captureLiveBoundary();
    mergeLiveRows(pendingLiveRows);
    const count = pendingLiveRows.length;
    setPendingLiveRows([]);
    return count;
  }, [captureLiveBoundary, mergeLiveRows, pendingLiveRows]);

  useEffect(() => {
    if (liveEligible) return;
    setPendingLiveRows([]);
    setLiveBoundary(undefined);
  }, [liveEligible]);

  useEffect(() => {
    return () => {
      metadataAbort.current?.abort();
      pageAbort.current?.abort();
      if (metadataTimer.current) globalThis.clearTimeout(metadataTimer.current);
    };
  }, []);

  return {
    rows,
    metadata,
    loading,
    refreshing,
    fetchingMore,
    error: error?.error,
    errorPhase: error?.phase,
    hasNextPage: Boolean(nextCursor),
    liveAvailable: liveSupported,
    liveEligible,
    liveBoundary,
    pendingLiveCount: pendingLiveRows.length,
    loadMore,
    refresh,
    retry,
    applyPendingLiveRows,
    setAtTop,
  };
}
