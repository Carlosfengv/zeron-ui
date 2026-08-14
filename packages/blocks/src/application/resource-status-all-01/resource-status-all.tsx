"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent } from "@zeron/ui/card";
import { cn } from "@zeron/ui/system/utils";

export type ResourceStatusTone = "normal" | "warning" | "critical" | "unknown";

export interface ResourceStatusItem {
  label: string;
  value: number;
  tone: ResourceStatusTone;
  /** Whether the status has a determinate state for coverage calculation. */
  countsTowardCoverage?: boolean;
}

export interface ResourceStatusAllProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onClick"> {
  /** Short description shown above the aggregate count. */
  title?: string;
  /** Label displayed inside the circular distribution. */
  totalLabel?: string;
  /** Label for the determinate-status coverage summary. */
  coverageLabel?: string;
  /** Defaults to the sum of all supplied status values. */
  total?: number;
  /** Status distribution shown in both the chart and the detailed legend. */
  statuses?: readonly ResourceStatusItem[];
  /** Formats aggregate and status counts. The default preserves Figma's plain numerals. */
  formatValue?: (value: number) => string;
}

const chartSize = 192;
const chartInnerRadius = 60;
const chartOuterRadius = 96;

const statusPresentation: Record<
  ResourceStatusTone,
  { dotClassName: string; stroke: string }
> = {
  normal: { dotClassName: "bg-brand", stroke: "var(--brand)" },
  warning: { dotClassName: "bg-warning", stroke: "var(--warning)" },
  critical: { dotClassName: "bg-destructive", stroke: "var(--destructive)" },
  unknown: {
    dotClassName: "bg-neutral",
    stroke: "var(--neutral)",
  },
};

export const defaultResourceStatuses = [
  { label: "正常", value: 1390, tone: "normal", countsTowardCoverage: true },
  { label: "告警", value: 73, tone: "warning", countsTowardCoverage: true },
  { label: "严重", value: 10, tone: "critical", countsTowardCoverage: true },
  { label: "未知", value: 28, tone: "unknown", countsTowardCoverage: false },
] as const satisfies readonly ResourceStatusItem[];

function positiveFinite(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function ResourceStatusDonut({
  statuses,
  total,
  totalLabel,
  formatValue,
}: {
  statuses: readonly ResourceStatusItem[];
  total: number;
  totalLabel: string;
  formatValue: (value: number) => string;
}) {
  const distributedTotal = Math.max(
    total,
    statuses.reduce((sum, status) => sum + status.value, 0)
  );
  const accessibleSummary = statuses
    .map((status) => `${status.label} ${formatValue(status.value)}`)
    .join("，");
  const chartData = statuses
    .filter((status) => status.value > 0)
    .map((status) => ({
      ...status,
      fill: statusPresentation[status.tone].stroke,
    }));
  const chartValue = chartData.reduce((sum, status) => sum + status.value, 0);
  const pieData =
    distributedTotal > chartValue
      ? [...chartData, { label: "未覆盖", value: distributedTotal - chartValue, fill: "var(--muted)" }]
      : chartData;

  return (
    <div className="relative flex size-48 shrink-0 items-center justify-center">
      <div
        role="img"
        aria-label={`${totalLabel} ${formatValue(total)}：${accessibleSummary}`}
        className="size-full"
      >
        <PieChart aria-hidden="true" height={chartSize} width={chartSize}>
          <Pie
            data={[{ value: 1 }]}
            dataKey="value"
            endAngle={-270}
            fill="var(--muted)"
            innerRadius={chartInnerRadius}
            isAnimationActive={false}
            outerRadius={chartOuterRadius}
            startAngle={90}
            stroke="none"
          />
          {distributedTotal > 0 && pieData.length > 0 && (
            <Pie
              data={pieData}
              dataKey="value"
              endAngle={-270}
              innerRadius={chartInnerRadius}
              isAnimationActive={false}
              outerRadius={chartOuterRadius}
              startAngle={90}
              stroke="none"
            >
              {pieData.map((status) => (
                <Cell
                  key={status.label}
                  fill={status.fill}
                />
              ))}
            </Pie>
          )}
        </PieChart>
      </div>
      <div aria-hidden="true" className="absolute flex w-14 flex-col items-center gap-1 text-center">
        <span className="w-full text-heading font-semibold leading-8 tabular-nums text-fg-default">
          {formatValue(total)}
        </span>
        <span className="w-full text-label leading-4 text-fg-subtle">{totalLabel}</span>
      </div>
    </div>
  );
}

function ResourceStatusLegend({
  statuses,
  formatValue,
}: {
  statuses: readonly ResourceStatusItem[];
  formatValue: (value: number) => string;
}) {
  return (
    <dl className="grid w-full grid-cols-2 gap-x-2 gap-y-2 max-[420px]:grid-cols-1">
      {statuses.map((status) => (
        <div
          key={`${status.tone}-${status.label}`}
          className="flex min-w-0 items-center justify-between gap-2 px-1.5 py-2"
        >
          <dt className="flex min-w-0 items-center text-body leading-5 font-medium text-fg-muted">
            <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
              <span
                className={cn("size-2 rounded-full", statusPresentation[status.tone].dotClassName)}
              />
            </span>
            <span className="truncate">{status.label}</span>
          </dt>
          <dd className="shrink-0 text-body leading-5 tabular-nums text-fg-muted">
            {formatValue(status.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A status summary with a circular distribution, detailed counts, and coverage. */
export function ResourceStatusAll({
  "aria-label": ariaLabel = "资源状态总览",
  className,
  title = "报告资源总数",
  totalLabel = "资源总数",
  coverageLabel = "状态可判断覆盖率",
  total: providedTotal,
  statuses = defaultResourceStatuses,
  formatValue = String,
  ...props
}: ResourceStatusAllProps) {
  const normalizedStatuses = statuses.map((status) => ({
    ...status,
    value: positiveFinite(status.value),
  }));
  const total = positiveFinite(
    providedTotal ?? normalizedStatuses.reduce((sum, status) => sum + status.value, 0)
  );
  const covered = normalizedStatuses.reduce(
    (sum, status) =>
      (status.countsTowardCoverage ?? status.tone !== "unknown")
        ? sum + status.value
        : sum,
    0
  );
  const coveragePercentage = total > 0 ? Math.min(100, (covered / total) * 100) : 0;

  return (
    <Card
      aria-label={ariaLabel}
      className={cn(
        "w-full max-w-[701px] min-h-0 overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-floating p-0",
        className
      )}
      {...props}
    >
      <CardContent className="flex min-w-0 flex-col gap-1 p-0 min-[600px]:min-h-[248px] min-[600px]:flex-row min-[600px]:items-stretch">
        <div className="flex shrink-0 items-center justify-center p-7 min-[600px]:w-[248px]">
          <ResourceStatusDonut
            statuses={normalizedStatuses}
            total={total}
            totalLabel={totalLabel}
            formatValue={formatValue}
          />
        </div>

        <section className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-5" aria-label={title}>
          <p className="text-body leading-5 text-fg-muted">{title}</p>
          <p className="text-heading leading-9 font-bold tabular-nums text-fg-brand">
            {formatValue(total)}
          </p>
          <span aria-hidden="true" className="h-2 shrink-0" />
          <ResourceStatusLegend statuses={normalizedStatuses} formatValue={formatValue} />
          <span aria-hidden="true" className="h-2 shrink-0" />
          <div className="flex min-w-0 items-center justify-between gap-3 text-body leading-5 text-fg-subtle">
            <span className="min-w-0">{coverageLabel}</span>
            <span className="shrink-0 whitespace-nowrap tabular-nums">
              {formatValue(covered)} / {formatValue(total)} · {formatPercentage(coveragePercentage)}
            </span>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
