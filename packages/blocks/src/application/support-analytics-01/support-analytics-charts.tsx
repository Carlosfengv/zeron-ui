"use client";

import { useId } from "react";
import { Bar, BarChart, Line, LineChart, ReferenceLine, XAxis, YAxis, type LabelProps } from "recharts";
import { Badge } from "@zeron/ui/badge";
import { chartColor } from "@zeron/ui/chart-primitives";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@zeron/ui/chart";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { formatCount, formatDate, metricTrendPoints, trendSummary } from "./support-analytics-data";
import type { SupportAnalyticsLabels, SupportAnalyticsMetric, SupportAnalyticsSnapshot } from "./support-analytics-types";

const averageColor = { base: "var(--inverse-background)", onStrong: "var(--fg-on-inverse)" };

function AverageMarker({ viewBox, text }: LabelProps & { text: string }) {
  if (!viewBox || !("x" in viewBox) || !("y" in viewBox) || !("width" in viewBox) || typeof viewBox.x !== "number" || typeof viewBox.y !== "number" || typeof viewBox.width !== "number") return null;
  return <g aria-hidden="true" pointerEvents="none">
    <foreignObject x={viewBox.x} y={viewBox.y - 12} width={viewBox.width} height={24} overflow="visible">
      <div className="flex h-full items-center"><div className="relative inline-flex">
        <span className="absolute -right-0.5 top-1/2 size-1.5 -translate-y-1/2 rotate-45 bg-inverse-background" />
        <Badge size="sm" variant="strong" color={averageColor} className="relative">{text}</Badge>
      </div></div>
    </foreignObject>
    <circle cx={viewBox.x + viewBox.width} cy={viewBox.y} r={2} fill="var(--fg-default)" />
  </g>;
}

export function TicketTrend({ data, labels, locale, timeZone }: { data: SupportAnalyticsSnapshot; labels: SupportAnalyticsLabels; locale: string; timeZone: string }) {
  const gradientId = `support-bars-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { points, average, complete } = trendSummary(data);
  if (!points.length) return <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.empty}</EmptyDescription></Empty>;
  const date = (timestamp: number) => data.range === "last-12-weeks" ? `W${Math.floor((timestamp - data.window.start) / data.window.bucketMs) + 1}` : formatDate(timestamp, locale, timeZone, data.range === "this-week").toLocaleUpperCase(locale);
  const radius = points.length > 12 ? 3 : points.length > 7 ? 6 : 8;
  return <div className="min-w-0 space-y-2">
    {!complete && <p className="text-label text-fg-subtle">{labels.average} {labels.unknown} · {labels.incomplete}</p>}
    <ChartContainer className="h-40" config={{ count: { label: labels[data.channel], color: chartColor(1) } }} aria-label={`${labels.trend} · ${labels[data.channel]} · ${labels[data.range]}${average === null ? "" : ` · ${labels.average} ${formatCount(Math.round(average), locale)}`}`}
      dataTable={{ caption: labels.trend, summary: labels.values, columns: [labels.date, labels.count], rows: points.map((point) => ({ id: String(point.start), label: formatDate(point.start, locale, timeZone), values: [formatCount(point.count, locale)] })) }}>
      <BarChart data={points} accessibilityLayer barCategoryGap={points.length > 12 ? "12%" : "6%"} margin={{ top: 8, right: 3, bottom: 0, left: 0 }}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.55} /><stop offset="55%" stopColor="var(--color-count)" stopOpacity={0.2} /><stop offset="100%" stopColor="var(--color-count)" stopOpacity={0} /></linearGradient></defs>
        <XAxis dataKey="start" tickFormatter={date} axisLine={false} tickLine={false} interval="preserveStartEnd" tickMargin={10} minTickGap={data.range === "last-30-days" ? 24 : 8} height={28} />
        <YAxis hide domain={[0, "auto"]} />
        <ChartTooltip cursor={{ fill: "var(--hover)" }} content={<ChartTooltipContent hideIndicator labelFormatter={(value) => formatDate(Number(value), locale, timeZone)} valueFormatter={(value) => formatCount(value, locale)} />} />
        <Bar dataKey="count" fill={`url(#${gradientId})`} radius={[radius, radius, 0, 0]} isAnimationActive={false} />
        {average !== null && <ReferenceLine y={average} stroke="var(--fg-default)" strokeDasharray="3 4" label={<AverageMarker text={`${labels.average} ${formatCount(Math.round(average), locale)}`} />} />}
      </BarChart>
    </ChartContainer>
  </div>;
}

export function MetricTrend({ metric }: { metric: SupportAnalyticsMetric }) {
  const points = metricTrendPoints(metric);
  if (!points.some((point) => point.value !== null)) return <span className="text-label text-fg-subtle">—</span>;
  return <ChartContainer className="h-8 min-h-0 w-20" config={{ value: { color: chartColor(1) } }} aria-hidden="true">
    <LineChart data={points} accessibilityLayer={false} margin={{ top: 4, right: 3, bottom: 4, left: 3 }}>
      <XAxis hide dataKey="timestamp" type="number" domain={["dataMin", "dataMax"]} />
      <YAxis hide domain={["dataMin", "dataMax"]} />
      <Line dataKey="value" type="linear" stroke="var(--color-value)" strokeWidth={1.5} dot={false} connectNulls={false} isAnimationActive={false} />
    </LineChart>
  </ChartContainer>;
}
