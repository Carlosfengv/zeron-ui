"use client";

import { curveLinear } from "@visx/curve";
import { Area, AreaChart } from "@zeron/ui/area-chart";
import { Bar, BarChart, BarXAxis, BarYAxis } from "@zeron/ui/bar-chart";
import { Line, LineChart } from "@zeron/ui/line-chart";
import { Grid, XAxis, YAxis, ChartTooltip, TooltipContent, ReferenceLine, useChartStable } from "@zeron/ui/chart-core";
import { DonutSummary, TimeSeriesChart } from "@zeron/ui/chart";
import { ChartDataTable, chartColor, chartSeriesColor, chartStatusColors, createChartNumberFormatter, createChartTimeFormatter, type ChartDataTableProps } from "@zeron/ui/chart-primitives";
import type { AiGatewayLatencyBucket, AiGatewayMetricSeries, AiGatewayProviderUsage, AiGatewayTimeSeriesPoint } from "./ai-gateway-overview-types";

const primaryColor = chartColor(1);
const secondaryColor = chartColor(2);
const dangerColor = chartStatusColors.danger;

const providerColors = new Map([
  ["openai", chartColor(1)],
  ["anthropic", chartColor(2)],
  ["google", chartColor(3)],
  ["mistral", chartColor(4)],
]);

export function providerChartColor(id: string) {
  return providerColors.get(id) ?? chartSeriesColor(id);
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

export function RequestsAreaChart({ data, label, locale, timeZone }: { data: AiGatewayTimeSeriesPoint[]; label: string; locale: string; timeZone: string }) {
  return <TimeSeriesChart className="h-64" data={data.map((point) => ({ timestamp: Date.parse(point.timestamp), values: { requests: point.requestCount } }))} series={[{ id: "requests", label, color: primaryColor }]} label={label} locale={locale} timeZone={timeZone} dataSummary="查看数据 / View data" />;
}

export function CostBarChart({ data, formatCost, label, locale, timeZone }: { data: AiGatewayTimeSeriesPoint[]; formatCost: (micros: number) => string; label: string; locale: string; timeZone: string }) {
  const date = chartDateFormatter(locale, timeZone, data);
  const chartData = data.map((point) => ({ ...point, cost: point.costMicros / 1_000_000 }));
  const formatValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? formatCost(value * 1_000_000) : "—";
  return <div className="min-w-0" aria-label={label}>
    <BarChart className="h-56" aspectRatio="auto" data={chartData} xDataKey="timestamp" margin={{ left: 64, right: 8, top: 12, bottom: 36 }} animationDuration={0}>
      <Grid horizontal /><BarXAxis formatLabel={date} maxLabels={5} /><YAxis formatValue={formatValue} />
      <Bar dataKey="cost" fill={primaryColor} lineCap={4} animate={false} />
      <ChartTooltip showDatePill={false} showDots={false} content={({ point }) => <TooltipContent title={date(String(point.timestamp))} rows={[{ label, color: primaryColor, value: formatValue(point.cost) }]} />} />
    </BarChart>
    <ChartDataTable {...timeTable(data, label, locale, timeZone, (index) => [formatCost(data[index].costMicros)], [label])} />
  </div>;
}

export function TokensAreaChart({ data, labels, locale, timeZone }: { data: AiGatewayTimeSeriesPoint[]; labels: { input: string; output: string }; locale: string; timeZone: string }) {
  const date = chartDateFormatter(locale, timeZone, data);
  const number = createChartNumberFormatter(locale);
  return <div className="min-w-0" aria-label={`${labels.input} / ${labels.output}`}>
    <AreaChart className="h-56" aspectRatio="auto" data={data.map(point => ({ ...point, timestamp: Date.parse(point.timestamp) }))} xDataKey="timestamp" margin={{ left: 56, right: 8, top: 12, bottom: 36 }} animationDuration={0} yDomainTween={false}>
      <Grid horizontal /><XAxis formatDate={(value) => date(value.getTime())} /><YAxis formatValue={compactNumberFormatter(locale)} />
      <Area dataKey="inputTokens" fill={primaryColor} stroke={primaryColor} fillOpacity={0.12} gradientToOpacity={0.12} stackId="tokens" curve={curveLinear} animate={false} showMarkers={data.length === 1} />
      <Area dataKey="outputTokens" fill={secondaryColor} stroke={secondaryColor} fillOpacity={0.24} gradientToOpacity={0.24} stackId="tokens" curve={curveLinear} animate={false} showMarkers={data.length === 1} />
      <ChartTooltip showDatePill={false} content={({ point }) => <TooltipContent title={date(Number(point.timestamp))} rows={[{ label: labels.input, color: primaryColor, value: number(point.inputTokens) }, { label: labels.output, color: secondaryColor, value: number(point.outputTokens) }]} />} />
    </AreaChart>
    <ChartDataTable {...timeTable(data, `${labels.input} / ${labels.output}`, locale, timeZone, (index) => [number(data[index].inputTokens), number(data[index].outputTokens)], [labels.input, labels.output])} />
  </div>;
}

function ProviderCountLabels({ formatValue }: { formatValue: (value: unknown) => string }) {
  const { data, barScale, bandWidth, yScale, margin } = useChartStable();
  if (!barScale) return null;
  return <g aria-hidden="true" pointerEvents="none">{data.map((point, index) => typeof point.requestCount === "number" && Number.isFinite(point.requestCount) && point.requestCount >= 0 ? <text key={index} x={margin.left + yScale(point.requestCount) + 6} y={margin.top + (barScale(String(point.name)) ?? 0) + (bandWidth ?? 0) / 2} dominantBaseline="middle" fill="var(--fg-subtle)" className="text-label">{formatValue(point.requestCount)}</text> : null)}</g>;
}

export function ProviderRequestsChart({ data, label, locale }: { data: AiGatewayProviderUsage[]; label: string; locale: string }) {
  const number = createChartNumberFormatter(locale);
  return <div className="min-w-0" aria-label={label}>
    <BarChart className="h-56" aspectRatio="auto" data={data.map(point => ({ ...point }))} xDataKey="name" orientation="horizontal" margin={{ left: 80, right: 48, top: 8, bottom: 8 }} animationDuration={0}>
      <BarYAxis /><Bar dataKey="requestCount" fill={primaryColor} lineCap={5} animate={false} /><ProviderCountLabels formatValue={compactNumberFormatter(locale)} />
      <ChartTooltip showDatePill={false} showDots={false} content={({ point }) => <TooltipContent title={String(point.name)} rows={[{ label, color: primaryColor, value: number(point.requestCount) }]} />} />
    </BarChart>
    <ChartDataTable {...chartTable(label, data.map(provider => ({ id: provider.id, label: provider.name, values: [number(provider.requestCount)] })), ["Provider", label])} />
  </div>;
}

export function LatencySparkline({ data, formatLatency, label, locale, timeZone }: { data: AiGatewayTimeSeriesPoint[]; formatLatency: (value: number | null) => string; label: string; locale: string; timeZone: string }) {
  const date = chartDateFormatter(locale, timeZone, data);
  const formatValue = (value: unknown) => formatLatency(typeof value === "number" && Number.isFinite(value) ? value : null);
  return <div className="min-w-0" aria-label={label}>
    <LineChart className="h-56" aspectRatio="auto" data={data.map(point => ({ ...point, timestamp: Date.parse(point.timestamp) }))} xDataKey="timestamp" margin={{ left: 56, right: 8, top: 12, bottom: 36 }} animationDuration={0} yDomainTween={false}>
      <Grid horizontal /><XAxis formatDate={(value) => date(value.getTime())} /><YAxis formatValue={formatValue} />
      <Line dataKey="p95LatencyMs" stroke={primaryColor} strokeWidth={2} curve={curveLinear} animate={false} fadeEdges={false} showMarkers={data.length === 1} />
      <ChartTooltip showDatePill={false} content={({ point }) => <TooltipContent title={date(Number(point.timestamp))} rows={[{ label, color: primaryColor, value: formatValue(point.p95LatencyMs) }]} />} />
    </LineChart>
    <ChartDataTable {...timeTable(data, label, locale, timeZone, index => [formatLatency(data[index].p95LatencyMs)], [label])} />
  </div>;
}

export function ErrorRateChart({ data, label, locale, timeZone }: { data: AiGatewayTimeSeriesPoint[]; label: string; locale: string; timeZone: string }) {
  const date = chartDateFormatter(locale, timeZone, data);
  const percent = createChartNumberFormatter(locale, { style: "percent", maximumFractionDigits: 1 });
  return <div className="min-w-0" aria-label={label}>
    <BarChart className="h-56" aspectRatio="auto" data={data.map(point => ({ ...point }))} xDataKey="timestamp" margin={{ left: 48, right: 8, top: 12, bottom: 36 }} animationDuration={0}>
      <Grid horizontal /><BarXAxis formatLabel={date} maxLabels={5} /><YAxis formatValue={percent} /><Bar dataKey="errorRate" fill={dangerColor} lineCap={4} animate={false} />
      <ChartTooltip showDatePill={false} showDots={false} content={({ point }) => <TooltipContent title={date(String(point.timestamp))} rows={[{ label, color: dangerColor, value: percent(point.errorRate) }]} />} />
    </BarChart>
    <ChartDataTable {...timeTable(data, label, locale, timeZone, index => [percent(data[index].errorRate)], [label])} />
  </div>;
}

export function MetricSeriesChart({ metric, locale, timeZone }: { metric: AiGatewayMetricSeries; locale: string; timeZone: string }) {
  const date = chartDateFormatter(locale, timeZone, metric.points);
  const formatValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? `${createChartNumberFormatter(locale, { maximumFractionDigits: 1 })(value)}${metric.unit}` : "—";
  const valueAxisWidth = metric.unit === "ms" ? 64 : metric.unit === "%" ? 50 : 54;
  return <div className="min-w-0" aria-label={metric.label}>
    <AreaChart className="h-36" aspectRatio="auto" data={metric.points.map(point => ({ ...point, timestamp: Date.parse(point.timestamp) }))} xDataKey="timestamp" margin={{ left: valueAxisWidth, right: 8, top: 12, bottom: 36 }} animationDuration={0} yDomainTween={false} yDomain={["dataMin", "dataMax"]}>
      <Grid horizontal /><XAxis numTicks={3} formatDate={(value) => date(value.getTime())} /><YAxis numTicks={3} formatValue={formatValue} />
      <Area dataKey="value" fill={primaryColor} stroke={primaryColor} fillOpacity={0.22} curve={curveLinear} animate={false} showMarkers={metric.points.length === 1} />
      <ChartTooltip showDatePill={false} content={({ point }) => <TooltipContent title={date(Number(point.timestamp))} rows={[{ label: metric.label, color: primaryColor, value: formatValue(point.value) }]} />} />
    </AreaChart>
    <ChartDataTable {...timeTable(metric.points, metric.label, locale, timeZone, index => [formatValue(metric.points[index].value)], [metric.label])} />
  </div>;
}

function latencyBucketLabel(bucket: AiGatewayLatencyBucket) {
  return bucket.upperMs === null ? `${bucket.lowerMs / 1000}s+` : bucket.upperMs < 1000 ? `${bucket.upperMs}ms` : `${bucket.upperMs / 1000}s`;
}
function percentileBucket(buckets: AiGatewayLatencyBucket[], value: number | null) {
  if (value === null) return null;
  return buckets.find(bucket => value >= bucket.lowerMs && (bucket.upperMs === null || value < bucket.upperMs))?.id ?? null;
}
export function LatencyDistributionChart({ buckets, percentiles, requestLabel }: { buckets: AiGatewayLatencyBucket[]; percentiles: { p50: number | null; p95: number | null; p99: number | null }; requestLabel: string }) {
  const chartData = buckets.map(bucket => ({ ...bucket, label: latencyBucketLabel(bucket) }));
  const markers = [{ key: "p50", value: percentileBucket(buckets, percentiles.p50), color: chartColor(1) }, { key: "p95", value: percentileBucket(buckets, percentiles.p95), color: chartColor(2) }, { key: "p99", value: percentileBucket(buckets, percentiles.p99), color: chartColor(3) }];
  return <div className="min-w-0" aria-label={requestLabel}>
    <BarChart className="h-64" aspectRatio="auto" data={chartData} xDataKey="label" margin={{ left: 40, right: 8, top: 28, bottom: 36 }} animationDuration={0}>
      <Grid horizontal /><BarXAxis /><YAxis /><Bar dataKey="count" fill={primaryColor} lineCap={4} animate={false} />
      {markers.map(marker => marker.value ? <ReferenceLine key={marker.key} x={chartData.find(bucket => bucket.id === marker.value)?.label} stroke={marker.color} label={marker.key} /> : null)}
      <ChartTooltip showDatePill={false} showDots={false} content={({ point }) => <TooltipContent title={`${point.lowerMs}ms–${point.upperMs ?? "∞"}ms`} rows={[{ label: requestLabel, color: primaryColor, value: String(point.count ?? "—") }]} />} />
    </BarChart>
    <ChartDataTable {...chartTable(requestLabel, chartData.map(bucket => ({ id: bucket.id, label: `${bucket.lowerMs}ms–${bucket.upperMs ?? "∞"}ms`, values: [String(bucket.count)] })), ["Latency", requestLabel])} />
  </div>;
}

export function ProviderCostDonut({ className, data, formatCost, total: providedTotal, unassignedLabel = "Unassigned" }: { className?: string; data: AiGatewayProviderUsage[]; formatCost: (micros: number) => string; total?: number; unassignedLabel?: string }) {
  const assigned = data.reduce((sum, provider) => sum + provider.costMicros, 0);
  const total = providedTotal ?? assigned;
  const unassigned = Math.max(0, total - assigned);
  return <div className={className}><DonutSummary className="mx-auto max-w-44" innerRadius="74.6%" total={total} segments={data.map(provider => ({ id: provider.id, label: provider.name, value: provider.costMicros, color: providerChartColor(provider.id) }))} aria-label={`${data.map(provider => `${provider.name}：${formatCost(provider.costMicros)}`).join("，")} · ${unassignedLabel} ${formatCost(unassigned)}`} center={<span className="text-body font-semibold">{formatCost(total)}</span>} /></div>;
}
