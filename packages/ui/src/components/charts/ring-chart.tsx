"use client";

import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import type { Transition } from "motion/react";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "#system/utils";
import { useSurface } from "#system/surface-context";
import { chartKeyboardIndex } from "./chart-keyboard";
import { ChartSourceData } from "./chart-source-data";
import { useChartReducedMotion } from "./use-chart-reduced-motion";
import { DEFAULT_CHART_ENTER_TRANSITION } from "./animation";
import { defaultRingColors, type RingContextValue, type RingData, RingProvider } from "./ring-context";

export interface RingChartProps {
  /** Data array - each item represents a ring */
  data: RingData[];
  /** Chart size in pixels. If not provided, uses parent container size */
  size?: number;
  /** Stroke width of each ring. Default: 12 */
  strokeWidth?: number;
  /** Gap between rings. Default: 6 */
  ringGap?: number;
  /** Inner radius of the innermost ring. Default: 60 */
  baseInnerRadius?: number;
  /** Animation duration in milliseconds. Default: 1100 */
  animationDuration?: number;
  /** Additional class name for the container */
  className?: string;
  /** Controlled hover state - index of hovered ring */
  hoveredIndex?: number | null;
  /** Callback when hover state changes */
  onHoverChange?: (index: number | null) => void;
  /** Start angle in radians. Default: -PI/2 */
  startAngle?: number;
  /** End angle in radians. Default: 3*PI/2 (full circle) */
  endAngle?: number;
  /** Motion transition for ring enter animation; overrides animationDuration */
  enterTransition?: Transition;
  /** Scales ring stagger delays (1 = default). */
  enterStaggerScale?: number;
  /** High-frequency geometry updates use plain SVG paths. Default: false */
  geometryScrubbing?: boolean;
  /** Child components (Ring, RingCenter, etc.) */
  children: ReactNode;
}

const nonnegative = (value: number, fallback: number) => Number.isFinite(value) ? Math.max(0, value) : fallback;
function usableRing(item: RingData) {
  return Number.isFinite(item.value) && item.value >= 0 && Number.isFinite(item.maxValue) && item.maxValue > 0;
}

function RingChartInner({ width, height, containerRef, ...props }: RingChartProps & {
  width: number; height: number; containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { data, strokeWidth: widthProp = 12, ringGap: gapProp = 6, baseInnerRadius: radiusProp = 60,
    animationDuration = 1100, hoveredIndex: controlledIndex, onHoverChange,
    startAngle: startProp = -Math.PI / 2, endAngle: endProp = 3 * Math.PI / 2,
    enterTransition, enterStaggerScale: staggerProp = 1, geometryScrubbing = false, children } = props;
  const reducedMotion = useChartReducedMotion();
  const [internalIndex, setInternalIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const controlled = controlledIndex !== undefined;
  const requestedIndex = controlled ? controlledIndex : internalIndex;
  const hoveredIndex = requestedIndex != null && Number.isInteger(requestedIndex) && data[requestedIndex] && usableRing(data[requestedIndex]) ? requestedIndex : null;
  const setHoveredIndex = useCallback((index: number | null) => {
    if (!controlled) setInternalIndex(index);
    onHoverChange?.(index);
  }, [controlled, onHoverChange]);

  // Keep the reference dimensions and input-index ordering; scale only to fit.
  const size = Math.max(0, Math.min(width, height));
  const center = size / 2;
  const requestedWidth = nonnegative(widthProp, 12);
  const requestedGap = nonnegative(gapProp, 6);
  const requestedRadius = nonnegative(radiusProp, 60);
  const designRadius = requestedRadius + Math.max(0, data.length - 1) * (requestedWidth + requestedGap) + requestedWidth;
  const scale = designRadius > 0 ? Math.min(1, Math.max(0, center - 8) / designRadius) : 0;
  const strokeWidth = requestedWidth * scale;
  const ringGap = requestedGap * scale;
  const baseInnerRadius = requestedRadius * scale;
  const startAngle = Number.isFinite(startProp) ? startProp : -Math.PI / 2;
  const endAngle = Number.isFinite(endProp) ? endProp : 3 * Math.PI / 2;
  const enterStaggerScale = nonnegative(staggerProp, 1);
  const effectiveTransition = useMemo(() => enterTransition ?? {
    ...DEFAULT_CHART_ENTER_TRANSITION, duration: nonnegative(animationDuration, 1100) / 1000,
  }, [enterTransition, animationDuration]);
  const totalValue = useMemo(() => data.reduce((sum, item) => sum + (usableRing(item) ? item.value : 0), 0), [data]);
  const getColor = useCallback((index: number) => data[index]?.color || defaultRingColors[index % defaultRingColors.length], [data]);
  const getRingRadii = useCallback((index: number) => {
    const innerRadius = baseInnerRadius + index * (strokeWidth + ringGap);
    return { innerRadius, outerRadius: innerRadius + strokeWidth };
  }, [baseInnerRadius, strokeWidth, ringGap]);

  // Also gives center portals a render after the container ref becomes available.
  useEffect(() => { setIsLoaded(true); }, []);

  const value: RingContextValue = {
    data, size, center, strokeWidth, ringGap, baseInnerRadius, hoveredIndex, setHoveredIndex,
    animationKey: 0, isLoaded, enterTransition: effectiveTransition, enterStaggerScale,
    containerRef, totalValue, getColor, getRingRadii, startAngle, endAngle, geometryScrubbing,
  };
  const keyboardRings = data.flatMap((item, index) => usableRing(item) ? [index] : []);
  if (size < 10) return null;
  return <RingProvider value={value}>
    <svg width={size} height={size} role="group" aria-roledescription="ring chart"
      aria-label={data.map(item => item.label).join(", ") || "Ring chart"}
      tabIndex={keyboardRings.length ? 0 : undefined}
      onKeyDown={event => {
        const next = chartKeyboardIndex(event, hoveredIndex === null ? null : keyboardRings.indexOf(hoveredIndex), keyboardRings.length);
        if (next !== undefined) setHoveredIndex(next === null ? null : keyboardRings[next]);
      }} onBlur={() => setHoveredIndex(null)}
      style={{ overflow: "visible" }} data-reduced-motion={reducedMotion || undefined}>
      <Group left={center} top={center}>{children}</Group>
    </svg>
    <ChartSourceData data={data} />
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{hoveredIndex === null ? "" : `${data[hoveredIndex].label}: ${data[hoveredIndex].value} / ${data[hoveredIndex].maxValue}`}</div>
  </RingProvider>;
}

export function RingChart({ size: fixedSize, className, ...props }: RingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const surface = useSurface();
  const style = { "--zeron-chart-surface": `var(--surface-${surface})` } as CSSProperties;
  if (fixedSize !== undefined) {
    const size = nonnegative(fixedSize, 0);
    return <div ref={containerRef} data-slot="ring-chart" className={cn("relative flex items-center justify-center", className)} style={{ ...style, width: size, height: size }}>
      <RingChartInner {...props} width={size} height={size} containerRef={containerRef} />
    </div>;
  }
  return <div ref={containerRef} data-slot="ring-chart" className={cn("relative aspect-square w-full", className)} style={style}>
    <ParentSize debounceTime={10}>{({ width, height }) => <RingChartInner {...props} width={width} height={height} containerRef={containerRef} />}</ParentSize>
  </div>;
}

export default RingChart;
