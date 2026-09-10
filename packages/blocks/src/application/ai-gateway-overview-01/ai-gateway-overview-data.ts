import type {
  AiGatewayOverviewData,
  AiGatewayOverviewRange,
} from "./ai-gateway-overview-types";

const ranges = new Set<AiGatewayOverviewRange>(["1d", "7d", "30d", "90d"]);

function fail(path: string, expectation: string): never {
  throw new TypeError(`Invalid AI gateway overview data at ${path}: expected ${expectation}.`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(path, "an object");
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) return fail(path, "an array");
  return value;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fail(path, "a non-empty string");
  }
  return value;
}

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fail(path, "a finite number");
  }
  return value;
}

function nonNegativeNumber(value: unknown, path: string): number {
  const result = finiteNumber(value, path);
  if (result < 0) return fail(path, "a non-negative number");
  return result;
}

function nonNegativeInteger(value: unknown, path: string): number {
  const result = nonNegativeNumber(value, path);
  if (!Number.isInteger(result)) return fail(path, "a non-negative integer");
  return result;
}

function nullableNonNegativeNumber(value: unknown, path: string): number | null {
  return value === null ? null : nonNegativeNumber(value, path);
}

function rate(value: unknown, path: string): number {
  const result = finiteNumber(value, path);
  if (result < 0 || result > 1) return fail(path, "a number between 0 and 1");
  return result;
}

function nullableRate(value: unknown, path: string): number | null {
  return value === null ? null : rate(value, path);
}

function timestamp(value: unknown, path: string): string {
  const result = string(value, path);
  if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(result) || Number.isNaN(Date.parse(result))) {
    return fail(path, "an ISO 8601 timestamp with a time-zone offset");
  }
  return result;
}

function uniqueIds(items: unknown[], path: string) {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const id = string(record(item, `${path}[${index}]`).id, `${path}[${index}].id`);
    if (seen.has(id)) fail(`${path}[${index}].id`, "a unique ID within the collection");
    seen.add(id);
  });
}

function validateWindow(value: unknown) {
  const item = record(value, "window");
  const range = string(item.range, "window.range");
  if (!ranges.has(range as AiGatewayOverviewRange)) {
    fail("window.range", 'one of "1d", "7d", "30d", or "90d"');
  }
  const from = timestamp(item.from, "window.from");
  const to = timestamp(item.to, "window.to");
  if (Date.parse(from) >= Date.parse(to)) fail("window", "from to be earlier than to");
  const granularity = string(item.granularity, "window.granularity");
  if (granularity !== "hour" && granularity !== "day") {
    fail("window.granularity", '"hour" or "day"');
  }
  const timeZone = string(item.timeZone, "window.timeZone");
  try {
    new Intl.DateTimeFormat("en", { timeZone });
  } catch {
    fail("window.timeZone", "a valid IANA time-zone name");
  }
  if (!/^[A-Z]{3}$/.test(string(item.currency, "window.currency"))) {
    fail("window.currency", "a three-letter ISO 4217 currency code");
  }
  timestamp(item.generatedAt, "window.generatedAt");
}

function validateSummary(value: unknown) {
  const item = record(value, "summary");
  nonNegativeInteger(item.requests, "summary.requests");
  nonNegativeInteger(item.costMicros, "summary.costMicros");
  nonNegativeInteger(item.inputTokens, "summary.inputTokens");
  nonNegativeInteger(item.outputTokens, "summary.outputTokens");
  nonNegativeInteger(item.errors, "summary.errors");
  rate(item.errorRate, "summary.errorRate");
  nullableNonNegativeNumber(item.p50LatencyMs, "summary.p50LatencyMs");
  nullableNonNegativeNumber(item.p95LatencyMs, "summary.p95LatencyMs");
  nullableNonNegativeNumber(item.p99LatencyMs, "summary.p99LatencyMs");
}

function validateTimeSeries(value: unknown) {
  const items = array(value, "timeSeries");
  let previousTimestamp = Number.NEGATIVE_INFINITY;
  items.forEach((value, index) => {
    const path = `timeSeries[${index}]`;
    const item = record(value, path);
    const currentTimestamp = Date.parse(timestamp(item.timestamp, `${path}.timestamp`));
    if (currentTimestamp <= previousTimestamp) {
      fail(`${path}.timestamp`, "timestamps in ascending order");
    }
    previousTimestamp = currentTimestamp;
    nonNegativeInteger(item.requestCount, `${path}.requestCount`);
    nonNegativeInteger(item.costMicros, `${path}.costMicros`);
    nonNegativeInteger(item.inputTokens, `${path}.inputTokens`);
    nonNegativeInteger(item.outputTokens, `${path}.outputTokens`);
    nonNegativeInteger(item.errorCount, `${path}.errorCount`);
    nullableRate(item.errorRate, `${path}.errorRate`);
    nullableNonNegativeNumber(item.p95LatencyMs, `${path}.p95LatencyMs`);
  });
}

function validateProviders(value: unknown) {
  const items = array(value, "providers");
  uniqueIds(items, "providers");
  items.forEach((value, index) => {
    const path = `providers[${index}]`;
    const item = record(value, path);
    string(item.name, `${path}.name`);
    nonNegativeInteger(item.requestCount, `${path}.requestCount`);
    nonNegativeInteger(item.costMicros, `${path}.costMicros`);
  });
}

function validateLatencyDistribution(value: unknown) {
  const items = array(value, "latencyDistribution");
  uniqueIds(items, "latencyDistribution");
  items.forEach((value, index) => {
    const path = `latencyDistribution[${index}]`;
    const item = record(value, path);
    const lower = nonNegativeNumber(item.lowerMs, `${path}.lowerMs`);
    const upper = nullableNonNegativeNumber(item.upperMs, `${path}.upperMs`);
    if (upper !== null && upper <= lower) fail(`${path}.upperMs`, "a value greater than lowerMs");
    nonNegativeInteger(item.count, `${path}.count`);
  });
}

function validateMetrics(value: unknown) {
  const items = array(value, "metrics");
  uniqueIds(items, "metrics");
  items.forEach((value, index) => {
    const path = `metrics[${index}]`;
    const item = record(value, path);
    string(item.label, `${path}.label`);
    string(item.aggregation, `${path}.aggregation`);
    if (typeof item.unit !== "string") fail(`${path}.unit`, "a string");
    if (item.currentValue !== null) finiteNumber(item.currentValue, `${path}.currentValue`);
    const points = array(item.points, `${path}.points`);
    let previousTimestamp = Number.NEGATIVE_INFINITY;
    points.forEach((value, pointIndex) => {
      const pointPath = `${path}.points[${pointIndex}]`;
      const point = record(value, pointPath);
      const currentTimestamp = Date.parse(timestamp(point.timestamp, `${pointPath}.timestamp`));
      if (currentTimestamp <= previousTimestamp) {
        fail(`${pointPath}.timestamp`, "timestamps in ascending order");
      }
      previousTimestamp = currentTimestamp;
      if (point.value !== null) finiteNumber(point.value, `${pointPath}.value`);
    });
  });
}

function validateSlowestOperations(value: unknown) {
  const items = array(value, "slowestOperations");
  uniqueIds(items, "slowestOperations");
  items.forEach((value, index) => {
    const path = `slowestOperations[${index}]`;
    const item = record(value, path);
    string(item.name, `${path}.name`);
    string(item.kind, `${path}.kind`);
    nonNegativeNumber(item.p95LatencyMs, `${path}.p95LatencyMs`);
  });
}

function validateTopUsers(value: unknown) {
  const items = array(value, "topUsers");
  uniqueIds(items, "topUsers");
  items.forEach((value, index) => {
    const path = `topUsers[${index}]`;
    const item = record(value, path);
    string(item.label, `${path}.label`);
    nonNegativeInteger(item.requestCount, `${path}.requestCount`);
  });
}

/** Validates an exact API response before it reaches the rendering layer. */
export function parseAiGatewayOverviewData(value: unknown): AiGatewayOverviewData {
  const input = record(value, "root");
  validateWindow(input.window);
  validateSummary(input.summary);
  validateTimeSeries(input.timeSeries);
  validateProviders(input.providers);
  validateLatencyDistribution(input.latencyDistribution);
  validateMetrics(input.metrics);
  validateSlowestOperations(input.slowestOperations);
  validateTopUsers(input.topUsers);
  return value as AiGatewayOverviewData;
}

export function isAiGatewayOverviewData(value: unknown): value is AiGatewayOverviewData {
  try {
    parseAiGatewayOverviewData(value);
    return true;
  } catch {
    return false;
  }
}
