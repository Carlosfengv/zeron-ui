"use client";

import { useMemo } from "react";
import { curveLinear } from "@visx/curve";
import { Area, AreaChart } from "@zeron/ui/area-chart";
import { ChartTooltip, Grid, ReferenceLine, TooltipContent, XAxis, YAxis, useChartStable, type TooltipRow } from "@zeron/ui/chart-core";
import { ChartDataTable } from "@zeron/ui/chart-primitives";
import { Line } from "@zeron/ui/line-chart";
import { findUsageBudgetCrossing, usageBudgetChartData, usageBudgetExtent, type usageBudgetModel } from "./usage-budget-forecast-data";
import type { UsageBudgetForecastData, UsageBudgetForecastLabels, UsageBudgetMetric } from "./usage-budget-forecast-types";

const colors = { actual: "var(--fg-default)", range: "var(--fg-subtle)", over: "var(--fg-danger)" };

function BudgetReference(props: React.ComponentProps<typeof ReferenceLine>) {
  const { margin } = useChartStable();
  return <g transform={`translate(${-margin.left},${-margin.top})`}><ReferenceLine {...props} /></g>;
}

function ForecastRegion({ now }: { now: number }) {
  const { xScale, innerWidth, innerHeight } = useChartStable();
  const x = xScale(new Date(now));
  return <rect aria-hidden="true" pointerEvents="none" x={x} y={0} width={Math.max(0, innerWidth - x)} height={innerHeight} fill="var(--surface-raised)" opacity={0.45} />;
}

/** Annotations use the public chart scales; the library owns all series and interactions. */
function BudgetAnnotations({ data, metric, model, labels, date, format }: ChartProps) {
  const { xScale, yScale, innerWidth, innerHeight } = useChartStable();
  const todayX = xScale(new Date(data.now));
  const baseline = metric.domain?.[0] ?? 0;
  const budgetY = yScale(metric.budget - baseline);
  const crossing = model.historyCrossing ?? model.expectedCrossing;
  const crossingX = crossing === null ? null : xScale(new Date(crossing));
  const eighty = findUsageBudgetCrossing(metric.history, metric.budget * 0.8);
  const eightyY = yScale(metric.budget * 0.8 - baseline);
  return <g aria-hidden="true" pointerEvents="none" fontSize="var(--font-size-label)">
    <line x1={todayX} x2={todayX} y1={-8} y2={innerHeight} stroke="var(--border)" />
    <text x={Math.min(innerWidth - 20, todayX)} y={-18} textAnchor="middle" fill="var(--fg-muted)">{labels.today}</text>
    <circle cx={todayX} cy={yScale(model.current.value - baseline)} r={4.5} fill={colors.actual} stroke="var(--surface-floating)" strokeWidth={2.5} />
    {innerWidth > 420 && <foreignObject x={8} y={budgetY - 14} width={200} height={32}>
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-floating px-3 py-1 text-label text-fg-muted">{labels.budget}<span className="font-medium text-fg-default">{format(metric.budget)}</span></span>
    </foreignObject>}
    {eighty !== null && eightyY >= 0 && eightyY <= innerHeight && (crossing === null || Math.abs(xScale(new Date(eighty)) - (crossingX ?? 0)) > 75) && <>
      <line x1={xScale(new Date(eighty))} x2={xScale(new Date(eighty))} y1={yScale(metric.budget * 0.8 - baseline) - 8} y2={yScale(metric.budget * 0.8 - baseline) + 8} stroke={colors.actual} strokeWidth={1.5} />
      <text x={Math.max(14, xScale(new Date(eighty)) - 10)} y={yScale(metric.budget * 0.8 - baseline) - 12} textAnchor={xScale(new Date(eighty)) < 32 ? "start" : "end"} fill="var(--fg-muted)">80%</text>
    </>}
    {crossingX !== null && <>
      <line x1={crossingX} x2={crossingX} y1={budgetY + 7} y2={innerHeight} stroke={colors.over} strokeDasharray="3 4" />
      <circle cx={crossingX} cy={budgetY} r={5.5} fill="var(--surface-floating)" stroke={colors.over} strokeWidth={2} />
      <text x={Math.max(56, Math.min(innerWidth - 56, crossingX))} y={budgetY - 17} textAnchor="middle" fill={colors.over}>100% · {date(crossing!)}</text>
    </>}
  </g>;
}

interface ChartProps {
  data: UsageBudgetForecastData;
  metric: UsageBudgetMetric;
  model: ReturnType<typeof usageBudgetModel>;
  labels: UsageBudgetForecastLabels;
  date: (timestamp: number) => string;
  format: (value: number) => string;
}

export function UsageBudgetForecastChart(props: ChartProps) {
  const { data, metric, labels, date, format } = props;
  const baseline = metric.domain?.[0] ?? 0;
  const maximum = useMemo(() => usageBudgetExtent(metric)[1], [metric]);
  // Native stacks include zero. Translate plotted ordinates to the requested origin,
  // then restore original values in axes, annotations, tooltips, and the data table.
  const points = useMemo(() => usageBudgetChartData(metric).map(point => {
    const plotted = { ...point };
    for (const key of ["actual", "actualOver", "forecast", "forecastOver", "rangeBase"]) {
      if (typeof plotted[key] === "number") plotted[key] = Number(plotted[key]) - baseline;
    }
    return plotted;
  }), [metric, baseline]);
  const tooltipRows = (point: Record<string, unknown>): TooltipRow[] => [
    ...(typeof point.observed === "number" ? [{ label: labels.actual, value: format(point.observed), color: point.observed > metric.budget ? colors.over : colors.actual }] : []),
    ...(typeof point.projected === "number" ? [{ label: labels.forecast, value: format(point.projected), color: point.projected > metric.budget ? colors.over : colors.actual }, { label: labels.range, value: `${format(Number(point.lower))}–${format(Number(point.upper))}`, color: colors.range }] : []),
    { label: labels.budget, value: format(metric.budget), color: colors.actual },
  ];
  const tableRows = useMemo(() => [...metric.history.map(point => ({ id: String(point.timestamp), label: date(point.timestamp), values: [format(point.value), "—", "—"] })),
    ...metric.forecast.slice(1).map(point => ({ id: String(point.timestamp), label: date(point.timestamp), values: ["—", format(point.value), `${format(point.lower)}–${format(point.upper)}`] }))], [metric, date, format]);
  const accessibleData = useMemo(() => tableRows.map(row => ({ [labels.date]: row.label, [labels.actual]: row.values[0], [labels.forecast]: row.values[1], [labels.range]: row.values[2] })), [tableRows, labels.date, labels.actual, labels.forecast, labels.range]);
  return <figure className="min-w-0" aria-label={`${metric.label} · ${labels.chart}`}>
    <div className="mb-2 text-label text-fg-muted @3xl/budget:hidden">{labels.budget}<span className="ml-2 font-medium tabular-nums text-fg-default">{format(metric.budget)}</span></div>
    <AreaChart key={metric.id} data={points} accessibleData={accessibleData} xDomain={[new Date(data.periodStart), new Date(data.periodEnd)]} yDomain={metric.domain ? [0, metric.domain[1] - baseline] : [0, maximum * 1.12]}
      yDomainTween={false} animationDuration={0} aspectRatio="auto" className="h-72 w-full @3xl/budget:h-80" margin={{ top: 36, right: 20, bottom: 36, left: 54 }}>
      <ForecastRegion now={data.now} />
      <Grid horizontal vertical={false} rowTickValues={metric.ticks?.map(value => value - baseline)} stroke="var(--border-subtle)" strokeDasharray="0" fadeHorizontal={false} />
      <YAxis tickValues={metric.ticks?.map(value => value - baseline)} formatValue={value => metric.unit === "seats" || metric.unit === "席位" ? String(value + baseline) : format(value + baseline)} />
      <XAxis formatDate={value => date(value.getTime())} numTicks={5} />
      <Area dataKey="rangeBase" stackId="interval" fillOpacity={0} showLine={false} showHighlight={false} animate={false} curve={curveLinear} />
      <Area dataKey="rangeWithin" stackId="interval" fill={colors.range} fillOpacity={0.16} gradientToOpacity={0.16} showLine={false} showHighlight={false} animate={false} curve={curveLinear} />
      <Area dataKey="rangeOver" stackId="interval" fill={colors.over} fillOpacity={0.1} gradientToOpacity={0.1} showLine={false} showHighlight={false} animate={false} curve={curveLinear} />
      <BudgetReference y={metric.budget - baseline} stroke={colors.actual} strokeDasharray="0" />
      <Line dataKey="actual" stroke={colors.actual} strokeWidth={2} curve={curveLinear} animate={false} fadeEdges={false} showHighlight={false} />
      <Line dataKey="actualOver" stroke={colors.over} strokeWidth={2} curve={curveLinear} animate={false} fadeEdges={false} showHighlight={false} />
      <Line dataKey="forecast" stroke={colors.actual} strokeWidth={2} curve={curveLinear} dashFromIndex={0} dashArray="4,5" animate={false} fadeEdges={false} showHighlight={false} />
      <Line dataKey="forecastOver" stroke={colors.over} strokeWidth={2} curve={curveLinear} dashFromIndex={0} dashArray="4,5" animate={false} fadeEdges={false} showHighlight={false} />
      <BudgetAnnotations {...props} />
      <ChartTooltip showDatePill={false} content={({ point }) => <TooltipContent title={date(Number(point.date))} rows={tooltipRows(point)} />} />
    </AreaChart>
    <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-label text-fg-subtle">
      {(["actual", "forecast", "range", "over"] as const).map(kind => <span key={kind} className="inline-flex items-center gap-2">
        <span aria-hidden="true" className={kind === "range" ? "h-2.5 w-3.5 rounded-sm" : `w-4 border-t-2 ${kind === "forecast" ? "border-dashed" : "border-solid"}`} style={kind === "range" ? { backgroundColor: colors.range, opacity: 0.25 } : { borderColor: kind === "over" ? colors.over : colors.actual }} />{labels[kind]}
      </span>)}
    </figcaption>
    <ChartDataTable caption={`${metric.label} · ${labels.chart}`} summary={labels.viewData} columns={[labels.date, labels.actual, labels.forecast, labels.range]} rows={tableRows} />
  </figure>;
}
