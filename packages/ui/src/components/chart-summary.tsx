"use client";

import * as React from "react";
import { ParentSize } from "@visx/responsive";
import { curveLinear } from "@visx/curve";
import { Area, AreaChart } from "#components/area-chart";
import { Grid, XAxis, YAxis, ChartTooltip as NativeChartTooltip, TooltipContent } from "#components/chart-core";
import { PieChart, PieSlice } from "#components/pie-chart";
import { ChartDataTable, chartSeriesColor, createChartNumberFormatter, createChartTimeFormatter, visualizationLayout, type ChartDataTableProps, type VisualizationSegment } from "#components/chart-primitives";
import { cn } from "#system/utils";

export interface TimeSeriesChartProps {
  data: readonly { timestamp: number; values: Record<string, number | null> }[];
  series: readonly { id: string; label: string; color?: string }[];
  locale: string;
  timeZone: string;
  label: string;
  domain?: readonly [number, number];
  className?: string;
  formatValue?: (value: unknown) => string;
  dataSummary?: string;
  labels?: { invalidTimestamps?: string; empty?: string };
}

/** Request trend retains raw table/tooltip values and gaps; native charts own render sampling. */
export function TimeSeriesChart({ data, series, locale, timeZone, label, domain, className, formatValue = createChartNumberFormatter(locale, { maximumFractionDigits: 0 }), dataSummary, labels }: TimeSeriesChartProps) {
  const points = data.filter((point) => Number.isFinite(new Date(point.timestamp).getTime()));
  const start = domain?.[0] ?? points.at(0)?.timestamp;
  const end = domain?.[1] ?? points.at(-1)?.timestamp;
  const formatTime = createChartTimeFormatter(locale, timeZone, start !== undefined && end !== undefined && end - start > 86400000 ? { month: "short", day: "numeric" } : undefined);
  const fullTime = createChartTimeFormatter(locale, timeZone, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  const dataTable: ChartDataTableProps = { caption: label, summary: dataSummary, columns: [timeZone, ...series.map((entry) => entry.label)], rows: data.map((point, index) => ({ id: `${point.timestamp}-${index}`, label: fullTime(point.timestamp), values: series.map((entry) => formatValue(point.values[entry.id])) })) };
  const isChinese = /^zh(?:-|$)/i.test(locale);
  const invalidTimeNotice = points.length < data.length
    ? <p className="mb-2 text-label text-fg-warning">{labels?.invalidTimestamps ?? (isChinese ? "部分时间无效，请查看数据" : "Invalid timestamps; view data")}</p>
    : null;
  if (!points.length) {
    return <div className="min-w-0" data-slot="time-series-chart" aria-label={label}>
      {invalidTimeNotice}
      <p className="flex h-52 items-center justify-center text-label text-fg-subtle">{labels?.empty ?? (isChinese ? "暂无数据" : "No data")}</p>
      {data.length > 0 && <ChartDataTable {...dataTable} />}
    </div>;
  }
  const chartData = points.map((point) => ({ ...Object.fromEntries(series.map((entry, index) => [`series${index}`, point.values[entry.id]])), timestamp: point.timestamp }));
  return <div className="min-w-0" data-slot="time-series-chart" data-time-zone={timeZone} aria-label={label}>
    {invalidTimeNotice}
    <AreaChart data={chartData} xDataKey="timestamp" xDomain={domain ? [new Date(domain[0]), new Date(domain[1])] : undefined} className={cn("h-52 min-h-0", className)} aspectRatio="auto" margin={{ top: 12, right: 12, bottom: 36, left: 48 }} animationDuration={0} yDomainTween={false}>
      <Grid horizontal />
      <XAxis formatDate={(date) => formatTime(date.getTime())} />
      <YAxis formatValue={formatValue} />
      {series.map((entry, index) => <Area key={entry.id} dataKey={`series${index}`} stroke={entry.color ?? chartSeriesColor(entry.id)} fill={entry.color ?? chartSeriesColor(entry.id)} fillOpacity={0.12} gradientToOpacity={0.12} curve={curveLinear} animate={false} showMarkers={points.length === 1} />)}
      <NativeChartTooltip showDatePill={false} content={({ point }) => <TooltipContent title={fullTime(Number(point.timestamp))} rows={series.map((entry, index) => ({ label: entry.label, color: entry.color ?? chartSeriesColor(entry.id), value: formatValue(point[`series${index}`]) }))} />} />
    </AreaChart>
    <ChartDataTable {...dataTable} />
  </div>;
}

export interface DonutSummaryProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  segments: readonly VisualizationSegment[];
  total?: number | null;
  center?: React.ReactNode;
  innerRadius?: string;
}

/** Unassigned total stays a neutral track. Incomplete distributions require an explicit total. */
export function DonutSummary({ segments, total, center, innerRadius = "80%", className, ...props }: DonutSummaryProps) {
  const { layout, data } = React.useMemo(() => {
    const layout = visualizationLayout(segments, total);
    const data = layout.denominator > 0 ? segments.flatMap((segment) =>
      segment.value !== null && Number.isFinite(segment.value) && segment.value > 0
        ? [{ label: segment.label, value: segment.value, color: segment.color ?? chartSeriesColor(segment.id) }]
        : []
    ) : [{ label: "—", value: 1, color: "var(--muted)" }];
    if (layout.remainder > 0) {
      data.push({ label: "—", value: layout.remainder, color: "var(--muted)" });
    }
    return { layout, data };
  }, [segments, total]);
  const radiusRatio = Math.min(1, Math.max(0, parseFloat(innerRadius) / 100 || 0));
  return <div role="img" className={cn("relative aspect-square w-full min-w-0 max-w-48", className)} data-slot="donut-summary" data-complete={layout.complete} data-overflow={layout.overflow} {...props}>
    <div aria-hidden="true" inert className="h-full"><ParentSize debounceTime={10}>{({ width, height }) => {
      const size = Math.min(width, height);
      if (size <= 0) return null;
      const outerRadius = size / 2;
      const innerRadiusPx = innerRadius.trim().endsWith("%") ? outerRadius * radiusRatio : Math.max(0, parseFloat(innerRadius) || 0);
      // Match the native donut example's 2px chord gap and rounded slice edges.
      const padRadius = Math.hypot(Math.min(innerRadiusPx, outerRadius), outerRadius);
      const padAngle = data.length > 1 && padRadius > 0 ? 2 * Math.asin(Math.min(1, 1 / padRadius)) : 0;
      return <PieChart size={size} data={data} innerRadius={innerRadiusPx} padAngle={padAngle} cornerRadius={4} hoverOffset={0} className="h-full" hoveredIndex={null} geometryScrubbing>
        {data.map((entry, index) => <PieSlice key={index} index={index} color={entry.color} animate={false} showGlow={false} hoverEffect="none" />)}
      </PieChart>;
    }}</ParentSize></div>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex min-w-0 flex-col items-center justify-center gap-1 px-4 text-center tabular-nums text-fg-default">{center}</div>
  </div>;
}
