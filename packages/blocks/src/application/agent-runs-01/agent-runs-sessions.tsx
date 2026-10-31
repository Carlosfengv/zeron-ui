"use client";

import { useId, useMemo } from "react";
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from "@tanstack/react-table";
import { Avatar, AvatarFallback } from "@zeron/ui/avatar";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { SegmentedBar, chartColor } from "@zeron/ui/chart-primitives";
import { DataTable, useDataTable } from "@zeron/ui/data-table";
import { useIcon } from "@zeron/ui/system/icon-context";
import {
  cacheRatio,
  runCost,
  runTokens,
  runDuration,
  summarizeAgentRuns,
  usageKinds,
  type AgentRunsFormatters,
} from "./agent-runs-data";
import type {
  AgentRun,
  AgentRunsAgent,
  AgentRunsData,
  AgentRunsLabels,
  AgentRunStatus,
} from "./agent-runs-types";

export function AgentRunIdentity({ agent }: { agent: AgentRunsAgent }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-body text-fg-default">
      <span aria-hidden="true">
        {agent.avatar ?? (
          <Avatar size="sm">
            <AvatarFallback>{agent.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )}
      </span>
      <span className="truncate" title={agent.name}>
        {agent.name}
      </span>
    </span>
  );
}
const statusTone = {
  running: "info",
  completed: "success",
  cancelled: "neutral",
  failed: "danger",
} as const;
export function AgentRunState({
  status,
  labels,
}: {
  status: AgentRunStatus;
  labels: AgentRunsLabels;
}) {
  return (
    <Badge variant="plain" status={statusTone[status]}>
      {labels[status]}
    </Badge>
  );
}
function RunDetails({
  run,
  data,
  format,
  labels,
  onOpenSession,
}: {
  run: AgentRun;
  data: AgentRunsData;
  format: AgentRunsFormatters;
  labels: AgentRunsLabels;
  onOpenSession?: (run: AgentRun) => void;
}) {
  const Arrow = useIcon("arrow-right");
  const cost = runCost(run);
  const ratio = cacheRatio(run);
  const segments = usageKinds.map((kind, index) => ({
    id: kind,
    label: labels[kind],
    color: chartColor((index + 1) as 1 | 2 | 3 | 4),
    value: run.usage?.[kind].cost ?? null,
  }));
  return (
    <div
      className="@container/run-detail min-w-0 space-y-5 py-4"
      data-slot="agent-run-detail"
    >
      <p className="break-words text-body text-fg-default">{run.trigger}</p>
      <div className="grid gap-6 @2xl/run-detail:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] @2xl/run-detail:gap-10">
        <div className="min-w-0 space-y-3">
          <h4 className="text-label font-medium text-fg-muted">
            {labels.costBreakdown}
          </h4>
          {run.usage ? (
            <>
              <SegmentedBar
                mode="distribution"
                segments={segments}
                valueText={`${labels.costBreakdown} · ${format.money(cost!)}`}
              />
              <table className="w-full text-label tabular-nums">
                <caption className="sr-only">{labels.costBreakdown}</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">{labels.costBreakdown}</th>
                    <th scope="col">{labels.tokens}</th>
                    <th scope="col">{labels.cost}</th>
                    <th scope="col">%</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((segment) => (
                    <tr key={segment.id}>
                      <th
                        scope="row"
                        className="py-1 text-left font-normal text-fg-muted"
                      >
                        <span
                          aria-hidden="true"
                          className="mr-2 inline-block size-2 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        {segment.label}
                      </th>
                      <td className="py-1 text-right text-fg-default">
                        {format.compact(
                          run.usage![segment.id as (typeof usageKinds)[number]]
                            .tokens,
                        )}
                      </td>
                      <td className="py-1 text-right text-fg-default">
                        {format.money(segment.value!)}
                      </td>
                      <td className="py-1 text-right text-fg-subtle">
                        {cost! > 0
                          ? format.percent(segment.value! / cost!)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th
                      scope="row"
                      className="pt-2 text-left font-medium text-fg-default"
                    >
                      {labels.total}
                    </th>
                    <td className="pt-2 text-right font-medium text-fg-default">
                      {format.compact(runTokens(run)!)}
                    </td>
                    <td className="pt-2 text-right font-medium text-fg-default">
                      {format.money(cost!)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <p className="py-4 text-body text-fg-muted">{labels.unreported}</p>
          )}
        </div>
        <div className="min-w-0 space-y-4">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-2 text-label">
            <dt className="text-fg-muted">{labels.status}</dt>
            <dd>
              <AgentRunState status={run.status} labels={labels} />
            </dd>
            <dt className="text-fg-muted">{labels.model}</dt>
            <dd className="break-words text-fg-default">
              {data.models.find((model) => model.id === run.modelId)?.name ??
                "—"}
            </dd>
            <dt className="text-fg-muted">{labels.cacheHit}</dt>
            <dd className="break-words text-fg-default">
              {ratio === null ? "—" : format.percent(ratio)}
              {run.cacheSavings !== undefined && (
                <span className="block text-fg-muted">
                  {labels.saved(format.money(run.cacheSavings))}
                </span>
              )}
            </dd>
            <dt className="text-fg-muted">{labels.sessionTime}</dt>
            <dd className="break-words tabular-nums text-fg-default">
              {format.fullDate(run.startedAt)}
              <br />
              {format.time(run.startedAt)}–
              {format.day(run.startedAt) !==
                format.day(run.endedAt ?? data.end) &&
                `${format.fullDate(run.endedAt ?? data.end)} `}
              {format.time(run.endedAt ?? data.end)}
            </dd>
          </dl>
          {onOpenSession && (
            <Button
              size="sm"
              variant="secondary"
              trailingIcon={Arrow}
              onClick={() => onOpenSession(run)}
            >
              {labels.openSession}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AgentRunsSessions({
  data,
  labels,
  format,
  runs,
  expandedId,
  onToggle,
  pagination,
  onPaginationChange,
  onOpenSession,
}: {
  data: AgentRunsData;
  labels: AgentRunsLabels;
  format: AgentRunsFormatters;
  runs: readonly AgentRun[];
  expandedId?: string;
  onToggle: (id: string) => void;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onOpenSession?: (run: AgentRun) => void;
}) {
  const id = useId();
  const Chevron = useIcon("chevron-right");
  const Down = useIcon("chevron-down");
  const rows = useMemo(() => [...runs], [runs]);
  const groups = useMemo(() => {
    const result = new Map<string, AgentRun[]>();
    for (const run of runs) {
      const day = format.day(run.startedAt);
      const group = result.get(day);
      if (group) group.push(run);
      else result.set(day, [run]);
    }
    return new Map(
      [...result].map(([day, group]) => [
        day,
        { count: group.length, summary: summarizeAgentRuns(group, data.end) },
      ]),
    );
  }, [runs, format, data.end]);
  const columns = useMemo<ColumnDef<AgentRun, unknown>[]>(
    () => [
      {
        accessorKey: "startedAt",
        header: labels.time,
        size: 80,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {format.time(row.original.startedAt)}
          </span>
        ),
      },
      {
        accessorKey: "trigger",
        header: labels.trigger,
        size: 380,
        cell: ({ row }) => {
          const run = row.original;
          return (
            <button
              type="button"
              aria-expanded={row.getIsExpanded()}
              aria-controls={
                row.getIsExpanded()
                  ? id + "-" + encodeURIComponent(run.id)
                  : undefined
              }
              aria-label={
                row.getIsExpanded()
                  ? labels.collapse(run.trigger)
                  : labels.expand(run.trigger)
              }
              onClick={() => onToggle(run.id)}
              className="block min-w-64 max-w-sm rounded-sm py-2 text-left text-body text-fg-default transition-colors duration-fast hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <span className="block truncate" title={run.trigger}>
                {run.trigger}
              </span>
            </button>
          );
        },
      },
      {
        accessorKey: "agentId",
        header: labels.agent,
        size: 128,
        cell: ({ row }) => (
          <AgentRunIdentity
            agent={
              data.agents.find((agent) => agent.id === row.original.agentId)!
            }
          />
        ),
      },
      {
        accessorKey: "modelId",
        header: labels.model,
        size: 160,
        cell: ({ row }) => {
          const model = data.models.find(
            (model) => model.id === row.original.modelId,
          );
          return (
            <span
              className="block max-w-40 truncate text-label"
              title={model?.name}
            >
              {model?.name ?? "—"}
            </span>
          );
        },
      },
      {
        id: "duration",
        header: labels.durationColumn,
        size: 128,
        cell: ({ row }) =>
          row.original.status === "running" ? (
            <AgentRunState status={row.original.status} labels={labels} />
          ) : (
            <span className="tabular-nums">
              {format.duration(runDuration(row.original, data.end))}
            </span>
          ),
      },
      {
        id: "tokens",
        header: labels.tokens,
        size: 96,
        cell: ({ row }) => {
          const value = runTokens(row.original);
          return (
            <span className="tabular-nums">
              {value === null ? "—" : format.compact(value)}
            </span>
          );
        },
      },
      {
        id: "cost",
        header: labels.cost,
        size: 96,
        cell: ({ row }) => {
          const value = runCost(row.original);
          return (
            <span className="font-medium tabular-nums text-fg-default">
              {value === null ? "—" : format.money(value)}
            </span>
          );
        },
      },
      {
        id: "expand",
        header: () => <span className="sr-only">{labels.costBreakdown}</span>,
        size: 40,
        cell: ({ row }) => {
          const Direction = row.getIsExpanded() ? Down : Chevron;
          return <Direction size={14} aria-hidden="true" />;
        },
      },
    ],
    [
      data.agents,
      data.models,
      data.end,
      format,
      labels,
      id,
      onToggle,
      Chevron,
      Down,
    ],
  );
  const expanded = useMemo(
    () => (expandedId ? { [expandedId]: true } : {}),
    [expandedId],
  );
  const { table } = useDataTable({
    data: rows,
    columns,
    getRowId: (run) => run.id,
    enableRowSelection: false,
    initialState: { columnPinning: { left: ["startedAt"] } },
    getRowCanExpand: () => true,
    autoResetPageIndex: false,
    state: { pagination, expanded },
    onPaginationChange,
  });
  return (
    <div className="min-w-0" data-slot="agent-runs-sessions">
      <DataTable
        table={table}
        variant="embedded"
        density="compact"
        stickyHeader
        className="@container/session-table"
        style={{ backgroundColor: "var(--surface-floating)" }}
        role="region"
        aria-label={labels.sessions}
        activeRowId={expandedId}
        onRowActivate={(row) => onToggle(row.original.id)}
        paginationProps={{
          pageSizeOptions: [6, 10, 20, 50],
          labels: {
            firstPage: labels.firstPage,
            previousPage: labels.previous,
            nextPage: labels.next,
            lastPage: labels.lastPage,
            rowsPerPage: labels.rowsPerPage,
            pageSummary: (page, count) =>
              labels.pageSummary(format.number(page), format.number(count)),
          },
        }}
        renderRowHeader={({ row, previousRow }) => {
          const day = format.day(row.original.startedAt);
          if (previousRow && format.day(previousRow.original.startedAt) === day)
            return null;
          const group = groups.get(day)!;
          const hasUsage = group.summary.unreported < group.count;
          return (
            <div className="sticky left-0 -mx-3 flex w-[100cqw] flex-wrap items-center justify-between gap-2 bg-surface-raised px-3 py-2">
              <h3 className="text-label font-medium text-fg-default">
                {format.fullDate(row.original.startedAt)}
              </h3>
              <p className="text-label tabular-nums text-fg-subtle">
                {labels.runCount(format.number(group.count))} ·{" "}
                {format.duration(group.summary.duration)} ·{" "}
                {hasUsage ? format.compact(group.summary.tokens) : "—"}{" "}
                {labels.tokens} ·{" "}
                {hasUsage ? format.money(group.summary.cost) : "—"}
              </p>
            </div>
          );
        }}
        renderExpandedRow={({ row }) => (
          <div
            id={id + "-" + encodeURIComponent(row.id)}
            className="sticky left-0 -mx-3 w-[100cqw] bg-surface-raised px-3"
          >
            <RunDetails
              run={row.original}
              data={data}
              labels={labels}
              format={format}
              onOpenSession={onOpenSession}
            />
          </div>
        )}
      />
    </div>
  );
}
