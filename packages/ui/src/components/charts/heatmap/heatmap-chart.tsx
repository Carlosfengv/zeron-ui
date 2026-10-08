"use client";

import { useParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import type { Transition } from "motion/react";
import { useReducedMotion } from "motion/react";
import {
  type ReactNode,
  isValidElement,
  useCallback,
  useId,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChartSourceData } from "../chart-source-data";
import { chartKeyboardIndex } from "../chart-keyboard";
import { chartChildren } from "../chart-data";
import { useSurface } from "#system/surface-context";
import { cn } from "#system/utils";
import type { Margin } from "../chart-context";
import { ChartLoadingLabel } from "../chart-loading-label";
import {
  type ChartPhase,
  type ChartStatus,
  DEFAULT_CHART_STATUS,
  resolveRestingChartPhase,
} from "../chart-phase";
import {
  HEATMAP_DEFAULT_ENTER_DURATION_MS,
  HEATMAP_DEFAULT_ENTER_TRANSITION,
  HEATMAP_DEFAULT_LOADING_CELL_MAX_OPACITY,
  HEATMAP_DEFAULT_LOADING_CELL_RANDOMNESS,
  HEATMAP_LOADING_CHART_OPACITY,
  HEATMAP_LOADING_CONCEAL_MS,
} from "./heatmap-animation";
import type { HeatmapLevelColors, HeatmapLevelStyles } from "./heatmap-colors";
import {
  buildHeatmapColorScaleFromStyles,
  buildHeatmapFillScale,
  resolveHeatmapLevelStyles,
} from "./heatmap-colors";
import {
  type HeatmapBin,
  type HeatmapColumn,
  type HeatmapContextValue,
  HeatmapInteractionRoot,
  HeatmapProvider,
  type HeatmapRevealMode,
  useHeatmap,
  useHeatmapInteraction,
} from "./heatmap-context";
import { HeatmapPatternDefs } from "./heatmap-pattern-defs";
import { resolveHeatmapSeparatorConfigWithData } from "./heatmap-resolve-separator";
import {
  filterHeatmapColumns,
  getHeatmapColumnXOffset,
  getHeatmapPlotInnerWidth,
  getHeatmapSeparatorCount,
  getHeatmapTimeExtent,
  type HeatmapSeparatorLayout,
  type HeatmapSeparatorParsedConfig,
  type HeatmapWeekStartDay,
  rotateHeatmapColumnBins,
  resolveHeatmapDisplayRange,
  isHeatmapGhostBin,
} from "./heatmap-utils";

export type HeatmapLayout = "fluid" | "fill";

export interface HeatmapChartProps {
  /** Column data — one entry per week (or category) with row bins inside. */
  data: HeatmapColumn[];
  /** Select a dated bin by click/tap or Enter/Space after keyboard inspection. */
  onCellSelect?: (bin: HeatmapBin) => void;
  /** Visible time range — filters week columns that overlap the domain. */
  xDomain?: [Date, Date];
  /**
   * Week columns used for cell sizing when `xDomain` is set. Keeps bin height
   * stable while scrubbing (filtered columns can vary by ±1 at boundaries).
   */
  sizingColumnCount?: number;
  /**
   * `fluid` — width drives square cells; chart height hugs the grid (GitHub-style).
   * `fill` — expands cells to fill the parent.
   */
  layout?: HeatmapLayout;
  /** Chart margins */
  margin?: Partial<Margin>;
  /** Fixed cell size in pixels. When 0, cells are square and sized to fit the plot. Default: 0 */
  binSize?: number;
  /** Gap between cells in pixels. Default: 2 */
  gap?: number;
  /** Override the default color scale. */
  colorScale?: (count: number | null | undefined) => string;
  /** Per-level colors for the Less → More scale (5 entries). */
  levelColors?: HeatmapLevelColors;
  /** Per-level fill styles (color and optional pattern). Takes precedence over `levelColors`. */
  levelStyles?: HeatmapLevelStyles;
  /** Optional outer aspect ratio (e.g. "2 / 1"). Omit to fill the parent. */
  aspectRatio?: string;
  /** Additional class name for the container */
  className?: string;
  /** Fetch / display status. Default: `"ready"`. */
  status?: ChartStatus;
  /** Centered label while loading. */
  loadingLabel?: string;
  /** Enter animation duration in milliseconds. Default: 1600 */
  animationDuration?: number;
  /** Motion enter transition (spring or cubic-bezier tween). */
  enterTransition?: Transition;
  /** Signature of motion URL state — triggers enter replay when it changes. */
  revealSignature?: string;
  /** Scales wave stagger delays (1 = default). */
  enterStaggerScale?: number;
  /** Play enter fade-in / loading shimmer animations. Default: true */
  animate?: boolean;
  /** Chart opacity while loading. Default: 0.5 */
  loadingOpacity?: number;
  /** Show loading cell shimmer while loading. Default: true */
  showLoadingCells?: boolean;
  /** Max opacity loading cells animate toward (0–1). Default: 0.5 */
  loadingCellMaxOpacity?: number;
  /** Share of cells that participate in loading shimmer (0–1). Default: 0.65 */
  loadingCellRandomness?: number;
  /**
   * Inserts horizontal gaps between column groups. Overridden when a
   * {@link HeatmapSeparator} child sets `every` / `spacing`.
   */
  columnSeparators?: HeatmapSeparatorParsedConfig;
  /**
   * First row of the grid — `0` = Sunday (GitHub default), `1` = Monday, etc.
   * Rotates column bins for display without reshaping source data.
   */
  weekStartDay?: HeatmapWeekStartDay;
  /** Child components (HeatmapCells, HeatmapXAxis, HeatmapYAxis) */
  children: ReactNode;
}

const DEFAULT_MARGIN: Margin = { top: 28, right: 16, bottom: 0, left: 40 };

function computeHeatmapDimensions({
  width,
  parentHeight,
  margin,
  columnCount,
  rowCount,
  binSize,
  layout,
  separator,
}: {
  width: number;
  parentHeight: number;
  margin: Margin;
  columnCount: number;
  rowCount: number;
  binSize: number;
  layout: HeatmapLayout;
  separator: Pick<HeatmapSeparatorLayout, "spacing" | "atColumns"> | null;
}) {
  const innerWidth = Math.max(width - margin.left - margin.right, 0);
  const availableHeight = Math.max(
    parentHeight - margin.top - margin.bottom,
    0
  );
  const separatorCount = separator ? getHeatmapSeparatorCount(separator) : 0;
  const totalSpacing = separatorCount * (separator?.spacing ?? 0);

  let binWidth: number;
  let binHeight: number;

  if (binSize > 0) {
    binWidth = binSize;
    binHeight = binSize;
  } else if (layout === "fluid") {
    const cellSize = Math.max((innerWidth - totalSpacing) / columnCount, 0);
    binWidth = cellSize;
    binHeight = cellSize;
  } else {
    const cellSize = Math.min(
      Math.max((innerWidth - totalSpacing) / columnCount, 0),
      availableHeight / rowCount
    );
    binWidth = cellSize;
    binHeight = cellSize;
  }

  const plotInnerWidth = getHeatmapPlotInnerWidth(
    columnCount,
    binWidth,
    separator
  );
  const innerHeight = rowCount * binHeight;
  const height =
    layout === "fluid"
      ? margin.top + innerHeight + margin.bottom
      : Math.max(parentHeight, margin.top + innerHeight + margin.bottom);
  const chartWidth =
    binSize > 0 && layout === "fluid"
      ? margin.left + plotInnerWidth + margin.right
      : width;

  return {
    binWidth,
    binHeight,
    innerWidth: plotInnerWidth,
    innerHeight,
    height,
    width: chartWidth,
  };
}

interface HeatmapChartInnerProps {
  width: number;
  height: number;
  data: HeatmapColumn[];
  onCellSelect?: (bin: HeatmapBin) => void;
  xDomain?: [Date, Date];
  sizingColumnCount?: number;
  margin: Margin;
  binSize: number;
  gap: number;
  layout: HeatmapLayout;
  colorScale: (count: number | null | undefined) => string;
  fillScale: (count: number | null | undefined) => string;
  levelStyles: HeatmapLevelStyles;
  chartStatus: ChartStatus;
  chartPhase: ChartPhase;
  isLoaded: boolean;
  revealEpoch: number;
  animationDuration: number;
  enterTransition?: Transition;
  enterStaggerScale: number;
  animateCells: boolean;
  loadingOpacity: number;
  showLoadingCells: boolean;
  loadingCellMaxOpacity: number;
  loadingCellRandomness: number;
  revealMode: HeatmapRevealMode;
  loadingLabel?: string;
  showLoadingLabel: boolean;
  columnSeparators?: HeatmapSeparatorParsedConfig;
  weekStartDay: HeatmapWeekStartDay;
  children: ReactNode;
}

function HeatmapChartInner({
  width,
  height: parentHeight,
  data,
  onCellSelect,
  xDomain,
  sizingColumnCount: sizingColumnCountProp,
  margin,
  binSize,
  gap,
  layout,
  colorScale,
  fillScale,
  levelStyles,
  chartStatus,
  chartPhase,
  isLoaded,
  revealEpoch,
  animationDuration,
  enterTransition,
  enterStaggerScale,
  animateCells,
  loadingOpacity,
  showLoadingCells,
  loadingCellMaxOpacity,
  loadingCellRandomness,
  revealMode,
  loadingLabel,
  showLoadingLabel,
  columnSeparators,
  weekStartDay,
  children,
}: HeatmapChartInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredData = useMemo(
    () => filterHeatmapColumns(data, xDomain),
    [data, xDomain]
  );

  const visibleData = useMemo(
    () => rotateHeatmapColumnBins(filteredData, weekStartDay),
    [filteredData, weekStartDay]
  );

  const visibleColumnCount = Math.max(visibleData.length, 1);
  const columnCount =
    xDomain && sizingColumnCountProp != null
      ? Math.max(sizingColumnCountProp, 1)
      : visibleColumnCount;
  const rowCount = Math.max(visibleData[0]?.bins.length ?? 7, 1);

  const separatorLayout = useMemo(
    () =>
      resolveHeatmapSeparatorConfigWithData(
        children,
        visibleData,
        columnSeparators
      ),
    [children, columnSeparators, visibleData]
  );

  const {
    binWidth,
    binHeight,
    innerWidth,
    innerHeight,
    height,
    width: chartWidth,
  } = useMemo(
    () =>
      computeHeatmapDimensions({
        width,
        parentHeight,
        margin,
        columnCount,
        rowCount,
        binSize,
        layout,
        separator: separatorLayout,
      }),
    [
      binSize,
      columnCount,
      layout,
      margin,
      parentHeight,
      rowCount,
      separatorLayout,
      width,
    ]
  );

  const xScale = useMemo(
    () => (columnIndex: number) =>
      columnIndex * binWidth +
      getHeatmapColumnXOffset(columnIndex, separatorLayout),
    [binWidth, separatorLayout]
  );
  const yScale = useMemo(
    () => (rowIndex: number) => rowIndex * binHeight,
    [binHeight]
  );

  const timeExtent = useMemo(() => getHeatmapTimeExtent(data), [data]);

  const timeXScale = useMemo(() => {
    const domain = timeExtent ?? [new Date(), new Date()];
    return scaleTime({
      domain,
      range: [0, innerWidth],
    });
  }, [innerWidth, timeExtent]);

  const brushYScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, 1],
        range: [innerHeight, 0],
      }),
    [innerHeight]
  );

  const contextValue = useMemo<HeatmapContextValue>(
    () => ({
      data: visibleData,
      onCellSelect,
      width: chartWidth,
      height,
      innerWidth,
      innerHeight,
      margin,
      binWidth,
      binHeight,
      gap: Math.max(0, Math.min(Number.isFinite(gap) ? gap : 2, binWidth, binHeight)),
      weekStartDay,
      xScale,
      yScale,
      separatorLayout,
      timeXScale,
      brushYScale,
      isReady: chartWidth >= 10 && height >= 10,
      colorScale,
      fillScale,
      levelStyles,
      containerRef,
      chartStatus,
      chartPhase,
      isLoaded,
      revealEpoch,
      animationDuration,
      enterTransition,
      enterStaggerScale,
      animateCells,
      loadingOpacity,
      showLoadingCells,
      loadingCellMaxOpacity,
      loadingCellRandomness,
      revealMode,
      loadingLabel,
      showLoadingLabel,
    }),
    [
      animateCells,
      animationDuration,
      binHeight,
      binWidth,
      brushYScale,
      chartPhase,
      chartStatus,
      chartWidth,
      colorScale,
      fillScale,
      enterStaggerScale,
      enterTransition,
      gap,
      height,
      innerHeight,
      innerWidth,
      isLoaded,
      loadingCellMaxOpacity,
      loadingCellRandomness,
      loadingLabel,
      levelStyles,
      loadingOpacity,
      margin,
      onCellSelect,
      revealMode,
      separatorLayout,
      showLoadingCells,
      showLoadingLabel,
      revealEpoch,
      timeXScale,
      visibleData,
      weekStartDay,
      xScale,
      yScale,
    ]
  );

  if (chartWidth < 10 || height < 10) {
    return null;
  }

  return (
    <HeatmapProvider value={contextValue}>
      <HeatmapInteractionRoot>
        <HeatmapChartSurface layout={layout}>{children}</HeatmapChartSurface>
      </HeatmapInteractionRoot>
    </HeatmapProvider>
  );
}

function HeatmapChartSurface({
  layout,
  children,
}: {
  layout: HeatmapLayout;
  children: ReactNode;
}) {
  const {
    containerRef,
    height,
    width,
    margin,
    levelStyles,
    fillScale,
    chartPhase,
    chartStatus,
    loadingOpacity,
    loadingLabel,
    showLoadingLabel,
    data, binWidth, binHeight, xScale, yScale, isLoaded, onCellSelect,
  } = useHeatmap();
  const { clearInteraction, setHoveredCell, setTooltipData, tooltipData } = useHeatmapInteraction();
  const keyboardIndex = useRef<number | null>(null);
  const cells = useMemo(() => {
    const child = chartChildren(children).find(child => isValidElement(child) && (child.type as { displayName?: string }).displayName === "HeatmapCells");
    const options = isValidElement(child) ? child.props as {interactive?: boolean; hideGhostCells?: boolean} : undefined;
    if (options?.interactive === false) return [];
    const displayRange = options?.hideGhostCells === false ? null : resolveHeatmapDisplayRange(data);
    return data.flatMap((column, columnIndex) => column.bins.map((bin, row) => ({bin, column: columnIndex, row}))).filter(cell =>
      Number.isFinite(cell.bin.date.getTime()) && Number.isFinite(cell.bin.count) && cell.bin.count >= 0 && !(displayRange && isHeatmapGhostBin(cell.bin, displayRange))
    );
  }, [children, data]);
  const canInspect = chartStatus === "ready" && isLoaded && cells.length > 0;
  useEffect(() => {
    keyboardIndex.current = null;
    clearInteraction();
  }, [canInspect, data, clearInteraction]);
  const reducedOpacity =
    chartPhase === "loading" || chartPhase === "exitingReady"
      ? loadingOpacity
      : 1;

  return (
    <div
      role="group" aria-label={onCellSelect ? "Heatmap. Use arrow keys to inspect cells, Enter or Space to select." : "Heatmap. Use arrow keys to inspect cells."} tabIndex={canInspect ? 0 : -1}
      className={cn("relative w-full rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus-ring", layout === "fill" && "h-full")}
      onBlur={() => { keyboardIndex.current = null; clearInteraction(); }}
      onKeyDown={(event) => {
        if (!canInspect) return;
        if (onCellSelect && (event.key === "Enter" || event.key === " ")) {
          const cell = cells.find(cell => cell.column === tooltipData?.column && cell.row === tooltipData.row && cell.bin.date.getTime() === tooltipData.date.getTime());
          if (cell) { event.preventDefault(); onCellSelect(cell.bin); }
          return;
        }
        const index = chartKeyboardIndex(event, keyboardIndex.current, cells.length);
        if (index === undefined) return;
        keyboardIndex.current = index;
        if (index === null) { clearInteraction(); return; }
        const cell = cells[index]!;
        setHoveredCell({column: cell.column, row: cell.row});
        setTooltipData({column: cell.column, row: cell.row, count: cell.bin.count, date: cell.bin.date, x: margin.left + xScale(cell.column) + binWidth / 2, y: margin.top + yScale(cell.row) + binHeight / 2});
      }}
      onPointerLeave={clearInteraction}
      ref={containerRef}
      style={{ opacity: reducedOpacity }}
    >
      <span className="sr-only" role="status" aria-live="polite">{tooltipData ? `${tooltipData.date.toISOString()}: ${tooltipData.count}` : ""}</span>
      <svg aria-hidden="true" height={height} width={width}>
        <HeatmapPatternDefs levelStyles={levelStyles} fillScale={fillScale} />
        <g transform={`translate(${margin.left},${margin.top})`}>{children}</g>
      </svg>
      {showLoadingLabel && loadingLabel?.trim() ? (
        <div
          className="pointer-events-none absolute"
          style={{
            top: margin.top,
            left: margin.left,
            width: Math.max(width - margin.left - margin.right, 0),
            height: Math.max(height - margin.top - margin.bottom, 0),
          }}
        >
          <ChartLoadingLabel
            exiting={chartPhase !== "loading"}
            text={loadingLabel}
          />
        </div>
      ) : null}
    </div>
  );
}

function useHeatmapChartLifecycle({
  chartStatus,
  animationDuration,
  revealSignature = "",
  animate,
}: {
  chartStatus: ChartStatus;
  animationDuration: number;
  revealSignature?: string;
  animate: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [chartPhase, setChartPhase] = useState<ChartPhase>(() =>
    resolveRestingChartPhase(chartStatus)
  );
  const [isLoaded, setIsLoaded] = useState(
    () => chartStatus === "ready" && (!animate || animationDuration <= 0)
  );
  const [revealEpoch, setRevealEpoch] = useState(0);
  const [revealMode, setRevealMode] = useState<HeatmapRevealMode>(null);
  const prevStatusRef = useRef(chartStatus);
  const phaseRef = useRef(chartPhase);
  phaseRef.current = chartPhase;

  const animateCells = animate && !reducedMotion;
  const animateEnter = animateCells && animationDuration > 0;

  const finishReveal = useCallback(() => {
    setIsLoaded(true);
    setChartPhase("ready");
    setRevealMode(null);
  }, []);

  const beginReveal = useCallback(() => {
    setRevealMode("enter");
    setRevealEpoch((epoch) => epoch + 1);
    setIsLoaded(false);
    setChartPhase("revealing");
    if (!animateEnter) {
      finishReveal();
    }
  }, [animateEnter, finishReveal]);

  useLayoutEffect(() => {
    const prevStatus = prevStatusRef.current;
    if (prevStatus === chartStatus) {
      return;
    }
    prevStatusRef.current = chartStatus;

    if (chartStatus === "ready" && prevStatus === "loading") {
      setRevealMode("fromLoading");
      setIsLoaded(false);
      setChartPhase("revealing");
      return;
    }

    if (chartStatus === "loading" && prevStatus === "ready") {
      setRevealMode(null);
      setIsLoaded(false);
      setChartPhase("exitingReady");
    }
  }, [chartStatus]);

  useEffect(() => {
    if (chartPhase !== "exitingReady") {
      return;
    }

    const timer = window.setTimeout(() => {
      setChartPhase("loading");
    }, HEATMAP_LOADING_CONCEAL_MS);

    return () => window.clearTimeout(timer);
  }, [chartPhase]);

    useEffect(() => {
    if (!animateEnter) {
      setIsLoaded(true);
      setChartPhase(resolveRestingChartPhase(chartStatus));
      return;
    }
    if (chartStatus !== "ready") {
      return;
    }
    if (phaseRef.current !== "ready") {
      return;
    }

    beginReveal();
  }, [
    animateEnter,
    animationDuration,
    beginReveal,
    chartStatus,
    revealSignature,
  ]);

    useEffect(() => {
    if (!animateEnter || chartPhase !== "revealing") {
      return;
    }

    const finishTimer = window.setTimeout(finishReveal, animationDuration);
    return () => window.clearTimeout(finishTimer);
  }, [animateEnter, animationDuration, chartPhase, finishReveal, revealEpoch]);

  return {
    chartPhase,
    isLoaded,
    revealEpoch,
    revealMode,
    animateCells,
  };
}

export function HeatmapChart({
  data,
  onCellSelect,
  xDomain,
  sizingColumnCount,
  layout = "fluid",
  margin: marginProp,
  binSize = 0,
  gap = 2,
  colorScale: colorScaleProp,
  levelColors,
  levelStyles: levelStylesProp,
  aspectRatio,
  className = "",
  status = DEFAULT_CHART_STATUS,
  loadingLabel,
  animationDuration = HEATMAP_DEFAULT_ENTER_DURATION_MS,
  enterTransition = HEATMAP_DEFAULT_ENTER_TRANSITION,
  revealSignature = "",
  enterStaggerScale = 1,
  animate = true,
  loadingOpacity = HEATMAP_LOADING_CHART_OPACITY,
  showLoadingCells = true,
  loadingCellMaxOpacity = HEATMAP_DEFAULT_LOADING_CELL_MAX_OPACITY,
  loadingCellRandomness = HEATMAP_DEFAULT_LOADING_CELL_RANDOMNESS,
  columnSeparators,
  weekStartDay = 0,
  children,
}: HeatmapChartProps) {
  const surface = useSurface();
  // Visx 4's ParentSize positions its content absolutely. Observe the root
  // directly so a fluid grid can contribute its computed height to layout.
  const { parentRef, width, height: parentHeight } = useParentSize();
  const scope = useId().replace(/:/g, "");
  const sourceRows = useMemo(() => data.flatMap(column => column.bins.map(bin => ({ column: column.bin, ...bin }))), [data]);
  const margin = { ...DEFAULT_MARGIN, ...marginProp };
  const levelStyles = useMemo(
    () => resolveHeatmapLevelStyles(levelColors, levelStylesProp),
    [levelColors, levelStylesProp]
  );
  const colorScale = useMemo(
    () => colorScaleProp ?? buildHeatmapColorScaleFromStyles(levelStyles),
    [colorScaleProp, levelStyles]
  );
  const fillScale = useMemo(
    () => buildHeatmapFillScale(levelStyles, scope),
    [levelStyles, scope]
  );

  const { chartPhase, isLoaded, revealEpoch, revealMode, animateCells } =
    useHeatmapChartLifecycle({
      chartStatus: status,
      animationDuration,
      revealSignature,
      animate,
    });

  const showLoadingLabel = Boolean(
    loadingLabel?.trim() &&
      status === "loading" &&
      (chartPhase === "loading" || chartPhase === "exitingReady")
  );

  return (
    <div
      className={cn(
        "relative w-full",
        layout === "fill" && "h-full min-h-0",
        className
      )}
      data-slot="heatmap-chart"
      ref={parentRef}
      style={{ aspectRatio, "--zeron-chart-surface": `var(--surface-${surface})` } as React.CSSProperties}
    >
      <ChartSourceData data={sourceRows} />
          <HeatmapChartInner
            animateCells={animateCells}
            animationDuration={animationDuration}
            binSize={binSize}
            chartPhase={chartPhase}
            chartStatus={status}
            colorScale={colorScale}
            columnSeparators={columnSeparators}
            data={data}
            onCellSelect={onCellSelect}
            enterStaggerScale={enterStaggerScale}
            enterTransition={enterTransition}
            fillScale={fillScale}
            gap={gap}
            height={parentHeight}
            isLoaded={isLoaded}
            layout={layout}
            levelStyles={levelStyles}
            loadingCellMaxOpacity={loadingCellMaxOpacity}
            loadingCellRandomness={loadingCellRandomness}
            loadingLabel={loadingLabel}
            loadingOpacity={loadingOpacity}
            margin={margin}
            revealEpoch={revealEpoch}
            revealMode={revealMode}
            showLoadingCells={showLoadingCells}
            showLoadingLabel={showLoadingLabel}
            sizingColumnCount={sizingColumnCount}
            weekStartDay={weekStartDay}
            width={width}
            xDomain={xDomain}
          >
            {children}
          </HeatmapChartInner>
    </div>
  );
}

HeatmapChart.displayName = "HeatmapChart";

export default HeatmapChart;
