import type {
  AiGatewayLatencyBucket,
  AiGatewayMetricSeries,
  AiGatewayOverviewData,
  AiGatewayOverviewRange,
  AiGatewayProviderUsage,
  AiGatewayTimeSeriesPoint,
} from "./ai-gateway-overview-types";

const DAY_MS = 86_400_000;

const rangeDays: Record<AiGatewayOverviewRange, number> = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const providerProfiles = [
  { id: "openai", name: "OpenAI", share: 0.46 },
  { id: "anthropic", name: "Anthropic", share: 0.29 },
  { id: "google", name: "Google", share: 0.16 },
  { id: "mistral", name: "Mistral", share: 0.09 },
] as const;

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildTimeSeries(
  range: AiGatewayOverviewRange,
  to: Date,
): AiGatewayTimeSeriesPoint[] {
  const days = rangeDays[range];
  const points = range === "1d" ? 24 : range === "7d" ? 28 : range === "30d" ? 30 : 45;
  const interval = (days * DAY_MS) / points;

  return Array.from({ length: points }, (_, index) => {
    const progress = index / Math.max(1, points - 1);
    const wave = Math.sin(index * 0.78) * 0.18 + Math.cos(index * 0.31) * 0.1;
    const launchPeak = Math.exp(-((progress - 0.84) ** 2) / 0.012) * 2.8;
    const requestCount = Math.max(0, Math.round(3 + days / 8 + wave * 8 + launchPeak * 8));
    const errorCount = index % 9 === 3 ? Math.max(1, Math.round(requestCount * 0.18)) : 0;
    const inputTokens = Math.round(requestCount * (1680 + (index % 5) * 210));
    const outputTokens = Math.round(requestCount * (760 + (index % 4) * 140));
    const timestamp = new Date(to.getTime() - (points - 1 - index) * interval);

    return {
      timestamp: timestamp.toISOString(),
      requestCount,
      costMicros: Math.round(inputTokens * 0.12 + outputTokens * 0.45),
      inputTokens,
      outputTokens,
      errorCount,
      errorRate: requestCount === 0 ? null : errorCount / requestCount,
      p95LatencyMs:
        requestCount === 0
          ? null
          : Math.round(1280 + Math.abs(Math.sin(index * 0.52)) * 2700 + launchPeak * 1900),
    };
  });
}

function buildProviders(requests: number, costMicros: number): AiGatewayProviderUsage[] {
  return providerProfiles.map((provider, index) => ({
    id: provider.id,
    name: provider.name,
    requestCount:
      index === providerProfiles.length - 1
        ? Math.max(
            0,
            requests -
              providerProfiles
                .slice(0, -1)
                .reduce((sum, item) => sum + Math.round(requests * item.share), 0),
          )
        : Math.round(requests * provider.share),
    costMicros: Math.round(costMicros * provider.share),
  }));
}

function buildMetrics(
  series: AiGatewayTimeSeriesPoint[],
): AiGatewayMetricSeries[] {
  const templates = [
    { id: "cache-hit", label: "Cache hit rate", aggregation: "Average", unit: "%" },
    { id: "ttft", label: "Time to first token", aggregation: "p95", unit: "ms" },
    { id: "tokens-per-request", label: "Tokens per request", aggregation: "Average", unit: "" },
  ] as const;

  return templates.map((template) => {
    const points = series.map((point, index) => {
      let value: number | null;
      if (template.id === "cache-hit") {
        value = round(56 + Math.sin(index * 0.45) * 12 + (index % 5), 1);
      } else if (template.id === "ttft") {
        value = point.p95LatencyMs === null ? null : Math.round(point.p95LatencyMs * 0.23);
      } else {
        value =
          point.requestCount === 0
            ? null
            : Math.round((point.inputTokens + point.outputTokens) / point.requestCount);
      }
      return { timestamp: point.timestamp, value };
    });

    return {
      ...template,
      currentValue: points.at(-1)?.value ?? null,
      points,
    };
  });
}

const latencyDistribution: AiGatewayLatencyBucket[] = [
  { id: "0-250", lowerMs: 0, upperMs: 250, count: 5 },
  { id: "250-500", lowerMs: 250, upperMs: 500, count: 12 },
  { id: "500-1000", lowerMs: 500, upperMs: 1000, count: 23 },
  { id: "1000-2000", lowerMs: 1000, upperMs: 2000, count: 36 },
  { id: "2000-4000", lowerMs: 2000, upperMs: 4000, count: 18 },
  { id: "4000-8000", lowerMs: 4000, upperMs: 8000, count: 9 },
  { id: "8000+", lowerMs: 8000, upperMs: null, count: 4 },
];

export function createAiGatewayOverviewDemoData(
  range: AiGatewayOverviewRange = "30d",
): AiGatewayOverviewData {
  const to = new Date("2026-09-10T10:00:00.000Z");
  const days = rangeDays[range];
  const timeSeries = buildTimeSeries(range, to);
  const requests = timeSeries.reduce((sum, point) => sum + point.requestCount, 0);
  const costMicros = timeSeries.reduce((sum, point) => sum + point.costMicros, 0);
  const inputTokens = timeSeries.reduce((sum, point) => sum + point.inputTokens, 0);
  const outputTokens = timeSeries.reduce((sum, point) => sum + point.outputTokens, 0);
  const errors = timeSeries.reduce((sum, point) => sum + point.errorCount, 0);
  const validLatencies = timeSeries
    .map((point) => point.p95LatencyMs)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  return {
    window: {
      range,
      from: new Date(to.getTime() - days * DAY_MS).toISOString(),
      to: to.toISOString(),
      granularity: range === "1d" || range === "7d" ? "hour" : "day",
      timeZone: "UTC",
      currency: "USD",
      generatedAt: to.toISOString(),
    },
    summary: {
      requests,
      costMicros,
      inputTokens,
      outputTokens,
      errors,
      errorRate: requests === 0 ? 0 : errors / requests,
      p50LatencyMs: validLatencies[Math.floor(validLatencies.length * 0.5)] ?? null,
      p95LatencyMs: validLatencies[Math.floor(validLatencies.length * 0.95)] ?? null,
      p99LatencyMs: validLatencies[Math.floor(validLatencies.length * 0.99)] ?? null,
    },
    timeSeries,
    providers: buildProviders(requests, costMicros),
    latencyDistribution,
    metrics: buildMetrics(timeSeries),
    slowestOperations: [
      { id: "chat-completions", name: "Chat completions", kind: "OpenAI", p95LatencyMs: 8482 },
      { id: "messages", name: "Messages", kind: "Anthropic", p95LatencyMs: 6110 },
      { id: "generate-content", name: "Generate content", kind: "Google", p95LatencyMs: 4920 },
    ],
    topUsers: [],
  };
}

export const aiGatewayOverviewDemoData = createAiGatewayOverviewDemoData("30d");
