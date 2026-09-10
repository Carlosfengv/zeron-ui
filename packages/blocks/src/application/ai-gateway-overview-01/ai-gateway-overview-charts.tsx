"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@zeron/ui/chart";
import { cn } from "@zeron/ui/system/utils";
import type {
  AiGatewayLatencyBucket,
  AiGatewayMetricSeries,
  AiGatewayProviderUsage,
  AiGatewayTimeSeriesPoint,
} from "./ai-gateway-overview-types";

const gridStroke = "var(--border)";
const primaryColor = "var(--brand)";
const secondaryColor = "var(--info-border)";
const dangerColor = "var(--danger-border)";

const providerColors = [
  "var(--brand)",
  "var(--info-border)",
  "var(--success-border)",
  "var(--warning-border)",
  "var(--neutral-status-border)",
] as const;

function numericValue(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function chartDateFormatter(
  locale: string,
  timeZone: string,
  data?: readonly { timestamp: string }[],
) {
  const firstTimestamp = data?.at(0)?.timestamp;
  const lastTimestamp = data?.at(-1)?.timestamp;
  const isIntraday =
    firstTimestamp !== undefined &&
    lastTimestamp !== undefined &&
    Date.parse(lastTimestamp) - Date.parse(firstTimestamp) <= 86_400_000;
  const formatter = new Intl.DateTimeFormat(locale, {
    ...(isIntraday
      ? { hour: "numeric", minute: "2-digit" }
      : { day: "numeric", month: "short" }),
    timeZone,
  });
  return (value: string | number) => formatter.format(new Date(value));
}

function compactNumberFormatter(locale: string) {
  const formatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return (value: unknown) => formatter.format(numericValue(value));
}

function BaseAxis({
  data,
  locale,
  timeZone,
}: {
  data: readonly { timestamp: string }[];
  locale: string;
  timeZone: string;
}) {
  return (
    <XAxis
      axisLine={false}
      dataKey="timestamp"
      minTickGap={28}
      tickFormatter={chartDateFormatter(locale, timeZone, data)}
      tickLine={false}
    />
  );
}

export function RequestsAreaChart({
  data,
  label,
  locale,
  timeZone,
}: {
  data: AiGatewayTimeSeriesPoint[];
  label: string;
  locale: string;
  timeZone: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const config = {
    requestCount: { label, color: primaryColor },
  } satisfies ChartConfig;

  return (
    <ChartContainer className="h-64 min-h-0" config={config}>
      <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-requestCount)" stopOpacity={0.24} />
            <stop offset="100%" stopColor="var(--color-requestCount)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <BaseAxis data={data} locale={locale} timeZone={timeZone} />
        <YAxis axisLine={false} tickLine={false} width={40} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={chartDateFormatter(locale, timeZone, data)}
              valueFormatter={compactNumberFormatter(locale)}
            />
          }
          cursor={{ stroke: gridStroke }}
        />
        <Area
          dataKey="requestCount"
          fill={`url(#${gradientId})`}
          stroke="var(--color-requestCount)"
          strokeWidth={2}
          type="monotone"
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function CostBarChart({
  data,
  formatCost,
  label,
  locale,
  timeZone,
}: {
  data: AiGatewayTimeSeriesPoint[];
  formatCost: (micros: number) => string;
  label: string;
  locale: string;
  timeZone: string;
}) {
  const chartData = data.map((point) => ({ ...point, cost: point.costMicros / 1_000_000 }));
  const config = { cost: { label, color: primaryColor } } satisfies ChartConfig;

  return (
    <ChartContainer className="h-56 min-h-0" config={config}>
      <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 4, top: 8 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <BaseAxis data={data} locale={locale} timeZone={timeZone} />
        <YAxis axisLine={false} tickFormatter={(value) => formatCost(Number(value) * 1_000_000)} tickLine={false} width={58} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={chartDateFormatter(locale, timeZone, data)}
              valueFormatter={(value) => formatCost(numericValue(value) * 1_000_000)}
            />
          }
          cursor={{ fill: "var(--hover)" }}
        />
        <Bar dataKey="cost" fill="var(--color-cost)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function TokensAreaChart({
  data,
  labels,
  locale,
  timeZone,
}: {
  data: AiGatewayTimeSeriesPoint[];
  labels: { input: string; output: string };
  locale: string;
  timeZone: string;
}) {
  const config = {
    inputTokens: { label: labels.input, color: primaryColor },
    outputTokens: { label: labels.output, color: secondaryColor },
  } satisfies ChartConfig;

  return (
    <ChartContainer className="h-56 min-h-0" config={config}>
      <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 4, top: 8 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <BaseAxis data={data} locale={locale} timeZone={timeZone} />
        <YAxis axisLine={false} tickFormatter={compactNumberFormatter(locale)} tickLine={false} width={56} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={chartDateFormatter(locale, timeZone, data)}
              valueFormatter={compactNumberFormatter(locale)}
            />
          }
          cursor={{ stroke: gridStroke }}
        />
        <Area dataKey="inputTokens" fill="var(--color-inputTokens)" fillOpacity={0.12} stackId="tokens" stroke="var(--color-inputTokens)" type="monotone" />
        <Area dataKey="outputTokens" fill="var(--color-outputTokens)" fillOpacity={0.24} stackId="tokens" stroke="var(--color-outputTokens)" type="monotone" />
      </AreaChart>
    </ChartContainer>
  );
}

export function ProviderRequestsChart({
  data,
  label,
  locale,
}: {
  data: AiGatewayProviderUsage[];
  label: string;
  locale: string;
}) {
  const config = { requestCount: { label, color: primaryColor } } satisfies ChartConfig;

  return (
    <ChartContainer className="h-56 min-h-0" config={config}>
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 4, right: 36 }}>
        <XAxis axisLine={false} hide type="number" />
        <YAxis axisLine={false} dataKey="name" tickLine={false} type="category" width={78} />
        <ChartTooltip content={<ChartTooltipContent valueFormatter={compactNumberFormatter(locale)} />} cursor={{ fill: "var(--hover)" }} />
        <Bar dataKey="requestCount" fill="var(--color-requestCount)" radius={[0, 5, 5, 0]}>
          <LabelList dataKey="requestCount" fill="var(--fg-subtle)" formatter={compactNumberFormatter(locale)} position="right" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function LatencySparkline({
  data,
  formatLatency,
  label,
  locale,
  timeZone,
}: {
  data: AiGatewayTimeSeriesPoint[];
  formatLatency: (value: number | null) => string;
  label: string;
  locale: string;
  timeZone: string;
}) {
  const config = { p95LatencyMs: { label, color: primaryColor } } satisfies ChartConfig;

  return (
    <ChartContainer className="h-56 min-h-0" config={config}>
      <LineChart accessibilityLayer data={data} margin={{ left: 0, right: 6, top: 8 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <BaseAxis data={data} locale={locale} timeZone={timeZone} />
        <YAxis axisLine={false} tickFormatter={(value) => formatLatency(Number(value))} tickLine={false} width={56} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={chartDateFormatter(locale, timeZone, data)} valueFormatter={(value) => formatLatency(numericValue(value))} />}
          cursor={{ stroke: gridStroke }}
        />
        <Line connectNulls dataKey="p95LatencyMs" dot={false} stroke="var(--color-p95LatencyMs)" strokeWidth={2} type="monotone" />
      </LineChart>
    </ChartContainer>
  );
}

export function ErrorRateChart({
  data,
  label,
  locale,
  timeZone,
}: {
  data: AiGatewayTimeSeriesPoint[];
  label: string;
  locale: string;
  timeZone: string;
}) {
  const chartData = data.map((point) => ({ ...point, rate: point.errorRate === null ? null : point.errorRate * 100 }));
  const config = { rate: { label, color: dangerColor } } satisfies ChartConfig;

  return (
    <ChartContainer className="h-56 min-h-0" config={config}>
      <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 6, top: 8 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <BaseAxis data={data} locale={locale} timeZone={timeZone} />
        <YAxis axisLine={false} tickFormatter={(value) => `${value}%`} tickLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={chartDateFormatter(locale, timeZone, data)} valueFormatter={(value) => `${numericValue(value).toFixed(1)}%`} />} cursor={{ fill: "var(--hover)" }} />
        <Bar dataKey="rate" fill="var(--color-rate)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function MetricSeriesChart({
  metric,
  locale,
  timeZone,
}: {
  metric: AiGatewayMetricSeries;
  locale: string;
  timeZone: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const config = { value: { label: metric.label, color: primaryColor } } satisfies ChartConfig;
  const formatValue = (value: unknown) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(numericValue(value))}${metric.unit}`;
  const valueAxisWidth = metric.unit === "ms" ? 64 : metric.unit === "%" ? 50 : 54;

  return (
    <ChartContainer className="h-36 min-h-0" config={config}>
      <AreaChart accessibilityLayer data={metric.points} margin={{ bottom: 0, left: 0, right: 6, top: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="timestamp"
          minTickGap={24}
          tickFormatter={chartDateFormatter(locale, timeZone, metric.points)}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          domain={["dataMin", "dataMax"]}
          tickCount={3}
          tickFormatter={formatValue}
          tickLine={false}
          tickMargin={6}
          width={valueAxisWidth}
        />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={chartDateFormatter(locale, timeZone, metric.points)} valueFormatter={formatValue} />} cursor={{ stroke: gridStroke }} />
        <Area connectNulls dataKey="value" fill={`url(#${gradientId})`} stroke="var(--color-value)" strokeWidth={2} type="monotone" />
      </AreaChart>
    </ChartContainer>
  );
}

function latencyBucketLabel(bucket: AiGatewayLatencyBucket) {
  return bucket.upperMs === null
    ? `${bucket.lowerMs / 1000}s+`
    : bucket.upperMs < 1000
      ? `${bucket.upperMs}ms`
      : `${bucket.upperMs / 1000}s`;
}

function percentileBucket(buckets: AiGatewayLatencyBucket[], value: number | null) {
  if (value === null) return null;
  return buckets.find((bucket) => value >= bucket.lowerMs && (bucket.upperMs === null || value < bucket.upperMs))?.id ?? null;
}

export function LatencyDistributionChart({
  buckets,
  percentiles,
  requestLabel,
}: {
  buckets: AiGatewayLatencyBucket[];
  percentiles: { p50: number | null; p95: number | null; p99: number | null };
  requestLabel: string;
}) {
  const chartData = buckets.map((bucket) => ({ ...bucket, label: latencyBucketLabel(bucket) }));
  const config = { count: { label: requestLabel, color: primaryColor } } satisfies ChartConfig;
  const markers = [
    { key: "p50", value: percentileBucket(buckets, percentiles.p50), color: "var(--success-border)" },
    { key: "p95", value: percentileBucket(buckets, percentiles.p95), color: "var(--warning-border)" },
    { key: "p99", value: percentileBucket(buckets, percentiles.p99), color: dangerColor },
  ];

  return (
    <ChartContainer className="h-64 min-h-0" config={config}>
      <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 6, top: 24 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis axisLine={false} dataKey="id" tickFormatter={(_, index) => chartData[index]?.label ?? ""} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => String(value)} />} cursor={{ fill: "var(--hover)" }} />
        {markers.map((marker) => marker.value ? (
          <ReferenceLine key={marker.key} label={{ fill: marker.color, fontSize: 11, position: "insideTopLeft", value: marker.key }} stroke={marker.color} strokeDasharray="4 4" x={marker.value} />
        ) : null)}
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function ProviderCostDonut({
  className,
  data,
  formatCost,
}: {
  className?: string;
  data: AiGatewayProviderUsage[];
  formatCost: (micros: number) => string;
}) {
  const chartData = data.map((provider, index) => ({
    ...provider,
    color: providerColors[index % providerColors.length],
    value: provider.costMicros,
  }));
  const config = Object.fromEntries(
    chartData.map((provider) => [provider.id, { label: provider.name, color: provider.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer className={cn("h-52 min-h-0", className)} config={config}>
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent hideIndicator valueFormatter={(value) => formatCost(numericValue(value))} />} />
        <Pie data={chartData} dataKey="value" innerRadius="52%" nameKey="name" outerRadius="80%" paddingAngle={3} strokeWidth={0}>
          {chartData.map((entry) => <Cell fill={entry.color} key={entry.id} />)}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export { providerColors };
