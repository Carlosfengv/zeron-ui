import type { ComponentPropsWithoutRef } from "react";

export type SupportAnalyticsRange = "this-week" | "last-30-days" | "last-12-weeks";
export type SupportAnalyticsChannel = "all" | "email" | "live-chat" | "in-app" | "social";
export type SupportAnalyticsView = "all" | "open" | "resolved";
export type SupportAnalyticsState = "ready" | "loading" | "stale" | "error";
export interface SupportAnalyticsQuery { range: SupportAnalyticsRange; channel: SupportAnalyticsChannel }
export interface SupportTicket {
  id: string;
  number: string;
  customer: string;
  subject: string;
  channel: Exclude<SupportAnalyticsChannel, "all">;
  status: "open" | "resolved";
  priority: "low" | "normal" | "urgent";
  createdAt: number;
  avatarUrl?: string;
  canResolve?: boolean;
}
export interface SupportAnalyticsBucket { start: number; end: number; count: number | null }
export interface SupportAnalyticsMetric {
  id: "first-reply" | "resolution" | "first-contact" | "waiting" | "sla-breach" | "reopened";
  value: number | null;
  previousValue: number | null;
  unit: "milliseconds" | "ratio";
  sampleSize: number | null;
  aggregation: "mean" | "ratio";
  target: number | null;
  improvementDirection: "higher" | "lower";
  comparison: "relative" | "percentage-points";
  trend: readonly { timestamp: number; value: number | null }[];
}
export interface SupportAnalyticsSnapshot extends SupportAnalyticsQuery {
  id: string;
  revision: string;
  scopeId: string;
  window: { start: number; end: number; observedThrough: number; bucketMs: number };
  previousWindow: { start: number; end: number };
  updatedAt: number;
  total: number | null;
  previousTotal: number | null;
  counts: { open: number | null; resolved: number | null };
  buckets: readonly SupportAnalyticsBucket[];
  views: Partial<Record<SupportAnalyticsView, { metrics: readonly SupportAnalyticsMetric[]; recentTickets: readonly SupportTicket[] }>>;
}
export interface SupportAnalyticsActionContext extends SupportAnalyticsQuery {
  scopeId: string;
  snapshotId: string;
  revision: string;
  view: SupportAnalyticsView;
}
export interface SupportAnalyticsTicketContext extends SupportAnalyticsActionContext { ticketId: string }
export interface SupportAnalyticsActions {
  onRefresh?: (context: SupportAnalyticsActionContext) => void | Promise<void>;
  onRetry?: (query: SupportAnalyticsQuery & { scopeId: string }) => void | Promise<void>;
  onExport?: (context: SupportAnalyticsActionContext) => void | Promise<void>;
  onOpenQueue?: (context: SupportAnalyticsActionContext) => void | Promise<void>;
  onOpenTicket?: (context: SupportAnalyticsTicketContext) => void | Promise<void>;
  onResolveTicket?: (context: SupportAnalyticsTicketContext) => void | Promise<void>;
}
export type SupportAnalyticsLabels = Record<
  "title" | "description" | "range" | "this-week" | "last-30-days" | "last-12-weeks" |
  "all" | "email" | "live-chat" | "in-app" | "social" | "open" | "resolved" |
  "channels" | "views" | "total" | "compare" | "average" | "trend" | "actual" | "previous" |
  "first-reply" | "resolution" | "first-contact" | "waiting" | "sla-breach" | "reopened" |
  "target" | "met" | "missed" | "samples" | "recent" | "low" | "normal" | "urgent" |
  "more" | "refresh" | "export" | "queue" | "details" | "resolve" | "resolving" |
  "updated" | "loading" | "refreshing" | "stale" | "error" | "actionError" | "retry" |
  "empty" | "noTickets" | "unknown" | "incomplete" | "values" | "date" | "count" | "points",
  string
>;
export interface SupportAnalyticsProps extends Omit<ComponentPropsWithoutRef<"div">, "title">, SupportAnalyticsQuery {
  scopeId: string;
  data: SupportAnalyticsSnapshot | null;
  onRangeChange: (range: SupportAnalyticsRange) => void;
  onChannelChange: (channel: SupportAnalyticsChannel) => void;
  view?: SupportAnalyticsView;
  defaultView?: SupportAnalyticsView;
  onViewChange?: (view: SupportAnalyticsView) => void;
  ticketsExpanded?: boolean;
  defaultTicketsExpanded?: boolean;
  onTicketsExpandedChange?: (expanded: boolean) => void;
  state?: SupportAnalyticsState;
  refreshing?: boolean;
  retainDataOnError?: boolean;
  statusMessage?: string;
  actions?: SupportAnalyticsActions;
  labels?: Partial<SupportAnalyticsLabels>;
  locale?: string;
  timeZone?: string;
  now?: number;
}
