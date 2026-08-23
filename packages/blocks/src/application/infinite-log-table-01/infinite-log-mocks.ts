import {
  createInfiniteLogMetadata,
  createInfiniteLogPage,
  createInfiniteLogSnapshotRevision,
  filterInfiniteLogRecords,
  getInfiniteLogCursorSnapshotRevision,
} from "./infinite-log-data-source";
import type {
  CreateMockLogOptions,
  HttpLogOutcome,
  InfiniteLogDataSource,
  InfiniteLogPageRequest,
  InfiniteLogRecord,
  LogMethod,
  MockRegion,
} from "./infinite-log-types";

const defaultRegions: readonly MockRegion[] = [
  { id: "iad1", label: "US East · IAD", latencyMultiplier: 1 },
  { id: "sfo1", label: "US West · SFO", latencyMultiplier: 1.25 },
  { id: "fra1", label: "Europe · FRA", latencyMultiplier: 1.12 },
  { id: "sin1", label: "Asia · SIN", latencyMultiplier: 1.42 },
  { id: "hkg1", label: "Asia · HKG", latencyMultiplier: 1.36 },
  { id: "syd1", label: "Oceania · SYD", latencyMultiplier: 1.66 },
];

const hosts = ["api.zeron.dev", "edge.zeron.dev", "console.zeron.dev"] as const;
const pathnames = [
  "/v1/agents/run",
  "/v1/models",
  "/v1/responses",
  "/v1/usage",
  "/healthz",
  "/internal/metrics",
] as const;
const methods: readonly LogMethod[] = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"];

export interface CreateMockLogDataSourceOptions extends CreateMockLogOptions {
  latencyMs?: number;
  failureRate?: number;
  liveIntervalMs?: number;
}

function createPrng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomFrom<T>(random: () => number, values: readonly T[]) {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))]!;
}

function outcomeFor(random: () => number): { outcome: HttpLogOutcome; status: number } {
  const value = random();
  if (value < 0.9) return { outcome: "success", status: random() < 0.94 ? 200 : 204 };
  if (value < 0.96) return { outcome: "warning", status: random() < 0.7 ? 404 : 429 };
  return { outcome: "error", status: random() < 0.55 ? 500 : 503 };
}

function createTiming(latency: number, random: () => number) {
  const dns = Math.max(0, Math.round(latency * (0.025 + random() * 0.045)));
  const connection = Math.max(0, Math.round(latency * (0.04 + random() * 0.08)));
  const tls = Math.max(0, Math.round(latency * (0.06 + random() * 0.1)));
  const ttfb = Math.max(1, Math.round(latency * (0.36 + random() * 0.2)));
  const transfer = Math.max(0, latency - dns - connection - tls - ttfb);
  return { dns, connection, tls, ttfb, transfer };
}

function createRecord({
  index,
  timestamp,
  region,
  random,
  seed,
}: {
  index: number;
  timestamp: number;
  region: MockRegion;
  random: () => number;
  seed: number;
}): InfiniteLogRecord {
  const result = outcomeFor(random);
  const baseLatency = result.outcome === "error" ? 450 + random() * 1450 : 45 + random() * 420;
  const latency = Math.max(8, Math.round(baseLatency * region.latencyMultiplier));
  const method = randomFrom(random, methods);
  const host = randomFrom(random, hosts);
  const pathname = randomFrom(random, pathnames);
  const id = `req_${seed.toString(36)}_${index.toString(36)}_${region.id}`;

  return {
    id,
    timestamp: new Date(timestamp).toISOString(),
    outcome: result.outcome,
    status: result.status,
    method,
    host,
    pathname,
    latency,
    region: region.label,
    timing: createTiming(latency, random),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-request-source": "mock-log-data",
    },
    traceId: `tr_${seed.toString(36)}_${Math.floor(index / 3).toString(36)}`,
    spanId: `sp_${index.toString(36)}`,
    message:
      result.outcome === "error"
        ? result.status === 503
          ? "Upstream service temporarily unavailable."
          : "Request failed while processing the upstream response."
        : undefined,
    metadata: {
      retryCount: result.outcome === "warning" ? 1 : 0,
      cache: result.outcome === "success" && random() > 0.55 ? "hit" : "miss",
    },
  };
}

export function createMockLogRecords(options: CreateMockLogOptions = {}) {
  const seed = options.seed ?? 20260822;
  const baseTime = Date.parse(options.baseTime ?? "2026-08-22T12:00:00.000Z");
  const days = options.days ?? 20;
  const regions = options.regions ?? defaultRegions;
  const random = createPrng(seed);
  const records: InfiniteLogRecord[] = [];
  const hours = Math.max(1, Math.floor(days * 24));

  for (let hour = 0; hour < hours; hour += 1) {
    for (let regionIndex = 0; regionIndex < regions.length; regionIndex += 1) {
      const region = regions[regionIndex]!;
      const minuteOffset = Math.floor(random() * 56) * 60_000;
      records.push(
        createRecord({
          index: hour * regions.length + regionIndex,
          timestamp: baseTime - (hours - hour) * 60 * 60_000 + minuteOffset,
          region,
          random,
          seed,
        }),
      );
    }
  }

  for (let index = 0; index < 60; index += 1) {
    const region = regions[index % regions.length]!;
    records.push(
      createRecord({
        index: hours * regions.length + index,
        timestamp: baseTime - index * 55_000,
        region,
        random,
        seed,
      }),
    );
  }

  return records;
}

function sleepWithAbort(delay: number, signal: AbortSignal) {
  if (delay <= 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timeout = globalThis.setTimeout(resolve, delay);
    const abort = () => {
      globalThis.clearTimeout(timeout);
      reject(new DOMException("The request was aborted.", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

function checkpointFor(sequence: number) {
  return `live:${sequence}`;
}

function sequenceForCheckpoint(checkpoint: string | undefined) {
  if (!checkpoint?.startsWith("live:")) return 0;
  const value = Number(checkpoint.slice("live:".length));
  return Number.isFinite(value) ? value : 0;
}

export function createMockLogDataSource(
  options: CreateMockLogDataSourceOptions = {},
): InfiniteLogDataSource {
  const seed = options.seed ?? 20260822;
  const baseTime = Date.parse(options.baseTime ?? "2026-08-22T12:00:00.000Z");
  const regions = options.regions ?? defaultRegions;
  const delay = options.latencyMs ?? 0;
  const failureRate = Math.min(1, Math.max(0, options.failureRate ?? 0));
  const liveIntervalMs = Math.max(250, options.liveIntervalMs ?? 5_000);
  const random = createPrng(seed + 7);
  let requestCount = 0;
  let liveSequence = 0;
  let liveRecords: InfiniteLogRecord[] = [];
  let snapshots = new Map<string, readonly InfiniteLogRecord[]>();

  const recordsForLatestSnapshot = () => [...createMockLogRecords(options), ...liveRecords];
  const createLatestSnapshot = () => {
    const records = recordsForLatestSnapshot();
    const snapshotRevision = createInfiniteLogSnapshotRevision(records);
    snapshots.set(snapshotRevision, records);
    return { records, snapshotRevision };
  };

  const failIfConfigured = () => {
    requestCount += 1;
    if (failureRate > 0 && (requestCount * 997) % 1000 < failureRate * 1000) {
      throw new Error("Mock log data source failed by configuration.");
    }
  };

  const loadPage = async (request: InfiniteLogPageRequest, { signal }: { signal: AbortSignal }) => {
    await sleepWithAbort(delay, signal);
    if (signal.aborted) throw new DOMException("The request was aborted.", "AbortError");
    failIfConfigured();

    const snapshotRevision = request.cursor
      ? getInfiniteLogCursorSnapshotRevision(request.cursor)
      : createLatestSnapshot().snapshotRevision;
    const snapshot = snapshots.get(snapshotRevision);
    if (!snapshot) {
      throw new Error("The requested mock snapshot has expired. Refresh the log table and try again.");
    }
    const page = createInfiniteLogPage(snapshot, request, snapshotRevision);
    return request.cursor
      ? page
      : { ...page, newerCheckpoint: checkpointFor(liveSequence) };
  };

  return {
    loadPage,
    async loadMetadata({ filters }: Pick<InfiniteLogPageRequest, "filters" | "sort">, { signal }) {
      await sleepWithAbort(delay, signal);
      if (signal.aborted) throw new DOMException("The request was aborted.", "AbortError");
      failIfConfigured();
      return createInfiniteLogMetadata(recordsForLatestSnapshot(), filters);
    },
    subscribeNewer({ after, filters, onBatch, onError }) {
      let active = true;
      let deliveredSequence = sequenceForCheckpoint(after);

      const emit = () => {
        if (!active) return;
        try {
          liveSequence += 1;
          const record = createRecord({
            index: 100_000 + liveSequence,
            timestamp: baseTime + liveSequence * liveIntervalMs,
            region: regions[liveSequence % regions.length]!,
            random,
            seed,
          });
          liveRecords = [...liveRecords, record];
          const newRecords = liveRecords
            .slice(Math.max(0, deliveredSequence))
            .filter((candidate) => filterInfiniteLogRecords([candidate], filters).length > 0);
          deliveredSequence = liveSequence;
          onBatch({
            rows: newRecords,
            metadata: createInfiniteLogMetadata(recordsForLatestSnapshot(), filters),
            checkpoint: checkpointFor(liveSequence),
          });
        } catch (error) {
          onError(error);
        }
      };

      const interval = globalThis.setInterval(emit, liveIntervalMs);
      return () => {
        active = false;
        globalThis.clearInterval(interval);
      };
    },
  };
}

export const defaultMockLogRegions = defaultRegions;
