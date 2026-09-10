import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import type { IconName } from "@zeron/ui/system/icon-context";

export type AiGatewayOverviewRange = "1d" | "7d" | "30d" | "90d";

export type AiGatewayOverviewStatus =
  | "ready"
  | "loading"
  | "refreshing"
  | "error";

export interface AiGatewayOverviewWindow {
  range: AiGatewayOverviewRange;
  from: string;
  to: string;
  granularity: "hour" | "day";
  timeZone: string;
  currency: string;
  generatedAt: string;
}

export interface AiGatewayOverviewSummary {
  requests: number;
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
  errors: number;
  errorRate: number;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  p99LatencyMs: number | null;
}

export interface AiGatewayTimeSeriesPoint {
  timestamp: string;
  requestCount: number;
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
  errorCount: number;
  errorRate: number | null;
  p95LatencyMs: number | null;
}

export interface AiGatewayProviderUsage {
  id: string;
  name: string;
  requestCount: number;
  costMicros: number;
}

export interface AiGatewayLatencyBucket {
  id: string;
  lowerMs: number;
  upperMs: number | null;
  count: number;
}

export interface AiGatewayMetricPoint {
  timestamp: string;
  value: number | null;
}

export interface AiGatewayMetricSeries {
  id: string;
  label: string;
  aggregation: string;
  unit: string;
  currentValue: number | null;
  points: AiGatewayMetricPoint[];
}

export interface AiGatewaySlowOperation {
  id: string;
  name: string;
  kind: string;
  p95LatencyMs: number;
}

export interface AiGatewayTopUser {
  id: string;
  label: string;
  requestCount: number;
}

export interface AiGatewayOverviewData {
  window: AiGatewayOverviewWindow;
  summary: AiGatewayOverviewSummary;
  timeSeries: AiGatewayTimeSeriesPoint[];
  providers: AiGatewayProviderUsage[];
  latencyDistribution: AiGatewayLatencyBucket[];
  metrics: AiGatewayMetricSeries[];
  slowestOperations: AiGatewaySlowOperation[];
  topUsers: AiGatewayTopUser[];
}

export interface AiGatewayOverviewLabels {
  title: string;
  description: string;
  rangeLabel: string;
  refresh: string;
  requests: string;
  totalCost: string;
  p95Latency: string;
  tokens: string;
  errorRate: string;
  inputTokens: string;
  outputTokens: string;
  requestsOverTime: string;
  costOverTime: string;
  tokensOverTime: string;
  requestsByProvider: string;
  latencyOverTime: string;
  errorsOverTime: string;
  metricSeries: string;
  metricSeriesDescription: string;
  latencyDistribution: string;
  costByProvider: string;
  slowestOperations: string;
  topUsers: string;
  noUsersTitle: string;
  noUsersDescription: string;
  noDataTitle: string;
  noDataDescription: string;
  errorTitle: string;
  retry: string;
  unavailable: string;
  requestsUnit: string;
  lastWindow: string;
  peakPerDay: string;
}

export interface AiGatewayOverviewActions {
  onRangeChange?: (range: AiGatewayOverviewRange) => void;
  onRefresh?: () => void;
  onRetry?: () => void;
  onProviderSelect?: (providerId: string) => void;
  onOperationSelect?: (operationId: string) => void;
  onUserSelect?: (userId: string) => void;
  onNavigationSelect?: (itemId: string, event: MouseEvent<HTMLAnchorElement>) => void;
  onWorkspaceSelect?: () => void;
  onAccountSelect?: () => void;
}

export interface AiGatewaySidebarNavigationItem {
  id: string;
  label: string;
  iconName: IconName;
  href?: string;
}

export interface AiGatewaySidebarNavigationGroup {
  id: string;
  label?: string;
  items: readonly AiGatewaySidebarNavigationItem[];
}

export interface AiGatewaySidebarIdentity {
  name: string;
  description?: string;
  avatarLabel?: string;
}

export interface AiGatewaySidebarConfig {
  ariaLabel: string;
  activeItem: string;
  workspace: AiGatewaySidebarIdentity;
  groups: readonly AiGatewaySidebarNavigationGroup[];
  account: AiGatewaySidebarIdentity;
}

export interface AiGatewaySidebarOptions
  extends Partial<Omit<AiGatewaySidebarConfig, "workspace" | "account">> {
  workspace?: Partial<AiGatewaySidebarIdentity>;
  account?: Partial<AiGatewaySidebarIdentity>;
}

export interface AiGatewayOverviewProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  data: AiGatewayOverviewData | null;
  range: AiGatewayOverviewRange;
  status?: AiGatewayOverviewStatus;
  error?: string;
  actions?: AiGatewayOverviewActions;
  availableRanges?: AiGatewayOverviewRange[];
  labels?: Partial<AiGatewayOverviewLabels>;
  locale?: string;
  timeZone?: string;
  /** Complete Figma-matched application navigation. Pass false only when embedding inside an existing shell. */
  sidebar?: AiGatewaySidebarOptions | false;
}
