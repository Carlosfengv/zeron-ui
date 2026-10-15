"use client";

import { useId, type CSSProperties, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "#system/utils";

export type TimeWindowTone = "neutral" | "success" | "warning" | "danger";

export interface TimeWindowInterval {
  id: string;
  /** Epoch milliseconds. Intervals outside the visible range are clipped. */
  start: number;
  end: number;
  label: ReactNode;
  /** Plain text name, including dates, for the interval and its optional meter. */
  ariaLabel: string;
  variant?: "current" | "earlier" | "next";
  tone?: TimeWindowTone;
  /** A percentage of the complete interval, independent of visible clipping. */
  value?: number;
}

export interface TimeWindowMarker {
  id: string;
  at: number;
  label: string;
  kind?: "reset" | "expiry";
}

export interface TimeWindowRow {
  id: string;
  label: ReactNode;
  intervals: readonly TimeWindowInterval[];
  markers?: readonly TimeWindowMarker[];
  muted?: boolean;
}

export interface TimeWindowGroup {
  id: string;
  label: ReactNode;
  rows: readonly TimeWindowRow[];
}

export interface TimeWindowTick {
  id: string;
  start: number;
  end: number;
  label: ReactNode;
  description?: ReactNode;
}

export interface TimeWindowTimelineProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  ariaLabel: string;
  start: number;
  end: number;
  ticks: readonly TimeWindowTick[];
  groups: readonly TimeWindowGroup[];
  labelHeader?: ReactNode;
  now?: number;
  nowLabel?: string;
  /** Maximum label-track and minimum time-track widths, in CSS pixels. */
  labelWidth?: number;
  minTrackWidth?: number;
  emptyContent?: ReactNode;
  invalidContent?: ReactNode;
}

/** Shared by the plotted intervals and their legends; follows chart theme overrides. */
export const timeWindowToneColors: Readonly<Record<TimeWindowTone, string>> = {
  neutral: "var(--chart-6)",
  success: "var(--chart-1)",
  warning: "var(--chart-3)",
  danger: "var(--chart-7)",
};

function validTimeline({ start, end, ticks, groups, now, labelWidth = 300, minTrackWidth = 840 }: TimeWindowTimelineProps) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(end - start) || end <= start || (now !== undefined && !Number.isFinite(now))
    || !Number.isFinite(labelWidth) || labelWidth <= 0 || !Number.isFinite(minTrackWidth) || minTrackWidth <= 0) return false;
  const rowIds = new Set<string>();
  const unique = (ids: readonly string[]) => ids.every(Boolean) && new Set(ids).size === ids.length;
  return unique(ticks.map((tick) => tick.id)) && unique(groups.map((group) => group.id))
    && ticks.every((tick, index) => Number.isFinite(tick.start) && Number.isFinite(tick.end) && tick.start < tick.end
      && (index === 0 || tick.start >= ticks[index - 1].end))
    && groups.every((group) => group.rows.every((row) => {
      if (!row.id || rowIds.has(row.id)) return false;
      rowIds.add(row.id);
      return unique(row.intervals.map((interval) => interval.id)) && unique((row.markers ?? []).map((marker) => marker.id))
        && row.intervals.every((interval) => Number.isFinite(interval.start) && Number.isFinite(interval.end) && Number.isFinite(interval.end - interval.start) && interval.start < interval.end
          && (interval.value === undefined || (Number.isFinite(interval.value) && interval.value >= 0 && interval.value <= 100)))
        && (row.markers ?? []).every((marker) => Number.isFinite(marker.at));
    }));
}

function TimelineInterval({ interval, start, end, now }: { interval: TimeWindowInterval; start: number; end: number; now?: number }) {
  const visibleStart = Math.max(start, interval.start);
  const visibleEnd = Math.min(end, interval.end);
  if (visibleEnd <= visibleStart) return null;
  const variant = interval.variant ?? "current";
  const color = timeWindowToneColors[interval.tone ?? "success"];
  const percent = (at: number) => (at - visibleStart) / (visibleEnd - visibleStart) * 100;
  const elapsed = now === undefined ? 0 : Math.max(0, Math.min(100, percent(now)));
  const valueEnd = interval.value === undefined ? visibleStart : interval.start + (interval.end - interval.start) * interval.value / 100;
  const valueWidth = Math.max(0, Math.min(100, percent(valueEnd)));
  const style: CSSProperties = {
    left: `${(visibleStart - start) / (end - start) * 100}%`,
    width: `${(visibleEnd - visibleStart) / (end - start) * 100}%`,
    ...(variant === "current" ? { backgroundColor: `color-mix(in oklab, ${color} 8%, var(--surface-floating))`, borderColor: `color-mix(in oklab, ${color} 45%, transparent)` } : {}),
  };
  return <div data-slot="time-window-interval" data-variant={variant} data-tone={interval.tone ?? "success"}
    role={interval.value === undefined ? "img" : "meter"} aria-label={interval.ariaLabel}
    aria-valuemin={interval.value === undefined ? undefined : 0} aria-valuemax={interval.value === undefined ? undefined : 100}
    aria-valuenow={interval.value} title={interval.ariaLabel}
    className={cn("absolute top-1/2 h-11 -translate-y-1/2 overflow-hidden rounded-lg border-hairline text-body",
      variant === "earlier" && "border-transparent bg-chart-6/20 text-fg-subtle",
      variant === "next" && "border-dashed border-border bg-surface-floating text-fg-subtle",
      variant === "current" && "text-fg-default")}
    style={style}>
    {variant === "current" && <span aria-hidden="true" className="absolute inset-y-0 left-0" style={{ width: `${elapsed}%`, backgroundColor: `color-mix(in oklab, ${color} 13%, transparent)` }} />}
    <span aria-hidden="true" className={cn("relative block truncate px-3 pt-2", variant === "current" && "font-medium")}>{interval.label}</span>
    {variant === "current" && interval.value !== undefined && <span aria-hidden="true" className="absolute inset-x-2 bottom-1.5 h-1 rounded-sm" style={{ backgroundColor: `color-mix(in oklab, ${color} 20%, transparent)` }}>
      <span className="block h-full rounded-sm" style={{ width: `${valueWidth}%`, backgroundColor: color }} />
    </span>}
  </div>;
}

/** Grouped, horizontally scrollable time windows. Hosts own time zones and ticks. */
export function TimeWindowTimeline(props: TimeWindowTimelineProps) {
  const { ariaLabel, start, end, ticks, groups, labelHeader, now, nowLabel = "Now", labelWidth = 300, minTrackWidth = 840,
    emptyContent = "No time windows", invalidContent = "Invalid timeline data", className, style, ...rest } = props;
  const captionId = useId();
  if (!validTimeline(props)) return <div role="alert" className={cn("p-6 text-body text-fg-danger", className)}>{invalidContent}</div>;
  if (!groups.some((group) => group.rows.length)) return <div role="status" className={cn("p-10 text-center text-body text-fg-subtle", className)}>{emptyContent}</div>;
  const position = (at: number) => `${(at - start) / (end - start) * 100}%`;
  const nowVisible = now !== undefined && now >= start && now < end;
  const currentTick = nowVisible ? ticks.find((tick) => now >= tick.start && now < tick.end) : undefined;
  const visibleTicks = ticks.filter((tick) => tick.end > start && tick.start < end);
  const labelSize = `min(${labelWidth}px, 55cqw)`;
  return <div {...rest} data-slot="time-window-timeline" role="region" aria-label={ariaLabel} tabIndex={0}
    className={cn("@container/time-window w-full overflow-x-auto rounded-xl border-hairline border-border bg-surface-floating focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring", className)} style={style}>
    <div className="relative isolate" style={{ minWidth: `calc(${labelSize} + ${minTrackWidth}px)` }}>
      <table className="w-full table-fixed border-separate border-spacing-0 text-left text-body" aria-labelledby={captionId}>
        <caption id={captionId} className="sr-only">{ariaLabel}</caption>
        <colgroup><col style={{ width: labelSize }} /><col /></colgroup>
        <thead><tr>
          <th scope="col" className="sticky left-0 z-raised h-16 border-b-hairline border-r-hairline border-border bg-surface-raised px-5 font-normal text-fg-subtle">{labelHeader}</th>
          <th scope="col" className="relative h-16 border-b-hairline border-border bg-surface-raised p-0 font-normal">
            <span className="sr-only">{ariaLabel}</span>
            {visibleTicks.map((tick) => <span key={tick.id} data-slot="time-window-tick" aria-current={currentTick?.id === tick.id ? "date" : undefined}
              className={cn("absolute inset-y-0 flex flex-col items-center justify-center border-l-hairline border-border-subtle text-label text-fg-subtle", currentTick?.id === tick.id && "bg-active text-fg-default")}
              style={{ left: position(Math.max(start, tick.start)), width: position(start + Math.min(end, tick.end) - Math.max(start, tick.start)) }}>
              <span>{tick.label}</span><span className="mt-0.5 font-medium">{tick.description}</span>
            </span>)}
          </th>
        </tr></thead>
        {groups.map((group) => <tbody key={group.id}>
          <tr><th scope="rowgroup" colSpan={2} className="h-11 border-b-hairline border-border-subtle bg-surface-raised px-0 font-normal">
            <span className="sticky left-0 inline-flex items-center gap-2.5 px-5 text-body text-fg-default">{group.label}</span>
          </th></tr>
          {group.rows.map((row) => <tr key={row.id} data-slot="time-window-row" data-muted={row.muted || undefined}>
            <th scope="row" className="sticky left-0 z-raised border-b-hairline border-r-hairline border-border-subtle bg-surface-floating px-5 py-4 align-middle font-normal">
              <div className={cn("min-w-0", row.muted && "opacity-50")}>{row.label}</div>
            </th>
            <td className="relative h-28 border-b-hairline border-border-subtle p-0">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                {visibleTicks.map((tick) => <span key={tick.id} className="absolute inset-y-0 border-l-hairline border-border-subtle" style={{ left: position(Math.max(start, tick.start)) }} />)}
                {currentTick && <span className="absolute inset-y-0 bg-hover" style={{ left: position(Math.max(start, currentTick.start)), width: position(start + Math.min(end, currentTick.end) - Math.max(start, currentTick.start)) }} />}
              </div>
              <div className={cn("absolute inset-0", row.muted && "opacity-45")}>
                {row.intervals.map((interval) => <TimelineInterval key={interval.id} interval={interval} start={start} end={end} now={now} />)}
                {row.markers?.filter((marker) => marker.at >= start && marker.at < end).map((marker) => <span key={marker.id}
                  data-slot="time-window-marker" data-kind={marker.kind ?? "reset"} role="img" aria-label={marker.label} title={marker.label}
                  className={cn("absolute inset-y-3 z-content -translate-x-1/2 rounded-full border-2 border-surface-floating", marker.kind === "expiry" ? "w-2" : "w-1.5")}
                  style={{ left: position(marker.at), backgroundColor: marker.kind === "expiry" ? "var(--chart-5)" : "var(--chart-2)" }} />)}
              </div>
            </td>
          </tr>)}
        </tbody>)}
      </table>
      {nowVisible && <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 top-16 z-content" style={{ left: labelSize }}>
        <span data-slot="time-window-now" className="absolute inset-y-0 border-l-2 border-brand/75" style={{ left: position(now) }}>
          <span className="absolute left-0 top-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand px-2 py-0.5 text-label text-fg-on-brand">{nowLabel}</span>
        </span>
      </div>}
    </div>
  </div>;
}
