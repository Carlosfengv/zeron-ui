"use client";

import { useMemo } from "react";
import { Bar, BarChart } from "@zeron/ui/bar-chart";
import { ChartTooltip, ReferenceLine } from "@zeron/ui/chart-core";
import type { PlanUsageDay, PlanUsageLabels } from "./plan-usage-types";

const dailyUsageColors = {
  actual: "var(--brand)",
  today: "var(--brand-active)",
  projected: "color-mix(in oklab, var(--brand) 16%, transparent)",
};

function dailyUsageColor(point: Record<string, unknown>) {
  return point.kind === "today" ? dailyUsageColors.today
    : point.kind === "projected" ? dailyUsageColors.projected : dailyUsageColors.actual;
}

export function PlanUsageChart({ days, allowance, labels, formatDate, formatNumber }: {
  days: readonly PlanUsageDay[];
  allowance: number;
  labels: PlanUsageLabels;
  formatDate: (date: string) => string;
  formatNumber: (value: number) => string;
}) {
  const today = days.find((day) => day.kind === "today");
  const chartData = useMemo(() => days.map((day) => ({ ...day, name: formatDate(day.date) })), [days, formatDate]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-body font-semibold text-fg-default">{labels.dailyUsage}</h4>
        {today && <p className="text-body text-fg-subtle">{labels.today(formatNumber(today.credits))}</p>}
      </div>
      {days.length ? <>
        <BarChart data={chartData}
          xDataKey="name" className="h-32 w-full" barGap={0.25}
          margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <Bar dataKey="credits" fill={dailyUsageColors.actual} lineCap={3}
            fillForDatum={dailyUsageColor} />
          <ReferenceLine y={allowance} stroke="var(--fg-subtle)" />
          <ChartTooltip showDatePill={false} rows={(point) => [{
            color: dailyUsageColor(point),
            label: String(point.name), value: formatNumber(Number(point.credits)),
          }]} />
        </BarChart>
        <div className="flex flex-wrap items-center justify-between gap-2 text-label text-fg-subtle">
          <span>{formatDate(days[0].date)}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 border-t-hairline border-dashed border-fg-subtle" aria-hidden="true" />
            {labels.evenPace(formatNumber(allowance))}
          </span>
          <span>{formatDate(days[days.length - 1].date)}</span>
        </div>
      </> : <p className="py-6 text-body text-fg-muted">{labels.emptyUsage}</p>}
    </div>
  );
}
