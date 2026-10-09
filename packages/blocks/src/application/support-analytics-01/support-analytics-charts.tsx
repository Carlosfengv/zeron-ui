"use client";

import { useId } from "react";
import { curveLinear } from "@visx/curve";
import { Bar, BarChart, BarXAxis } from "@zeron/ui/bar-chart";
import { Line, LineChart } from "@zeron/ui/line-chart";
import { ChartTooltip, TooltipContent, ReferenceLine, LinearGradient } from "@zeron/ui/chart-core";
import { Badge } from "@zeron/ui/badge";
import { ChartDataTable, chartColor } from "@zeron/ui/chart-primitives";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { formatCount, formatDate, metricTrendPoints, trendSummary } from "./support-analytics-data";
import type { SupportAnalyticsLabels, SupportAnalyticsMetric, SupportAnalyticsSnapshot } from "./support-analytics-types";

const averageColor = { base: "var(--inverse-background)", onStrong: "var(--fg-on-inverse)" };

export function TicketTrend({ data, labels, locale, timeZone }: { data: SupportAnalyticsSnapshot; labels: SupportAnalyticsLabels; locale: string; timeZone: string }) {
  const gradientId = `support-bars-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { points, average, complete } = trendSummary(data);
  if (!points.length) return <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.empty}</EmptyDescription></Empty>;
  const date = (timestamp: number) => data.range === "last-12-weeks" ? `W${Math.floor((timestamp - data.window.start) / data.window.bucketMs) + 1}` : formatDate(timestamp, locale, timeZone, data.range === "this-week").toLocaleUpperCase(locale);
  const radius = points.length > 12 ? 3 : points.length > 7 ? 6 : 8;
  return <div className="min-w-0 space-y-2">
    {!complete && <p className="text-label text-fg-subtle">{labels.average} {labels.unknown} · {labels.incomplete}</p>}
    <div aria-label={`${labels.trend} · ${labels[data.channel]} · ${labels[data.range]}` + (average === null ? "" : ` · ${labels.average} ${formatCount(Math.round(average), locale)}`)}>
      <BarChart className="h-40" aspectRatio="auto" data={points.map(point => ({ ...point }))} xDataKey="start" barGap={points.length > 12 ? 0.12 : 0.06} margin={{ top: 24, right: 3, bottom: 32, left: 0 }} animationDuration={0}>
        <LinearGradient id={gradientId} from={chartColor(1)} to={chartColor(1)} fromOpacity={0.55} toOpacity={0} />
        <BarXAxis formatLabel={(value) => date(Number(value))} maxLabels={data.range === "last-30-days" ? 7 : 12} />
        <Bar dataKey="count" fill={`url(#${gradientId})`} stroke={chartColor(1)} lineCap={radius} animate={false} />
        {average !== null && <ReferenceLine y={average} label={<Badge size="sm" variant="strong" color={averageColor}>{`${labels.average} ${formatCount(Math.round(average), locale)}`}</Badge>} />}
        <ChartTooltip showDatePill={false} showDots={false} content={({ point }) => <TooltipContent title={formatDate(Number(point.start), locale, timeZone)} rows={[{ label: labels[data.channel], color: chartColor(1), value: formatCount(point.count, locale) }]} />} />
      </BarChart>
      <ChartDataTable caption={labels.trend} summary={labels.values} columns={[labels.date, labels.count]} rows={points.map(point => ({ id: String(point.start), label: formatDate(point.start, locale, timeZone), values: [formatCount(point.count, locale)] }))} />
    </div>
  </div>;
}

export function MetricTrend({ metric }: { metric: SupportAnalyticsMetric }) {
  const points = metricTrendPoints(metric);
  if (!points.some((point) => point.value !== null)) return <span className="text-label text-fg-subtle">—</span>;
  return <div className="w-20" aria-hidden="true" inert>
    <LineChart className="h-8" aspectRatio="auto" data={points.map(point => ({ ...point }))} xDataKey="timestamp" yDomain={["dataMin", "dataMax"]} margin={{ top: 4, right: 3, bottom: 4, left: 3 }} animationDuration={0} yDomainTween={false}>
      <Line dataKey="value" stroke={chartColor(1)} strokeWidth={1.5} curve={curveLinear} fadeEdges={false} animate={false} />
    </LineChart>
  </div>;
}
