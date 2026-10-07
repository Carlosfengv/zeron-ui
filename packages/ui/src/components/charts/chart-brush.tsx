"use client";

import { Brush, type Bounds, type BrushProps as VisxBrushProps, type BrushHandleRenderProps } from "@visx/brush";
import type React from "react";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ChartBrushHandleOverlay,
  renderChartBrushHandle,
} from "./chart-brush-handle";
import {
  ChartBrushSelectionOverlay,
  type ChartBrushSelectionPattern,
} from "./chart-brush-selection-overlay";
import {
  ChartBrushTrackOverlay,
  type ChartBrushTrackOverlayStyle,
} from "./chart-brush-track-overlay";
import { chartCssVars, useChartStable } from "./chart-context";

const BrushComponent = Brush;

export interface ChartBrushSelection {
  start: Date;
  end: Date;
}

export interface ChartBrushProps {
  /** Requests selection updates during preview and commit. Null clears the range. */
  onSelectionChange?: (domain: ChartBrushSelection | null) => void;
  /** Brush direction. Default: "horizontal" for time range selection. */
  brushDirection?: "horizontal" | "vertical" | "both";
  /** Fill style for the selected region. Default: chart segment style. */
  selectedBoxStyle?: React.SVGProps<SVGRectElement>;
  /** Initial selection so the brush overlay is visible on load (e.g. first 50% of range). */
  initialSelection?: ChartBrushSelection | null;
  /** Current selection (e.g. from parent state). When set, a visible selection rect is drawn. */
  selection?: ChartBrushSelection | null;
  /** Use window move events for brush (can fix coordinate offset when SVG is in transformed container). Default: true for brush-in-strip. */
  useWindowMoveEvents?: boolean;
  /** Optional backdrop blur on the neutral inactive track (0–5 px). Default: 0 */
  blurPx?: number;
  /** Fade inactive regions at the outer track edges. Default: false */
  fadeOuterEdges?: boolean;
  /** Optional pattern overlay inside the brush selection window. */
  selectionPattern?: ChartBrushSelectionPattern;
}

interface ChartBrushInnerProps extends ChartBrushTrackOverlayStyle {
  brushDirection?: ChartBrushProps["brushDirection"];
  selectedBoxStyle?: ChartBrushProps["selectedBoxStyle"];
  initialSelection?: ChartBrushProps["initialSelection"];
  selection?: ChartBrushProps["selection"];
  useWindowMoveEvents?: ChartBrushProps["useWindowMoveEvents"];
  xScale: ReturnType<typeof useChartStable>["xScale"];
  yScale: ReturnType<typeof useChartStable>["yScale"];
  innerWidth: number;
  innerHeight: number;
  margin: ReturnType<typeof useChartStable>["margin"];
  onBrushPreview?: (bounds: Bounds | null) => void;
  onBrushCommit: (bounds: Bounds | null) => void;
  selectionPattern?: ChartBrushSelectionPattern;
}

function toDate(value: number | Date | unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "number") {
    return new Date(value);
  }
  return new Date(Number(value));
}

function boundsToPixelExtent(
  bounds: Pick<Bounds, "x0" | "x1"> | null,
  xScale: ReturnType<typeof useChartStable>["xScale"],
  innerWidth: number
): { x0: number; x1: number } | null {
  if (
    !bounds ||
    typeof bounds.x0 === "undefined" ||
    typeof bounds.x1 === "undefined"
  ) {
    return null;
  }

  const start = toDate(bounds.x0);
  const end = toDate(bounds.x1);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return null;
  const xScaleFn = xScale as (d: Date) => number;
  const x0 = Math.max(0, xScaleFn(start < end ? start : end) ?? 0);
  const x1 = Math.min(
    innerWidth,
    xScaleFn(end > start ? end : start) ?? innerWidth
  );

  if (!Number.isFinite(x0) || !Number.isFinite(x1) || x1 <= x0) {
    return null;
  }

  return { x0, x1 };
}

const ChartBrushInner = memo(function ChartBrushInner({
  brushDirection = "horizontal",
  selectedBoxStyle,
  initialSelection,
  selection,
  useWindowMoveEvents = true,
  xScale,
  yScale,
  innerWidth,
  innerHeight,
  margin,
  onBrushPreview,
  onBrushCommit,
  blurPx,
  fadeOuterEdges,
  selectionPattern,
}: ChartBrushInnerProps) {
  const controlled = selection !== undefined;
  const [uncontrolledSelection, setUncontrolledSelection] = useState<ChartBrushSelection | null>(() =>
    initialSelection === undefined ? { start: xScale.invert(0), end: xScale.invert(innerWidth) } : initialSelection);
  const effectiveSelection = controlled ? selection : uncontrolledSelection;
  useEffect(() => {
    if (controlled) setUncontrolledSelection(selection);
  }, [controlled, selection]);
  const brushRef = useRef(null) as NonNullable<VisxBrushProps["innerRef"]>;
  const [commitEpoch, setCommitEpoch] = useState(0);
  const emptyRef = useRef<SVGRectElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const focusEmptyAfterClear = useRef(false);
  const focusHandleAfterCreate = useRef(false);
  const initialBrushPosition = useMemo(() => {
    if (!effectiveSelection || innerWidth <= 0 || innerHeight <= 0) {
      return undefined;
    }
    const pixels = boundsToPixelExtent({ x0: effectiveSelection.start.getTime(), x1: effectiveSelection.end.getTime() }, xScale, innerWidth);
    if (!pixels) return undefined;
    return {
      start: { x: pixels.x0, y: 0 },
      end: { x: pixels.x1, y: innerHeight },
    };
  }, [effectiveSelection, xScale, innerWidth, innerHeight]);

  const [pixelExtent, setPixelExtent] = useState(() => ({
    x0: initialBrushPosition?.start.x ?? 0,
    x1: initialBrushPosition?.end.x ?? innerWidth,
  }));

  useEffect(() => {
    setPixelExtent({
      x0: initialBrushPosition?.start.x ?? 0,
      x1: initialBrushPosition?.end.x ?? innerWidth,
    });
  }, [initialBrushPosition, innerWidth]);

  useLayoutEffect(() => {
    const brush = brushRef.current;
    if (!brush || brush.state.isBrushing) return;
    if (!initialBrushPosition) {
      brush.setState(brush.getIdleState());
      return;
    }
    const { start, end } = initialBrushPosition;
    brush.setState(previous => ({ ...previous, start, end, extent: brush.getExtent(start, end) }));
  }, [brushRef, initialBrushPosition, commitEpoch]);

  const displayedExtent = controlled ? {
    x0: initialBrushPosition?.start.x ?? 0,
    x1: initialBrushPosition?.end.x ?? innerWidth,
  } : pixelExtent;
  const showSelection = Boolean(initialBrushPosition);
  useLayoutEffect(() => {
    if (focusEmptyAfterClear.current && !showSelection) emptyRef.current?.focus();
    if (focusHandleAfterCreate.current && showSelection) groupRef.current?.querySelector<SVGRectElement>('.visx-brush-handle-left[role="slider"]')?.focus();
    focusEmptyAfterClear.current = false;
    focusHandleAfterCreate.current = false;
  }, [commitEpoch, showSelection]);

  const updatePixelExtent = useCallback(
    (bounds: Bounds | null) => {
      const pixels = boundsToPixelExtent(bounds, xScale, innerWidth);
      if (!controlled) {
        setPixelExtent(pixels ?? { x0: 0, x1: innerWidth });
        setUncontrolledSelection(pixels ? { start: xScale.invert(pixels.x0), end: xScale.invert(pixels.x1) } : null);
      }
    },
    [controlled, innerWidth, xScale]
  );

  const handleBrushPreview = useCallback(
    (bounds: Bounds | null) => {
      updatePixelExtent(bounds);
      onBrushPreview?.(bounds);
    },
    [onBrushPreview, updatePixelExtent]
  );

  const handleBrushCommit = useCallback(
    (bounds: Bounds | null) => {
      updatePixelExtent(bounds);
      onBrushCommit(bounds);
      setCommitEpoch(epoch => epoch + 1);
    },
    [onBrushCommit, updatePixelExtent]
  );

  const defaultStyle = {
    fill: "transparent",
    fillOpacity: 0,
    stroke: chartCssVars.brushBorder,
    strokeWidth: 1,
  };

  return (
    <g data-slot="chart-brush" ref={groupRef}>
      <rect
        data-slot="chart-brush-track-border"
        x={0.5}
        y={0.5}
        width={Math.max(0, innerWidth - 1)}
        height={Math.max(0, innerHeight - 1)}
        fill="none"
        stroke="var(--border)"
        strokeWidth={1}
        pointerEvents="none"
      />
      {showSelection ? <>
      <ChartBrushTrackOverlay
        blurPx={blurPx}
        fadeOuterEdges={fadeOuterEdges}
        innerHeight={innerHeight}
        innerWidth={innerWidth}
        selectionX0={displayedExtent.x0}
        selectionX1={displayedExtent.x1}
      />
      <ChartBrushSelectionOverlay
        innerHeight={innerHeight}
        innerWidth={innerWidth}
        pattern={selectionPattern}
        selectionX0={displayedExtent.x0}
        selectionX1={displayedExtent.x1}
      />
      <ChartBrushHandleOverlay
        innerHeight={innerHeight}
        innerWidth={innerWidth}
        selectionX0={displayedExtent.x0}
        selectionX1={displayedExtent.x1}
      />
      </> : null}
      <BrushComponent
        innerRef={brushRef}
        brushDirection={brushDirection}
        handleSize={8}
        height={innerHeight}
        initialBrushPosition={initialBrushPosition}
        key={`brush-${innerWidth}-${innerHeight}`}
        margin={
          useWindowMoveEvents
            ? margin
            : { top: 0, left: 0, right: 0, bottom: 0 }
        }
        onBrushEnd={handleBrushCommit}
        onChange={handleBrushPreview}
        renderBrushHandle={(props: BrushHandleRenderProps) => {
          if (!showSelection) return null;
          const isStart = props.className.includes("left");
          const isEnd = props.className.includes("right");
          if (!isStart && !isEnd) return renderChartBrushHandle(props);
          const value = isStart ? displayedExtent.x0 : displayedExtent.x1;
          return <rect className={props.className} fill="transparent" x={props.x} y={props.y} width={props.width} height={props.height}
            style={{ cursor: "ew-resize" }} tabIndex={0} role="slider"
            aria-label={isStart ? "Range start" : "Range end"}
            aria-valuemin={xScale.invert(0).getTime()} aria-valuemax={xScale.invert(innerWidth).getTime()}
            aria-valuenow={xScale.invert(value).getTime()} aria-valuetext={xScale.invert(value).toISOString()}
            onKeyDown={event => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) return;
              event.preventDefault(); event.stopPropagation();
              if (event.key === "Escape") {
                focusEmptyAfterClear.current = true;
                if (!controlled && brushRef.current) brushRef.current.setState(brushRef.current.getIdleState());
                handleBrushPreview(null); handleBrushCommit(null); return;
              }
              const step = Math.max(1, innerWidth / 100);
              const next = event.key === "Home" ? 0 : event.key === "End" ? innerWidth : value + (event.key === "ArrowLeft" ? -step : step);
              const x0 = isStart ? Math.max(0, Math.min(next, displayedExtent.x1 - 1)) : displayedExtent.x0;
              const x1 = isEnd ? Math.min(innerWidth, Math.max(next, displayedExtent.x0 + 1)) : displayedExtent.x1;
              const bounds = { x0: xScale.invert(x0).getTime(), x1: xScale.invert(x1).getTime(), y0: 0, y1: 0 } as Bounds;
              const brush = brushRef.current;
              if (!controlled && brush) {
                const start = { x: x0, y: 0 }; const end = { x: x1, y: innerHeight };
                brush.setState(previous => ({ ...previous, start, end, extent: brush.getExtent(start, end) }));
              }
              handleBrushPreview(bounds); handleBrushCommit(bounds);
            }} />;
        }}
        selectedBoxStyle={selectedBoxStyle ?? defaultStyle}
        useWindowMoveEvents={useWindowMoveEvents}
        width={innerWidth}
        xScale={xScale}
        yScale={yScale}
      />
      {!showSelection ? <rect ref={emptyRef} tabIndex={0} role="button" aria-label="Select full range"
        fill="transparent" width={innerWidth} height={innerHeight} style={{ pointerEvents: "none" }}
        onKeyDown={event => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault(); event.stopPropagation();
          focusHandleAfterCreate.current = true;
          const bounds = { x0: xScale.invert(0).getTime(), x1: xScale.invert(innerWidth).getTime(), y0: 0, y1: 0 } as Bounds;
          handleBrushPreview(bounds); handleBrushCommit(bounds);
        }} /> : null}
    </g>
  );
});

export function ChartBrush({
  onSelectionChange,
  brushDirection = "horizontal",
  selectedBoxStyle,
  initialSelection,
  selection,
  useWindowMoveEvents = true,
  blurPx,
  fadeOuterEdges,
  selectionPattern,
}: ChartBrushProps) {
  const { xScale, yScale, innerWidth, innerHeight, margin, isLoaded } =
    useChartStable();

  const boundsToSelection = useCallback(
    (bounds: Bounds | null): ChartBrushSelection | null => {
      if (
        !bounds ||
        typeof bounds.x0 === "undefined" ||
        typeof bounds.x1 === "undefined"
      ) {
        return null;
      }
      const start = toDate(bounds.x0);
      const end = toDate(bounds.x1);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start.getTime() === end.getTime()) {
        return null;
      }
      return {
        start: start < end ? start : end,
        end: end > start ? end : start,
      };
    },
    []
  );

  const notifySelectionChange = useCallback(
    (bounds: Bounds | null) => {
      if (!onSelectionChange) {
        return;
      }
      onSelectionChange(boundsToSelection(bounds));
    },
    [onSelectionChange, boundsToSelection]
  );

  const handleBrushPreview = useCallback(
    (bounds: Bounds | null) => {
      notifySelectionChange(bounds);
    },
    [notifySelectionChange]
  );

  const handleBrushCommit = useCallback(
    (bounds: Bounds | null) => {
      notifySelectionChange(bounds);
    },
    [notifySelectionChange]
  );

  if (!isLoaded || innerWidth <= 0 || innerHeight <= 0) {
    return null;
  }

  return (
    <ChartBrushInner
      blurPx={blurPx}
      brushDirection={brushDirection}
      fadeOuterEdges={fadeOuterEdges}
      initialSelection={initialSelection}
      selection={selection}
      innerHeight={innerHeight}
      innerWidth={innerWidth}
      margin={margin}
      onBrushCommit={handleBrushCommit}
      onBrushPreview={handleBrushPreview}
      selectedBoxStyle={selectedBoxStyle}
      selectionPattern={selectionPattern}
      useWindowMoveEvents={useWindowMoveEvents}
      xScale={xScale}
      yScale={yScale}
    />
  );
}

ChartBrush.displayName = "ChartBrush";

export default ChartBrush;
