"use client";

import { useCallback, useMemo, useState } from "react";
import { curveLinear, curveStepAfter } from "@visx/curve";
import { Area, AreaChart } from "@zeron/ui/area-chart";
import {
  Grid,
  XAxis,
  YAxis,
  ChartTooltip,
  TooltipContent,
} from "@zeron/ui/chart-core";
import { ChartDataTable, chartColor } from "@zeron/ui/chart-primitives";
import { cn } from "@zeron/ui/system/utils";
import {
  agentRunsChartData,
  runCost,
  runDuration,
  type AgentRunsFormatters,
} from "./agent-runs-data";
import type {
  AgentRun,
  AgentRunsData,
  AgentRunsLabels,
  AgentRunsMode,
} from "./agent-runs-types";

export function AgentRunsChart({
  data,
  mode,
  labels,
  format,
  selectedId,
  onSelect,
}: {
  data: AgentRunsData;
  mode: AgentRunsMode;
  labels: AgentRunsLabels;
  format: AgentRunsFormatters;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const points = useMemo(() => agentRunsChartData(data, mode), [data, mode]);
  const [focusedIds, setFocusedIds] = useState<Record<string, string>>({});
  const lanes = useMemo(() => {
    const byAgent = new Map<string, AgentRun[]>();
    for (const run of data.runs) {
      const lane = byAgent.get(run.agentId);
      if (lane) lane.push(run);
      else byAgent.set(run.agentId, [run]);
    }
    return data.agents.map((agent) => ({
      agent,
      runs: (byAgent.get(agent.id) ?? []).sort(
        (a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id),
      ),
    }));
  }, [data.agents, data.runs]);
  const domain = useMemo<[Date, Date]>(
    () => [new Date(data.start), new Date(data.end)],
    [data.start, data.end],
  );
  const formatTick = useCallback(
    (date: Date) => {
      const span = data.end - data.start;
      if (span < 60_000) return format.timeWithSeconds(date.getTime());
      if (span < 86_400_000) return format.time(date.getTime());
      return format.date(date);
    },
    [data.start, data.end, format],
  );
  const title = mode === "cumulative" ? labels.cumulative : labels.perRun;
  const rows = useMemo(
    () =>
      points.map((point, index) => ({
        id: String(index),
        label: `${format.fullDate(point.date)} ${format.time(point.date)}`,
        values: [format.money(point.value)],
      })),
    [points, format],
  );
  const accessibleData = useMemo(
    () =>
      rows.map((row) => ({ [labels.time]: row.label, [title]: row.values[0] })),
    [rows, labels.time, title],
  );
  return (
    <div className="min-w-0" data-slot="agent-runs-chart" data-mode={mode}>
      <div
        className="min-w-0"
        role="group"
        aria-label={`${labels.chartTitle} · ${title}`}
      >
        {points.length ? (
          <AreaChart
            data={points}
            accessibleData={accessibleData}
            xDomain={domain}
            xDomainSlotCount={0}
            margin={{ top: 20, bottom: 30, left: 92, right: 64 }}
            style={{ height: 240, aspectRatio: "auto" }}
            yDomain={[0, "dataMax"]}
            animationDuration={0}
            yDomainTween={false}
          >
            <Grid horizontal />
            <Area
              dataKey="value"
              stroke={chartColor(1)}
              fill={chartColor(1)}
              curve={mode === "cumulative" ? curveStepAfter : curveLinear}
              fillOpacity={0.25}
              gradientToOpacity={0}
              showMarkers={mode === "per-run"}
              markers={{ radius: 2, strokeWidth: 0, ringGap: 0 }}
              animate={false}
            />
            <XAxis tickMode="domain" numTicks={3} formatDate={formatTick} />
            <YAxis
              orientation="right"
              numTicks={4}
              formatValue={format.axisMoney}
            />
            <ChartTooltip
              showDatePill={false}
              content={({ point }) => (
                <TooltipContent
                  title={`${format.fullDate(Number(point.date))} · ${format.time(Number(point.date))}`}
                  rows={[
                    {
                      label: title,
                      value: format.money(Number(point.value)),
                      color: chartColor(1),
                    },
                  ]}
                />
              )}
            />
          </AreaChart>
        ) : (
          <p className="flex h-60 items-center justify-center text-body text-fg-muted">
            {labels.unreported}
          </p>
        )}
      </div>
      <div className="mt-1 space-y-2" role="group" aria-label={labels.activity}>
        {lanes.map(({ agent, runs }) => {
          const tabId =
            runs.find((item) => item.id === focusedIds[agent.id])?.id ??
            runs.find((item) => item.id === selectedId)?.id ??
            runs[0]?.id;
          return (
            <div
              key={agent.id}
              className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 pr-16"
            >
              <span className="flex min-w-0 items-center gap-2 text-label text-fg-muted">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: chartColor(agent.colorIndex) }}
                />
                <span className="truncate" title={agent.name}>
                  {agent.name}
                </span>
              </span>
              <div className="relative h-6 min-w-0 rounded-md bg-surface-raised">
                {runs.map((run, index) => {
                  const left =
                    ((run.startedAt - data.start) / (data.end - data.start)) *
                    100;
                  const width =
                    (runDuration(run, data.end) / (data.end - data.start)) *
                    100;
                  const cost = runCost(run);
                  const description = `${agent.name} · ${run.trigger} · ${format.time(run.startedAt)} · ${format.duration(runDuration(run, data.end))} · ${labels[run.status]} · ${cost === null ? labels.unreported : format.money(cost)}`;
                  return (
                    <button
                      key={run.id}
                      type="button"
                      title={description}
                      aria-label={labels.expand(description)}
                      aria-pressed={selectedId === run.id}
                      onClick={() => onSelect(run.id)}
                      tabIndex={run.id === tabId ? 0 : -1}
                      onFocus={() =>
                        setFocusedIds((current) => ({
                          ...current,
                          [agent.id]: run.id,
                        }))
                      }
                      onKeyDown={(event) => {
                        const next =
                          event.key === "ArrowRight"
                            ? Math.min(index + 1, runs.length - 1)
                            : event.key === "ArrowLeft"
                              ? Math.max(index - 1, 0)
                              : event.key === "Home"
                                ? 0
                                : event.key === "End"
                                  ? runs.length - 1
                                  : undefined;
                        if (next === undefined) return;
                        event.preventDefault();
                        event.currentTarget.parentElement
                          ?.querySelectorAll<HTMLButtonElement>("button")
                          [next]?.focus();
                      }}
                      className={cn(
                        "absolute inset-y-1 min-w-1 rounded-sm opacity-75 transition-opacity duration-fast hover:opacity-100 focus-visible:z-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                        selectedId === run.id &&
                          "z-content opacity-100 ring-2 ring-focus-ring ring-offset-2 ring-offset-surface-floating",
                        run.status === "cancelled" && "opacity-40",
                      )}
                      style={{
                        left: `${Math.min(left, 99.5)}%`,
                        width: `${Math.min(width, 100 - left)}%`,
                        backgroundColor: chartColor(agent.colorIndex),
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ChartDataTable
        caption={`${labels.chartTitle} · ${title}`}
        summary={labels.viewData}
        columns={[labels.time, title]}
        rows={rows}
      />
    </div>
  );
}
