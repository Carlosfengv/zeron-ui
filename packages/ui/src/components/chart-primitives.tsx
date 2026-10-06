"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { badgeColors } from "#components/badge";
import { cn } from "#system/utils";

/** Categories never imply health. Stable IDs, rather than list positions, select a color. */
export const chartCategoricalColors = [badgeColors.indigo, badgeColors.cyan, badgeColors.violet, badgeColors.orange, badgeColors.teal, badgeColors.pink, badgeColors.blue, badgeColors.amber] as const;
export const chartStatusColors = { success: "var(--fg-success)", warning: "var(--fg-warning)", danger: "var(--fg-danger)", info: "var(--fg-info)", neutral: "var(--fg-neutral-status)" } as const;

export function chartSeriesColor(id: string) {
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return chartCategoricalColors[(hash >>> 0) % chartCategoricalColors.length];
}

/** Percent accepts ratios (0.15), never percentage points (15). Null stays unknown. */
export function createChartNumberFormatter(locale: string, options: Intl.NumberFormatOptions = {}) {
  const formatter = new Intl.NumberFormat(locale, options);
  return (value: unknown) => typeof value === "number" && Number.isFinite(value) ? formatter.format(value) : "—";
}

export function createChartTimeFormatter(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }) {
  const formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone });
  return (value: string | number) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? formatter.format(date) : "—";
  };
}

export interface ChartLegendItem {
  id: string;
  label: ReactNode;
  color?: string;
  value?: ReactNode;
  ratio?: ReactNode;
  /** Optional toggle state; omit for action-only legends. */
  pressed?: boolean;
}

/** Static by default. onSelect performs the consumer's explicit action, never implicit hiding. */
export function ChartLegend({ items, onSelect, className, ...props }: Omit<ComponentPropsWithoutRef<"ul">, "children" | "onSelect"> & {
  items: readonly ChartLegendItem[];
  onSelect?: (id: string) => void;
}) {
  return <ul className={cn("m-0 grid min-w-0 list-none gap-3 p-0 text-label", className)} data-slot="chart-legend" {...props}>{items.map((item) => {
    const content = <><span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color ?? chartSeriesColor(item.id) }} /><span className="min-w-0 flex-1 break-words text-fg-muted">{item.label}</span>{item.value !== undefined && <span className="shrink-0 tabular-nums text-fg-default">{item.value}</span>}{item.ratio !== undefined && <span className="shrink-0 tabular-nums text-fg-subtle">{item.ratio}</span>}</>;
    return <li key={item.id} data-series={item.id} className={cn("flex min-w-0 items-start gap-2", item.pressed === false && "opacity-50")}>{onSelect ? <button type="button" aria-pressed={item.pressed} className="flex w-full min-w-0 items-start gap-2 rounded-sm text-left hover:bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring" onClick={() => onSelect(item.id)}>{content}</button> : content}</li>;
  })}</ul>;
}

export interface VisualizationSegment { id: string; label: string; value: number | null; color?: string }
export function visualizationLayout(segments: readonly VisualizationSegment[], total?: number | null) {
  const valuesComplete = segments.every((segment) => segment.value !== null && Number.isFinite(segment.value) && segment.value >= 0);
  const assigned = segments.reduce((sum, segment) => sum + (segment.value !== null && Number.isFinite(segment.value) && segment.value >= 0 ? segment.value : 0), 0);
  const knownTotal = total !== null && total !== undefined && Number.isFinite(total) && total >= 0;
  // Only an omitted total can be inferred. Explicit unknown/invalid totals stay unknown.
  const finiteAssigned = Number.isFinite(assigned);
  const complete = valuesComplete && finiteAssigned && (total === undefined || knownTotal);
  const denominator = !finiteAssigned ? 0 : knownTotal ? Math.max(total, assigned) : total === undefined && complete ? assigned : 0;
  return { complete, assigned, denominator, remainder: Math.max(0, denominator - assigned), overflow: knownTotal && assigned > total };
}

type SegmentedBarProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  segments: readonly VisualizationSegment[];
  valueText: string;
  segmentSlot?: string;
  remainderSlot?: string;
} & ({ mode: "capacity"; total: number } | { mode: "distribution"; total?: number | null });

/** Capacity and distribution share drawing; each retains its denominator and accessible semantics. */
export function SegmentedBar({ segments, mode, total, valueText, className, segmentSlot, remainderSlot, ...props }: SegmentedBarProps) {
  const layout = visualizationLayout(segments, total);
  return <div role={mode === "capacity" ? "progressbar" : "img"} aria-label={valueText} {...(mode === "capacity" ? { "aria-valuemin": 0, "aria-valuemax": Math.max(layout.denominator, 1), "aria-valuenow": layout.complete ? layout.assigned : undefined, "aria-valuetext": valueText } : {})} className={cn("flex h-3 min-w-0 w-full overflow-hidden rounded-full bg-muted", className)} data-slot="segmented-bar" data-complete={layout.complete} data-overflow={layout.overflow} {...props}>
    {segments.map((segment) => <span key={segment.id} aria-hidden="true" className="h-full min-w-0" data-slot={segmentSlot ?? "segmented-bar-segment"} data-series={segment.id} style={{ backgroundColor: segment.color ?? chartSeriesColor(segment.id), flexBasis: 0, flexGrow: layout.denominator > 0 && segment.value !== null && Number.isFinite(segment.value) ? Math.max(0, segment.value) / layout.denominator : 0 }} />)}
    {layout.remainder > 0 && <span aria-hidden="true" className="h-full min-w-0 bg-muted" data-slot={remainderSlot ?? "segmented-bar-remainder"} style={{ flexBasis: 0, flexGrow: layout.remainder / layout.denominator }} />}
  </div>;
}

export interface ChartDataTableProps { caption: string; summary?: string; columns: readonly string[]; rows: readonly { id: string; label: ReactNode; values: readonly ReactNode[] }[] }
export function ChartDataTable({ caption, summary = "View data", columns, rows }: ChartDataTableProps) {
  return <details className="mt-3 min-w-0 text-label text-fg-muted" data-slot="chart-data-table"><summary className="w-fit cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring">{summary}</summary><div className="mt-2 max-h-52 overflow-auto rounded-lg border-hairline border-border"><table className="w-full text-left tabular-nums"><caption className="sr-only">{caption}</caption><thead><tr>{columns.map((column, index) => <th key={index} className="p-2">{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t-hairline border-border-subtle"><th scope="row" className="p-2 font-normal">{row.label}</th>{row.values.map((value, index) => <td key={index} className="p-2">{value}</td>)}</tr>)}</tbody></table></div></details>;
}
