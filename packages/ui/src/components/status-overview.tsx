"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Skeleton } from "#components/skeleton";
import { Tooltip } from "#components/tooltip";
import { cn } from "#system/utils";

export type StatusOverviewStatus =
  | "operational"
  | "degraded"
  | "down"
  | "maintenance"
  | "unknown"
  | "empty";

export interface StatusOverviewSummary {
  label: ReactNode;
  value: ReactNode;
  status?: Exclude<StatusOverviewStatus, "empty">;
}

export interface StatusOverviewSegment {
  /** Unique and stable within one rail. Used to retain the active segment across updates. */
  id: string;
  status: StatusOverviewStatus;
  /** Complete, localized description announced for the active segment. */
  ariaLabel: string;
  /** Content shown in the shared tooltip. Falls back to ariaLabel. */
  tooltip?: ReactNode;
}

/** A bucket in the equal-duration timeline represented by content.start–content.end. */
export type StatusTimelineItem = StatusOverviewSegment;
export type NodeStatusItem = StatusOverviewSegment;

export interface StatusTimelineMarker {
  at: number;
  label: ReactNode;
}

export type StatusOverviewContent =
  | {
      type: "timeline";
      /** Finite epoch range covered by equal-duration, contiguous items. */
      start: number;
      end: number;
      items: readonly StatusTimelineItem[];
      markers?: readonly StatusTimelineMarker[];
      footer?: ReactNode;
    }
  | {
      type: "nodes";
      items: readonly NodeStatusItem[];
      footer?: ReactNode;
    };

interface StatusOverviewBaseProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children" | "content"> {
  /** Card and chart share rounded status bars; chart is frameless and activity is a compact service row. */
  variant?: "card" | "activity" | "chart";
  ariaLabel: string;
  /** Pass null in activity mode for a full-width rail with results below it. */
  label: ReactNode;
  rangeLabel?: ReactNode;
  summary?: StatusOverviewSummary;
  /** Optional activity-row controls/results. Replaces the summary column only in activity mode. */
  trailing?: ReactNode;
  content: StatusOverviewContent;
  emptyContent: ReactNode;
}

type StatusOverviewDataStateProps =
  | {
      state?: "ready";
      statusMessage?: never;
    }
  | {
      state: "loading";
      statusMessage?: never;
    }
  | {
      state: "stale" | "unavailable" | "error";
      statusMessage: ReactNode;
    };

export type StatusOverviewProps =
  StatusOverviewBaseProps & StatusOverviewDataStateProps;

const statusSegmentClass: Record<StatusOverviewStatus, string> = {
  operational: "bg-success-border",
  degraded: "bg-warning-border",
  down: "bg-danger-border",
  maintenance: "bg-info-border",
  unknown: "bg-neutral-status-border",
  empty: "bg-surface-raised [background-image:repeating-linear-gradient(135deg,var(--neutral-status-border)_0_1px,transparent_1px_3px)]",
};

const summaryClass: Record<Exclude<StatusOverviewStatus, "empty">, string> = {
  operational: "text-fg-success",
  degraded: "text-fg-warning",
  down: "text-fg-danger",
  maintenance: "text-fg-info",
  unknown: "text-fg-neutral-status",
};

function isFiniteTimelineRange(content: StatusOverviewContent): content is Extract<StatusOverviewContent, { type: "timeline" }> {
  return content.type === "timeline" && Number.isFinite(content.start) && Number.isFinite(content.end) && content.start < content.end;
}

function StatusSegmentRail({
  ariaLabel,
  content,
  variant,
}: Pick<StatusOverviewProps, "ariaLabel" | "content" | "variant">) {
  const activity = variant === "activity";
  const chart = variant === "chart";
  const items = content.items;
  const railId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const [activeId, setActiveId] = useState<string | undefined>(() => items[0]?.id);
  const [gridFocused, setGridFocused] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);
  const [touchTooltipOpen, setTouchTooltipOpen] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  useEffect(() => {
    setActiveId((current) => items.some((item) => item.id === current) ? current : items[0]?.id);
  }, [items]);

  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId));
  const activeItem = items[activeIndex];
  const cellId = (item: StatusOverviewSegment) => `${railId}-segment-${item.id}`;
  const activeCellId = activeItem ? cellId(activeItem) : undefined;
  const minimumCanvasWidth = Math.max(0, activity ? items.length * 5 - 1 : items.length * 4 - 2);
  const markerRangeValid = isFiniteTimelineRange(content) && items.length > 0;
  const markers = useMemo(() => {
    if (!markerRangeValid || content.type !== "timeline") return [];
    const duration = content.end - content.start;
    return (content.markers ?? []).flatMap((marker) => {
      if (!Number.isFinite(marker.at)) return [];
      return [{
        ...marker,
        position: Math.min(100, Math.max(0, ((marker.at - content.start) / duration) * 100)),
      }];
    });
  }, [content, markerRangeValid]);

  const scrollActiveCellIntoView = (item: StatusOverviewSegment | undefined) => {
    const viewport = viewportRef.current;
    const cell = item ? cellRefs.current.get(item.id) : undefined;
    if (!viewport || !cell) return;
    const viewportRect = viewport.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    if (cellRect.left < viewportRect.left) viewport.scrollLeft += cellRect.left - viewportRect.left;
    if (cellRect.right > viewportRect.right) viewport.scrollLeft += cellRect.right - viewportRect.right;
  };

  useEffect(() => {
    scrollActiveCellIntoView(activeItem);
  }, [activeItem]);

  const setActiveIndex = (index: number, { openTooltip = true }: { openTooltip?: boolean } = {}) => {
    const next = items[Math.max(0, Math.min(items.length - 1, index))];
    if (!next) return;
    setActiveId(next.id);
    if (openTooltip) setTooltipDismissed(false);
  };

  const indexAtPointer = (event: PointerEvent<HTMLDivElement>) => {
    const firstItem = items[0];
    const lastItem = items.at(-1);
    const first = firstItem && cellRefs.current.get(firstItem.id);
    const last = lastItem && cellRefs.current.get(lastItem.id);
    if (first && last) {
      if (items.length === 1) return 0;
      const firstBounds = first.getBoundingClientRect();
      const lastBounds = last.getBoundingClientRect();
      const firstCenter = firstBounds.left + firstBounds.width / 2;
      const pitch = (lastBounds.left + lastBounds.width / 2 - firstCenter) / (items.length - 1);
      // Equal grid columns let two measurements cover gaps, scrolling and RTL.
      if (Number.isFinite(pitch) && pitch !== 0) {
        return Math.max(0, Math.min(items.length - 1, Math.round((event.clientX - firstCenter) / pitch)));
      }
    }

    const viewport = viewportRef.current;
    if (!viewport?.clientWidth || items.length === 0) return 0;
    const bounds = viewport.getBoundingClientRect();
    const localX = Math.max(0, Math.min(viewport.scrollWidth - 1, event.clientX - bounds.left + viewport.scrollLeft));
    const slotWidth = viewport.scrollWidth / items.length;
    return Math.max(0, Math.min(items.length - 1, Math.floor(localX / slotWidth)));
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      setTouchTooltipOpen(false);
      return;
    }
    setPointerInside(true);
    setActiveIndex(indexAtPointer(event));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    setActiveIndex(indexAtPointer(event));
    setTouchTooltipOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (items.length === 0) return;
    let nextIndex = activeIndex;
    if (event.key === "ArrowLeft") nextIndex -= 1;
    else if (event.key === "ArrowRight") nextIndex += 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else if (event.key === "PageUp") nextIndex -= 5;
    else if (event.key === "PageDown") nextIndex += 5;
    else if (event.key === "Escape") {
      event.preventDefault();
      setTooltipDismissed(true);
      setTouchTooltipOpen(false);
      return;
    } else return;

    event.preventDefault();
    setActiveIndex(nextIndex);
  };

  const tooltipOpen = Boolean(activeItem) && !tooltipDismissed && (gridFocused || pointerInside || touchTooltipOpen);
  const anchorLeft = `${((activeIndex + 0.5) / Math.max(items.length, 1)) * 100}%`;

  return (
    <div ref={viewportRef} data-slot="status-overview-rail-scroll" className={cn("overflow-x-auto", !activity && "-mx-1 -my-1 px-1 py-1")}>
      <div
        data-slot="status-overview-rail-canvas"
        data-start={content.type === "timeline" ? content.start : undefined}
        data-end={content.type === "timeline" ? content.end : undefined}
        className="w-full"
        style={{ minWidth: minimumCanvasWidth }}
      >
        <div
          aria-activedescendant={activeCellId}
          aria-colcount={items.length}
          aria-label={ariaLabel}
          aria-rowcount={1}
          data-slot="status-overview-rail"
          onBlur={() => setGridFocused(false)}
          onFocus={() => {
            setGridFocused(true);
            setTooltipDismissed(false);
          }}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerLeave={() => setPointerInside(false)}
          onPointerMove={handlePointerMove}
          role="grid"
          tabIndex={0}
          className={cn("relative min-w-0 cursor-crosshair outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus-ring", activity ? "h-6" : "h-control-md")}
        >
          <div
            data-slot="status-overview-rail-row"
            role="row"
            className={cn("grid h-full", activity ? "gap-px" : "gap-0.5")}
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(${activity ? 4 : 2}px, 1fr))` }}
          >
            {items.map((item, index) => (
              <div
                aria-colindex={index + 1}
                aria-label={item.ariaLabel}
                data-index={index}
                data-slot="status-overview-segment"
                data-status={item.status}
                id={cellId(item)}
                key={item.id}
                ref={(node) => {
                  if (node) cellRefs.current.set(item.id, node);
                  else cellRefs.current.delete(item.id);
                }}
                role="gridcell"
                className={cn(
                  "min-w-0",
                  activity ? "flex items-center justify-center" : cn("rounded-full transition-colors duration-moderate", statusSegmentClass[item.status], chart && "origin-bottom animate-in fade-in-0 zoom-in-50 ease-out motion-reduce:animate-none", tooltipOpen && item.id === activeId && "outline outline-1 outline-offset-2 outline-fg-muted"),
                )}
                style={chart ? { animationDelay: `${Math.min(index * 12, 400)}ms`, animationFillMode: "both" } : undefined}
              >
                {activity && <span aria-hidden="true" data-slot="status-overview-tick" className={cn(
                  "w-1 shrink-0 rounded-full",
                  item.status === "unknown" ? "h-3" : "h-5",
                  item.status === "empty" ? "bg-border" : statusSegmentClass[item.status],
                )} />}
              </div>
            ))}
          </div>

          {activeItem && (
            <Tooltip content={activeItem.tooltip ?? activeItem.ariaLabel} forceOpen={tooltipOpen} className={activity ? undefined : "rounded-lg border-hairline border-border bg-surface-floating px-2.5 py-1.5 text-body font-normal text-fg-default shadow-floating"}>
              <span
                aria-hidden
                data-slot="status-overview-active-anchor"
                className="pointer-events-none absolute top-0 h-full w-6 -translate-x-1/2"
                style={{ left: anchorLeft }}
              />
            </Tooltip>
          )}
        </div>

        {markers.length > 0 && (
          <div data-slot="status-overview-markers" className="relative mt-2 h-4 text-label text-fg-subtle">
            {markers.map((marker, index) => (
              <span
                data-slot="status-overview-marker"
                key={`${marker.at}-${index}`}
                className={cn(
                  "absolute top-0 whitespace-nowrap",
                  marker.position === 0 && "text-left",
                  marker.position === 100 && "-translate-x-full text-right",
                  marker.position > 0 && marker.position < 100 && "-translate-x-1/2 text-center",
                )}
                style={{ left: `${marker.position}%` }}
              >
                {marker.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const StatusOverview = forwardRef<HTMLElement, StatusOverviewProps>((props, ref) => {
  const {
    ariaLabel,
    label,
    rangeLabel,
    summary,
    trailing,
    content,
    emptyContent,
    state: stateProp,
    statusMessage,
    className,
    variant = "card",
    ...sectionProps
  } = props;
  const state = stateProp ?? "ready";
  const activity = variant === "activity";
  const chart = variant === "chart";
  const unlabeledActivity = activity && label == null && rangeLabel == null;
  const loading = state === "loading";
  const unavailable = state === "unavailable" || state === "error";
  const showData = state === "ready" || state === "stale";
  const empty = content.items.length === 0;
  const showRail = showData && !empty;
  const showFooter = showData && !empty && content.footer;
  const summaryTone = summary?.status ? summaryClass[summary.status] : "text-fg-default";

  return (
    <section
      {...sectionProps}
      ref={ref}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      data-slot="status-overview"
      data-state={state}
      data-view={content.type}
      data-variant={variant}
      className={cn(
        "min-w-0",
        chart ? "flex flex-col" : activity ? "@container/status" : "flex flex-col rounded-xl border-hairline border-border bg-surface-floating p-3",
        className,
      )}
    >
      <div className={cn(activity && "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2", activity && !unlabeledActivity && (trailing ? "@xl/status:grid-cols-[6rem_minmax(0,1fr)_auto]" : "@sm/status:grid-cols-[6rem_minmax(0,1fr)_3rem]"))}>
      <div data-slot="status-overview-header" className={activity ? "contents" : "flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2"}>
        {!unlabeledActivity && <div className={cn("flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5", activity && "col-start-1 row-start-1")}>
          <span data-slot="status-overview-label" className={activity ? "break-words font-mono text-label uppercase text-fg-subtle" : "font-medium text-body text-fg-default"}>{label}</span>
          {rangeLabel && <span data-slot="status-overview-range" className="text-body text-fg-subtle">{rangeLabel}</span>}
        </div>}

        {summary && !(activity && trailing) && !unavailable && (
          <div data-slot="status-overview-summary" className={cn("flex min-w-0 items-baseline gap-1.5", activity ? "justify-end font-mono text-label" : "text-body", activity && (unlabeledActivity ? "col-start-2 row-start-2" : "col-start-2 row-start-1 @sm/status:col-start-3"))}>
            <span className={activity || chart ? "sr-only" : "text-fg-subtle"}>{summary.label}</span>
            {loading ? (
              <Skeleton className="h-4 w-16 rounded" />
            ) : (
              <span className={cn("break-words tabular-nums", activity || chart ? "text-fg-muted" : "font-medium", summary?.status || (!activity && !chart) ? summaryTone : undefined)}>{summary.value}</span>
            )}
          </div>
        )}
      </div>

      {activity && trailing && !unavailable && (
        <div data-slot="status-overview-trailing" className={cn("col-span-2 flex min-w-0 flex-wrap items-center justify-end gap-2", unlabeledActivity ? "row-start-2" : "row-start-3 @xl/status:col-span-1 @xl/status:col-start-3 @xl/status:row-start-1")}>
          {loading ? <Skeleton className="h-6 w-24 rounded" /> : trailing}
        </div>
      )}
      <div className={cn("min-w-0", activity && "col-span-2", activity && (unlabeledActivity ? "row-start-1" : "row-start-2"), activity && !unlabeledActivity && (trailing ? "@xl/status:col-span-1 @xl/status:col-start-2 @xl/status:row-start-1" : "@sm/status:col-span-1 @sm/status:col-start-2 @sm/status:row-start-1"), chart ? "mt-5" : !activity && "mt-3")}>
        {loading && <Skeleton data-slot="status-overview-skeleton" className={cn("rounded-sm", activity ? "h-6" : "h-control-md")} />}
        {showRail && <StatusSegmentRail ariaLabel={ariaLabel} content={content} variant={variant} />}
        {showData && empty && (
          <div data-slot="status-overview-state-message" role="status" className="grid min-h-control-md place-items-center text-label text-fg-subtle">
            {emptyContent}
          </div>
        )}
        {statusMessage && !loading && (
          <div
            data-slot="status-overview-state-message"
            role={state === "error" ? "alert" : "status"}
            className={cn("text-label", state === "error" ? "text-fg-danger" : "text-fg-subtle", showData && "mt-2")}
          >
            {statusMessage}
          </div>
        )}
      </div>

      {showFooter && <div data-slot="status-overview-footer" className={cn(chart ? "mt-3 text-body text-fg-muted" : "mt-2 text-label text-fg-subtle", activity && "col-span-2", activity && (unlabeledActivity ? (summary || trailing ? "row-start-3" : "row-start-2") : (trailing ? "row-start-4 @xl/status:col-span-3 @xl/status:row-start-2" : "@sm/status:col-span-3")))}>{content.footer}</div>}
      </div>
    </section>
  );
});

StatusOverview.displayName = "StatusOverview";

export { StatusOverview };
