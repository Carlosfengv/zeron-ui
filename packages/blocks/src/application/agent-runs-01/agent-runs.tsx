"use client";

import { useCallback, useId, useMemo, useState } from "react";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { Button } from "@zeron/ui/button";
import {
  ChartLegend,
  SegmentedBar,
  chartColor,
} from "@zeron/ui/chart-primitives";
import { Container, ContainerBody } from "@zeron/ui/container";
import { Empty, EmptyTitle, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Skeleton } from "@zeron/ui/skeleton";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { AgentRunsChart } from "./agent-runs-chart";
import { AgentRunsSessions } from "./agent-runs-sessions";
import {
  createAgentRunsFormatters,
  summarizeAgentRuns,
  validateAgentRunsData,
} from "./agent-runs-data";
import { agentRunsEnLabels } from "./agent-runs-labels";
import type { AgentRunsProps } from "./agent-runs-types";

/** A shell-free project usage block. The host owns fetching, billing and navigation. */
export function AgentRuns(props: AgentRunsProps) {
  return <AgentRunsContent key={props.data.id} {...props} />;
}
function AgentRunsContent({
  data,
  locale = "en-US",
  timeZone = "UTC",
  labels: suppliedLabels,
  mode: suppliedMode,
  defaultMode = "cumulative",
  onModeChange,
  defaultExpandedRunId,
  pageSize: suppliedPageSize = 6,
  onOpenSession,
  onClose,
  state = "ready",
  errorMessage,
  onRetry,
  className,
  ...props
}: AgentRunsProps) {
  const titleId = useId();
  const Close = useIcon("x");
  const [localMode, setMode] = useState(defaultMode);
  const [expandedId, setExpandedId] = useState(defaultExpandedRunId);
  const mode = suppliedMode ?? localMode;
  const labels = useMemo(
    () => ({ ...agentRunsEnLabels, ...suppliedLabels }),
    [suppliedLabels],
  );
  const format = useMemo(
    () => createAgentRunsFormatters(locale, timeZone, data.currency, labels),
    [locale, timeZone, data.currency, labels],
  );
  const valid = useMemo(() => validateAgentRunsData(data), [data]);
  const summary = useMemo(
    () => (valid ? summarizeAgentRuns(data.runs, data.end) : null),
    [data, valid],
  );
  const runs = useMemo(
    () =>
      [...data.runs].sort(
        (a, b) => b.startedAt - a.startedAt || a.id.localeCompare(b.id),
      ),
    [data.runs],
  );
  const configuredPageSize = Number.isFinite(suppliedPageSize)
    ? Math.max(1, Math.min(100, Math.floor(suppliedPageSize)))
    : 6;
  const [paginationState, setPaginationState] = useState(() => ({
    configuredPageSize,
    value: {
      pageSize: configuredPageSize,
      pageIndex: Math.floor(
        Math.max(
          0,
          runs.findIndex((run) => run.id === defaultExpandedRunId),
        ) / configuredPageSize,
      ),
    },
  }));
  if (paginationState.configuredPageSize !== configuredPageSize) {
    setPaginationState({
      configuredPageSize,
      value: { pageSize: configuredPageSize, pageIndex: 0 },
    });
  }
  const pagination = useMemo(
    () => ({
      ...paginationState.value,
      pageIndex: Math.min(
        paginationState.value.pageIndex,
        Math.max(
          0,
          Math.ceil(runs.length / paginationState.value.pageSize) - 1,
        ),
      ),
    }),
    [paginationState.value, runs.length],
  );
  const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) =>
      setPaginationState((current) => {
        const previous = {
          ...current.value,
          pageIndex: Math.min(
            current.value.pageIndex,
            Math.max(0, Math.ceil(runs.length / current.value.pageSize) - 1),
          ),
        };
        return {
          configuredPageSize,
          value: typeof updater === "function" ? updater(previous) : updater,
        };
      }),
    [configuredPageSize, runs.length],
  );
  const hasReportedUsage = summary !== null && summary.unreported < runs.length;
  const toggleRun = useCallback(
    (id: string) =>
      setExpandedId((current) => (current === id ? undefined : id)),
    [],
  );
  const selectRun = useCallback(
    (id: string) => {
      setExpandedId(id);
      const index = runs.findIndex((run) => run.id === id);
      if (index >= 0)
        setPaginationState((current) => ({
          ...current,
          value: {
            ...current.value,
            pageIndex: Math.floor(index / current.value.pageSize),
          },
        }));
    },
    [runs],
  );
  return (
    <section
      {...props}
      aria-labelledby={titleId}
      aria-busy={state === "loading"}
      data-slot="agent-runs"
      className={cn("@container/agent-runs min-w-0", className)}
    >
      <Container>
        <ContainerBody>
          <div className="space-y-6 @lg/agent-runs:p-2">
            <header className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <h2
                  id={titleId}
                  className="text-title font-medium text-fg-default"
                >
                  {labels.title}
                </h2>
                <p className="break-words text-body text-fg-muted">
                  {data.project.identifier && (
                    <>
                      <span className="text-fg-subtle">
                        {data.project.identifier}
                      </span>
                      <span aria-hidden="true"> · </span>
                    </>
                  )}
                  {data.project.name}
                </p>
              </div>
              {onClose && (
                <Button
                  size="sm"
                  iconOnly
                  variant="ghost"
                  leadingIcon={Close}
                  aria-label={labels.close}
                  onClick={onClose}
                />
              )}
            </header>
            {state === "loading" ? (
              <div role="status" className="space-y-6">
                <span className="sr-only">{labels.loading}</span>
                <div className="grid grid-cols-2 gap-6 @3xl/agent-runs:grid-cols-5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="space-y-3">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-28" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-60 w-full" />
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : state === "error" || !valid ? (
              <div className="flex min-h-60 flex-col items-center justify-center gap-4">
                <InlineNotice variant="emphasized" tone="danger" role="alert">
                  <InlineNoticeContent>
                    {!valid
                      ? labels.invalid
                      : (errorMessage ?? labels.loadError)}
                  </InlineNoticeContent>
                </InlineNotice>
                {onRetry && (
                  <Button variant="secondary" onClick={onRetry}>
                    {labels.retry}
                  </Button>
                )}
              </div>
            ) : !data.runs.length ? (
              <Empty reason="no-data">
                <EmptyTitle>{labels.empty}</EmptyTitle>
                <EmptyDescription>{labels.emptyDescription}</EmptyDescription>
              </Empty>
            ) : (
              summary && (
                <>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-5 @lg/agent-runs:grid-cols-3 @4xl/agent-runs:grid-cols-5">
                    {[
                      {
                        label: labels.spent,
                        value: hasReportedUsage
                          ? format.money(summary.cost)
                          : "—",
                        detail: `${format.date(data.start)}–${format.date(data.end)}`,
                      },
                      {
                        label: labels.tokens,
                        value: hasReportedUsage
                          ? format.compact(summary.tokens)
                          : "—",
                        detail:
                          summary.cacheRatio === null
                            ? "—"
                            : labels.fromCache(
                                format.percent(summary.cacheRatio),
                              ),
                      },
                      {
                        label: labels.output,
                        value: hasReportedUsage
                          ? format.compact(summary.output)
                          : "—",
                        detail: undefined,
                      },
                      {
                        label: labels.agentTime,
                        value: format.duration(summary.duration),
                        detail: labels.elapsed(
                          format.duration(data.end - data.start),
                        ),
                      },
                      {
                        label: labels.sessions,
                        value: format.number(runs.length),
                        detail: labels.runStates(
                          format.number(summary.active),
                          format.number(summary.cancelled),
                        ),
                      },
                    ].map((item) => (
                      <div key={item.label} className="min-w-0 space-y-1.5">
                        <dt className="text-label text-fg-muted">
                          {item.label}
                        </dt>
                        <dd className="break-words text-title font-semibold tabular-nums text-fg-default">
                          {item.value}
                        </dd>
                        {item.detail && (
                          <dd className="text-label text-fg-subtle">
                            {item.detail}
                          </dd>
                        )}
                      </div>
                    ))}
                  </dl>
                  <Tabs
                    value={mode}
                    variant="segment"
                    color="default"
                    onValueChange={(value) => {
                      const next =
                        value === "per-run" ? "per-run" : "cumulative";
                      if (suppliedMode === undefined) setMode(next);
                      onModeChange?.(next);
                    }}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                      <TabsList aria-label={labels.chartMode}>
                        <TabItem value="per-run" label={labels.perRun} />
                        <TabItem value="cumulative" label={labels.cumulative} />
                      </TabsList>
                      <span className="flex items-center gap-2 text-label text-fg-subtle">
                        <span
                          className="h-0.5 w-4 rounded-full"
                          style={{ backgroundColor: chartColor(1) }}
                        />
                        {mode === "cumulative"
                          ? labels.cumulative
                          : labels.perRun}
                      </span>
                    </div>
                    {(["cumulative", "per-run"] as const).map((value) => (
                      <TabPanel key={value} value={value}>
                        {mode === value && (
                          <AgentRunsChart
                            data={data}
                            mode={mode}
                            labels={labels}
                            format={format}
                            selectedId={expandedId}
                            onSelect={selectRun}
                          />
                        )}
                      </TabPanel>
                    ))}
                  </Tabs>
                  <p className="text-label text-fg-subtle">
                    {labels.durationHint}
                    {summary.unreported > 0 || summary.active > 0
                      ? ` · ${labels.reportedOnly}`
                      : ""}
                  </p>
                  <div className="grid gap-6 border-y-hairline border-border-subtle py-5 @2xl/agent-runs:grid-cols-2 @2xl/agent-runs:gap-10">
                    {(["agent", "model"] as const).map((kind) => {
                      const items = (
                        kind === "agent" ? data.agents : data.models
                      ).map((item) => ({
                        id: item.id,
                        label: item.name,
                        color: chartColor(item.colorIndex),
                        value:
                          (kind === "agent"
                            ? summary.agentCosts
                            : summary.modelCosts
                          ).get(item.id) ?? 0,
                      }));
                      const title =
                        kind === "agent" ? labels.byAgent : labels.byModel;
                      return (
                        <div key={kind} className="min-w-0 space-y-3">
                          <h3 className="text-label font-medium text-fg-muted">
                            {title}
                          </h3>
                          <SegmentedBar
                            mode="distribution"
                            segments={items.map((item) => ({
                              ...item,
                              value: hasReportedUsage ? item.value : null,
                            }))}
                            valueText={`${title} · ${hasReportedUsage ? format.money(summary.cost) : labels.unreported}`}
                          />
                          <ChartLegend
                            className="flex flex-wrap gap-x-5 gap-y-2"
                            items={items.map((item) => ({
                              ...item,
                              value: hasReportedUsage
                                ? format.money(item.value)
                                : "—",
                              ratio:
                                summary.cost > 0
                                  ? format.percent(item.value / summary.cost)
                                  : "—",
                            }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <AgentRunsSessions
                    data={data}
                    runs={runs}
                    labels={labels}
                    format={format}
                    expandedId={expandedId}
                    onToggle={toggleRun}
                    pagination={pagination}
                    onPaginationChange={onPaginationChange}
                    onOpenSession={onOpenSession}
                  />
                </>
              )
            )}
          </div>
        </ContainerBody>
      </Container>
    </section>
  );
}
