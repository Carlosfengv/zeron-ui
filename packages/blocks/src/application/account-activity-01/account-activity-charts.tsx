"use client";

import { useMemo, type ReactNode } from "react";
import { curveLinear, curveStepAfter } from "@visx/curve";
import { Area, AreaChart } from "@zeron/ui/area-chart";
import { Line, LineChart } from "@zeron/ui/line-chart";
import { ChartTooltip, ReferenceArea, useChartStable } from "@zeron/ui/chart-core";
import { ChartBrush } from "@zeron/ui/chart-brush";
import { CHART_SCALE_VARS, HeatmapMatrix, type HeatmapColumn } from "@zeron/ui/heatmap-chart";
import { chartColor, ChartLegend } from "@zeron/ui/chart-primitives";
import { average, DAY, HOUR, profile, type ActivityCalendar, type ActivityDay, type ActivitySelection } from "./account-activity-data";
import type { AccountActivityEvent, AccountActivityLabels } from "./account-activity-types";

const noMargin = { top: 0, right: 0, bottom: 0, left: 0 };
export const MATRIX_HEIGHT = 432;
export const activityChartColors = { primary: chartColor(1), secondary: chartColor(2), incident: chartColor(7) };
const activityColors = CHART_SCALE_VARS;

export function windowColor(percent: number | null) {
  if (percent === null || !Number.isFinite(percent)) return "var(--surface-raised)";
  return percent >= 100 ? activityChartColors.incident : activityColors[percent < 40 ? 1 : percent < 60 ? 2 : percent < 80 ? 3 : 4];
}

export function ActivityLegend({ labels, windows = false, relative = false }: { labels: AccountActivityLabels; windows?: boolean; relative?: boolean }) {
  const values = windows ? ["<40%", "40–60%", "60–80%", "80–99%", labels.hitLimit] : relative ? ["", "", "", "", labels.busiestHour] : ["0", "1–2", "3–4", "5–6", "7+"];
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-body text-fg-subtle">
    <span>{windows ? labels.windowPeak : relative ? labels.quietActivity : labels.active}</span>
    <ChartLegend className="flex flex-wrap gap-x-4 gap-y-2 text-body" items={values.map((label, index) => ({ id: String(index), label,
      color: windows ? index === 4 ? activityChartColors.incident : activityColors[index + 1] : activityColors[index] }))} />
    {windows ? <span className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-4 rounded-sm border border-dashed border-brand" />{labels.thisWindow}</span>
      : <><LegendMark line color={activityChartColors.incident}>{labels.locked}</LegendMark><LegendMark color={activityChartColors.incident}>{labels.ranOut}</LegendMark>{!relative && <><LegendMark line>{labels.weekday}</LegendMark><LegendMark line dashed color={activityChartColors.secondary}>{labels.weekend}</LegendMark></>}<span className="text-label">{labels.missing}</span></>}
  </div>;
}
export function LegendMark({ children, color = activityChartColors.primary, line, dashed }: { children: ReactNode; color?: string; line?: boolean; dashed?: boolean }) {
  return <span className="inline-flex items-center gap-2 text-body text-fg-subtle"><span aria-hidden className={line ? `w-3 border-t-2 ${dashed ? "border-dashed" : ""}` : "size-2 rounded-full"} style={line ? { borderColor: color } : { backgroundColor: color }} />{children}</span>;
}

export function ActivityHeatmap({ columns, points = [], locks, max = 8, height, labels, formatHeader, formatLabel }: {
  columns: HeatmapColumn[]; points?: { column: number; row: number; label?: string }[]; locks?: { column: number; row: number }[];
  max?: number; height: number; labels: AccountActivityLabels;
  formatHeader?: (count: number, date: Date) => ReactNode; formatLabel?: (count: number, date: Date) => string;
}) {
  return <HeatmapMatrix ariaLabel={labels.matrix} data={columns} points={points} lockedCells={locks} height={height} max={max}
    formatHeader={formatHeader} formatLabel={formatLabel ?? ((count, date) => `${String(date.getUTCHours()).padStart(2, "0")}:00 · ${Number.isFinite(count) ? count.toLocaleString(undefined, { maximumFractionDigits: 1 }) : labels.unknown} ${labels.active}`)} />;
}

export function MatrixChart({ selection, days, calendar, labels }: {
  selection: ActivitySelection; days: ActivityDay[]; calendar: ActivityCalendar; labels: AccountActivityLabels;
}) {
  const byHour = new Map(selection.hours.map((point) => [`${point.date}/${point.hour}`, point.active]));
  const timestamps = new Map(selection.hours.map((point) => [`${point.date}/${point.hour}`, point.timestamp]));
  const columns = days.map((day, column) => ({ bin: column, bins: Array.from({ length: 24 }, (_, hour) => ({
    bin: hour, date: new Date(timestamps.get(`${day.date}/${hour}`) ?? calendar.fromCalendar(day.date, hour)), count: byHour.get(`${day.date}/${hour}`) ?? NaN,
  })) }));
  const points = selection.events.flatMap((event) => {
    const part = calendar.parts(event.timestamp), column = days.findIndex((day) => day.date === part.date);
    return column < 0 ? [] : [{ column, row: part.hour, label: `${labels.ranOut} · ${calendar.date(event.timestamp)}` }];
  });
  return <HeatmapMatrix ariaLabel={labels.matrix} data={columns} points={points} height={MATRIX_HEIGHT} minWidth={640} className="pb-2"
    columns={days.map((day, index) => ({ id: day.date, label: calendar.weekday(day.weekday).replace(/^(星期|周)/, "").slice(0, 1),
      groupLabel: index % 7 === 0 ? calendar.date(day.timestamp) : undefined, weekend: day.weekday >= 5,
      locked: selection.locks.filter((event) => event.timestamp < day.end && event.unlockedAt > day.timestamp).length }))}
    rowLabels={Array.from({ length: 24 }, (_, hour) => hour % 6 === 0 ? `${String(hour).padStart(2, "0")}:00` : "")}
    lockedLabel={labels.locked} profile={{ title: labels.dayProfile, description: labels.averageActive,
      content: <DayProfile selection={selection} height={MATRIX_HEIGHT} label={labels.dayProfile} eventHours={selection.events.map((event) => calendar.parts(event.timestamp).hour)} />,
      footer: <><span>0</span><span>{selection.accounts.length.toFixed(1)}</span></> }}
    formatHeader={(_, date) => calendar.date(date.getTime())}
    formatLabel={(count, date) => `${String(calendar.parts(date.getTime()).hour).padStart(2, "0")}:00 · ${Number.isFinite(count) ? count : labels.unknown} ${labels.active}`} />;
}

function DayProfile({ selection, height, label, eventHours }: { selection: ActivitySelection; height: number; label: string; eventHours: number[] }) {
  const chartData = useMemo(() => profile(selection), [selection]);
  return <div className="relative overflow-hidden" style={{ height }} aria-label={label}>
    <div className="pointer-events-none absolute left-0 top-0" style={{ width: height, height: 152, transform: "translateX(152px) rotate(90deg)", transformOrigin: "0 0" }}>
      <LineChart data={chartData} xDataKey="timestamp" className="h-full w-full" aspectRatio="auto" margin={noMargin} yDomain={[0, Math.max(1, selection.accounts.length)]} animationDuration={0} yDomainTween={false}>
        <Line dataKey="weekday" stroke={activityChartColors.primary} strokeWidth={1.5} curve={curveLinear} animate={false} fadeEdges={false} />
        <Line dataKey="weekend" stroke={activityChartColors.secondary} strokeWidth={1.5} curve={curveLinear} animate={false} fadeEdges={false} dashFromIndex={0} dashArray="4,4" />
      </LineChart>
    </div>
    {[...new Set(eventHours)].map((hour) => <span key={hour} aria-hidden className="absolute right-0 h-0.5 w-1.5 rounded-sm" style={{ top: `${(hour + .5) / 24 * 100}%`, backgroundColor: activityChartColors.incident }} />)}
  </div>;
}

type LockInterval = { id: string; start: number; end: number };
function EventAnnotations({ events, locks, start, end }: { events: readonly AccountActivityEvent[]; locks?: readonly LockInterval[]; start: number; end: number }) {
  const { xScale, innerHeight } = useChartStable();
  const intervals = locks ?? events.map((event) => ({ id: event.id, start: event.timestamp, end: event.unlockedAt }));
  return <g pointerEvents="none">
    {intervals.filter((lock) => lock.start < end && lock.end > start).map((lock) => <rect key={lock.id}
      data-slot="account-activity-lock" x={xScale(new Date(Math.max(start, lock.start)))} y={Math.max(0, innerHeight - 3)}
      width={Math.max(0, xScale(new Date(Math.min(end, lock.end))) - xScale(new Date(Math.max(start, lock.start))))}
      height={3} fill={activityChartColors.incident} opacity={.65} />)}
    {events.filter((event) => event.timestamp >= start && event.timestamp < end).map((event) => {
      const x = xScale(new Date(event.timestamp));
      return <g key={event.id}><line x1={x} x2={x} y1={7} y2={innerHeight} stroke={activityChartColors.incident} strokeWidth={1.5} /><circle data-slot="account-activity-run-out" cx={x} cy={6} r={3.5} fill={activityChartColors.incident} /></g>;
    })}
  </g>;
}

export function ActivityArea({ points, start, end, max, height = 64, events = [], locks, nights = false, typical = false, selection, onRangeChange, labels }: {
  points: { timestamp: number; value: number | null }[]; start: number; end: number; max: number; height?: number;
  events?: readonly AccountActivityEvent[]; locks?: readonly LockInterval[]; nights?: boolean; typical?: boolean;
  selection?: { start: number; end: number }; onRangeChange?: (range: { start: number; end: number }) => void; labels: AccountActivityLabels;
}) {
  const chartData = useMemo(() => points.map((point) => ({ ...point })), [points]);
  const color = typical ? activityChartColors.primary : activityChartColors.secondary;
  return <div style={{ height }} className="relative min-w-0">
    <AreaChart data={chartData} xDataKey="timestamp" aspectRatio="auto" className="h-full w-full" margin={noMargin} xDomain={[new Date(start), new Date(end)]} yDomain={[0, Math.max(1, max)]} animationDuration={0} yDomainTween={false}>
      {nights && Array.from({ length: Math.ceil((end - start) / DAY) }, (_, index) => <ReferenceArea key={index} x1={start + index * DAY} x2={start + index * DAY + 7 * HOUR} fill="var(--surface-base)" fillOpacity={.65} stroke="transparent" />)}
      <Area dataKey="value" curve={typical ? curveLinear : curveStepAfter} stroke={color} strokeWidth={typical ? 1.7 : 1.1}
        fill={color} fillOpacity={.16} gradientToOpacity={.16} animate={false} showHighlight={false} />
      <EventAnnotations events={events} locks={locks} start={start} end={end} />
      {selection && <ChartBrush selection={{ start: new Date(selection.start), end: new Date(selection.end) }} selectedBoxStyle={{ fill: "var(--brand)", fillOpacity: .08, stroke: "var(--brand)", strokeWidth: 1 }} onSelectionChange={(range) => { if (range) onRangeChange?.({ start: range.start.getTime(), end: range.end.getTime() }); }} />}
      {!selection && <ChartTooltip showDatePill={false} rows={(point) => [{ label: labels.active, value: point.value == null ? labels.unknown : Number(point.value).toLocaleString(undefined, { maximumFractionDigits: 1 }), color }]} />}
    </AreaChart>
  </div>;
}

export function ProfileChart({ selection, labels, calendar }: { selection: ActivitySelection; labels: AccountActivityLabels; calendar: ActivityCalendar }) {
  const points = useMemo(() => profile(selection), [selection]);
  return <div className="space-y-2">
    <LineChart data={points} xDataKey="timestamp" className="h-28 w-full" aspectRatio="auto" margin={{ ...noMargin, top: 5, bottom: 5 }} animationDuration={0} yDomainTween={false}>
      <Line dataKey="weekday" stroke={activityChartColors.primary} curve={curveLinear} strokeWidth={1.7} animate={false} fadeEdges={false} />
      <Line dataKey="weekend" stroke={activityChartColors.secondary} curve={curveLinear} strokeWidth={1.5} animate={false} fadeEdges={false} dashFromIndex={0} dashArray="4,4" />
      <ChartTooltip showDatePill={false} rows={(point) => ["weekday", "weekend"].map((key) => ({ label: key === "weekday" ? labels.weekday : labels.weekend, color: key === "weekday" ? activityChartColors.primary : activityChartColors.secondary, value: point[key] == null ? labels.unknown : Number(point[key]).toFixed(1) }))} />
    </LineChart>
    <div className="relative h-2" aria-hidden>{[...new Set(selection.events.map((event) => calendar.parts(event.timestamp).hour))].map((hour) => <span key={hour} className="absolute top-0 h-2 w-0.5 rounded-sm" style={{ left: `${hour / 23 * 100}%`, backgroundColor: activityChartColors.incident }} />)}</div>
    <HourAxis />
  </div>;
}

export function HourAxis() { return <div className="flex justify-between text-body tabular-nums text-fg-subtle">{["00:00", "06:00", "12:00", "18:00", "23:00"].map((hour) => <span key={hour}>{hour}</span>)}</div>; }

export function WeekdayHeatmap({ selection, calendar, labels }: { selection: ActivitySelection; calendar: ActivityCalendar; labels: AccountActivityLabels }) {
  const columns = Array.from({ length: 24 }, (_, hour) => ({ bin: hour, bins: Array.from({ length: 7 }, (_, weekday) => ({ bin: weekday, date: new Date(Date.UTC(2026, 8, 14 + weekday, hour)),
    count: average(selection.hours.filter((point) => point.weekday === weekday && point.hour === hour).map((point) => point.active)) ?? NaN,
  })) }));
  const points = selection.events.map((event) => { const part = calendar.parts(event.timestamp); return { column: part.hour, row: part.weekday }; });
  return <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2"><div /><HourAxis /><div className="flex flex-col justify-around text-body text-fg-subtle">{Array.from({ length: 7 }, (_, weekday) => <span key={weekday}>{calendar.weekday(weekday)}</span>)}</div><ActivityHeatmap columns={columns} points={points} height={196} labels={labels} formatHeader={(_, date) => calendar.weekday((date.getUTCDay() + 6) % 7)} /></div>;
}
