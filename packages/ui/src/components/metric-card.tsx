"use client";

import {
  forwardRef,
  useId,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "#system/utils";

export type MetricTone = "default" | "positive" | "warning" | "critical";
export type MetricCardState = "ready" | "loading" | "unavailable" | "stale" | "error";

export type MetricBreakdownItem = {
  label: string;
  value: string | number;
  tone?: MetricTone;
};

export type MetricChartDatum = {
  value: number;
  /** An x-axis and tooltip label, such as a timestamp or category name. */
  label?: string;
};

export type MetricChartContent = {
  type: "visualization";
  chart: "line" | "area" | "bar";
  /** At least 24 finite values are required; use objects when the tooltip needs labels. */
  data: Array<number | MetricChartDatum>;
  accessibleLabel: string;
  /** Formats the inspected value shown in the chart tooltip. */
  formatValue?: (value: number) => string;
};

export type MetricCardContent =
  | { type: "none" }
  | {
      type: "breakdown";
      layout?: "list" | "grid";
      items: MetricBreakdownItem[];
    }
  | MetricChartContent;

export interface MetricCardProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "content" | "onClick"> {
  /** Describes the measurement, for example "Completion rate". */
  label: string;
  /** The primary metric result. Units are rendered separately for consistent formatting. */
  value: string | number;
  unit?: string;
  /** Supporting context such as sample size, token count, or update time. */
  meta?: string;
  tone?: MetricTone;
  content?: MetricCardContent;
  state?: MetricCardState;
  /** Optional text displayed for unavailable, stale, or failed data. */
  statusMessage?: ReactNode;
  /** Optional action rendered above the whole-card click target. */
  action?: ReactNode;
  /** Enables the supplied whole-card action. Defaults to true when onClick is set. */
  interactive?: boolean;
  /** Invoked by the accessible whole-card button. */
  onClick?: () => void;
  /** Accessible name for the whole-card action. Defaults to the metric label. */
  actionLabel?: string;
}

type NormalizedChartDatum = MetricChartDatum & { index: number };
type ChartPoint = NormalizedChartDatum & { x: number; y: number };

const chartWidth = 320;
const chartHeight = 60;
const chartMargin = { top: 4, right: 4, bottom: 4, left: 4 };
const chartInnerWidth = chartWidth - chartMargin.left - chartMargin.right;
const chartInnerHeight = chartHeight - chartMargin.top - chartMargin.bottom;
const minimumChartDataPoints = 24;

function toneClass(tone: MetricTone) {
  return {
    default: "text-fg-default",
    positive: "text-fg-success",
    warning: "text-fg-warning",
    critical: "text-fg-danger",
  }[tone];
}

function chartData(data: MetricChartContent["data"]): NormalizedChartDatum[] {
  return data.flatMap((item, index) => {
    const datum = typeof item === "number" ? { value: item } : item;
    return Number.isFinite(datum.value) ? [{ ...datum, index }] : [];
  });
}

function formatChartValue(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (absolute >= 10 || Number.isInteger(value)) return String(Math.round(value));
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function chartModel(data: NormalizedChartDatum[], chart: MetricChartContent["chart"]) {
  const values = data.map((datum) => datum.value);
  const rawMinimum = Math.min(...values);
  const rawMaximum = Math.max(...values);
  const includesZero = true;
  const minimum = includesZero ? Math.min(0, rawMinimum) : rawMinimum;
  const maximum = Math.max(0, rawMaximum);
  const range = maximum - minimum || Math.max(Math.abs(maximum), 1);
  const padding = chart === "bar" ? range * 0.08 : range * 0.14;
  const domainMinimum = minimum >= 0 ? 0 : minimum - padding;
  const domainMaximum = maximum + padding;
  const domainRange = domainMaximum - domainMinimum || 1;
  const y = (value: number) =>
    chartMargin.top + chartInnerHeight - ((value - domainMinimum) / domainRange) * chartInnerHeight;
  const x = (index: number) =>
    data.length === 1
      ? chartMargin.left + chartInnerWidth / 2
      : chartMargin.left + (index / (data.length - 1)) * chartInnerWidth;
  const points = data.map((datum, index) => ({ ...datum, x: x(index), y: y(datum.value) }));
  return { points, baseline: chart === "line" ? chartHeight : y(0) };
}

function linePath(points: ChartPoint[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
}

function MetricCardChart({
  chart,
  data,
  accessibleLabel,
  formatValue = formatChartValue,
  interactive = true,
}: MetricChartContent & { interactive?: boolean }) {
  const id = useId();
  const normalizedData = useMemo(() => chartData(data), [data]);
  const model = useMemo(() => chartModel(normalizedData, chart), [chart, normalizedData]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const points = model.points;
  const activePoint = activeIndex === null ? null : points[activeIndex] ?? null;

  if (points.length < minimumChartDataPoints) {
    return (
      <div
        role="img"
        aria-label={`${accessibleLabel}. At least ${minimumChartDataPoints} data points are required.`}
        data-slot="metric-card-chart-insufficient"
        className="flex h-15 items-center overflow-hidden"
      >
        <span className="h-px w-full bg-muted" />
        <span className="sr-only">At least {minimumChartDataPoints} data points are required.</span>
      </div>
    );
  }

  const path = linePath(points);
  const baselineAreaPath = `${path} L${points[points.length - 1].x.toFixed(2)},${model.baseline.toFixed(2)} L${points[0].x.toFixed(2)},${model.baseline.toFixed(2)} Z`;
  const visualLabel = activePoint
    ? `${accessibleLabel}. ${activePoint.label ?? `Point ${activePoint.index + 1}`}: ${formatValue(activePoint.value)}`
    : accessibleLabel;

  const updateActivePoint = (event: PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    setActiveIndex(Math.round(progress * (points.length - 1)));
  };

  const updateFromKeyboard = (event: KeyboardEvent<SVGSVGElement>) => {
    if (!interactive || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    setActiveIndex((current) => {
      if (event.key === "Home") return 0;
      if (event.key === "End") return points.length - 1;
      const next = (current ?? 0) + (event.key === "ArrowRight" ? 1 : -1);
      return Math.max(0, Math.min(points.length - 1, next));
    });
  };

  return (
    <div className="relative h-15 overflow-hidden">
      <svg
        role="img"
        aria-label={visualLabel}
        aria-describedby={interactive ? `${id}-instructions` : undefined}
        tabIndex={interactive ? 0 : undefined}
        onPointerMove={updateActivePoint}
        onPointerLeave={interactive ? () => setActiveIndex(null) : undefined}
        onBlur={interactive ? () => setActiveIndex(null) : undefined}
        onKeyDown={updateFromKeyboard}
        data-slot="metric-card-chart"
        data-chart={chart}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        className={cn(
          "h-full w-full overflow-hidden text-fg-brand outline-none",
          interactive && "cursor-crosshair focus-visible:ring-1 focus-visible:ring-focus-ring"
        )}
      >
        {(chart === "line" || chart === "area") && (
          <path
            data-slot="metric-card-chart-area"
            d={baselineAreaPath}
            fill="currentColor"
            fillOpacity={chart === "line" ? 0.1 : 0.16}
          />
        )}
        {chart === "bar" ? (
          points.map((point, index) => {
            const slotWidth = chartInnerWidth / points.length;
            const barWidth = Math.max(3, slotWidth - 4);
            const y = Math.min(point.y, model.baseline);
            return (
              <rect
                key={point.index}
                x={chartMargin.left + index * slotWidth + (slotWidth - barWidth) / 2}
                y={y}
                width={barWidth}
                height={Math.max(1, Math.abs(model.baseline - point.y))}
                rx="2"
                fill="currentColor"
                fillOpacity={activePoint && activePoint.index !== point.index ? 0.45 : 1}
              />
            );
          })
        ) : (
          <>
            <path d={path} fill="none" stroke="currentColor" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
            {activePoint && (
              <>
                <line x1={activePoint.x} x2={activePoint.x} y1={chartMargin.top} y2={chartMargin.top + chartInnerHeight} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" opacity="0.55" />
                <circle cx={activePoint.x} cy={activePoint.y} r="3" fill="var(--surface-floating)" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </>
            )}
          </>
        )}
      </svg>

      {interactive && <span id={`${id}-instructions`} className="sr-only">Use left and right arrow keys to inspect chart values.</span>}
      {activePoint && (
        <div
          data-slot="metric-card-chart-tooltip"
          aria-live="polite"
          className={cn(
            "pointer-events-none absolute top-2 z-foreground rounded-lg bg-surface-top px-2 py-1 shadow-floating",
            activePoint.x > chartMargin.left + chartInnerWidth / 2 ? "left-12" : "right-2"
          )}
        >
          <span className="block text-label text-fg-muted">{activePoint.label ?? `Point ${activePoint.index + 1}`}</span>
          <span className="block text-body font-semibold tabular-nums text-fg-default">{formatValue(activePoint.value)}</span>
        </div>
      )}
    </div>
  );
}

function MetricCardBreakdown({
  layout = "list",
  items,
}: Extract<MetricCardContent, { type: "breakdown" }>) {
  return (
    <div
      role="list"
      data-slot="metric-card-breakdown"
      data-layout={layout}
      className={cn(
        "mt-2 w-full text-body",
        layout === "grid" ? "grid grid-cols-2 gap-x-4" : "flex flex-col"
      )}
    >
      {items.map((item, index) => (
        <div
          role="listitem"
          key={`${item.label}-${index}`}
          className="flex min-w-0 items-baseline gap-3 py-1"
        >
          <span className="min-w-0 truncate text-fg-muted">{item.label}</span>
          <span className={cn("ml-auto shrink-0 font-medium tabular-nums", toneClass(item.tone ?? "default"))}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * A self-sizing, single-metric summary card with optional breakdown or trend.
 * Layout is intentionally owned by the parent; the card never sets a fixed or
 * minimum height and does not stretch to match neighbouring cards.
 */
const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      label,
      value,
      unit,
      meta,
      tone = "default",
      content = { type: "none" },
      state = "ready",
      statusMessage,
      action,
      interactive: interactiveProp,
      onClick,
      actionLabel,
      className,
      ...props
    },
    ref
  ) => {
    const loading = state === "loading";
    const unavailable = state === "unavailable" || state === "error";
    const showContent = !loading && !unavailable && content.type !== "none";
    const interactive = (interactiveProp ?? Boolean(onClick)) && Boolean(onClick) && !loading;
    const valueClass = unavailable ? "text-fg-subtle" : toneClass(tone);
    const contentSkeletonClass = "h-15";

    return (
      <div
        ref={ref}
        data-slot="metric-card"
        data-state={state}
        data-tone={tone}
        aria-busy={loading || undefined}
        className={cn(
          "group/metric-card relative flex h-auto min-h-0 self-start min-w-0 flex-col",
          "rounded-xl border-[0.5px] border-border bg-surface-floating p-3",
          interactive && "cursor-pointer transition-colors duration-fast hover:bg-hover",
          className
        )}
        {...props}
      >
        {interactive && (
          <button
            type="button"
            onClick={onClick}
            aria-label={actionLabel ?? label}
            className="absolute inset-0 z-raised cursor-pointer rounded-[inherit] outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
          />
        )}

        <div className="relative z-content flex min-w-0 flex-col">
          <span data-slot="metric-card-label" className="truncate text-[14px] leading-5 text-fg-muted">
            {label}
          </span>

          <div data-slot="metric-card-value-row" className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            {loading ? (
              <span aria-hidden className="mt-0.5 h-6 w-24 animate-pulse rounded-lg bg-muted" />
            ) : (
              <span className={cn("min-w-0 truncate text-[24px] leading-9 font-semibold tabular-nums", valueClass)}>
                {unavailable ? "—" : value}
                {unit && <span className="ml-1 text-body font-medium text-fg-muted">{unit}</span>}
              </span>
            )}
            {meta &&
              (loading ? (
                <span aria-hidden className="h-4 w-16 animate-pulse rounded-lg bg-muted" />
              ) : (
                <span data-slot="metric-card-meta" className="ml-auto truncate text-label text-fg-subtle">
                  {meta}
                </span>
              ))}
          </div>

          {statusMessage && !loading && (
            <div
              data-slot="metric-card-status"
              role={state === "error" ? "alert" : "status"}
              className={cn(
                "mt-1 text-label",
                state === "error" ? "text-fg-danger" : "text-fg-subtle"
              )}
            >
              {statusMessage}
            </div>
          )}

          {loading && content.type !== "none" && (
            <span aria-hidden data-slot="metric-card-content-skeleton" className={cn("mt-2 animate-pulse rounded-lg bg-muted", contentSkeletonClass)} />
          )}

          {showContent && content.type === "breakdown" && <MetricCardBreakdown {...content} />}
          {showContent && content.type === "visualization" && (
            <div className="mt-2">
              <MetricCardChart {...content} interactive={!interactive} />
            </div>
          )}
        </div>

        {action && <div data-slot="metric-card-action" className="relative z-action mt-2 w-fit">{action}</div>}
      </div>
    );
  }
);

MetricCard.displayName = "MetricCard";

export { MetricCard };
