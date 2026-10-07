"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "#system/utils";
import { useMountProgress } from "./use-mount-progress";
import { useEnterComplete } from "./use-enter-complete";

export interface FunnelGradientStop {
  offset: string | number;
  color: string;
}

export interface FunnelStage {
  label: string;
  value: number;
  displayValue?: string;
  color?: string;
  gradient?: FunnelGradientStop[];
}

export interface FunnelChartProps {
  data: FunnelStage[];
  orientation?: "horizontal" | "vertical";
  color?: string;
  layers?: number;
  className?: string;
  style?: CSSProperties;
  showPercentage?: boolean;
  showValues?: boolean;
  showLabels?: boolean;
  /** Pass a number or null for controlled highlighting; omit for internal state. */
  hoveredIndex?: number | null;
  /** Requests changes only in controlled mode, preserving the reference contract. */
  onHoverChange?: (index: number | null) => void;
  formatPercentage?: (pct: number) => string;
  formatValue?: (value: number) => string;
  staggerDelay?: number;
  enterTransition?: Transition;
  gap?: number;
  renderPattern?: (id: string, color: string) => ReactNode;
  edges?: "curved" | "straight";
  labelLayout?: "spread" | "grouped";
  labelOrientation?: "vertical" | "horizontal";
  labelAlign?: "center" | "start" | "end";
  grid?: boolean | {
    bands?: boolean;
    bandColor?: string;
    lines?: boolean;
    lineColor?: string;
    lineOpacity?: number;
    lineWidth?: number;
  };
}

const intFmt = new Intl.NumberFormat("en-US").format;
const percentFmt = (pct: number) => `${Math.round(pct)}%`;
const justify = { start: "justify-start", center: "justify-center", end: "justify-end" };
const items = { start: "items-start", center: "items-center", end: "items-end" };

// The reference curve, mirrored for vertical funnels without changing its geometry.
function segmentPath(start: number, end: number, width: number, height: number, scale: number, horizontal: boolean, straight: boolean) {
  const midpoint = (horizontal ? height : width) / 2;
  const cross = (horizontal ? height : width) * 0.44 * scale;
  const a = start * cross;
  const b = end * cross;
  if (horizontal) {
    if (straight) return `M 0 ${midpoint - a} L ${width} ${midpoint - b} L ${width} ${midpoint + b} L 0 ${midpoint + a} Z`;
    const control = width * 0.55;
    return `M 0 ${midpoint - a} C ${control} ${midpoint - a}, ${width - control} ${midpoint - b}, ${width} ${midpoint - b} L ${width} ${midpoint + b} C ${width - control} ${midpoint + b}, ${control} ${midpoint + a}, 0 ${midpoint + a} Z`;
  }
  if (straight) return `M ${midpoint - a} 0 L ${midpoint - b} ${height} L ${midpoint + b} ${height} L ${midpoint + a} 0 Z`;
  const control = height * 0.55;
  return `M ${midpoint - a} 0 C ${midpoint - a} ${control}, ${midpoint - b} ${height - control}, ${midpoint - b} ${height} L ${midpoint + b} ${height} C ${midpoint + b} ${height - control}, ${midpoint + a} ${control}, ${midpoint + a} 0 Z`;
}

interface SegmentProps {
  id: string;
  index: number;
  start: number;
  end: number;
  width: number;
  height: number;
  horizontal: boolean;
  color: string;
  layers: number;
  hovered: boolean;
  dimmed: boolean;
  staggerDelay: number;
  enterTransition?: Transition;
  reducedMotion: boolean;
  renderPattern?: FunnelChartProps["renderPattern"];
  straight: boolean;
  gradient?: FunnelGradientStop[];
}

function FunnelSegment({ id, index, start, end, width, height, horizontal, color, layers, hovered, dimmed, staggerDelay, enterTransition, reducedMotion, renderPattern, straight, gradient }: SegmentProps) {
  const patternId = `${id}-pattern-${index}`;
  const gradientId = `${id}-gradient-${index}`;
  const progress = useMountProgress(enterTransition, index * staggerDelay, index, reducedMotion);
  const complete = useEnterComplete(progress);
  const hasGradient = Boolean(gradient?.length);
  const svg = (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        {hasGradient && (
          <linearGradient id={gradientId} x1="0" y1="0" x2={horizontal ? "1" : "0"} y2={horizontal ? "0" : "1"}>
            {gradient?.map((stop, stopIndex) => (
              <stop key={stopIndex} offset={typeof stop.offset === "number" ? `${stop.offset * 100}%` : stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        )}
        {renderPattern?.(patternId, color)}
      </defs>
      {Array.from({ length: layers }, (_, ring) => {
        const scale = 1 - (ring / layers) * 0.35;
        const opacity = 0.18 + (ring / (layers - 1 || 1)) * 0.65;
        const inner = ring === layers - 1;
        const fill = inner && renderPattern ? `url(#${patternId})` : inner && hasGradient ? `url(#${gradientId})` : color;
        const hoverScale = hovered && !reducedMotion ? 1 + (ring / Math.max(layers - 1, 1)) * 0.12 : 1;
        return (
          <motion.path
            key={ring}
            d={segmentPath(start, end, width, height, scale, horizontal, straight)}
            fill={fill}
            opacity={opacity}
            style={{ transformOrigin: "center center" }}
            animate={horizontal ? { scaleY: hoverScale } : { scaleX: hoverScale }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: Math.max(30, 300 - ring * 60), damping: Math.max(8, 24 - ring * 3) }}
          />
        );
      })}
    </svg>
  );
  return (
    <motion.div
      data-slot="funnel-segment"
      className="pointer-events-none relative shrink-0 overflow-visible"
      style={{ width, height, zIndex: hovered ? 10 : 1 }}
      animate={{ opacity: dimmed ? 0.4 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.15 }}
    >
      <motion.div
        className="absolute inset-0 overflow-visible"
        style={{ scaleX: complete ? 1 : progress, scaleY: complete ? 1 : progress, transformOrigin: horizontal ? "left center" : "center top" }}
      >
        {svg}
      </motion.div>
    </motion.div>
  );
}

interface LabelProps {
  stage: FunnelStage;
  percentage: string;
  displayValue: string;
  horizontal: boolean;
  showValues: boolean;
  showPercentage: boolean;
  showLabels: boolean;
  index: number;
  staggerDelay: number;
  reducedMotion: boolean;
  layout: NonNullable<FunnelChartProps["labelLayout"]>;
  orientation?: FunnelChartProps["labelOrientation"];
  align: NonNullable<FunnelChartProps["labelAlign"]>;
}

function SegmentLabel({ stage, percentage, displayValue, horizontal, showValues, showPercentage, showLabels, index, staggerDelay, reducedMotion, layout, orientation, align }: LabelProps) {
  const value = showValues && <span data-slot="funnel-value" title={displayValue} className="min-w-0 max-w-full truncate whitespace-nowrap text-body font-semibold text-fg-default">{displayValue}</span>;
  const pct = showPercentage && <span data-slot="funnel-percentage" title={percentage} className="min-w-0 max-w-full truncate rounded-full bg-inverse-background px-3 py-1 text-label font-bold text-fg-on-inverse shadow-sm">{percentage}</span>;
  const label = showLabels && <span data-slot="funnel-label" title={stage.label} className="min-w-0 max-w-full truncate whitespace-nowrap text-label font-medium text-fg-muted">{stage.label}</span>;
  const transition: Transition = reducedMotion ? { duration: 0 } : { delay: index * staggerDelay + 0.25, duration: 0.35, ease: "easeOut" };
  if (layout === "spread") {
    return (
      <motion.div initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={transition} className={cn("absolute inset-0 flex min-w-0", horizontal ? "flex-col items-center" : "flex-row items-center")}>
        <div className={cn("flex min-w-0 justify-center", horizontal ? "h-[16%] max-w-full items-end pb-1" : "w-[16%] shrink-0 items-center justify-end pr-2")}>{value}</div>
        <div className="flex min-w-0 flex-1 items-center justify-center">{pct}</div>
        <div className={cn("flex min-w-0 max-w-full", horizontal ? "h-[16%] items-start justify-center pt-1" : "w-[16%] shrink-0 items-center justify-start pl-2")}>{label}</div>
      </motion.div>
    );
  }
  const verticalStack = (orientation ?? (horizontal ? "vertical" : "horizontal")) === "vertical";
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={transition}
      className={cn("absolute inset-0 flex min-w-0 items-center", horizontal ? "flex-col" : "flex-row", justify[align])}
      style={{ padding: horizontal ? "8% 0" : "0 8%" }}
    >
      <div className={cn("flex min-w-0 max-w-full gap-1.5", verticalStack ? cn("flex-col", items[horizontal ? "center" : align]) : "flex-row items-center")}>{value}{pct}{label}</div>
    </motion.div>
  );
}

export function FunnelChart({
  data, orientation = "horizontal", color = "var(--chart-1)", layers = 3, className, style,
  showPercentage = true, showValues = true, showLabels = true, hoveredIndex, onHoverChange,
  formatPercentage = percentFmt, formatValue = intFmt, staggerDelay = 0.12, enterTransition,
  gap = 4, renderPattern, edges = "curved", labelLayout = "spread", labelOrientation,
  labelAlign = "center", grid = false,
}: FunnelChartProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerFocus = useRef(false);
  const keyboardFocus = useRef(false);
  const id = `funnel-${useId().replace(/:/g, "")}`;
  const reducedMotion = Boolean(useReducedMotion());
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [internalHover, setInternalHover] = useState<number | null>(null);
  const hasData = data.length > 0;
  const horizontal = orientation === "horizontal";
  const first = data[0]?.value ?? 0;
  const ratios = data.map((stage) => stage.value / first);
  const valid = first > 0 && data.every((stage, index) => Number.isFinite(stage.value) && stage.value >= 0 && Number.isFinite(ratios[index] * 100) && Number.isFinite(ratios[index] * Math.max(size.width, size.height)));
  const requestedHover = hoveredIndex === undefined ? internalHover : hoveredIndex;
  const hover = valid && requestedHover !== null && Number.isInteger(requestedHover) && requestedHover >= 0 && requestedHover < data.length ? requestedHover : null;
  const setHover = (next: number | null) => {
    if (hoveredIndex === undefined) setInternalHover(next);
    else onHoverChange?.(next);
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      setSize((previous) => previous.width === 0 && previous.height === 0 ? previous : { width: 0, height: 0 });
      pointerFocus.current = false;
      keyboardFocus.current = false;
      return;
    }
    // ResizeObserver reports layout pixels, unaffected by a parent's transform.
    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((entry) => entry.target === root);
      if (!entry) return;
      const width = Number.isFinite(entry.contentRect.width) ? Math.max(0, entry.contentRect.width) : 0;
      const height = Number.isFinite(entry.contentRect.height) ? Math.max(0, entry.contentRect.height) : 0;
      setSize((previous) => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [hasData]);

  useEffect(() => {
    setInternalHover((previous) => previous !== null && (!valid || previous >= data.length) ? null : previous);
  }, [valid, data.length]);

  if (!hasData) return null;

  const mainSize = horizontal ? size.width : size.height;
  // Oversized gaps retain positive segments instead of producing negative paths.
  const effectiveGap = Math.min(Number.isFinite(gap) ? Math.max(0, gap) : 4, data.length > 1 ? mainSize / (2 * (data.length - 1)) : mainSize);
  const segmentSize = (mainSize - effectiveGap * (data.length - 1)) / data.length;
  const width = horizontal ? segmentSize : size.width;
  const height = horizontal ? size.height : segmentSize;
  const drawable = valid && width > 0 && height > 0;
  const layerCount = Number.isFinite(layers) ? Math.min(64, Math.max(1, Math.floor(layers))) : 3;
  const delay = Number.isFinite(staggerDelay) ? Math.max(0, staggerDelay) : 0.12;
  const gridOptions = typeof grid === "object" ? grid : {};
  const bands = Boolean(grid) && (gridOptions.bands ?? true);
  const lines = Boolean(grid) && (gridOptions.lines ?? true);
  const displays = data.map((stage) => stage.displayValue ?? formatValue(stage.value));
  const percentages = ratios.map((ratio) => valid ? formatPercentage(ratio * 100) : "—");
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !valid) return;
    const forward = horizontal ? "ArrowRight" : "ArrowDown";
    const backward = horizontal ? "ArrowLeft" : "ArrowUp";
    let next: number | null;
    if (event.key === forward) next = Math.min((hover ?? -1) + 1, data.length - 1);
    else if (event.key === backward) next = Math.max((hover ?? data.length) - 1, 0);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = data.length - 1;
    else if (event.key === "Escape") next = null;
    else return;
    event.preventDefault();
    keyboardFocus.current = true;
    pointerFocus.current = false;
    setHover(next);
  };

  return (
    <div
      ref={rootRef} role="group" aria-label={data.map((stage) => stage.label).join(" → ")}
      data-slot="funnel-chart" data-state={valid ? "ready" : "invalid"} data-orientation={orientation}
      data-hovered-index={hover ?? undefined} tabIndex={valid ? 0 : undefined}
      className={cn("relative isolate w-full select-none overflow-visible outline-none focus-visible:ring-1 focus-visible:ring-focus-ring", className)}
      style={{ aspectRatio: horizontal ? "2.2 / 1" : "1 / 1.8", ...style }}
      onKeyDown={keyboard}
      onPointerDown={() => { pointerFocus.current = true; keyboardFocus.current = false; }}
      onPointerUp={() => { pointerFocus.current = false; }}
      onPointerCancel={() => { pointerFocus.current = false; }}
      onBlur={() => { pointerFocus.current = false; keyboardFocus.current = false; setHover(null); }}
      onFocus={() => {
        keyboardFocus.current = !pointerFocus.current;
        if (keyboardFocus.current && hover === null && valid) setHover(0);
      }}
    >
      <ol className="sr-only">
        {data.map((stage, index) => <li key={index}>{stage.label}: {displays[index]}{valid ? ` (${percentages[index]})` : ""}</li>)}
      </ol>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{hover !== null ? `${data[hover].label}: ${displays[hover]} (${percentages[hover]})` : ""}</span>
      {drawable && <>
        {bands && (
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${size.width} ${size.height}`}>
            {data.map((_, index) => index % 2 === 0 && <rect key={index} x={horizontal ? index * (width + effectiveGap) : 0} y={horizontal ? 0 : index * (height + effectiveGap)} width={width} height={height} fill={gridOptions.bandColor ?? "var(--muted)"} />)}
          </svg>
        )}
        <div className={cn("absolute inset-0 flex", horizontal ? "flex-row" : "flex-col")} style={{ gap: effectiveGap }}>
          {data.map((stage, index) => (
            <FunnelSegment
              key={index} id={id} index={index} start={ratios[index]} end={ratios[index + 1] ?? ratios[index]}
              width={width} height={height} horizontal={horizontal} color={stage.gradient?.[0]?.color ?? stage.color ?? color}
              layers={layerCount} hovered={hover === index} dimmed={hover !== null && hover !== index}
              staggerDelay={delay} enterTransition={enterTransition} reducedMotion={reducedMotion}
              renderPattern={renderPattern} straight={edges === "straight"} gradient={stage.gradient}
            />
          ))}
        </div>
        {lines && (
          <svg aria-hidden="true" data-slot="funnel-grid-lines" className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 10 }} viewBox={`0 0 ${size.width} ${size.height}`}>
            {data.slice(1).map((_, index) => {
              const position = (index + 1) * (segmentSize + effectiveGap) - effectiveGap / 2;
              return <line key={index} x1={horizontal ? position : 0} y1={horizontal ? 0 : position} x2={horizontal ? position : size.width} y2={horizontal ? size.height : position} stroke={gridOptions.lineColor ?? "var(--border)"} strokeOpacity={gridOptions.lineOpacity ?? 1} strokeWidth={gridOptions.lineWidth ?? 1} />;
            })}
          </svg>
        )}
        {data.map((stage, index) => (
          <motion.div
            key={index} data-slot="funnel-stage" data-index={index} aria-hidden="true"
            className="absolute cursor-pointer"
            style={{ left: horizontal ? index * (width + effectiveGap) : 0, top: horizontal ? 0 : index * (height + effectiveGap), width, height, zIndex: 20 }}
            animate={{ opacity: hover !== null && hover !== index ? 0.4 : 1 }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }}
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => { if (!keyboardFocus.current) setHover(null); }}
          >
            <SegmentLabel stage={stage} displayValue={displays[index]} percentage={percentages[index]} horizontal={horizontal}
              showValues={showValues} showPercentage={showPercentage} showLabels={showLabels}
              index={index} staggerDelay={delay} reducedMotion={reducedMotion} layout={labelLayout} orientation={labelOrientation} align={labelAlign} />
          </motion.div>
        ))}
      </>}
    </div>
  );
}
