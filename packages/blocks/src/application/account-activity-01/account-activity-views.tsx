"use client";

import { useMemo, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Slider } from "@zeron/ui/slider";
import { Tooltip } from "@zeron/ui/tooltip";
import { createIconSlot } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { activityChartColors, ActivityArea, ActivityHeatmap, ActivityLegend, HourAxis, LegendMark, ProfileChart, WeekdayHeatmap, windowColor } from "./account-activity-charts";
import { activityDays, average, clampActivityRange, DAY, HOUR, isLocked, selectionLockedHours, type ActivityCalendar, type ActivitySelection } from "./account-activity-data";
import type { AccountActivityAccount, AccountActivityData, AccountActivityLabels, AccountActivityQuery } from "./account-activity-types";

const ChevronDown = createIconSlot("chevron-down");
const ChevronRight = createIconSlot("chevron-right");
export function AccountName({ account, hidden, onClick }: { account: AccountActivityAccount; hidden?: boolean; onClick?: () => void }) {
  const content = <span className="flex min-w-0 items-center gap-2"><span aria-hidden className="flex size-4 shrink-0 items-center justify-center text-fg-default">{account.logo}</span><span className="truncate">{account.name}</span></span>;
  return onClick ? <Button size="md" variant="ghost" className={cn("w-full justify-start", hidden && "opacity-40")} aria-pressed={!hidden} onClick={onClick} title={account.name}>{content}</Button>
    : <span className="block min-w-0 truncate text-body text-fg-muted" title={account.name}>{content}</span>;
}

export function WindowUsage({ data, selection, calendar, labels }: { data: AccountActivityData; selection: ActivitySelection; calendar: ActivityCalendar; labels: AccountActivityLabels }) {
  const [open, setOpen] = useState(true);
  return <div className="border-t-hairline border-border pt-4">
    <Button variant="ghost" size="md" aria-expanded={open} onClick={() => setOpen(!open)} leadingIcon={open ? ChevronDown : ChevronRight}>
      {labels.usageWindows}
    </Button><span className="ml-2 hidden text-label text-fg-subtle sm:inline">{labels.usageWindowsHint}</span>
    {open && <div className="mt-4 space-y-6">
      <div className="overflow-x-auto"><div className="min-w-144 space-y-2.5">
        {selection.accounts.map((account) => <div key={account.id} className="grid grid-cols-[minmax(0,1fr)_11rem] items-center gap-5">
          <div className="relative h-5 rounded-sm bg-surface-raised">
            {data.windows.filter((window) => window.accountId === account.id && window.end > data.start && window.start < data.end).map((window) => {
              const start = Math.max(data.start, window.start), end = Math.min(data.end, window.end);
              const description = `${calendar.date(window.start)} – ${calendar.date(window.end - 1)} · ${window.peakPercent === null ? labels.unknown : `${window.peakPercent}%`} ${window.current ? `· ${labels.thisWindow}` : ""}`;
              return <Tooltip key={window.id} content={description} className="text-body"><span tabIndex={0} role="img" aria-label={`${account.name} · ${description}`}
                className={cn("absolute inset-y-0 rounded-sm border-2 border-surface-floating outline-none focus-visible:ring-2 focus-visible:ring-focus-ring", window.current && "border border-dashed border-brand")}
                style={{ left: `${(start - data.start) / (data.end - data.start) * 100}%`, width: `${(end - start) / (data.end - data.start) * 100}%`, backgroundColor: windowColor(window.peakPercent) }} /></Tooltip>;
            })}
          </div><AccountName account={account} />
        </div>)}
      </div></div><ActivityLegend labels={labels} windows />
    </div>}
  </div>;
}

export function WeeksView({ data, selection, calendar, labels, locale }: { data: AccountActivityData; selection: ActivitySelection; calendar: ActivityCalendar; labels: AccountActivityLabels; locale: string }) {
  const days = activityDays(data, calendar);
  const first = new Date(`${days[0].date}T00:00:00Z`); first.setUTCDate(first.getUTCDate() - days[0].weekday);
  const weekStart = first.getTime(), weekCount = Math.floor((Date.parse(`${days[days.length - 1].date}T00:00:00Z`) - weekStart) / (7 * DAY)) + 1;
  const byHour = new Map(selection.hours.map((point) => [Date.parse(`${point.date}T00:00:00Z`) + point.hour * HOUR, point.active]));
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const typical = Array.from({ length: 7 * 24 }, (_, hour) => ({ timestamp: hour * HOUR,
    value: average(selection.hours.filter((point) => point.weekday === Math.floor(hour / 24) && point.hour === hour % 24).map((point) => point.active)),
  }));
  const peakValue = Math.max(0, ...typical.map((point) => point.value ?? 0)), max = Math.max(1, peakValue);
  return <div className="space-y-6">
    <div className="overflow-x-auto"><div className="grid min-w-192 grid-cols-[7rem_minmax(0,1fr)_11rem] items-center gap-x-5 gap-y-4">
      <div /><div className="grid grid-cols-7 text-center text-body text-fg-subtle">{Array.from({ length: 7 }, (_, day) => <span key={day}>{calendar.weekday(day)}</span>)}</div><div />
      <div className="text-body text-fg-muted">{labels.typicalWeek}<p className="mt-1 text-label text-fg-subtle">{labels.averageHour}</p></div>
      <ActivityArea points={typical} start={0} end={7 * DAY} max={max} height={100} nights typical labels={labels} />
      <div className="text-body text-fg-muted">{labels.peak} {format.format(peakValue)}<p className="mt-1 text-label text-fg-subtle">{labels.weekAverage(format.format((data.end - data.start) / DAY / 7))}</p></div>
      {Array.from({ length: weekCount }, (_, index) => {
        const start = weekStart + index * 7 * DAY, end = start + 7 * DAY;
        const points = Array.from({ length: 7 * 24 }, (_, hour) => { const timestamp = start + hour * HOUR; return { timestamp, value: byHour.get(timestamp) ?? null }; });
        const actualStart = calendar.fromCalendar(new Date(start).toISOString().slice(0, 10)), actualEnd = calendar.fromCalendar(new Date(end).toISOString().slice(0, 10));
        const events = selection.events.filter((event) => event.timestamp >= actualStart && event.timestamp < actualEnd)
          .map((event) => ({ ...event, timestamp: calendar.coordinate(event.timestamp) }));
        const locks = selection.lockRanges.flatMap((range) => selection.locks.flatMap((event) => {
          const a = Math.max(actualStart, range.start, event.timestamp), b = Math.min(actualEnd, range.end, event.unlockedAt);
          return b > a ? [{ id: `${event.id}/${range.start}`, start: calendar.coordinate(a), end: calendar.coordinate(b) }] : [];
        }));
        const hours = selectionLockedHours(selection, actualStart, actualEnd);
        return <WeekRow key={start} start={start} end={end} points={points} max={Math.max(max, ...points.map((point) => point.value ?? 0))} events={events} locks={locks} label={calendar.date(actualStart)} summary={events.length || hours ? `${labels.runOuts(events.length)} · ${labels.lockedHours(format.format(hours))}` : labels.quiet} labels={labels} />;
      })}
    </div></div>
    <div className="flex flex-wrap gap-x-5 gap-y-2"><LegendMark color={activityChartColors.secondary}>{labels.active}</LegendMark><LegendMark line color={activityChartColors.incident}>{labels.locked}</LegendMark><LegendMark color={activityChartColors.incident}>{labels.ranOut}</LegendMark><LegendMark color="var(--surface-base)">{labels.night}</LegendMark><LegendMark line>{labels.typicalWeek}</LegendMark></div>
  </div>;
}
function WeekRow({ start, end, points, max, events, locks, label, summary, labels }: {
  start: number; end: number; points: { timestamp: number; value: number | null }[]; max: number;
  events: ActivitySelection["events"]; locks: { id: string; start: number; end: number }[]; label: string; summary: string; labels: AccountActivityLabels;
}) { return <><span className="text-body text-fg-muted">{label}</span><ActivityArea points={points} start={start} end={end} max={max} events={events} locks={locks} nights labels={labels} /><span className={cn("text-body", summary === labels.quiet ? "text-fg-subtle" : "text-fg-muted")}>{summary}</span></>; }

export function RangeView({ data, selection, calendar, labels, query, onChange }: {
  data: AccountActivityData; selection: ActivitySelection; calendar: ActivityCalendar; labels: AccountActivityLabels; query: AccountActivityQuery; onChange: (patch: Partial<AccountActivityQuery>) => void;
}) {
  const accounts = data.accounts.filter((account) => query.accountId === "all" || query.accountId === account.id);
  const boundaries = useMemo(() => [data.start, ...activityDays({ start: data.start, end: data.end }, calendar).slice(1).map((day) => day.timestamp), data.end], [data.start, data.end, calendar]);
  const dayCount = boundaries.length - 1;
  const startDay = Math.max(0, boundaries.findIndex((time) => time > query.range.start) - 1);
  const endDay = Math.max(startDay + 1, boundaries.findIndex((time) => time >= query.range.end));
  const changeRange = (range: { start: number; end: number }) => onChange({ range: clampActivityRange(data, range) });
  const peak = selection.hours.reduce<(typeof selection.hours)[number] | undefined>((best, point) => !best || point.active > best.active ? point : best, undefined);
  return <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
    <div className="min-w-0 space-y-4">
      <div className="overflow-x-auto"><div className="min-w-160">
        <div className="mb-2 grid grid-cols-[11rem_minmax(0,1fr)] gap-4"><div /><div className="flex justify-between text-body text-fg-subtle">{Array.from({ length: 6 }, (_, index) => <span key={index}>{calendar.date(data.start + (data.end - data.start - 1) * index / 5)}</span>)}</div></div>
        <div className="space-y-2.5">{accounts.map((account) => {
          const windows = data.windows.filter((window) => window.accountId === account.id);
          const points = windows.flatMap((window) => [...window.readings.map((reading) => ({ timestamp: reading.timestamp, value: reading.percent })), { timestamp: window.end, value: null }]).sort((a, b) => a.timestamp - b.timestamp);
          const hidden = query.hiddenAccountIds.includes(account.id);
          return <div key={account.id} className="grid grid-cols-[11rem_minmax(0,1fr)] items-center gap-4">
            <AccountName account={account} hidden={hidden} onClick={() => onChange({ hiddenAccountIds: hidden ? query.hiddenAccountIds.filter((id) => id !== account.id) : [...query.hiddenAccountIds, account.id] })} />
            <div className={cn("min-w-0 border-b-hairline border-border", hidden && "opacity-30")}>
              <ActivityArea points={points} start={data.start} end={data.end} max={100} height={38} events={data.events.filter((event) => event.accountId === account.id)} labels={labels} selection={query.range} onRangeChange={changeRange} />
            </div>
          </div>;
        })}</div>
      </div></div>
      <Slider label={labels.selectRange} value={[startDay, endDay]} min={0} max={dayCount} step={1} showValue={false} color="brand"
        onChange={(value) => { if (Array.isArray(value)) changeRange({ start: boundaries[value[0]], end: boundaries[Math.max(value[0] + 1, value[1])] }); }} />
      <div className="flex flex-wrap gap-x-5 gap-y-2"><LegendMark color={activityChartColors.secondary}>{labels.windowFilling}</LegendMark><LegendMark line color={activityChartColors.incident}>{labels.locked}</LegendMark><span className="text-label text-fg-subtle">{labels.accountHint}</span></div>
    </div>
    <div className="min-w-0 space-y-6 border-t-hairline border-border pt-6 xl:border-l-hairline xl:border-t-0 xl:pl-6 xl:pt-0">
      <div><h3 className="text-title font-medium text-fg-default">{peak?.active ? labels.busiest(`${String(peak.hour).padStart(2, "0")}:00`, calendar.weekday(peak.weekday)) : selection.hours.length ? labels.quietActivity : labels.empty}</h3><p className="mt-1 text-body text-fg-subtle">{labels.runOuts(selection.events.length)}</p></div>
      {selection.hours.length ? <><WeekdayHeatmap selection={selection} calendar={calendar} labels={labels} /><ProfileChart selection={selection} labels={labels} calendar={calendar} /></> : <p className="py-12 text-body text-fg-subtle">{labels.empty}</p>}
      <div className="flex flex-wrap gap-x-5 gap-y-2"><LegendMark line>{labels.weekday}</LegendMark><LegendMark line dashed color={activityChartColors.secondary}>{labels.weekend}</LegendMark><LegendMark color={activityChartColors.incident}>{labels.ranOut}</LegendMark></div>
    </div>
  </div>;
}

export function AccountsView({ selection, calendar, labels, locale }: { selection: ActivitySelection; calendar: ActivityCalendar; labels: AccountActivityLabels; locale: string }) {
  const lockTotals = new Map(selection.accounts.map((account) => [account.id, selectionLockedHours(selection, selection.start, selection.end, account.id)]));
  const accounts = [...selection.accounts].sort((a, b) => (lockTotals.get(b.id) ?? 0) - (lockTotals.get(a.id) ?? 0));
  const { values, lockedHours } = useMemo(() => {
    const buckets = new Map<string, number[]>();
    const lockedHours = new Set<string>();
    for (const point of selection.samples) {
      const key = `${point.accountId}/${calendar.parts(point.timestamp).hour}`;
      if (isLocked(point, selection.locks)) { lockedHours.add(key); continue; }
      if (point.value === null || !Number.isFinite(point.value) || point.value < 0) continue;
      buckets.set(key, [...(buckets.get(key) ?? []), point.value]);
    }
    return { values: new Map([...buckets].map(([key, list]) => [key, average(list)])), lockedHours };
  }, [selection, calendar]);
  const maxByAccount = new Map(accounts.map((account) => [account.id, Math.max(0, ...Array.from({ length: 24 }, (_, hour) => values.get(`${account.id}/${hour}`) ?? 0)) || 1]));
  const rowOrigin = Date.UTC(2026, 8, 14);
  const accountAt = (date: Date) => accounts[Math.floor((date.getTime() - rowOrigin) / DAY)];
  const columns = Array.from({ length: 24 }, (_, hour) => ({ bin: hour, bins: accounts.map((account, row) => ({ bin: row, date: new Date(rowOrigin + row * DAY + hour * HOUR), count: values.get(`${account.id}/${hour}`) == null ? NaN : (values.get(`${account.id}/${hour}`) ?? 0) / (maxByAccount.get(account.id) ?? 1) * 8 })) }));
  const points = selection.events.map((event) => ({ column: calendar.parts(event.timestamp).hour, row: accounts.findIndex((account) => account.id === event.accountId) }));
  const locks = accounts.flatMap((account, row) => Array.from({ length: 24 }, (_, hour) => ({ column: hour, row })).filter((cell) => lockedHours.has(`${account.id}/${cell.column}`)));
  const top = Array.from({ length: 24 }, (_, hour) => ({ timestamp: hour * HOUR, value: average(selection.hours.filter((point) => point.hour === hour).map((point) => point.active)) }));
  const peakValue = Math.max(0, ...top.map((point) => point.value ?? 0)), max = Math.max(1, peakValue), format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return <div className="space-y-6">
    <div className="overflow-x-auto"><div className="grid min-w-192 grid-cols-[12rem_minmax(0,1fr)_8rem] items-center gap-x-5 gap-y-4">
      <div className="text-body text-fg-default">{labels.allAccounts}<p className="mt-1 text-label text-fg-subtle">{labels.averageActive}</p></div>
      <div className="space-y-2"><ActivityArea points={top} start={0} end={23 * HOUR} max={max} height={80} typical labels={labels} /><HourAxis /></div>
      <span className="text-body text-fg-subtle">{labels.peak} {format.format(peakValue)}<p className="text-label">{labels.active}</p></span>
      <div className="flex flex-col" style={{ height: accounts.length * 34 }}>{accounts.map((account) => <div className="flex h-full min-h-0 items-center" key={account.id}><AccountName account={account} /></div>)}</div>
      <ActivityHeatmap columns={columns} points={points} locks={locks} height={accounts.length * 34} labels={labels}
        formatHeader={(_, date) => accountAt(date)?.name}
        formatLabel={(_, date) => { const account = accountAt(date), value = account ? values.get(`${account.id}/${date.getUTCHours()}`) : null; return `${String(date.getUTCHours()).padStart(2, "0")}:00 · ${value == null ? labels.unknown : format.format(value)}`; }} />
      <div className="flex flex-col" style={{ height: accounts.length * 34 }}>{accounts.map((account) => {
        const hours = lockTotals.get(account.id) ?? 0;
        return <span key={account.id} className={cn("flex h-full items-center justify-end whitespace-nowrap text-body", hours ? "text-fg-default" : "text-fg-subtle")}>{hours ? labels.lockedHours(format.format(hours)) : labels.neverLocked}</span>;
      })}</div>
    </div></div><ActivityLegend labels={labels} relative /><p className="text-label text-fg-subtle">{labels.scaleHint}</p>
  </div>;
}
