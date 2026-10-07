import { Children, Fragment, isValidElement, type ReactNode } from "react";

export function isFiniteValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function chartDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return new Date(NaN);
  return new Date(value);
}

export function rawChartValue(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  return String(value);
}

/** Keep raw rows intact; only the plotting view is chronological and date-valid. */
export function timeSeriesData(data: Record<string, unknown>[], key: string) {
  return data.filter(row => Number.isFinite(chartDate(row[key]).getTime()))
    .sort((a, b) => chartDate(a[key]).getTime() - chartDate(b[key]).getTime());
}

export function chartChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap(child =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? chartChildren(child.props.children) : [child]);
}

export function tooltipPosition(x: number, y: number, width: number, height: number, containerWidth: number, containerHeight: number, offset: number) {
  const flipped = x + width + offset > containerWidth;
  return {
    left: Math.max(0, Math.min(flipped ? x - offset - width : x + offset, containerWidth - width)),
    top: Math.max(0, Math.min(Math.max(offset, y - height / 2), containerHeight - height)),
    flipped,
  };
}
