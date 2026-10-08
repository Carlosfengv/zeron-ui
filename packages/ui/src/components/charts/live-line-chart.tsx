"use client";

import { localPoint } from "@visx/event";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { bisector } from "d3-array";
import {
  isValidElement,
  memo,
  type ReactElement,
  type ReactNode,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChartSourceData } from "./chart-source-data";
import { chartKeyboardIndex } from "./chart-keyboard";
import { chartChildren } from "./chart-data";
import { useSurface } from "#system/surface-context";
import { computeTargetRange, nextAnimFrame, interpolateAtTime, shouldCommitLiveUpdates, type AnimFrame } from "./live-line-state";
import { cn } from "#system/utils";
import {
  isClipExcludedComponent,
  isUnderlayComponent,
} from "./chart-child-passthrough";
import {
  ChartProvider,
  type LineConfig,
  type Margin,
  type TooltipData,
} from "./chart-context";
import { hmsTimeFmt } from "./chart-formatters";
import { DEFAULT_CHART_LIFECYCLE } from "./chart-phase";
import type { LiveLineProps } from "./live-line";
import { extractReferenceAreaConfigs } from "./reference-area-config";
import { wrapSingleYScale } from "./y-axis-scales";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveLinePoint {
  time: number;
  value: number;
}

export interface LiveLineChartProps {
  /** Streaming data — array of { time: unixSeconds, value } */
  data: LiveLinePoint[];
  /** Latest value (smoothly interpolated to) */
  value: number;
  /** Key used for the value field in context data. Default: "value" */
  dataKey?: string;
  /** Visible time window in seconds. Default: 30 */
  window?: number;
  /** Number of X-axis ticks (used to compute leading offset). Default: 5 */
  numXTicks?: number;
  /** Leading offset in X-tick units (0 = now at right edge). Default: 0 */
  nowOffsetUnits?: number;
  /** Tight Y-axis. Default: false */
  exaggerate?: boolean;
  /** Interpolation speed (0–1). Default: 0.08 */
  lerpSpeed?: number;
  /** Chart margins */
  margin?: Partial<Margin>;
  /** Freeze chart scrolling. Default: false */
  paused?: boolean;
  /** Child components (LiveLine, Grid, ChartTooltip, LiveXAxis, LiveYAxis, etc.) */
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LERP_SPEED = 0.08;
const DEFAULT_MARGIN: Margin = { top: 24, right: 16, bottom: 32, left: 16 };
/** React commit interval for the live animation loop (~30fps). */


const bisectTime = bisector<LiveLinePoint, number>((d) => d.time).left;

function extractLiveLineConfigs(children: ReactNode): LineConfig[] {
  const configs: LineConfig[] = [];
  chartChildren(children).forEach((child) => {
    if (!isValidElement(child)) {
      return;
    }
    const childType = child.type as { displayName?: string; name?: string };
    const name =
      typeof child.type === "function"
        ? childType.displayName || childType.name || ""
        : "";
    const props = child.props as LiveLineProps | undefined;
    if (
      (name === "LiveLine" || (props && "dataKey" in props)) &&
      props?.dataKey
    ) {
      configs.push({
        dataKey: props.dataKey,
        stroke: props.stroke || "var(--chart-1)",
        strokeWidth: props.strokeWidth || 2,
      });
    }
  });
  return configs;
}

// ---------------------------------------------------------------------------
// Inner chart
// ---------------------------------------------------------------------------

function liveTooltipKey(
  tooltip: TooltipData | null,
  dataKey: string
): string | null {
  if (!tooltip) {
    return null;
  }
  return `${tooltip.x}:${tooltip.point[dataKey]}:${String(tooltip.point.date)}`;
}

function resolveLiveTooltip(
  cursorX: number | null,
  innerWidth: number,
  innerHeight: number,
  frame: AnimFrame,
  leadingMs: number,
  windowMs: number,
  xTickUnitMs: number,
  data: LiveLinePoint[],
  dataKey: string
): TooltipData | null {
  if (cursorX === null || innerWidth <= 0 || innerHeight <= 0) {
    return null;
  }

  const domainEndMs = frame.now + leadingMs;
  const xScaleNext = scaleTime({
    domain: [new Date(domainEndMs - windowMs), new Date(domainEndMs)],
    range: [0, innerWidth],
  });
  const yScaleNext = scaleLinear({
    domain: [frame.yMin, frame.yMax],
    range: [innerHeight, 0],
    nice: true,
  });
  const timeMs = xScaleNext.invert(cursorX).getTime();
  const timeSec = timeMs / 1000;
  const visible = data.filter((p) => p.time >= (domainEndMs - windowMs) / 1000 && p.time <= frame.now / 1000);
  visible.push({ time: frame.now / 1000, value: frame.displayValue });
  visible.push({
    time: (frame.now + xTickUnitMs) / 1000,
    value: frame.displayValue,
  });
  const val = interpolateAtTime(visible, timeSec);
  if (val === null) {
    return null;
  }

  return {
    point: { date: new Date(timeMs), [dataKey]: val },
    index: 0,
    x: cursorX,
    yPositions: { [dataKey]: yScaleNext(val) ?? 0 },
  };
}

interface InnerProps {
  data: LiveLinePoint[];
  value: number;
  dataKey: string;
  windowSecs: number;
  numXTicks: number;
  nowOffsetUnits: number;
  exaggerate: boolean;
  lerpSpeed: number;
  margin: Margin;
  paused: boolean;
  width: number;
  height: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

function LiveLineChartInner(props: InnerProps) {
  const { width, height, margin } = props;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (innerWidth <= 0 || innerHeight <= 0) {
    return null;
  }

  return <LiveLineChartCore {...props} />;
}

const LiveLineChartCore = memo(function LiveLineChartCore({
  data,
  value,
  dataKey,
  windowSecs,
  numXTicks,
  nowOffsetUnits,
  exaggerate,
  lerpSpeed,
  margin,
  paused,
  width,
  height,
  containerRef,
  children,
}: InnerProps) {
  const windowMs = windowSecs * 1000;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // ---- Animation state ----
  const animRef = useRef<AnimFrame>({
    now: Date.now(),
    yMin: 0,
    yMax: 100,
    displayValue: value,
  });
  const [frame, setFrame] = useState<AnimFrame>({
    now: Date.now(),
    yMin: 0,
    yMax: 100,
    displayValue: value,
  });

  const pausedRef = useRef(paused);
  const dataRef = useRef(data);
  const dataKeyRef = useRef(dataKey);
  dataRef.current = data;
  dataKeyRef.current = dataKey;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const targetRange = useMemo(
    () => computeTargetRange(data, value, exaggerate),
    [data, value, exaggerate]
  );

  const lines = useMemo(() => extractLiveLineConfigs(children), [children]);

  // Leading offset (used in rAF for tooltip)
  const xTickUnitMs = windowMs / (numXTicks - 1);
  const leadingMs = nowOffsetUnits * xTickUnitMs;

  // ---- rAF loop: update frame and tooltip in one place to avoid effect→setState loops ----
  const cursorXRef = useRef<number | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const lastFrameCommitRef = useRef(0);
  const lastTooltipKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const next = nextAnimFrame(
        animRef.current,
        targetRange,
        value,
        lerpSpeed,
        pausedRef.current
      );
      animRef.current = next;

      const nextTooltip = resolveLiveTooltip(
        cursorXRef.current,
        innerWidth,
        innerHeight,
        next,
        leadingMs,
        windowMs,
        xTickUnitMs,
        dataRef.current,
        dataKeyRef.current
      );
      const now = performance.now();
      const tooltipKey = liveTooltipKey(nextTooltip, dataKeyRef.current);
      const { commitFrame, commitTooltip } = shouldCommitLiveUpdates(
        now,
        lastFrameCommitRef.current,
        tooltipKey,
        lastTooltipKeyRef.current
      );

      if (!(commitFrame || commitTooltip)) {
        raf = requestAnimationFrame(tick);
        return;
      }

      if (commitFrame) {
        lastFrameCommitRef.current = now;
      }
      if (commitTooltip) {
        lastTooltipKeyRef.current = tooltipKey;
      }

      startTransition(() => {
        if (commitFrame) {
          setFrame(next);
        }
        if (commitTooltip) {
          setTooltipData(nextTooltip);
        }
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    targetRange,
    value,
    lerpSpeed,
    leadingMs,
    windowMs,
    xTickUnitMs,
    innerWidth,
    innerHeight,
  ]);

  const domainEndMs = frame.now + leadingMs;

  // ---- Scales ----
  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [new Date(domainEndMs - windowMs), new Date(domainEndMs)],
        range: [0, innerWidth],
      }),
    [domainEndMs, windowMs, innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [frame.yMin, frame.yMax],
        range: [innerHeight, 0],
        nice: true,
      }),
    [frame.yMin, frame.yMax, innerHeight]
  );

  // ---- Build context-compatible data ----
  // Convert LiveLinePoint[] to Record<string, unknown>[] with 2 virtual points:
  // 1. At "now" — the live tip where the dot sits
  // 2. At "now + 1 unit" — a queued point that the line fades into
  const contextData = useMemo(() => {
    const windowStart = domainEndMs - windowMs;
    let startIdx = bisectTime(data, windowStart / 1000, 0);
    if (startIdx > 0) {
      startIdx--;
    }
    const sliced = data.slice(startIdx).filter(p => p.time <= frame.now / 1000);
    const records: Record<string, unknown>[] = sliced.map((p) => ({
      date: new Date(p.time * 1000),
      [dataKey]: p.value,
    }));
    // Virtual point 1: the "now" position (where the live dot sits)
    records.push({
      date: new Date(frame.now),
      [dataKey]: frame.displayValue,
    });
    // Virtual point 2: queued ahead (the line extends and fades into this)
    records.push({
      date: new Date(frame.now + xTickUnitMs),
      [dataKey]: frame.displayValue,
    });
    return records;
  }, [
    data,
    frame.now,
    frame.displayValue,
    domainEndMs,
    windowMs,
    dataKey,
    xTickUnitMs,
  ]);

  // ---- X accessor ----
  const xAccessor = useCallback(
    (d: Record<string, unknown>): Date =>
      d.date instanceof Date ? d.date : new Date(d.date as number),
    []
  );

  const handleMouseMove = useCallback(
    (event: React.PointerEvent<SVGGElement>) => {
      const coords = localPoint(event);
      if (!coords) {
        return;
      }
      const x = coords.x - margin.left;
      cursorXRef.current = x >= 0 && x <= innerWidth ? x : null;
    },
    [margin.left, innerWidth]
  );

  const handleMouseLeave = useCallback(() => {
    cursorXRef.current = null;
    lastTooltipKeyRef.current = null;
    setTooltipData(null);
    setAnnouncement("");
  }, []);

  // Date labels (for ChartTooltip's DateTicker — not used in live but needed for context)
  const dateLabels = useMemo(
    () => contextData.map((d) => hmsTimeFmt.format(xAccessor(d))),
    [contextData, xAccessor]
  );

  const columnWidth = useMemo(() => {
    if (contextData.length < 2) {
      return 0;
    }
    return innerWidth / (contextData.length - 1);
  }, [innerWidth, contextData.length]);

  const clipExcludedChildren: ReactElement[] = [];
  const underlayChildren: ReactElement[] = [];
  const seriesChildren: ReactElement[] = [];
  chartChildren(children).forEach((child) => {
    if (!isValidElement(child)) {
      return;
    }
    if (isClipExcludedComponent(child)) {
      clipExcludedChildren.push(child);
    } else if (isUnderlayComponent(child)) {
      underlayChildren.push(child);
    } else {
      seriesChildren.push(child);
    }
  });

  const referenceAreas = useMemo(
    () => extractReferenceAreaConfigs(children),
    [children]
  );

  const contextValue = useMemo(
    () => ({
      ...DEFAULT_CHART_LIFECYCLE,
      data: contextData,
      renderData: contextData,
      xScale,
      yScale,
      yScales: wrapSingleYScale(yScale),
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
      columnWidth,
      tooltipData,
      setTooltipData,
      containerRef,
      lines,
      referenceAreas,
      isLoaded: true,
      animationDuration: 0,
      xAccessor,
      dateLabels,
    }),
    [
      contextData,
      xScale,
      yScale,
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
      columnWidth,
      tooltipData,
      containerRef,
      lines,
      referenceAreas,
      xAccessor,
      dateLabels,
    ]
  );

  return (
    <ChartProvider value={contextValue}>
      <div role="group" aria-label="Live chart. Use arrow keys to inspect data." tabIndex={0} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" onBlur={handleMouseLeave} onKeyDown={(event) => {
        const current = cursorXRef.current === null ? null : contextData.reduce((best, d, i) => Math.abs((xScale(xAccessor(d)) ?? 0) - cursorXRef.current!) < Math.abs((xScale(xAccessor(contextData[best]!)) ?? 0) - cursorXRef.current!) ? i : best, 0);
        const index = chartKeyboardIndex(event, current, contextData.length);
        if (index === null) handleMouseLeave(); else if (index !== undefined) {
          const point = contextData[index]!;
          cursorXRef.current = Math.max(0, Math.min(innerWidth, xScale(xAccessor(point)) ?? 0));
          setAnnouncement(`${String(point.date)}: ${point[dataKey]}`);
        }
      }}>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
      <svg
        aria-hidden="true"
        className="overflow-visible"
        height={height}
        width={width}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG group for mouse tracking */}
        <g
          onPointerLeave={handleMouseLeave}
          onPointerMove={handleMouseMove}
          style={{ cursor: "crosshair" }}
          transform={`translate(${margin.left},${margin.top})`}
        >
          <rect
            fill="transparent"
            height={innerHeight}
            width={innerWidth}
            x={0}
            y={0}
          />
          {clipExcludedChildren}
          {underlayChildren}
          {seriesChildren}
        </g>
      </svg>
      </div>
    </ChartProvider>
  );
});

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function LiveLineChart({
  data,
  value,
  dataKey = "value",
  window: windowSecs = 30,
  numXTicks = 5,
  nowOffsetUnits = 0,
  exaggerate = false,
  lerpSpeed = LERP_SPEED,
  margin: marginProp,
  paused = false,
  children,
  className,
  style,
}: LiveLineChartProps) {
  const surface = useSurface();
  const validData = useMemo(() => data.filter(p => Number.isFinite(p.time) && Number.isFinite(p.value)).sort((a, b) => a.time - b.time), [data]);
  const lastValue = useRef(Number.isFinite(value) ? value : validData.at(-1)?.value ?? 0);
  if (Number.isFinite(value)) lastValue.current = value;
  value = lastValue.current;
  windowSecs = Number.isFinite(windowSecs) && windowSecs > 0 ? windowSecs : 30;
  numXTicks = Number.isFinite(numXTicks) && numXTicks >= 2 ? Math.floor(numXTicks) : 5;
  nowOffsetUnits = Number.isFinite(nowOffsetUnits) ? nowOffsetUnits : 0;
  lerpSpeed = Number.isFinite(lerpSpeed) && lerpSpeed > 0 && lerpSpeed <= 1 ? lerpSpeed : LERP_SPEED;
  const containerRef = useRef<HTMLDivElement>(null);
  const margin = { ...DEFAULT_MARGIN, ...marginProp };

  return (
    <div
      className={cn("relative w-full", className)}
      ref={containerRef}
      data-slot="live-line-chart"
      style={{ height: 300, touchAction: "none", "--zeron-chart-surface": `var(--surface-${surface})`, ...style } as React.CSSProperties}
    >
      <ChartSourceData data={data} />
      <ParentSize debounceTime={10}>
        {({ width, height }) => (
          <LiveLineChartInner
            containerRef={containerRef}
            data={validData}
            dataKey={dataKey}
            exaggerate={exaggerate}
            height={height}
            lerpSpeed={lerpSpeed}
            margin={margin}
            nowOffsetUnits={nowOffsetUnits}
            numXTicks={numXTicks}
            paused={paused}
            value={value}
            width={width}
            windowSecs={windowSecs}
          >
            {children}
          </LiveLineChartInner>
        )}
      </ParentSize>
    </div>
  );
}

export default LiveLineChart;
