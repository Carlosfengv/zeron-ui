"use client";

import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import type { Transition } from "motion/react";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { cn } from "#system/utils";
import { useSurface } from "#system/surface-context";
import { ChartSourceData } from "./chart-source-data";
import { chartKeyboardIndex } from "./chart-keyboard";
import { useChartReducedMotion } from "./use-chart-reduced-motion";
import {
  defaultRadarColors,
  type RadarContextValue,
  type RadarData,
  type RadarMetric,
  RadarProvider,
} from "./radar-context";

export interface RadarChartProps {
  /** Data array - each item represents a data series (polygon) */
  data: RadarData[];
  /** Metrics to display on the radar */
  metrics: RadarMetric[];
  /** Chart size in pixels. If not provided, uses parent container size */
  size?: number;
  /** Number of concentric grid circles. Default: 5 */
  levels?: number;
  /** Margin around the chart. Default: 60 */
  margin?: number;
  /** Enable animations. Default: true */
  animate?: boolean;
  /** Enter animation budget in ms. Default: 1100 */
  enterDurationMs?: number;
  /** Scales stagger timing (1 = default). */
  staggerScale?: number;
  /** Motion enter transition (spring or cubic-bezier tween). */
  enterTransition?: Transition;
  /** Changes when motion settings change — replays enter animations. */
  motionReplayKey?: string;
  /** Controlled hover state - index of hovered area */
  hoveredIndex?: number | null;
  /** Callback when hover state changes */
  onHoverChange?: (index: number | null) => void;
  /** Additional class name for the container */
  className?: string;
  /** Child components (RadarGrid, RadarAxis, RadarLabels, RadarArea) */
  children: ReactNode;
}

interface RadarChartInnerProps {
  width: number;
  height: number;
  data: RadarData[];
  metrics: RadarMetric[];
  levels: number;
  margin: number;
  animate: boolean;
  enterDurationMs: number;
  staggerScale: number;
  enterTransition?: Transition;
  motionReplayKey: string;
  children: ReactNode;
  hoveredIndexProp?: number | null;
  onHoverChange?: (index: number | null) => void;
}

function RadarChartInner({
  width,
  height,
  data,
  metrics,
  levels,
  margin,
  animate,
  enterDurationMs,
  staggerScale,
  enterTransition,
  motionReplayKey,
  children,
  hoveredIndexProp,
  onHoverChange,
}: RadarChartInnerProps) {
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<
    number | null
  >(null);

  // Use controlled or uncontrolled hover state
  const isControlled = hoveredIndexProp !== undefined;
  const requestedIndex = isControlled ? hoveredIndexProp : internalHoveredIndex;
  const hoveredIndex = requestedIndex != null && Number.isInteger(requestedIndex) && data[requestedIndex] ? requestedIndex : null;
  const setHoveredIndex = useCallback(
    (index: number | null) => {
      if (!isControlled) setInternalHoveredIndex(index);
      onHoverChange?.(index);
    },
    [isControlled, onHoverChange]
  );

  // Use the smaller dimension
  const size = Math.min(width, height);
  const radius = Math.max(0, (size - margin * 2) / 2);

  // Scale for converting values (0-100) to radius
  const radialScale = useMemo(() => scaleLinear<number>({ range: [0, radius], domain: [0, 100] }), [radius]);
  const yScale = useCallback((value: number) => radialScale(Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0) ?? 0, [radialScale]);

  // Get angle for a metric index (rotated so first metric is at top)
  const getAngle = useCallback(
    (metricIndex: number) => {
      const step = metrics.length ? (Math.PI * 2) / metrics.length : 0;
      const angleOffset = -Math.PI / 2; // Rotate so first axis is at top
      return metricIndex * step + angleOffset;
    },
    [metrics.length]
  );

  // Get x,y position for a metric at a given value
  const getPointPosition = useCallback(
    (metricIndex: number, value: number) => {
      const angle = getAngle(metricIndex);
      const r = yScale(value);
      return {
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
      };
    },
    [getAngle, yScale]
  );

  // Get color for a data index
  const getColor = useCallback(
    (index: number) => {
      const item = data[index];
      if (item?.color) {
        return item.color;
      }
      return defaultRadarColors[index % defaultRadarColors.length] as string;
    },
    [data]
  );

  // Early return if dimensions not ready
  if (size < 10) {
    return null;
  }

  const contextValue: RadarContextValue = {
    data,
    metrics,
    size,
    radius,
    levels,
    hoveredIndex,
    setHoveredIndex,
    animate,
    enterDurationMs,
    staggerScale,
    enterTransition,
    motionReplayKey,
    getColor,
    getAngle,
    getPointPosition,
    yScale,
  };

  return (
    <RadarProvider value={contextValue}>
      <svg
        role="group"
        aria-roledescription="radar chart"
        aria-label={metrics.map(metric => metric.label).join(", ") || "Radar chart"}
        tabIndex={data.length && metrics.length >= 3 ? 0 : undefined}
        onKeyDown={event => {
          const next = chartKeyboardIndex(event, hoveredIndex, data.length);
          if (next !== undefined) setHoveredIndex(next);
        }}
        onBlur={() => setHoveredIndex(null)}
        height={size}
        style={{ overflow: "visible" }}
        width={size}
      >
        <Group key={motionReplayKey} left={size / 2} top={size / 2}>
          {children}
        </Group>
      </svg>
      <ChartSourceData data={data.map(item => ({ label: item.label, color: item.color, ...Object.fromEntries(Object.entries(item.values).map(([key, value]) => [`values.${key}`, value])) }))} />
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{hoveredIndex === null ? "" : data[hoveredIndex].label + ": " + metrics.map(metric => `${metric.label}: ${String(data[hoveredIndex].values[metric.key] ?? 0)}`).join(", ")}</div>
    </RadarProvider>
  );
}

export function RadarChart({
  data,
  metrics,
  size: fixedSize,
  levels: levelsProp = 5,
  margin: marginProp = 60,
  animate: animateProp = true,
  enterDurationMs: durationProp = 1100,
  staggerScale: staggerProp = 1,
  enterTransition,
  motionReplayKey = "",
  className = "",
  hoveredIndex,
  onHoverChange,
  children,
}: RadarChartProps) {
  const surface = useSurface();
  const reducedMotion = useChartReducedMotion();
  const animate = animateProp && !reducedMotion;
  const levels = Number.isFinite(levelsProp) ? Math.max(1, Math.min(100, Math.floor(levelsProp))) : 5;
  const margin = Number.isFinite(marginProp) ? Math.max(0, marginProp) : 60;
  const enterDurationMs = Number.isFinite(durationProp) ? Math.max(0, durationProp) : 1100;
  const staggerScale = Number.isFinite(staggerProp) ? Math.max(0, staggerProp) : 1;
  const style = { "--zeron-chart-surface": `var(--surface-${surface})` } as React.CSSProperties;
  // If fixed size is provided, use it directly
  if (fixedSize !== undefined) {
    const size = Number.isFinite(fixedSize) ? Math.max(0, fixedSize) : 0;
    return (
      <div
        className={cn("relative flex items-center justify-center", className)}
        data-slot="radar-chart"
        style={{ ...style, width: size, height: size }}
      >
        <RadarChartInner
          animate={animate}
          data={data}
          enterDurationMs={enterDurationMs}
          enterTransition={enterTransition}
          height={size}
          hoveredIndexProp={hoveredIndex}
          levels={levels}
          margin={margin}
          metrics={metrics}
          motionReplayKey={motionReplayKey}
          onHoverChange={onHoverChange}
          staggerScale={staggerScale}
          width={size}
        >
          {children}
        </RadarChartInner>
      </div>
    );
  }

  // Otherwise use ParentSize for responsive sizing
  return (
    <div data-slot="radar-chart" style={style} className={cn("relative aspect-square w-full", className)}>
      <ParentSize debounceTime={10}>
        {({ width, height }) => (
          <RadarChartInner
            animate={animate}
            data={data}
            enterDurationMs={enterDurationMs}
            enterTransition={enterTransition}
            height={height}
            hoveredIndexProp={hoveredIndex}
            levels={levels}
            margin={margin}
            metrics={metrics}
            motionReplayKey={motionReplayKey}
            onHoverChange={onHoverChange}
            staggerScale={staggerScale}
            width={width}
          >
            {children}
          </RadarChartInner>
        )}
      </ParentSize>
    </div>
  );
}

export default RadarChart;
