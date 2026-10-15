"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { curveLinear, curveMonotoneX } from "@visx/curve";
import { Area } from "@zeron/ui/area-chart";
import { Bar, BarChart, BarXAxis } from "@zeron/ui/bar-chart";
import { ChartTooltip, ReferenceArea, ReferenceLine, TooltipContent, YAxis, useChartStable, type TooltipRow } from "@zeron/ui/chart-core";
import { Line, LineChart } from "@zeron/ui/line-chart";
import { cn } from "@zeron/ui/system/utils";
import type { UsageForecastLabels, UsageForecastProjection } from "./usage-forecast-types";

/** ReferenceLine includes chart margins; native chart children already sit in plot space. */
function QuotaReferenceLine(props: React.ComponentProps<typeof ReferenceLine>) {
  const { margin } = useChartStable();
  return <g transform={`translate(${-margin.left},${-margin.top})`}><ReferenceLine {...props} /></g>;
}

export const usageForecastColors = {
  used: "var(--chart-1, var(--brand))",
  pace: "var(--chart-2, var(--brand))",
  even: "var(--chart-6)",
  out: "var(--chart-7)",
  over: "var(--chart-3)",
} as const;

export const usageForecastHatch = {
  backgroundImage: `repeating-linear-gradient(135deg, transparent 0, transparent 5px, color-mix(in oklab, ${usageForecastColors.out} 55%, transparent) 5px, color-mix(in oklab, ${usageForecastColors.out} 55%, transparent) 6px)`,
};

export function ForecastLegendItem({ children, kind }: { children: React.ReactNode; kind: "used" | "pace" | "even" | "out" | "locked" | "within" | "over" | "allowance" }) {
  const color = kind === "within" ? usageForecastColors.used : kind === "allowance" ? usageForecastColors.even
    : kind === "locked" ? usageForecastColors.out : usageForecastColors[kind];
  return <span className="inline-flex items-center gap-1.5">
    <span aria-hidden="true" className={cn("inline-block w-3.5 shrink-0", kind === "out" ? "size-2 rounded-full"
      : kind === "locked" || kind === "within" || kind === "over" ? "h-2 rounded-sm" : "border-t-2",
    (kind === "pace" || kind === "allowance") && "border-dashed", kind === "even" && "border-dotted")}
      style={kind === "locked" ? usageForecastHatch : kind === "out" || kind === "within" || kind === "over" ? { backgroundColor: color } : { borderColor: color }} />{children}
  </span>;
}

function ForecastAnnotations({ projection, now, timeLabel, lockedLabel }: {
  projection: UsageForecastProjection; now: number; timeLabel: string; lockedLabel: string;
}) {
  const { xScale, yScale, innerWidth, innerHeight } = useChartStable();
  const out = projection.runsOutAt;
  const x = out === null ? null : xScale(new Date(out));
  return <g aria-hidden="true" pointerEvents="none">
    <circle cx={xScale(new Date(now))} cy={yScale(projection.account.usedPercent)} r={3.5} fill={usageForecastColors.used} stroke="var(--surface-floating)" strokeWidth={2} />
    {x !== null && <>
      <line x1={x} x2={innerWidth} y1={yScale(100)} y2={yScale(100)} stroke={usageForecastColors.out} strokeWidth={2.5} />
      <circle cx={x} cy={yScale(100)} r={4.5} fill={usageForecastColors.out} stroke="var(--surface-floating)" strokeWidth={2} />
      <text x={Math.min(innerWidth - 30, Math.max(34, x))} y={yScale(100) - 12} textAnchor="middle" fill="var(--fg-default)" fontSize="var(--font-size-body)">{timeLabel}</text>
      {innerWidth - x > 150 && <text x={x + (innerWidth - x) / 2} y={innerHeight / 2} textAnchor="middle" fill="var(--fg-danger)" fontSize="var(--font-size-body)">{lockedLabel}</text>}
    </>}
  </g>;
}

function UsageForecastTooltip({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return <><p className="px-3 pt-2.5 text-body font-medium text-fg-default">{title}</p><TooltipContent rows={rows} /></>;
}

function ForecastTimeLabels({ start, reset, now, elapsedPercent }: {
  start: string; reset: string; now: string; elapsedPercent: number;
}) {
  const axisRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLSpanElement>(null);
  const nowRef = useRef<HTMLSpanElement>(null);
  const resetRef = useRef<HTMLSpanElement>(null);
  const [showNow, setShowNow] = useState(false);

  useEffect(() => {
    const elements = [axisRef.current, startRef.current, nowRef.current, resetRef.current];
    const measure = () => {
      const first = startRef.current?.getBoundingClientRect();
      const current = nowRef.current?.getBoundingClientRect();
      const last = resetRef.current?.getBoundingClientRect();
      setShowNow(Boolean(first && current && last && current.left >= first.right + 8 && current.right <= last.left - 8));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    elements.forEach((element) => { if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [start, reset, now, elapsedPercent]);

  return <div ref={axisRef} className="pointer-events-none absolute bottom-3 left-12 right-2 flex justify-between gap-2 whitespace-nowrap text-body text-fg-subtle">
    <span ref={startRef}>{start}</span>
    <span ref={nowRef} className={cn("absolute -translate-x-1/2", !showNow && "invisible")} style={{ left: `${elapsedPercent}%` }}>{now}</span>
    <span ref={resetRef}>{reset}</span>
  </div>;
}

export function UsageForecastTrend({ projection, now, labels, percent, date, time, duration, alignCharts = false, usageSummary }: {
  projection: UsageForecastProjection; now: number; labels: UsageForecastLabels;
  percent: (value: number) => string; date: (value: number) => string; time: (value: number) => string; duration: (value: number) => string;
  alignCharts?: boolean;
  usageSummary: string;
}) {
  const { account, runsOutAt, projectedPercent } = projection;
  const data = useMemo(() => {
    const points = new Map<number, Record<string, unknown>>();
    const add = (timestamp: number, values: Record<string, unknown>) => points.set(timestamp, { ...points.get(timestamp), date: timestamp, ...values });
    // Missing history stays missing; only the supplied current observation is known.
    add(account.windowStart, { even: 0 });
    add(account.resetsAt, { even: 100 });
    for (const point of account.history ?? []) add(point.timestamp, { used: point.usedPercent });
    add(now, { used: account.usedPercent, projected: account.usedPercent });
    if (projectedPercent !== null) add(runsOutAt ?? account.resetsAt, { projected: Math.min(100, projectedPercent) });
    return [...points.values()].sort((a, b) => Number(a.date) - Number(b.date)).map((point) => ({
      ...point, even: (Number(point.date) - account.windowStart) / (account.resetsAt - account.windowStart) * 100,
    }));
  }, [account, now, projectedPercent, runsOutAt]);

  const tooltipRows = (point: Record<string, unknown>): TooltipRow[] => [
    ...(typeof point.used === "number" ? [{ label: labels.used, value: percent(point.used), color: usageForecastColors.used }] : []),
    ...(typeof point.projected === "number" ? [{ label: labels.currentPace, value: percent(point.projected), color: usageForecastColors.pace }] : []),
  ];

  return <figure className={cn("min-w-0", alignCharts && "@3xl/forecast:row-span-3 @3xl/forecast:grid @3xl/forecast:grid-rows-subgrid")} aria-label={`${account.name} ${labels.forecast}`}>
    {alignCharts && <div className="hidden @3xl/forecast:block"><p className="text-body text-fg-muted">{usageSummary}</p>{!account.history?.length && <p className="mt-1 text-label text-fg-subtle">{labels.noHistory}</p>}</div>}
    <div className="relative min-w-0">
    <LineChart key={account.id} data={data} xDomain={[new Date(account.windowStart), new Date(account.resetsAt)]}
      yDomain={[0, 100]} yDomainTween={false} className="h-64 w-full" aspectRatio="auto" animationDuration={0}
      margin={{ top: 30, right: 8, bottom: 44, left: 48 }}>
      <YAxis tickValues={[0, 50, 100]} formatValue={percent} labelClassName="text-body" />
      <QuotaReferenceLine y={0} stroke="var(--border)" strokeDasharray="0" />
      <QuotaReferenceLine y={50} stroke="var(--border-subtle)" strokeDasharray="0" />
      <QuotaReferenceLine y={100} stroke="var(--border)" />
      {runsOutAt !== null && <ReferenceArea x1={runsOutAt} x2={account.resetsAt} y1={0} y2={100}
        pattern="diagonal" patternColor={usageForecastColors.out} patternStrokeWidth={1} fillOpacity={0.5}
        strokeWidth={0} fadeEdges={false} />}
      {account.history?.length ? <Area dataKey="used" fill={usageForecastColors.used} stroke={usageForecastColors.used} fillOpacity={0.08}
        gradientToOpacity={0.08} showLine={false} curve={curveMonotoneX} animate={false} showHighlight={false} /> : null}
      <Line dataKey="even" stroke={usageForecastColors.even} strokeWidth={1} curve={curveLinear} dashFromIndex={0} dashArray="1,4" fadeEdges={false} animate={false} showHighlight={false} />
      <Line dataKey="used" stroke={usageForecastColors.used} strokeWidth={2} curve={curveMonotoneX} fadeEdges={false} animate={false} showHighlight={false} />
      {projectedPercent !== null && <Line dataKey="projected" stroke={usageForecastColors.pace} strokeWidth={1.5} curve={curveLinear} dashFromIndex={0} dashArray="4,4" fadeEdges={false} animate={false} showHighlight={false} />}
      <QuotaReferenceLine x={now} stroke="var(--border)" />
      <ForecastAnnotations projection={projection} now={now} timeLabel={runsOutAt === null ? "" : time(runsOutAt)} lockedLabel={duration(projection.lockedMs)} />
      <ChartTooltip showDatePill={false} rows={tooltipRows}
        content={({ point }) => <UsageForecastTooltip title={date(Number(point.date))} rows={tooltipRows(point)} />} />
    </LineChart>
    <ForecastTimeLabels start={date(account.windowStart)} reset={`${labels.reset} ${date(account.resetsAt)}`} now={labels.now} elapsedPercent={projection.elapsedPercent} />
    </div>
    <figcaption className={cn("mt-3 text-body text-fg-subtle", alignCharts && "@3xl/forecast:mt-0")}>
      {!account.history?.length && <p className={cn("mb-3 text-label", alignCharts && "@3xl/forecast:hidden")}>{labels.noHistory}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
      <ForecastLegendItem kind="used">{labels.used}</ForecastLegendItem>
      <ForecastLegendItem kind="pace">{labels.currentPace}</ForecastLegendItem>
      <ForecastLegendItem kind="even">{labels.evenPace}</ForecastLegendItem>
      <ForecastLegendItem kind="out">{labels.runsOut}</ForecastLegendItem>
      <ForecastLegendItem kind="locked">{labels.locked}</ForecastLegendItem>
      </div>
    </figcaption>
  </figure>;
}

function DailyValues() {
  const { data, barScale, bandWidth, yScale } = useChartStable();
  return <g aria-hidden="true" pointerEvents="none">
    {data.map((point) => <text key={String(point.id)} x={(barScale?.(String(point.id)) ?? 0) + (bandWidth ?? 0) / 2}
      y={yScale(Number(point.usedPercent)) - 7} textAnchor="middle" fill="var(--fg-subtle)" fontSize="var(--font-size-body)">{String(point.usedPercent)}</text>)}
  </g>;
}

export function UsageForecastDaily({ projection, labels, number, alignCharts = false }: { projection: UsageForecastProjection; labels: UsageForecastLabels; number: (value: number) => string; alignCharts?: boolean }) {
  const data = useMemo(() => (projection.account.recentUsage ?? []).map((day) => ({ ...day })), [projection.account.recentUsage]);
  const color = (point: Record<string, unknown>) => Number(point.usedPercent) > projection.allowance ? usageForecastColors.over : usageForecastColors.used;
  const tooltipRows = (point: Record<string, unknown>): TooltipRow[] => [{ label: String(point.label), value: `${number(Number(point.usedPercent))} pp`, color: color(point) }];
  const domainMax = Math.max(1, data.reduce((max, day) => Math.max(max, day.usedPercent), projection.allowance));
  return <figure className={cn("min-w-0", alignCharts && "@3xl/forecast:row-span-3 @3xl/forecast:grid @3xl/forecast:grid-rows-subgrid")} aria-label={`${projection.account.name} ${labels.recentPace}`}>
    <figcaption className="text-body text-fg-muted"><span className="font-medium text-fg-default">{labels.recentPace}</span><span className="text-fg-subtle"> · {labels.perDay}</span> · {labels.allowed(number(projection.allowance))}</figcaption>
    {data.length ? <BarChart key={projection.account.id} data={data} xDataKey="id" yDomain={[0, domainMax * 1.1]} className={cn("mt-4 h-40 w-full", alignCharts && "@3xl/forecast:mt-0 @3xl/forecast:h-64")} aspectRatio="auto"
      margin={{ top: 24, right: 0, bottom: 44, left: 0 }} barWidth={22} barGap={0.4} animationDuration={0}>
      <Bar dataKey="usedPercent" fill={usageForecastColors.used} fillForDatum={color} lineCap={3} animate={false} />
      <QuotaReferenceLine y={0} stroke="var(--border)" strokeDasharray="0" />
      <QuotaReferenceLine y={projection.allowance} stroke={usageForecastColors.even} strokeDasharray="4,4" />
      <BarXAxis showAllLabels formatLabel={(_id, point) => String(point.label)} labelClassName="text-body" />
      <DailyValues />
      <ChartTooltip showDatePill={false} rows={tooltipRows}
        content={({ point }) => <UsageForecastTooltip title={String(point.label)} rows={tooltipRows(point)} />} />
    </BarChart> : <p className={cn("flex h-40 items-center text-body text-fg-subtle", alignCharts && "@3xl/forecast:h-64")}>{labels.noRecentUsage}</p>}
    <div className={cn("mt-3 flex flex-wrap content-start items-start gap-x-4 gap-y-2 text-body text-fg-subtle", alignCharts && "@3xl/forecast:mt-0")}>
      <ForecastLegendItem kind="within">{labels.within}</ForecastLegendItem><ForecastLegendItem kind="over">{labels.over}</ForecastLegendItem><ForecastLegendItem kind="allowance">{labels.allowedPerDay}</ForecastLegendItem>
    </div>
  </figure>;
}
