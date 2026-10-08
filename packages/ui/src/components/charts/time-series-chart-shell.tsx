"use client";

import { scaleLinear, scaleTime } from "@visx/scale";
import { bisector, extent } from "d3-array";
import { useReducedMotion, type Transition } from "motion/react";
import {
  cloneElement,
  isValidElement,
  memo,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_ANIMATION_EASING,
  DEFAULT_CHART_ENTER_TRANSITION,
} from "./animation";
import {
  isClipExcludedComponent,
  isPostOverlayComponent,
  isUnderlayComponent,
  resolveChartChildElement,
} from "./chart-child-passthrough";
import { ChartProvider, type LineConfig, type Margin } from "./chart-context";
import { isGradientDefComponent, isPatternDefComponent } from "./chart-defs";
import { shortDateFmt } from "./chart-formatters";
import {
  type ChartPhase,
  type ChartStatus,
  DEFAULT_CHART_STATUS,
  DEFAULT_Y_DOMAIN_TWEEN_MS,
  isChartInteractionPhase,
} from "./chart-phase";
import { ChartRevealClip } from "./chart-reveal-clip";
import {
  decimateTimeSeries,
  maxRenderPointsForWidth,
} from "./decimate-time-series";
import { filterDataByXDomain } from "./filter-data-by-x-domain";
import {
  generateChartSkeletonData,
  generateChartSkeletonFromTarget,
} from "./generate-chart-skeleton-data";
import {
  extractProjectionLineConfigs,
  mergeProjectionXDomainMax,
  mergeProjectionYDomain,
} from "./projection-config";
import {
  extractReferenceAreaConfigs,
  type ReferenceAreaConfig,
} from "./reference-area-config";
import { ReferenceAreaRegistrationContext } from "./reference-area-registration-context";
import {
  computeSeriesBarRevealClipPadding,
  computeSeriesBarWidth,
} from "./series-bar-layout";
import { useStaticChartPreview } from "./static-chart-preview-context";
import { useAnimatedYDomains } from "./use-animated-y-domains";
import { useChartInteraction } from "./use-chart-interaction";
import { useChartPhaseOrchestrator } from "./use-chart-phase-orchestrator";
import {
  buildYScalesFromDomains,
  DEFAULT_Y_AXIS_ID,
  getPrimaryYScale,
  groupLinesByYAxisId,
} from "./y-axis-scales";
import { computeYDomainsByAxis } from "./y-domain-utils";
import { chartChildren, chartDate, isFiniteValue, timeSeriesData } from "./chart-data";
import { normalizeYAxisId } from "./y-axis-scales";
import { areaStackRange, seriesYValue } from "./area-stack";

function collectNumericExtents(
  data: Record<string, unknown>[],
  dataKeys: string[],
  lines: LineConfig[]
) {
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;

  for (const d of data) {
    for (const key of dataKeys) {
      const series = lines.find(line => line.dataKey === key);
      if (series?.stackId !== undefined) {
        const range = areaStackRange(d, series, lines);
        if (range) {
          minValue = Math.min(minValue, ...range);
          maxValue = Math.max(maxValue, ...range);
        }
        continue;
      }
      const value = d[key];
      if (isFiniteValue(value)) {
        if (value < minValue) {
          minValue = value;
        }
        if (value > maxValue) {
          maxValue = value;
        }
      }
    }
  }

  if (minValue === Number.POSITIVE_INFINITY) {
    return { minValue: 0, maxValue: 100 };
  }

  return { minValue, maxValue };
}

function resolveTimeSeriesYDomain(
  data: Record<string, unknown>[],
  dataKeys: string[],
  yScaleDomainMax: number | undefined,
  lines: LineConfig[]
): [number, number] {
  if (isFiniteValue(yScaleDomainMax) && yScaleDomainMax > 0) {
    return [0, yScaleDomainMax * 1.1];
  }

  const { minValue, maxValue } = collectNumericExtents(data, dataKeys, lines);

  if (minValue >= 0) {
    const top = maxValue <= 0 ? 100 : maxValue * 1.1;
    return [0, top];
  }

  const padding = (maxValue - minValue) * 0.05 || 1;
  return [minValue - padding, maxValue + padding];
}

function ensureChildKey(child: ReactElement, index: number): ReactElement {
  if (child.key != null) {
    return child;
  }
  return cloneElement(child, { key: `chart-child-${index}` });
}

export interface TimeSeriesChartInnerProps {
  width: number;
  height: number;
  data: Record<string, unknown>[];
  xDataKey: string;
  margin: Margin;
  animationDuration: number;
  animationEasing?: string;
  enterTransition?: Transition;
  /** Signature of motion URL state — triggers reveal replay when it changes. */
  revealSignature?: string;
  children: ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Series keys driving y-domain and tooltip (Line / Area / SeriesBar configs). */
  lines: LineConfig[];
  /**
   * Base SVG clipPath id for grow animation. Uniquified per chart instance so
   * multiple charts on one page do not share a clipPath (instance scoped).
   */
  clipPathId: string;
  /** Optional ComposedChart bar layout (forwarded into context). */
  composedBarDataKeys?: string[];
  composedBarSize?: number;
  composedMaxBarSize?: number;
  composedBarGap?: number;
  composedStacked?: boolean;
  composedStackOffsets?: Map<number, Map<string, number>>;
  composedStackGap?: number;
  /** When set, drives the y-axis max instead of scanning `lines` (e.g. stacked bar totals). */
  yScaleDomainMax?: number;
  /** Loading vs ready — drives chart phase until transition orchestration lands. */
  chartStatus?: ChartStatus;
  loadingLabel?: string;
  /** Animate y-domain on status / data transitions. Default: true */
  yDomainTween?: boolean;
  yDomainTweenDuration?: number;
  /** Visible x-domain for brush zoom. When set, y-domain and series use data in this range. */
  xDomain?: [Date, Date];
  /** Full dataset length for x-scale padding when `xDomain` is set. */
  xDomainSlotCount?: number;
  /** Tween y-domain when the visible x-range changes during the ready phase. */
  tweenYDomainOnXDomainChange?: boolean;
  onPhaseChange?: (phase: ChartPhase) => void;
}

export function TimeSeriesChartInner(props: TimeSeriesChartInnerProps) {
  const { width, height } = props;
  if (width < props.margin.left + props.margin.right + 1 || height < props.margin.top + props.margin.bottom + 1) {
    return null;
  }
  return <TimeSeriesChartCore {...props} />;
}

const TimeSeriesChartCore = memo(function TimeSeriesChartCore({
  width,
  height,
  data: rawData,
  xDataKey,
  margin,
  animationDuration,
  animationEasing = DEFAULT_ANIMATION_EASING,
  enterTransition,
  revealSignature = "",
  children,
  containerRef,
  lines,
  clipPathId,
  composedBarDataKeys,
  composedBarSize,
  composedMaxBarSize,
  composedBarGap,
  composedStacked,
  composedStackOffsets,
  composedStackGap,
  yScaleDomainMax,
  chartStatus = DEFAULT_CHART_STATUS,
  loadingLabel,
  yDomainTween = true,
  yDomainTweenDuration = DEFAULT_Y_DOMAIN_TWEEN_MS,
  xDomain: requestedXDomain,
  xDomainSlotCount,
  tweenYDomainOnXDomainChange = false,
  onPhaseChange,
}: TimeSeriesChartInnerProps) {
  const reducedMotion = useReducedMotion();
  const data = useMemo(() => timeSeriesData(rawData, xDataKey), [rawData, xDataKey]);
  const xDomain = useMemo(() => {
    if (!requestedXDomain?.every(date => Number.isFinite(date.getTime()))) return undefined;
    return requestedXDomain[0] <= requestedXDomain[1] ? requestedXDomain : [requestedXDomain[1], requestedXDomain[0]] as [Date, Date];
  }, [requestedXDomain]);
  const xDomainSignature = xDomain?.map(date => date.getTime()).join(":") ?? "";
  const previousXDomain = useRef(xDomainSignature);
  const viewportChanged = previousXDomain.current !== xDomainSignature;
  useEffect(() => { previousXDomain.current = xDomainSignature; }, [xDomainSignature]);
  // Unique per instance — shared clipPath ids crop later charts (instance scoped).
  const uniqueClipPathId = `${clipPathId}-${useId().replace(/:/g, "")}`;
  const staticPreview = useStaticChartPreview();
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const resolveYDomain = useCallback(
    (sourceData: Record<string, unknown>[], dataKeys: string[]) => {
      const axisGroups = groupLinesByYAxisId(lines);
      const usesDefaultOnly =
        axisGroups.size === 1 && axisGroups.has(DEFAULT_Y_AXIS_ID);
      const domainMax =
        usesDefaultOnly && yScaleDomainMax != null
          ? yScaleDomainMax
          : undefined;
      return resolveTimeSeriesYDomain(sourceData, dataKeys, domainMax, lines);
    },
    [lines, yScaleDomainMax]
  );

  const skeletonData = useMemo(() => {
    const primaryKey = lines[0]?.dataKey ?? "value";
    if (data.length === 0) {
      return generateChartSkeletonData({ dataKey: primaryKey });
    }
    return generateChartSkeletonFromTarget(data, primaryKey);
  }, [data, lines]);

  const {
    chartPhase,
    plotData,
    revealEpoch,
    concealEpoch,
    isLoaded,
    notifyLoadingPulseComplete,
    notifyRevealConcealComplete,
    notifyYDomainTweenComplete,
  } = useChartPhaseOrchestrator({
    animationDuration,
    chartStatus,
    revealSignature,
    skeletonData,
    skipEnterReveal: staticPreview || Boolean(reducedMotion),
    targetData: data,
    yDomainTweenDuration,
  });

  useEffect(() => {
    onPhaseChange?.(chartPhase);
  }, [chartPhase, onPhaseChange]);

  const xAccessor = useCallback(
    (d: Record<string, unknown>): Date => {
      const value = d[xDataKey];
      return chartDate(value);
    },
    [xDataKey]
  );

  const bisectDate = useMemo(
    () => bisector<Record<string, unknown>, Date>((d) => xAccessor(d)).left,
    [xAccessor]
  );

  const visiblePlotData = useMemo(() => {
    if (!xDomain) {
      return plotData;
    }
    return filterDataByXDomain(plotData, xDomain, xAccessor);
  }, [plotData, xDomain, xAccessor]);

  const projectionConfigs = useMemo(
    () => extractProjectionLineConfigs(children),
    [children]
  );

  const xScale = useMemo(() => {
    const minTime = xDomain
      ? xDomain[0].getTime()
      : (extent(plotData, (d) => xAccessor(d).getTime())[0] ?? 0);
    let maxTime = xDomain
      ? xDomain[1].getTime()
      : (extent(plotData, (d) => xAccessor(d).getTime())[1] ?? minTime);
    // Brush defines the viewport — projection horizon is included via brush
    // track extent, not by extending past the selection on the main chart.
    if (!xDomain) {
      maxTime = mergeProjectionXDomainMax(maxTime, projectionConfigs);
    }

    return scaleTime({
      range: [0, innerWidth],
      domain: [minTime, maxTime],
    });
  }, [innerWidth, plotData, projectionConfigs, xAccessor, xDomain]);

  // When brushing, keep the full series for path rendering so edge fades stay
  // anchored to the viewport while the line pans through them. Y-domain and
  // interaction still use the filtered visible slice.
  const seriesSourceData = xDomain ? plotData : visiblePlotData;

  const renderData = useMemo(() => {
    const valueKeys = lines.map((line) => line.dataKey);
    return decimateTimeSeries(
      seriesSourceData,
      maxRenderPointsForWidth(innerWidth),
      valueKeys
    );
  }, [seriesSourceData, innerWidth, lines]);

  const columnWidth = useMemo(() => {
    const slotCount =
      xDomain && xDomainSlotCount != null
        ? xDomainSlotCount
        : visiblePlotData.length;
    if (slotCount < 2) {
      return 0;
    }
    return innerWidth / (slotCount - 1);
  }, [innerWidth, visiblePlotData.length, xDomain, xDomainSlotCount]);

  const yDomainSkeletonByAxis = useMemo(
    () =>
      computeYDomainsByAxis({
        lines,
        resolveDomain: (dataKeys) => resolveYDomain(skeletonData, dataKeys),
      }),
    [lines, resolveYDomain, skeletonData]
  );

  const yDomainTargetByAxis = useMemo(() => {
    const base = computeYDomainsByAxis({
      lines,
      resolveDomain: (dataKeys) =>
        resolveYDomain(xDomain ? visiblePlotData : data, dataKeys),
    });
    if (projectionConfigs.length === 0) {
      return base;
    }
    const merged: Record<string, [number, number]> = { ...base };
    for (const axisId of Object.keys(base)) {
      merged[axisId] = mergeProjectionYDomain(
        base[axisId] ?? [0, 100],
        projectionConfigs,
        axisId
      );
    }
    for (const config of projectionConfigs) {
      if (!merged[config.yAxisId]) {
        merged[config.yAxisId] = mergeProjectionYDomain(
          [0, 100],
          projectionConfigs,
          config.yAxisId
        );
      }
    }
    return merged;
  }, [
    data,
    lines,
    projectionConfigs,
    resolveYDomain,
    visiblePlotData,
    xDomain,
  ]);

  const animatedYDomainsByAxis = useAnimatedYDomains({
    chartPhase,
    durationMs: yDomainTweenDuration,
    enabled: yDomainTween,
    onSettled: notifyYDomainTweenComplete,
    skeletonByAxis: yDomainSkeletonByAxis,
    targetByAxis: yDomainTargetByAxis,
    tweenOnTargetChange: viewportChanged ? tweenYDomainOnXDomainChange : yDomainTween,
  });

  const yDomainsForScales = animatedYDomainsByAxis;

  const yScales = useMemo(
    () =>
      buildYScalesFromDomains({
        domainsByAxis: yDomainsForScales,
        innerHeight,
        lines,
      }),
    [yDomainsForScales, innerHeight, lines]
  );

  const yScale = getPrimaryYScale(
    yScales,
    scaleLinear({ range: [innerHeight, 0], domain: [0, 100], nice: true })
  );

  const formatDate = useMemo(() => {
    for (const child of chartChildren(children)) {
      if (!isValidElement(child)) continue;
      const axis = resolveChartChildElement(child);
      const type = axis.type as { displayName?: string; name?: string };
      if ((type.displayName || type.name) === "XAxis") {
        return (axis.props as { formatDate?: (date: Date) => string }).formatDate;
      }
    }
    return undefined;
  }, [children]);

  const dateLabels = useMemo(
    () => visiblePlotData.map((d) => formatDate ? formatDate(xAccessor(d)) : shortDateFmt.format(xAccessor(d))),
    [visiblePlotData, xAccessor, formatDate]
  );

  const canInteract = isLoaded && isChartInteractionPhase(chartPhase);

  const {
    tooltipData,
    setTooltipData,
    selection,
    clearSelection,
    interactionHandlers,
    interactionStyle,
  } = useChartInteraction({
    bisectDate,
    canInteract,
    data: visiblePlotData,
    lines,
    margin,
    xAccessor,
    xScale,
    yScale,
    yScales,
  });

  const defsChildren: ReactElement[] = [];
  const clipExcludedChildren: ReactElement[] = [];
  const underlayChildren: ReactElement[] = [];
  const preOverlayChildren: ReactElement[] = [];
  const postOverlayChildren: ReactElement[] = [];

  chartChildren(children).forEach((child, index) => {
    if (!isValidElement(child)) {
      return;
    }

    const keyedChild = ensureChildKey(child, index);
    const resolvedChild = resolveChartChildElement(keyedChild);

    if (isGradientDefComponent(resolvedChild)) {
      defsChildren.push(resolvedChild);
    } else if (isPatternDefComponent(resolvedChild)) {
      preOverlayChildren.push(resolvedChild);
    } else if (isPostOverlayComponent(resolvedChild)) {
      postOverlayChildren.push(resolvedChild);
    } else if (isClipExcludedComponent(resolvedChild)) {
      clipExcludedChildren.push(resolvedChild);
    } else if (isUnderlayComponent(resolvedChild)) {
      underlayChildren.push(resolvedChild);
    } else {
      preOverlayChildren.push(resolvedChild);
    }
  });

  const [registeredReferenceAreas, setRegisteredReferenceAreas] = useState(
    () => new Map<string, ReferenceAreaConfig>()
  );

  const registerReferenceArea = useCallback(
    (id: string, config: ReferenceAreaConfig) => {
      setRegisteredReferenceAreas((prev) => {
        const existing = prev.get(id);
        if (
          existing &&
          existing.yAxisId === config.yAxisId &&
          existing.y1 === config.y1 &&
          existing.y2 === config.y2 &&
          existing.axisLabelColor === config.axisLabelColor
        ) {
          return prev;
        }
        const next = new Map(prev);
        next.set(id, config);
        return next;
      });
    },
    []
  );

  const unregisterReferenceArea = useCallback((id: string) => {
    setRegisteredReferenceAreas((prev) => {
      if (!prev.has(id)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const referenceAreaRegistration = useMemo(
    () => ({ registerReferenceArea, unregisterReferenceArea }),
    [registerReferenceArea, unregisterReferenceArea]
  );

  const referenceAreas = useMemo(() => {
    const extracted = extractReferenceAreaConfigs(children);
    const registered = [...registeredReferenceAreas.values()];
    if (registered.length === 0) {
      return extracted;
    }
    if (extracted.length === 0) {
      return registered;
    }
    return [...extracted, ...registered];
  }, [children, registeredReferenceAreas]);

  const contextValue = useMemo(
    () => ({
      data: visiblePlotData,
      renderData,
      xScale,
      yScale,
      yScales,
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
      chartPhase,
      chartStatus,
      loadingLabel,
      yDomainTweenDuration,
      yDomainSkeletonByAxis,
      yDomainTargetByAxis,
      isLoaded,
      animationDuration,
      animationEasing,
      enterTransition,
      revealEpoch,
      notifyLoadingPulseComplete,
      xAccessor,
      dateLabels,
      xDomain,
      xDomainSlotCount,
      selection,
      clearSelection,
      composedBarDataKeys,
      composedBarSize,
      composedMaxBarSize,
      composedBarGap,
      composedStacked,
      composedStackOffsets,
      composedStackGap,
    }),
    [
      visiblePlotData,
      renderData,
      xScale,
      yScale,
      yScales,
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
      chartPhase,
      chartStatus,
      loadingLabel,
      yDomainTweenDuration,
      yDomainSkeletonByAxis,
      yDomainTargetByAxis,
      isLoaded,
      animationDuration,
      animationEasing,
      enterTransition,
      revealEpoch,
      notifyLoadingPulseComplete,
      xAccessor,
      dateLabels,
      xDomain,
      xDomainSlotCount,
      selection,
      clearSelection,
      composedBarDataKeys,
      composedBarSize,
      composedMaxBarSize,
      composedBarGap,
      composedStacked,
      composedStackOffsets,
      composedStackGap,
    ]
  );

  const useClipReveal =
    !staticPreview && !reducedMotion &&
    renderData.length > 1 &&
    innerWidth > 0 &&
    animationDuration > 0;
  const isRevealAnimating = chartPhase === "revealing";
  const isRevealConcealing =
    chartPhase === "exitingReady" && animationDuration > 0;

  const effectiveEnterTransition: Transition =
    enterTransition ??
    ({
      ...DEFAULT_CHART_ENTER_TRANSITION,
      duration: animationDuration / 1000,
    } satisfies Transition);

  const revealClipPadding = useMemo(() => {
    if (!composedBarDataKeys?.length) {
      return 0;
    }
    const barWidth = computeSeriesBarWidth({
      columnWidth,
      composedBarGap,
      composedBarSize,
      composedMaxBarSize,
      dataLength: plotData.length,
      innerWidth,
      seriesCount: composedBarDataKeys.length,
      stacked: composedStacked,
    });
    return computeSeriesBarRevealClipPadding({
      barWidth,
      gap: composedBarGap,
      seriesCount: composedBarDataKeys.length,
      stacked: composedStacked,
    });
  }, [
    columnWidth,
    composedBarDataKeys,
    composedBarGap,
    composedBarSize,
    composedMaxBarSize,
    composedStacked,
    innerWidth,
    plotData.length,
  ]);

  const hasBrush = chartChildren(children).some(child => isValidElement(child) &&
    (child.type as { displayName?: string }).displayName === "ChartBrush");
  const keyboardId = `${uniqueClipPathId}-data`;
  const showPoint = (index: number) => {
    const point = visiblePlotData[index];
    if (!point) return;
    interactionHandlers.onMouseLeave?.();
    const yPositions: Record<string, number> = {};
    for (const line of lines) {
      const value = seriesYValue(point, line, lines);
      if (isFiniteValue(value)) yPositions[line.dataKey] = (yScales[normalizeYAxisId(line.yAxisId)] ?? yScale)(value) ?? 0;
    }
    setTooltipData({ point, index, x: xScale(xAccessor(point)) ?? 0, yPositions });
  };

  return (
    <ReferenceAreaRegistrationContext.Provider
      value={referenceAreaRegistration}
    >
      <ChartProvider value={contextValue}>
        <div role="group" aria-label={lines.map(line => line.dataKey).join(", ") || "Chart"}
          aria-describedby={keyboardId} tabIndex={canInteract && data.length > 0 && !hasBrush ? 0 : undefined}
          className="relative outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          style={{ width, height }}
          onFocus={event => { if (event.target === event.currentTarget && canInteract) showPoint(0); }}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) interactionHandlers.onMouseLeave?.(); }}
          onKeyDown={event => {
            if (event.target !== event.currentTarget || !canInteract || !visiblePlotData.length) return;
            const index = tooltipData?.index ?? 0;
            if (event.key === "Escape") { event.preventDefault(); interactionHandlers.onMouseLeave?.(); clearSelection(); return; }
            const next = event.key === "Home" ? 0 : event.key === "End" ? visiblePlotData.length - 1 :
              event.key === "ArrowRight" || event.key === "ArrowDown" ? Math.min(index + 1, visiblePlotData.length - 1) :
              event.key === "ArrowLeft" || event.key === "ArrowUp" ? Math.max(index - 1, 0) : null;
            if (next !== null) { event.preventDefault(); showPoint(next); }
          }}>
        <div id={keyboardId} className="sr-only">
          Use arrow keys to move between observations, Home or End to reach either boundary, and Escape to clear the tooltip.
        </div>
        <span className="sr-only" role="status" aria-live="polite">{tooltipData ? `${dateLabels[tooltipData.index]}: ${lines.map(line => `${line.dataKey}: ${String(tooltipData.point[line.dataKey])}`).join(", ")}` : ""}</span>
        {renderData.length > 0 ? <svg aria-hidden={hasBrush ? undefined : true} height={height} width={width}>
          <defs>
            {defsChildren}
            {useClipReveal ? (
              <ChartRevealClip
                animating={isRevealAnimating || isRevealConcealing}
                clipPathId={uniqueClipPathId}
                enterTransition={effectiveEnterTransition}
                height={innerHeight + 20}
                mode={isRevealConcealing ? "conceal" : "reveal"}
                onComplete={
                  isRevealConcealing ? notifyRevealConcealComplete : undefined
                }
                padding={revealClipPadding}
                revealEpoch={isRevealConcealing ? concealEpoch : revealEpoch}
                targetWidth={innerWidth}
              />
            ) : null}
          </defs>

          <rect fill="transparent" height={height} width={width} x={0} y={0} />

          <g
            {...interactionHandlers}
            style={interactionStyle}
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
            {useClipReveal ? (
              <g clipPath={`url(#${uniqueClipPathId})`}>{preOverlayChildren}</g>
            ) : (
              preOverlayChildren
            )}
            {postOverlayChildren}
          </g>
        </svg> : null}
        </div>
      </ChartProvider>
    </ReferenceAreaRegistrationContext.Provider>
  );
});
