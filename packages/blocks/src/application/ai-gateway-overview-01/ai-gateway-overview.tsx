"use client";

import type { ReactNode } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Card, CardContent, CardHeader } from "@zeron/ui/card";
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
} from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { MetricCard } from "@zeron/ui/metric-card";
import {
  PageActions,
  PageBody,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageLayout,
  PageTitle,
} from "@zeron/ui/page-layout";
import { SidebarProvider, SidebarTrigger } from "@zeron/ui/sidebar";
import { Skeleton } from "@zeron/ui/skeleton";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import {
  AiGatewayWorkspaceSidebar,
  resolveAiGatewaySidebarConfig,
} from "../ai-gateway-workspace-sidebar";
import {
  CostBarChart,
  ErrorRateChart,
  LatencyDistributionChart,
  LatencySparkline,
  MetricSeriesChart,
  ProviderCostDonut,
  ProviderRequestsChart,
  RequestsAreaChart,
  TokensAreaChart,
  providerColors,
} from "./ai-gateway-overview-charts";
import type {
  AiGatewayMetricSeries,
  AiGatewayOverviewLabels,
  AiGatewayOverviewProps,
  AiGatewayOverviewRange,
  AiGatewayProviderUsage,
  AiGatewaySlowOperation,
  AiGatewayTopUser,
} from "./ai-gateway-overview-types";

const defaultLabels: AiGatewayOverviewLabels = {
  title: "Overview",
  description: "Monitor AI gateway traffic, spend, latency, tokens, and reliability.",
  rangeLabel: "Time range",
  refresh: "Refresh metrics",
  requests: "Requests",
  totalCost: "Total cost",
  p95Latency: "p95 latency",
  tokens: "Tokens",
  errorRate: "Error rate",
  inputTokens: "Input",
  outputTokens: "Output",
  requestsOverTime: "Requests over time",
  costOverTime: "Cost over time",
  tokensOverTime: "Tokens over time",
  requestsByProvider: "Requests by provider",
  latencyOverTime: "p95 latency",
  errorsOverTime: "Error rate",
  metricSeries: "Metric series",
  metricSeriesDescription: "Key operational signals reported by the gateway.",
  latencyDistribution: "Latency distribution",
  costByProvider: "Cost by provider",
  slowestOperations: "Slowest operations",
  topUsers: "Top users",
  noUsersTitle: "No user attribution yet",
  noUsersDescription: "User-level usage appears here when identity metadata is available.",
  noDataTitle: "No gateway data",
  noDataDescription: "There is no telemetry for the selected time range.",
  errorTitle: "Gateway metrics could not be loaded.",
  retry: "Retry",
  unavailable: "Unavailable",
  requestsUnit: "requests",
  lastWindow: "Selected window",
  peakPerDay: "Peak per interval",
};

const rangeLabels: Record<AiGatewayOverviewRange, string> = {
  "1d": "1d",
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
};

function formatter(locale: string, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options);
}

function DashboardCard({
  children,
  className,
  description,
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title: string;
}) {
  return (
    <Card className={cn("min-w-0 rounded-2xl bg-hover pb-4", className)}>
      <CardHeader className="gap-1 px-4 pt-4">
        <h2 className="text-body font-medium text-fg-default">{title}</h2>
        {description ? <div className="text-label text-fg-muted">{description}</div> : null}
      </CardHeader>
      <CardContent className="min-w-0 px-4 pt-4">{children}</CardContent>
    </Card>
  );
}

function SummaryTile({
  icon,
  label,
  meta,
  tone = "default",
  value,
}: {
  icon: IconName | "currency";
  label: string;
  meta?: string;
  tone?: "default" | "critical";
  value: ReactNode;
}) {
  const FallbackIcon = useIcon(icon === "currency" ? "circle" : icon);

  return (
    <section className="flex min-w-0 flex-col rounded-2xl bg-hover p-4">
      <MetricCard
        className="w-full border-0 bg-transparent p-0 shadow-none"
        label={label}
        labelClassName="text-label font-medium"
        leading={
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-floating text-label font-medium text-fg-default">
            {icon === "currency" ? "$" : <FallbackIcon aria-hidden size={16} strokeWidth={1.5} />}
          </span>
        }
        meta={meta}
        tone={tone}
        value={value}
      />
    </section>
  );
}

function MetricPanel({
  locale,
  metric,
  timeZone,
}: {
  locale: string;
  metric: AiGatewayMetricSeries;
  timeZone: string;
}) {
  const value = metric.currentValue === null
    ? "—"
    : `${formatter(locale, { maximumFractionDigits: 1 }).format(metric.currentValue)}${metric.unit}`;

  return (
    <Card className="min-w-0 rounded-xl bg-surface-floating pb-3">
      <CardHeader className="px-3 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-label font-medium text-fg-default">{metric.label}</h3>
            <p className="mt-0.5 text-label text-fg-subtle">{metric.aggregation}</p>
          </div>
          <span className="shrink-0 text-body font-medium tabular-nums text-fg-default">{value}</span>
        </div>
      </CardHeader>
      <CardContent className="px-3 pt-2">
        <MetricSeriesChart locale={locale} metric={metric} timeZone={timeZone} />
      </CardContent>
    </Card>
  );
}

function LoadingDashboard() {
  return (
    <div aria-label="Loading gateway overview" className="grid gap-4" role="status">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="rounded-2xl bg-hover p-4" key={index}>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="mt-5 h-9 w-24" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>
      {Array.from({ length: 5 }, (_, index) => (
        <div className="rounded-2xl bg-hover p-4" key={index}>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-5 h-52 w-full" />
        </div>
      ))}
    </div>
  );
}

function DataRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring" onClick={onClick} type="button">
        {children}
      </button>
    );
  }

  return <div className="flex items-center justify-between gap-3 px-2 py-2">{children}</div>;
}

function ProviderCostList({
  formatCost,
  onSelect,
  providers,
}: {
  formatCost: (value: number) => string;
  onSelect?: (providerId: string) => void;
  providers: AiGatewayProviderUsage[];
}) {
  return (
    <div className="grid gap-1">
      {providers.map((provider, index) => (
        <DataRow key={provider.id} onClick={onSelect ? () => onSelect(provider.id) : undefined}>
          <span className="flex min-w-0 items-center gap-2 text-body text-fg-muted">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: providerColors[index % providerColors.length] }} />
            <span className="truncate">{provider.name}</span>
          </span>
          <span className="shrink-0 text-body font-medium tabular-nums text-fg-default">{formatCost(provider.costMicros)}</span>
        </DataRow>
      ))}
    </div>
  );
}

function OperationsList({
  formatLatency,
  onSelect,
  operations,
}: {
  formatLatency: (value: number | null) => string;
  onSelect?: (operationId: string) => void;
  operations: AiGatewaySlowOperation[];
}) {
  return (
    <div className="divide-y divide-border">
      {operations.map((operation) => (
        <DataRow key={operation.id} onClick={onSelect ? () => onSelect(operation.id) : undefined}>
          <span className="min-w-0">
            <span className="block truncate text-body font-medium text-fg-default">{operation.name}</span>
            <span className="mt-0.5 block text-label text-fg-muted">{operation.kind}</span>
          </span>
          <Badge color="orange" size="sm">{formatLatency(operation.p95LatencyMs)}</Badge>
        </DataRow>
      ))}
    </div>
  );
}

function UsersList({
  labels,
  onSelect,
  users,
}: {
  labels: AiGatewayOverviewLabels;
  onSelect?: (userId: string) => void;
  users: AiGatewayTopUser[];
}) {
  if (users.length === 0) {
    return (
      <Empty className="min-h-44" density="compact" reason="no-data" scope="inline">
        <EmptyMedia variant="illustration"><EmptyIllustration variant="analytics" /></EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{labels.noUsersTitle}</EmptyTitle>
          <EmptyDescription>{labels.noUsersDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="divide-y divide-border">
      {users.map((user) => (
        <DataRow key={user.id} onClick={onSelect ? () => onSelect(user.id) : undefined}>
          <span className="truncate text-body text-fg-default">{user.label}</span>
          <span className="text-body font-medium tabular-nums text-fg-default">{user.requestCount}</span>
        </DataRow>
      ))}
    </div>
  );
}

export function AiGatewayOverview({
  actions,
  availableRanges = ["1d", "7d", "30d", "90d"],
  className,
  data,
  error,
  labels: labelsProp,
  locale = "en-US",
  range,
  sidebar: sidebarProp,
  status = "ready",
  timeZone,
  ...props
}: AiGatewayOverviewProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const RefreshIcon = useIcon("rotate-ccw");
  const OverviewIcon = useIcon("home");
  const sidebarConfig = resolveAiGatewaySidebarConfig(sidebarProp);
  const resolvedTimeZone = timeZone ?? data?.window.timeZone ?? "UTC";
  const compact = formatter(locale, { notation: "compact", maximumFractionDigits: 1 });
  const percent = formatter(locale, { style: "percent", maximumFractionDigits: 1 });
  const money = data
    ? formatter(locale, { style: "currency", currency: data.window.currency, maximumFractionDigits: 2 })
    : formatter(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  const formatCost = (micros: number) => money.format(micros / 1_000_000);
  const formatLatency = (value: number | null) => {
    if (value === null) return labels.unavailable;
    return value >= 1000 ? `${formatter(locale, { maximumFractionDigits: 2 }).format(value / 1000)}s` : `${Math.round(value)}ms`;
  };

  const pageIntro = (
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-3 pb-1 max-sm:flex-col">
      <div className="min-w-0">
        <PageTitle className="text-heading font-semibold">{labels.title}</PageTitle>
        <PageDescription>{labels.description}</PageDescription>
      </div>
      <PageActions>
        <Tabs
          onValueChange={(value) => actions?.onRangeChange?.(value as AiGatewayOverviewRange)}
          value={range}
          variant="pill"
        >
          <TabsList activationMode="manual" aria-label={labels.rangeLabel}>
            {availableRanges.map((item) => (
              <TabItem
                disabled={!actions?.onRangeChange}
                key={item}
                label={rangeLabels[item]}
                value={item}
              />
            ))}
          </TabsList>
        </Tabs>
        {actions?.onRefresh ? (
          <Button
            aria-label={labels.refresh}
            iconOnly
            loading={status === "refreshing"}
            onClick={actions.onRefresh}
            size="sm"
            type="button"
            variant="tertiary"
          >
            <RefreshIcon aria-hidden />
          </Button>
        ) : null}
      </PageActions>
    </header>
  );

  const dashboard = status === "loading" && !data ? (
    <LoadingDashboard />
  ) : !data && status === "error" ? (
    <Empty reason="no-data" scope="page">
      <EmptyMedia variant="illustration"><EmptyIllustration variant="analytics" /></EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{labels.errorTitle}</EmptyTitle>
        <EmptyDescription>{error ?? labels.noDataDescription}</EmptyDescription>
      </EmptyHeader>
      {actions?.onRetry ? <EmptyActions><Button onClick={actions.onRetry}>{labels.retry}</Button></EmptyActions> : null}
    </Empty>
  ) : data ? (
    <div className="grid gap-4">
      {status === "error" ? (
        <InlineNotice role="alert" tone="danger" variant="emphasized">
          <InlineNoticeContent>{error ?? labels.errorTitle}</InlineNoticeContent>
        </InlineNotice>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] gap-3">
        <SummaryTile icon="rocket" label={labels.requests} meta={labels.lastWindow} value={compact.format(data.summary.requests)} />
        <SummaryTile icon="currency" label={labels.totalCost} meta={data.window.currency} value={formatCost(data.summary.costMicros)} />
        <SummaryTile icon="clock" label={labels.p95Latency} meta={labels.lastWindow} value={formatLatency(data.summary.p95LatencyMs)} />
        <SummaryTile icon="hash" label={labels.tokens} meta={`${labels.inputTokens} + ${labels.outputTokens}`} value={compact.format(data.summary.inputTokens + data.summary.outputTokens)} />
        <SummaryTile icon="circle-x" label={labels.errorRate} meta={`${compact.format(data.summary.errors)} errors`} tone={data.summary.errorRate > 0.1 ? "critical" : "default"} value={percent.format(data.summary.errorRate)} />
      </div>

      <DashboardCard description={`${compact.format(data.summary.requests)} ${labels.requestsUnit}`} title={labels.requestsOverTime}>
        <RequestsAreaChart data={data.timeSeries} label={labels.requests} locale={locale} timeZone={resolvedTimeZone} />
      </DashboardCard>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <DashboardCard description={formatCost(data.summary.costMicros)} title={labels.costOverTime}>
          <CostBarChart data={data.timeSeries} formatCost={formatCost} label={labels.totalCost} locale={locale} timeZone={resolvedTimeZone} />
        </DashboardCard>
        <DashboardCard description={compact.format(data.summary.inputTokens + data.summary.outputTokens)} title={labels.tokensOverTime}>
          <TokensAreaChart data={data.timeSeries} labels={{ input: labels.inputTokens, output: labels.outputTokens }} locale={locale} timeZone={resolvedTimeZone} />
        </DashboardCard>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <DashboardCard title={labels.requestsByProvider}>
          <ProviderRequestsChart data={data.providers} label={labels.requests} locale={locale} />
        </DashboardCard>
        <DashboardCard description={formatLatency(data.summary.p95LatencyMs)} title={labels.latencyOverTime}>
          <LatencySparkline data={data.timeSeries} formatLatency={formatLatency} label={labels.p95Latency} locale={locale} timeZone={resolvedTimeZone} />
        </DashboardCard>
        <DashboardCard description={percent.format(data.summary.errorRate)} title={labels.errorsOverTime}>
          <ErrorRateChart data={data.timeSeries} label={labels.errorRate} locale={locale} timeZone={resolvedTimeZone} />
        </DashboardCard>
      </div>

      <DashboardCard description={labels.metricSeriesDescription} title={labels.metricSeries}>
        <div className="grid min-w-0 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {data.metrics.map((metric) => <MetricPanel key={metric.id} locale={locale} metric={metric} timeZone={resolvedTimeZone} />)}
        </div>
      </DashboardCard>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <DashboardCard title={labels.latencyDistribution}>
          <LatencyDistributionChart
            buckets={data.latencyDistribution}
            percentiles={{ p50: data.summary.p50LatencyMs, p95: data.summary.p95LatencyMs, p99: data.summary.p99LatencyMs }}
            requestLabel={labels.requests}
          />
        </DashboardCard>
        <DashboardCard title={labels.costByProvider}>
          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
            <ProviderCostDonut className="h-44" data={data.providers} formatCost={formatCost} />
            <ProviderCostList formatCost={formatCost} onSelect={actions?.onProviderSelect} providers={data.providers} />
          </div>
        </DashboardCard>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <DashboardCard title={labels.slowestOperations}>
          <OperationsList formatLatency={formatLatency} onSelect={actions?.onOperationSelect} operations={data.slowestOperations} />
        </DashboardCard>
        <DashboardCard title={labels.topUsers}>
          <UsersList labels={labels} onSelect={actions?.onUserSelect} users={data.topUsers} />
        </DashboardCard>
      </div>
    </div>
  ) : (
    <Empty reason="no-data" scope="page">
      <EmptyMedia variant="illustration"><EmptyIllustration variant="analytics" /></EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{labels.noDataTitle}</EmptyTitle>
        <EmptyDescription>{labels.noDataDescription}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );

  const content = (
    <section
      className={cn("flex h-full min-h-[42rem] min-w-0 overflow-hidden bg-surface-base", className)}
      {...props}
    >
      {sidebarConfig ? (
        <AiGatewayWorkspaceSidebar actions={actions} config={sidebarConfig} />
      ) : null}

      <PageLayout
        aria-busy={status === "loading" || status === "refreshing"}
        className="h-full min-w-0 flex-1"
        size="full"
      >
        <PageHeader className="h-control-sm py-0 max-sm:flex-row">
          <div className="flex h-full min-w-0 items-center gap-2">
            {sidebarConfig ? <SidebarTrigger className="shrink-0 xl:hidden" label="Open AI gateway navigation" size="xs" /> : null}
            <PageHeaderContent className="h-full" icon={OverviewIcon}>
              <nav aria-label="Current location" className="text-body font-medium text-fg-default">{labels.title}</nav>
            </PageHeaderContent>
          </div>
        </PageHeader>
        <PageContent className="overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl">
          <PageBody className="max-w-[1620px] flex-none overflow-visible overscroll-auto p-4 sm:p-5">
            <div className="grid gap-4 pb-20" id="overview">
              {pageIntro}
              {dashboard}
            </div>
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );

  return sidebarConfig ? (
    <SidebarProvider breakpointBehavior="drawer">{content}</SidebarProvider>
  ) : content;
}
