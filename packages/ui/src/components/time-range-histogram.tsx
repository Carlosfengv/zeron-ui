"use client";

import { useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Bar, BarChart, Cell, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "#components/chart";
import { cn } from "#system/utils";

export interface TimeRangeHistogramDatum {
  start: number;
  end: number;
  label: string;
  [key: string]: number | string;
}

export interface TimeRangeHistogramRange {
  start: number;
  end: number;
}

export interface TimeRangeHistogramSeries {
  dataKey: string;
  label: string;
  color: string;
  inactiveColor?: string;
}

interface BucketSelection {
  startIndex: number;
  endIndex: number;
}

type DragMode = "create" | "move" | "resize-start" | "resize-end";

export interface TimeRangeHistogramProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children" | "onChange"> {
  /** Accessible name for the interactive range selector. */
  ariaLabel: string;
  /** Ordered, non-overlapping time buckets. */
  data: readonly TimeRangeHistogramDatum[];
  /** Stacked data series rendered for every bucket. */
  series: readonly TimeRangeHistogramSeries[];
  /** Controlled time range. Values are snapped to bucket boundaries. */
  value: TimeRangeHistogramRange;
  /** Called after a pointer or keyboard range move completes. */
  onValueChange: (value: TimeRangeHistogramRange) => void;
  /** Formats the selected range for assistive technology. */
  formatRange?: (value: TimeRangeHistogramRange) => string;
  /** Formats values displayed in the chart tooltip. */
  formatValue?: (value: number, series: TimeRangeHistogramSeries) => ReactNode;
  /** Label displayed beneath the first bucket. */
  rangeStartLabel?: ReactNode;
  /** Label displayed beneath the last bucket. */
  rangeEndLabel?: ReactNode;
  /** Optional interaction hint displayed between the boundary labels. */
  instruction?: ReactNode;
  /** Content shown when no buckets are available. */
  emptyContent?: ReactNode;
  /** Disables pointer and keyboard interaction while retaining the visualization. */
  disabled?: boolean;
  /** Class applied to the fixed-height chart container. */
  chartClassName?: string;
}

function normalizeSelection(startIndex: number, endIndex: number): BucketSelection {
  return {
    startIndex: Math.min(startIndex, endIndex),
    endIndex: Math.max(startIndex, endIndex),
  };
}

function selectionForRange(
  data: readonly TimeRangeHistogramDatum[],
  value: TimeRangeHistogramRange,
): BucketSelection {
  if (data.length === 0) return { startIndex: 0, endIndex: 0 };
  const firstSelected = data.findIndex((bucket) => value.start < bucket.end && value.end > bucket.start);
  const lastSelected = data.findLastIndex((bucket) => value.start < bucket.end && value.end > bucket.start);
  if (firstSelected >= 0 && lastSelected >= 0) {
    return { startIndex: firstSelected, endIndex: lastSelected };
  }

  const rangeCenter = value.start + (value.end - value.start) / 2;
  const closestIndex = data.reduce((closest, bucket, index) => {
    const distance = rangeCenter < bucket.start
      ? bucket.start - rangeCenter
      : rangeCenter > bucket.end
        ? rangeCenter - bucket.end
        : 0;
    const closestBucket = data[closest]!;
    const closestDistance = rangeCenter < closestBucket.start
      ? closestBucket.start - rangeCenter
      : rangeCenter > closestBucket.end
        ? rangeCenter - closestBucket.end
        : 0;
    return distance < closestDistance ? index : closest;
  }, 0);
  return { startIndex: closestIndex, endIndex: closestIndex };
}

function rangeForSelection(
  data: readonly TimeRangeHistogramDatum[],
  selection: BucketSelection,
): TimeRangeHistogramRange {
  return {
    start: data[selection.startIndex]?.start ?? 0,
    end: data[selection.endIndex]?.end ?? 0,
  };
}

export function TimeRangeHistogram({
  ariaLabel,
  data,
  series,
  value,
  onValueChange,
  formatRange,
  formatValue,
  rangeStartLabel,
  rangeEndLabel,
  instruction,
  emptyContent,
  disabled = false,
  chartClassName,
  className,
  ...props
}: TimeRangeHistogramProps) {
  const interactionRef = useRef<HTMLDivElement>(null);
  const dragStartIndex = useRef<number | null>(null);
  const dragMode = useRef<DragMode | null>(null);
  const dragOriginSelection = useRef<BucketSelection | null>(null);
  const [draftSelection, setDraftSelection] = useState<BucketSelection | null>(null);
  const selection = useMemo(() => selectionForRange(data, value), [data, value]);
  const activeSelection = draftSelection ?? selection;
  const activeRange = rangeForSelection(data, activeSelection);
  const selectionLabel = formatRange
    ? formatRange(activeRange)
    : `${data[activeSelection.startIndex]?.label ?? ""} – ${data[activeSelection.endIndex]?.label ?? ""}`;
  const chartConfig = useMemo<ChartConfig>(
    () => Object.fromEntries(series.map((item) => [item.dataKey, { label: item.label, color: item.color }])),
    [series],
  );

  if (data.length === 0) {
    return (
      <section aria-label={ariaLabel} className={cn("grid min-h-[68px] place-items-center text-label text-fg-muted", className)} {...props}>
        {emptyContent}
      </section>
    );
  }

  const getIndexAtPointer = (clientX: number) => {
    const bounds = interactionRef.current?.getBoundingClientRect();
    if (!bounds?.width) return 0;
    const position = Math.min(0.9999, Math.max(0, (clientX - bounds.left) / bounds.width));
    return Math.floor(position * data.length);
  };
  const getSelectionAtIndex = (index: number) => {
    const origin = dragOriginSelection.current;
    if (dragMode.current === "resize-start" && origin) {
      return { startIndex: Math.min(index, origin.endIndex), endIndex: origin.endIndex };
    }
    if (dragMode.current === "resize-end" && origin) {
      return { startIndex: origin.startIndex, endIndex: Math.max(index, origin.startIndex) };
    }
    if (dragMode.current === "move" && dragStartIndex.current !== null && origin) {
      const selectionWidth = origin.endIndex - origin.startIndex;
      const nextStartIndex = Math.min(
        data.length - selectionWidth - 1,
        Math.max(0, origin.startIndex + index - dragStartIndex.current),
      );
      return { startIndex: nextStartIndex, endIndex: nextStartIndex + selectionWidth };
    }
    return normalizeSelection(dragStartIndex.current ?? index, index);
  };
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    const index = getIndexAtPointer(event.clientX);
    const bounds = interactionRef.current?.getBoundingClientRect();
    const pointerOffset = bounds ? event.clientX - bounds.left : 0;
    const startBoundaryOffset = bounds ? selection.startIndex / data.length * bounds.width : 0;
    const endBoundaryOffset = bounds ? (selection.endIndex + 1) / data.length * bounds.width : 0;
    const boundaryHitRadius = event.pointerType === "touch" ? 12 : 8;
    const startBoundaryDistance = Math.abs(pointerOffset - startBoundaryOffset);
    const endBoundaryDistance = Math.abs(pointerOffset - endBoundaryOffset);
    const nearestBoundaryMode: DragMode | null =
      Math.min(startBoundaryDistance, endBoundaryDistance) <= boundaryHitRadius
        ? startBoundaryDistance <= endBoundaryDistance ? "resize-start" : "resize-end"
        : null;
    const selectionCoversAllBuckets = selection.startIndex === 0 && selection.endIndex === data.length - 1;
    const moveExistingSelection =
      !selectionCoversAllBuckets &&
      index >= selection.startIndex &&
      index <= selection.endIndex;
    const nextDragMode = nearestBoundaryMode ?? (moveExistingSelection ? "move" : "create");
    dragStartIndex.current = index;
    dragMode.current = nextDragMode;
    dragOriginSelection.current = nextDragMode === "create" ? null : selection;
    setDraftSelection(nextDragMode === "create" ? { startIndex: index, endIndex: index } : selection);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || dragStartIndex.current === null) return;
    setDraftSelection(getSelectionAtIndex(getIndexAtPointer(event.clientX)));
  };
  const resetPointerInteraction = (event: PointerEvent<HTMLDivElement>) => {
    dragStartIndex.current = null;
    dragMode.current = null;
    dragOriginSelection.current = null;
    setDraftSelection(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const finishPointerSelection = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || dragStartIndex.current === null) return;
    const nextSelection = getSelectionAtIndex(getIndexAtPointer(event.clientX));
    resetPointerInteraction(event);
    onValueChange(rangeForSelection(data, nextSelection));
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const selectionWidth = selection.endIndex - selection.startIndex;
    const maximumStart = data.length - selectionWidth - 1;
    let startIndex = selection.startIndex;
    if (event.key === "ArrowLeft") startIndex = Math.max(0, startIndex - 1);
    else if (event.key === "ArrowRight") startIndex = Math.min(maximumStart, startIndex + 1);
    else if (event.key === "PageUp") startIndex = Math.max(0, startIndex - 5);
    else if (event.key === "PageDown") startIndex = Math.min(maximumStart, startIndex + 5);
    else if (event.key === "Home") startIndex = 0;
    else if (event.key === "End") startIndex = maximumStart;
    else return;
    event.preventDefault();
    onValueChange(rangeForSelection(data, {
      startIndex,
      endIndex: startIndex + selectionWidth,
    }));
  };
  const selectionLeft = activeSelection.startIndex / data.length * 100;
  const selectionWidth = (activeSelection.endIndex - activeSelection.startIndex + 1) / data.length * 100;
  const isSelectedIndex = (index: number) => index >= activeSelection.startIndex && index <= activeSelection.endIndex;

  return (
    <section className={cn("min-w-0", className)} {...props}>
      <div
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        aria-valuemax={data.length}
        aria-valuemin={1}
        aria-valuenow={activeSelection.startIndex + 1}
        aria-valuetext={selectionLabel}
        className={cn(
          "relative rounded-md outline-none transition-shadow",
          disabled ? "cursor-default" : "cursor-crosshair touch-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-floating",
        )}
        onKeyDown={handleKeyDown}
        onPointerCancel={resetPointerInteraction}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerSelection}
        ref={interactionRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-10 bg-brand/10"
          data-slot="time-range-histogram-selection"
          style={{ left: `${selectionLeft}%`, width: `${selectionWidth}%` }}
        >
          <span className="absolute inset-y-0 left-0 w-0.5 bg-brand" data-slot="time-range-histogram-boundary">
            <span className="absolute left-1/2 top-1/2 h-2 w-1 -translate-x-1/2 -translate-y-1/2 bg-brand" data-slot="time-range-histogram-handle" />
          </span>
          <span className="absolute inset-y-0 right-0 w-0.5 bg-brand" data-slot="time-range-histogram-boundary">
            <span className="absolute left-1/2 top-1/2 h-2 w-1 -translate-x-1/2 -translate-y-1/2 bg-brand" data-slot="time-range-histogram-handle" />
          </span>
          <span className="pointer-events-auto absolute -left-2 inset-y-0 w-4 cursor-col-resize" data-slot="time-range-histogram-hit-area" />
          <span className="pointer-events-auto absolute -right-2 inset-y-0 w-4 cursor-col-resize" data-slot="time-range-histogram-hit-area" />
        </div>
        <ChartContainer
          className={cn(
            "relative aspect-auto h-[68px] min-h-0 w-full [&_.recharts-layer]:!outline-none [&_.recharts-surface]:!outline-none [&_.recharts-tooltip-wrapper]:!z-tooltip [&_.recharts-wrapper]:!outline-none",
            chartClassName,
          )}
          config={chartConfig}
        >
          <BarChart accessibilityLayer={false} data={data} margin={{ bottom: 4, left: 0, right: 0, top: 20 }}>
            <XAxis dataKey="label" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[170px]"
                  labelFormatter={(label) => String(label)}
                  valueFormatter={(tooltipValue, name) => {
                    const item = series.find((candidate) => candidate.label === name || candidate.dataKey === name);
                    const numericValue = Number(tooltipValue);
                    return item && formatValue ? formatValue(numericValue, item) : numericValue.toLocaleString();
                  }}
                />
              }
              cursor={{ fill: "var(--surface-raised)" }}
              isAnimationActive={false}
            />
            {series.map((item) => (
              <Bar dataKey={item.dataKey} fill={`var(--color-${item.dataKey})`} key={item.dataKey} stackId="time-range-histogram">
                {data.map((bucket, index) => (
                  <Cell
                    fill={isSelectedIndex(index) ? `var(--color-${item.dataKey})` : item.inactiveColor ?? "var(--surface-raised)"}
                    key={`${item.dataKey}-${bucket.start}`}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 text-label text-fg-subtle">
        <span>{rangeStartLabel ?? data[0]?.label}</span>
        {instruction ? <span className="hidden text-center sm:inline">{instruction}</span> : null}
        <span>{rangeEndLabel ?? data.at(-1)?.label}</span>
      </div>
    </section>
  );
}
