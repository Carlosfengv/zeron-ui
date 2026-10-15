"use client";

import { memo, useCallback, useMemo, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";
import { CHART_SCALE_VARS } from "../chart-scale";
import { HeatmapCells } from "./heatmap-cells";
import { HeatmapChart } from "./heatmap-chart";
import { useHeatmap, type HeatmapBin, type HeatmapColumn } from "./heatmap-context";
import { HeatmapTooltip, type HeatmapTooltipProps } from "./heatmap-tooltip";
import { cn } from "#system/utils";

export interface HeatmapMatrixColumn {
  id: string;
  label: ReactNode;
  groupLabel?: ReactNode;
  /** Mark weekend columns with a small underline. */
  weekend?: boolean;
  /** Number of simultaneous lock intervals; zero means unlocked. */
  locked?: number;
}

export interface HeatmapMatrixPoint {
  column: number;
  row: number;
  label?: string;
}

export interface HeatmapMatrixProfile {
  title: ReactNode;
  description?: ReactNode;
  /** Host-owned profile, sized to the same height as the matrix. */
  content: ReactNode;
  footer?: ReactNode;
}

export interface HeatmapMatrixProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  ariaLabel: string;
  /** Equal-length row bins. NaN means missing; zero remains an observed idle value. */
  data: HeatmapColumn[];
  columns?: readonly HeatmapMatrixColumn[];
  /** One optional label per row; use empty strings for unticked rows. */
  rowLabels?: readonly ReactNode[];
  points?: readonly HeatmapMatrixPoint[];
  lockedCells?: readonly HeatmapMatrixPoint[];
  profile?: HeatmapMatrixProfile;
  /** Shows the per-column lock strip when supplied. */
  lockedLabel?: ReactNode;
  /** Upper value of the shared sequential chart scale. Default: 8 */
  max?: number;
  /** Plot height in CSS pixels. Default: 432 */
  height?: number;
  /** Local horizontal scrolling below this width; zero allows the plot to shrink. Default: 0 */
  minWidth?: number;
  formatHeader?: HeatmapTooltipProps["formatHeader"];
  formatLabel?: HeatmapTooltipProps["formatLabel"];
  onCellSelect?: (bin: HeatmapBin) => void;
  emptyContent?: ReactNode;
  invalidContent?: ReactNode;
}

const noMargin = { top: 0, right: 0, bottom: 0, left: 0 };
const incidentColor = "var(--chart-7)";
const noPoints: readonly HeatmapMatrixPoint[] = [];

const MatrixAnnotations = memo(function MatrixAnnotations({ points, locks, missing }: {
  points: readonly HeatmapMatrixPoint[]; locks: readonly HeatmapMatrixPoint[]; missing: readonly HeatmapMatrixPoint[];
}) {
  const { xScale, yScale, binWidth, binHeight, gap, data } = useHeatmap();
  const valid = (point: HeatmapMatrixPoint) => Number.isInteger(point.column) && Number.isInteger(point.row)
    && point.column >= 0 && point.row >= 0 && point.column < data.length && point.row < data[point.column].bins.length;
  return <g pointerEvents="none">
    {missing.map((point) => <circle key={`m-${point.column}-${point.row}`} cx={xScale(point.column) + (binWidth - gap) / 2}
      cy={yScale(point.row) + (binHeight - gap) / 2} r={1} fill="var(--fg-subtle)" opacity={.35} />)}
    {locks.filter(valid).map((point, index) => <rect key={index} data-slot="heatmap-matrix-lock" x={xScale(point.column)}
      y={yScale(point.row) + binHeight - 2} width={Math.max(0, binWidth - gap)} height={2} rx={1} fill={incidentColor} opacity={.7} />)}
    {points.filter(valid).map((point, index) => <circle key={index} data-slot="heatmap-matrix-point"
      cx={xScale(point.column) + (binWidth - gap) / 2} cy={yScale(point.row) + (binHeight - gap) / 2}
      r={Math.min(4, binHeight / 3)} fill={incidentColor} stroke="var(--surface-floating)" strokeWidth={1.5}><title>{point.label}</title></circle>)}
  </g>;
});

/** Ready-made matrix extension of HeatmapChart, with optional axes, incidents and profile slots. */
export const HeatmapMatrix = memo(function HeatmapMatrix({ ariaLabel, data, columns, rowLabels, points = noPoints,
  lockedCells = noPoints, profile, lockedLabel, max = 8, height = 432, minWidth = 0, formatHeader, formatLabel, onCellSelect,
  emptyContent = "No activity readings", invalidContent = "Invalid matrix data", className, style, ...props }: HeatmapMatrixProps) {
  const missing = useMemo(() => data.flatMap((column, col) => column.bins.flatMap((bin, row) =>
    Number.isFinite(bin.count) ? [] : [{ column: col, row }])), [data]);
  const colorScale = useCallback((value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value)) return "transparent";
    return CHART_SCALE_VARS[value <= 0 ? 0 : Math.min(4, Math.ceil(value / max * 4))];
  }, [max]);
  const rows = data[0]?.bins.length ?? 0;
  const valid = Number.isFinite(max) && max > 0 && Number.isFinite(height) && height > 0 && Number.isFinite(minWidth) && minWidth >= 0
    && (!columns || (columns.length === data.length && new Set(columns.map((column) => column.id)).size === columns.length))
    && (!rowLabels || rowLabels.length === rows) && data.every((column) => column.bins.length === rows)
    && (!columns || columns.every((column) => column.id && (column.locked === undefined || (Number.isFinite(column.locked) && column.locked >= 0))));
  if (!valid) return <div role="alert" className={cn("p-6 text-body text-fg-danger", className)}>{invalidContent}</div>;
  if (!data.length || !rows) return <div role="status" className={cn("p-6 text-body text-fg-subtle", className)}>{emptyContent}</div>;

  const showFooter = lockedLabel !== undefined || profile?.footer !== undefined;
  return <div {...props} role="region" aria-label={ariaLabel} data-slot="heatmap-matrix" data-theme-transition="instant"
    className={cn("min-w-0 overflow-x-auto text-body", className)} style={{ "--zeron-theme-color-duration": "0ms", ...style } as CSSProperties}>
    <div className="grid gap-x-4 gap-y-2" style={{ minWidth, gridTemplateColumns: `${rowLabels ? "3rem " : ""}minmax(0,1fr)${profile ? " 10rem" : ""}` }}>
      {(columns || profile) && <>
        {rowLabels && <div />}
        <div className="grid items-end" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0,1fr))` }}>
          {columns?.map((column) => <div key={column.id} className="flex h-full min-w-0 flex-col justify-between text-center text-body text-fg-subtle">
            <span className="relative whitespace-nowrap text-left">{column.groupLabel}</span>
            <span className={column.weekend ? "border-b-2 border-border pb-1" : "pb-1"}>{column.label}</span>
          </div>)}
        </div>
        {profile && <div className="text-body text-fg-subtle">{profile.title}<p className="mt-1 text-label">{profile.description}</p></div>}
      </>}
      {rowLabels && <div className="relative text-right text-body tabular-nums text-fg-subtle" style={{ height }}>
        {rowLabels.map((label, row) => <span key={row} className="absolute right-0" style={{ top: `${row / rows * 100}%` }}>{label}</span>)}
      </div>}
      <div style={{ height }}>
        <HeatmapChart data={data} layout="fill" stretchCells margin={noMargin} gap={2} animate={false} colorScale={colorScale} onCellSelect={onCellSelect}>
          <HeatmapCells cornerRadius={3} colorScale={colorScale} inactiveOpacity={.7} inactiveScale={1} activeScale={1} />
          <MatrixAnnotations points={points} locks={lockedCells} missing={missing} />
          <HeatmapTooltip formatHeader={formatHeader ? (count, date) => <span className="text-body">{formatHeader(count, date)}</span> : undefined} formatLabel={formatLabel} />
        </HeatmapChart>
      </div>
      {profile && profile.content}
      {showFooter && <>
        {rowLabels && <span className="text-right text-body text-fg-subtle">{lockedLabel}</span>}
        <div className="grid h-2.5 gap-0.5" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0,1fr))` }}>
          {lockedLabel !== undefined && data.map((_, index) => { const count = columns?.[index]?.locked ?? 0;
            return <span key={index} data-slot="heatmap-matrix-column-lock" className="rounded-sm"
              style={{ backgroundColor: count ? incidentColor : "var(--surface-raised)", opacity: count ? Math.min(1, .35 + count * .25) : 1 }} />;
          })}
        </div>
        {profile && <div className="flex justify-between text-body text-fg-subtle">{profile.footer}</div>}
      </>}
    </div>
  </div>;
});
