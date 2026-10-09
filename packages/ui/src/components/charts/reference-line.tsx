"use client";

import type { ReactNode } from "react";
import { useChartStable, useYScale } from "./chart-context";

export interface ReferenceLineProps {
  /** Time coordinate, or a category on a BarChart. */
  x?: Date | number | string;
  /** Value on the chart's value scale, including horizontal BarChart. */
  y?: number;
  yAxisId?: string | number;
  stroke?: string;
  strokeDasharray?: string;
  label?: ReactNode;
}

/** Reference annotations use the same public scales as the plotted observations. */
export function ReferenceLine({ x, y, yAxisId, stroke = "var(--fg-default)", strokeDasharray = "3 4", label }: ReferenceLineProps) {
  const { xScale, barScale, bandWidth, innerWidth, innerHeight, margin, orientation } = useChartStable();
  const yScale = useYScale(yAxisId);
  const horizontal = (y !== undefined) !== (orientation === "horizontal");
  let position = NaN;
  if (y !== undefined) {
    position = yScale(y);
  } else if (x !== undefined) {
    position = barScale
      ? (barScale(String(x)) ?? NaN) + (bandWidth ?? 0) / 2
      : xScale(x instanceof Date ? x : new Date(x));
  }
  if (!Number.isFinite(position) || position < 0 || position > (horizontal ? innerHeight : innerWidth)) return null;
  return <g aria-hidden="true" pointerEvents="none" transform={`translate(${margin.left},${margin.top})`} data-slot="chart-reference-line">
    <line x1={horizontal ? 0 : position} x2={horizontal ? innerWidth : position} y1={horizontal ? position : 0} y2={horizontal ? position : innerHeight} stroke={stroke} strokeDasharray={strokeDasharray} />
    {label != null && <foreignObject x={horizontal ? 0 : Math.min(position, Math.max(0, innerWidth - 48))} y={horizontal ? position - 20 : -22} width={horizontal ? innerWidth : 48} height={20}><div className="text-label" style={{ color: stroke }}>{label}</div></foreignObject>}
  </g>;
}
