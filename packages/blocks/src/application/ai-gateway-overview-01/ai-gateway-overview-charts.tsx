"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  DonutSummary,
  TimeSeriesChart,
  chartTrendPreset,
  type ChartConfig,
} from "@zeron/ui/chart";
import { chartColor, chartStatusColors, createChartNumberFormatter, createChartTimeFormatter, type ChartDataTableProps } from "@zeron/ui/chart-primitives";
import type {
  AiGatewayLatencyBucket,
  AiGatewayMetricSeries,
  AiGatewayProviderUsage,
  AiGatewayTimeSeriesPoint,
} from "./ai-gateway-overview-types";

const gridStroke = "var(--border)";
const primaryColor = chartColor(1);
const secondaryColor = chartColor(2);
const dangerColor = chartStatusColors.danger;

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : NaN;
}

function chartDateFormatter(locale: string, timeZone: string, data?: readonly { timestamp: string }[]) {
  const intraday = !!data?.length && Date.parse(data.at(-1)!.timestamp) - Date.parse(data[0].timestamp) <= 86400000;
  return createChartTimeFormatter(locale, timeZone, intraday ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" });
}

function compactNumberFormatter(locale: string) {
  return createChartNumberFormatter(locale, { notation: "compact", maximumFractionDigits: 1 });
}

function chartTable(caption: string, rows: readonly { id: string; label: string; values: string[] }[], columns: string[]): ChartDataTableProps {
  return { caption, summary: "查看数据 / View data", columns, rows };
}

function timeTable(data: readonly { timestamp: string }[], caption: string, locale: string, timeZone: string, values: (index: number) => string[], columns: string[]) {
  const time = createChartTimeFormatter(locale, timeZone, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  return chartTable(caption, data.map((point, index) => ({ id: `${point.timestamp}-${index}`, label: time(point.timestamp), values: values(index) })), [timeZone, ...columns]);
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
      {...chartTrendPreset.axis}
      dataKey="timestamp"
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
  return <TimeSeriesChart className="h-64" data={data.map((point) => ({ timestamp: Date.parse(point.timestamp), values: { requests: point.requestCount } }))} series={[{ id: "requests", label, color: primaryColor }]} label={label} locale={locale} timeZone={timeZone} dataSummary="查看数据 / View data" />;
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
    <ChartContainer className="h-56 min-h-0" config={config} dataTable={timeTable(data, label, locale, timeZone, (index) => [formatCost(data[index].costMicros)], [label])}>
      <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 4, top: 8 }}>
        <CartesianGrid {...chartTrendPreset.grid} />
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
        <Bar isAnimationActive={false} dataKey="cost" fill="var(--color-cost)" radius={[4, 4, 0, 0]} />
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
    <ChartContainer className="h-56 min-h-0" config={config} dataTable={timeTable(data, `${labels.input} / ${labels.output}`, locale, timeZone, (index) => [createChartNumberFormatter(locale)(data[index].inputTokens), createChartNumberFormatter(locale)(data[index].outputTokens)], [labels.input, labels.output])}>
      <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 4, top: 8 }}>
        <CartesianGrid {...chartTrendPreset.grid} />
        <BaseAxis data={data} locale={locale} timeZone={timeZone} />
        <YAxis axisLine={false} tickFormatter={compactNumberFormatter(locale)} tickLine={false} width={56} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={chartDateFormatter(locale, timeZone, data)}
              valueFormatter={createChartNumberFormatter(locale)}
            />
          }
          cursor={{ stroke: gridStroke }}
        />
        <Area dataKey="inputTokens" fill="var(--color-inputTokens)" fillOpacity={0.12} stackId="tokens" stroke="var(--color-inputTokens)" type="linear" isAnimationActive={false} />
        <Area dataKey="outputTokens" fill="var(--color-outputTokens)" fillOpacity={0.24} stackId="tokens" stroke="var(--color-outputTokens)" type="linear" isAnimationActive={false} />
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
    <ChartContainer className="h-56 min-h-0" config={config} dataTable={chartTable(label, data.map((provider) => ({ id: provider.id, label: provider.name, values: [createChartNumberFormatter(locale)(provider.requestCount)] })), ["Provider", label])}>
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 4, right: 36 }}>
        <XAxis axisLine={false} hide type="number" />
        <YAxis axisLine={false} dataKey="name" tickLine={false} type="category" width={78} />
        <ChartTooltip content={<ChartTooltipContent valueFormatter={createChartNumberFormatter(locale)} />} cursor={{ fill: "var(--hover)" }} />
        <Bar isAnimationActive={false} dataKey="requestCount" fill="var(--color-requestCount)" radius={[0, 5, 5, 0]}>
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
    <ChartContainer className="h-56 min-h-0" config={config} dataTable={timeTable(data, label, locale, timeZone, (index) => [formatLatency(data[index].p95LatencyMs)], [label])}>
      <LineChart accessibilityLayer data={data} margin={{ left: 0, right: 6, top: 8 }}>
        <CartesianGrid {...chartTrendPreset.grid} />
        <BaseAxis data={data} locale={locale} timeZone={timeZone} />
        <YAxis axisLine={false} tickFormatter={(value) => formatLatency(Number(value))} tickLine={false} width={56} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={chartDateFormatter(locale, timeZone, data)} valueFormatter={(value) => formatLatency(numericValue(value))} />}
          cursor={{ stroke: gridStroke }}
        />
        <Line connectNulls={false} dataKey="p95LatencyMs" dot={false} stroke="var(--color-p95LatencyMs)" strokeWidth={2} type="linear" isAnimationActive={false} />
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
    <ChartContainer className="h-56 min-h-0" config={config} dataTable={timeTable(data, label, locale, timeZone, (index) => [createChartNumberFormatter(locale, { style: "percent", maximumFractionDigits: 1 })(data[index].errorRate)], [label])}>
      <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 6, top: 8 }}>
        <CartesianGrid {...chartTrendPreset.grid} />
        <BaseAxis data={data} locale={locale} timeZone={timeZone} />
        <YAxis axisLine={false} tickFormatter={(value) => `${value}%`} tickLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={chartDateFormatter(locale, timeZone, data)} valueFormatter={(value) => `${numericValue(value).toFixed(1)}%`} />} cursor={{ fill: "var(--hover)" }} />
        <Bar isAnimationActive={false} dataKey="rate" fill="var(--color-rate)" radius={[4, 4, 0, 0]} />
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
  const formatValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? `${createChartNumberFormatter(locale, { maximumFractionDigits: 1 })(value)}${metric.unit}` : "—";
  const valueAxisWidth = metric.unit === "ms" ? 64 : metric.unit === "%" ? 50 : 54;

  return (
    <ChartContainer className="h-36 min-h-0" config={config} dataTable={timeTable(metric.points, metric.label, locale, timeZone, (index) => [metric.points[index].value === null ? "—" : formatValue(metric.points[index].value)], [metric.label])}>
      <AreaChart accessibilityLayer data={metric.points} margin={{ bottom: 0, left: 0, right: 6, top: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...chartTrendPreset.grid} />
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
        <Area connectNulls={false} dataKey="value" fill={`url(#${gradientId})`} stroke="var(--color-value)" strokeWidth={2} type="linear" isAnimationActive={false} />
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
    { key: "p50", value: percentileBucket(buckets, percentiles.p50), color: chartColor(1) },
    { key: "p95", value: percentileBucket(buckets, percentiles.p95), color: chartColor(2) },
    { key: "p99", value: percentileBucket(buckets, percentiles.p99), color: chartColor(3) },
  ];

  return (
    <ChartContainer className="h-64 min-h-0" config={config} dataTable={chartTable(requestLabel, chartData.map((bucket) => ({ id: bucket.id, label: `${bucket.lowerMs}ms–${bucket.upperMs ?? "∞"}ms`, values: [String(bucket.count)] })), ["Latency", requestLabel])}>
      <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 6, top: 24 }}>
        <CartesianGrid {...chartTrendPreset.grid} />
        <XAxis axisLine={false} dataKey="id" tickFormatter={(_, index) => chartData[index]?.label ?? ""} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => String(value)} />} cursor={{ fill: "var(--hover)" }} />
        {markers.map((marker) => marker.value ? (
          <ReferenceLine key={marker.key} label={{ fill: marker.color, fontSize: 11, position: "insideTopLeft", value: marker.key }} stroke={marker.color} strokeDasharray="4 4" x={marker.value} />
        ) : null)}
        <Bar isAnimationActive={false} dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function ProviderCostDonut({
  className,
  data,
  formatCost,
  total: providedTotal,
  unassignedLabel = "Unassigned",
}: {
  className?: string;
  data: AiGatewayProviderUsage[];
  formatCost: (micros: number) => string;
  total?: number;
  unassignedLabel?: string;
}) {
  const assigned = data.reduce((sum, provider) => sum + provider.costMicros, 0);
  const total = providedTotal ?? assigned;
  const unassigned = Math.max(0, total - assigned);
  return <div className={className}><DonutSummary className="mx-auto max-w-44" innerRadius="65%" total={total} segments={data.map((provider) => ({ id: provider.id, label: provider.name, value: provider.costMicros }))} aria-label={`${data.map((provider) => `${provider.name}：${formatCost(provider.costMicros)}`).join("，")} · ${unassignedLabel} ${formatCost(unassigned)}`} center={<span className="text-body font-semibold">{formatCost(total)}</span>} /></div>;
}
