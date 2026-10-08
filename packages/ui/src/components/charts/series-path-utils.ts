import { line as d3Line } from "d3-shape";

import type { CurveFactory } from "d3-shape";

export interface SeriesPathPoint {
  x: number;
  y: number;
  defined?: boolean;
  key: string;
}

export function computeSeriesPathPoints(
  data: Record<string, unknown>[],
  xAccessor: (datum: Record<string, unknown>) => Date,
  xScale: (value: Date) => number | undefined,
  yScale: (value: number) => number | undefined,
  dataKey: string
): SeriesPathPoint[] {
  return data.map((datum, index) => {
    const xValue = xAccessor(datum);
    const yValue = datum[dataKey];
    return {
      ...(typeof yValue === "number" && Number.isFinite(yValue) && Number.isFinite(xValue.getTime()) ? {} : { defined: false }),
      x: xScale(xValue) ?? 0,
      y: typeof yValue === "number" && Number.isFinite(yValue) ? (yScale(yValue) ?? 0) : 0,
      key: String(xValue.getTime?.() ?? index),
    };
  });
}

export function interpolateSeriesPathPoints(
  from: SeriesPathPoint[],
  to: SeriesPathPoint[],
  progress: number
): SeriesPathPoint[] {
  if (progress >= 1) {
    return to;
  }
  if (progress <= 0) {
    return from.length > 0 ? from : to;
  }

  const fromByKey = new Map(from.map((point) => [point.key, point]));

  return to.map((target, index) => {
    const source = fromByKey.get(target.key);
    if (source) {
      return {
        ...(target.defined === undefined ? {} : { defined: target.defined }),
      key: target.key,
        x: source.x + (target.x - source.x) * progress,
        y: source.y + (target.y - source.y) * progress,
      };
    }

    const previousTarget = index > 0 ? to[index - 1] : undefined;
    const previousSource = previousTarget
      ? fromByKey.get(previousTarget.key)
      : undefined;
    const nextTarget = index < to.length - 1 ? to[index + 1] : undefined;
    const nextSource = nextTarget ? fromByKey.get(nextTarget.key) : undefined;
    const anchor = previousSource ?? nextSource ?? from[0] ?? target;

    return {
      ...(target.defined === undefined ? {} : { defined: target.defined }),
      key: target.key,
      x: anchor.x + (target.x - anchor.x) * progress,
      y: anchor.y + (target.y - anchor.y) * progress,
    };
  });
}

export function seriesPathFromPoints(
  points: SeriesPathPoint[],
  curve: CurveFactory
): string {
  if (points.length === 0) {
    return "";
  }

  const generator = d3Line<SeriesPathPoint>()
    .defined((point) => point.defined !== false && Number.isFinite(point.x) && Number.isFinite(point.y))
    .x((point) => point.x)
    .y((point) => point.y)
    .curve(curve);

  return generator(points) ?? "";
}

export function seriesPathTransitionSignature({
  renderData,
  xAccessor,
  dataKey,
  innerWidth,
  xDomainMin,
  xDomainMax,
}: {
  renderData: Record<string, unknown>[];
  xAccessor: (datum: Record<string, unknown>) => Date;
  dataKey: string;
  innerWidth: number;
  xDomainMin: number;
  xDomainMax: number;
}): string {
  const values = renderData.map((datum) => {
    const xValue = xAccessor(datum);
    const yValue = datum[dataKey];
    return `${xValue.getTime()}:${typeof yValue === "number" && Number.isFinite(yValue) ? yValue : ""}`;
  });

  return `${innerWidth}|${xDomainMin}|${xDomainMax}|${values.join(",")}`;
}
