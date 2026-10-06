import type { ComponentPropsWithoutRef } from "react";

export type IntegrationMonitorLifecycle = "active" | "paused" | "needs-setup";
export type IntegrationMonitorResult = "passed" | "failed" | "warning" | "unknown";
export type IntegrationMonitorCategory = "all" | "failing" | "compliant" | "inactive";
export type IntegrationMonitorAction = "details" | "assets" | "check" | "configure" | "edit" | "pause" | "resume" | "remove" | "copy";
export type IntegrationMonitorsState = "ready" | "loading" | "stale" | "error";

export interface IntegrationMonitorCheck {
  id: string;
  name: string;
  result: IntegrationMonitorResult;
  checkedAt: number | null;
}
export interface IntegrationMonitorItem {
  id: string;
  integrationId: string;
  name: string;
  description: string;
  logoSrc?: string;
  lifecycle: IntegrationMonitorLifecycle;
  assetCount: number | null;
  /** null means not loaded; [] means there are no checks. */
  checks: readonly IntegrationMonitorCheck[] | null;
  shareUrl?: string;
  /** Omit to allow every action for which the host supplies a callback. */
  capabilities?: readonly IntegrationMonitorAction[];
}
export interface MonitorIntegration {
  id: string;
  name: string;
  description: string;
  logoSrc?: string;
}
export interface IntegrationMonitorsSnapshot {
  scopeId: string;
  snapshotId: string;
  updatedAt: number | null;
  lastCheckedAt: number | null;
  /** Complete collection, not one page from a server query. */
  items: readonly IntegrationMonitorItem[];
  integrations: readonly MonitorIntegration[];
  mutedUntil?: number | null;
}
export interface IntegrationMonitorsQuery {
  category: IntegrationMonitorCategory;
  integrationId: string;
  lifecycle: IntegrationMonitorLifecycle | "all";
  search: string;
  pageIndex: number;
  pageSize: number;
}
export interface IntegrationMonitorsContext {
  scopeId: string;
  snapshotId: string;
}
export interface IntegrationMonitorsExportContext extends IntegrationMonitorsContext {
  query: IntegrationMonitorsQuery;
  /** All matching rows, not just the visible page. */
  items: readonly IntegrationMonitorItem[];
}
type ActionResult = void | Promise<void>;
type RowAction = (id: string, context: IntegrationMonitorsContext) => ActionResult;
export interface IntegrationMonitorsActions {
  onConnect?: (integrationId: string, context: IntegrationMonitorsContext) => ActionResult;
  onConfigure?: RowAction;
  onCheck?: RowAction;
  onPause?: RowAction;
  onResume?: RowAction;
  onEdit?: RowAction;
  onRemove?: RowAction;
  onOpenDetails?: RowAction;
  onOpenAssets?: RowAction;
  onCheckAll?: (context: IntegrationMonitorsContext) => ActionResult;
  onExport?: (context: IntegrationMonitorsExportContext) => ActionResult;
  onShare?: (context: IntegrationMonitorsContext, id?: string) => ActionResult;
  onMute?: (durationMs: number | null, context: IntegrationMonitorsContext) => ActionResult;
  onManageIntegrations?: (context: IntegrationMonitorsContext) => ActionResult;
  onRetry?: (context: { scopeId: string }) => ActionResult;
}
export interface IntegrationMonitorsLabels {
  title: string; all: string; failing: string; compliant: string; inactive: string;
  navigation: string; allIntegrations: string; integration: string; anyStatus: string; status: string;
  active: string; paused: string; "needs-setup": string; search: string; clearSearch: string;
  add: string; available: string; noAvailable: string; more: string; rowMore: string;
  details: string; assets: string; check: string; checkAll: string; configure: string; edit: string;
  pause: string; resume: string; remove: string; copy: string; share: string; export: string;
  mute: string; unmute: string; muted: string; manage: string;
  checks: string; passed: string; failed: string; warning: string; unknown: string;
  allPassed: string; failureSummary: string; incomplete: string; noChecks: string; notConfigured: string; pausedHistory: string;
  lastChecked: string; neverChecked: string; unclassified: string; matching: string;
  loading: string; error: string; stale: string; refreshing: string; retry: string;
  empty: string; noMatches: string; reset: string; operationError: string; copied: string;
  previous: string; next: string; page: string; pages: string;
}
export interface IntegrationMonitorsProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "title"> {
  scopeId: string;
  data: IntegrationMonitorsSnapshot | null;
  state?: IntegrationMonitorsState;
  refreshing?: boolean;
  retainDataOnError?: boolean;
  statusMessage?: string;
  query?: IntegrationMonitorsQuery;
  defaultQuery?: Partial<IntegrationMonitorsQuery>;
  onQueryChange?: (query: IntegrationMonitorsQuery) => void;
  actions?: IntegrationMonitorsActions;
  shareUrl?: string;
  title?: string;
  labels?: Partial<IntegrationMonitorsLabels>;
  locale?: string;
  timeZone?: string;
  /** Explicit clock for relative dates and mute expiry. No clock is fabricated internally. */
  now?: number;
}
