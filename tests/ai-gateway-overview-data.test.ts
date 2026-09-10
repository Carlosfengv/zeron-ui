import { describe, expect, it } from "vitest";
import { createAiGatewayOverviewDemoData } from "../packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-demo-data";
import {
  isAiGatewayOverviewData,
  parseAiGatewayOverviewData,
} from "../packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-data";

describe("AiGatewayOverview demo data", () => {
  it.each(["1d", "7d", "30d", "90d"] as const)("builds a consistent %s window", (range) => {
    const data = createAiGatewayOverviewDemoData(range);
    const requestTotal = data.timeSeries.reduce((sum, point) => sum + point.requestCount, 0);
    const tokenTotal = data.timeSeries.reduce((sum, point) => sum + point.inputTokens + point.outputTokens, 0);

    expect(data.window.range).toBe(range);
    expect(data.window.granularity).toBe(range === "1d" || range === "7d" ? "hour" : "day");
    expect(Date.parse(data.window.from)).toBeLessThan(Date.parse(data.window.to));
    expect(data.summary.requests).toBe(requestTotal);
    expect(data.summary.inputTokens + data.summary.outputTokens).toBe(tokenTotal);
    expect(data.providers.reduce((sum, provider) => sum + provider.requestCount, 0)).toBe(requestTotal);
    expect(data.timeSeries.every((point, index, points) => index === 0 || point.timestamp > points[index - 1]!.timestamp)).toBe(true);
  });

  it("uses stable IDs and preserves nullable telemetry", () => {
    const data = createAiGatewayOverviewDemoData("30d");
    const ids = [
      ...data.providers.map((provider) => provider.id),
      ...data.latencyDistribution.map((bucket) => bucket.id),
      ...data.metrics.map((metric) => metric.id),
      ...data.slowestOperations.map((operation) => operation.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
    expect(data.latencyDistribution.at(-1)?.upperMs).toBeNull();
  });

  it("validates exact API responses before rendering", () => {
    const data = createAiGatewayOverviewDemoData("1d");

    expect(parseAiGatewayOverviewData(data)).toBe(data);
    expect(isAiGatewayOverviewData(data)).toBe(true);
    expect(isAiGatewayOverviewData({ ...data, providers: undefined })).toBe(false);
    expect(() => parseAiGatewayOverviewData({ ...data, summary: { ...data.summary, errorRate: 12 } }))
      .toThrow("summary.errorRate");
  });
});
