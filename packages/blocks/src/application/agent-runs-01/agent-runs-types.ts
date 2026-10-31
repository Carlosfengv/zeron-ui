import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { ChartColorIndex } from "@zeron/ui/chart-primitives";

export type AgentRunStatus = "running" | "completed" | "cancelled" | "failed";
export type AgentRunsMode = "cumulative" | "per-run";
export type AgentRunUsageKind = "input" | "output" | "cacheRead" | "cacheWrite";
export interface AgentRunUsage {
  tokens: number;
  cost: number;
}
export interface AgentRunsAgent {
  id: string;
  name: string;
  colorIndex: Exclude<ChartColorIndex, 6 | 7>;
  avatar?: ReactNode;
}
export interface AgentRunsModel {
  id: string;
  name: string;
  colorIndex: Exclude<ChartColorIndex, 6 | 7>;
}
export interface AgentRun {
  id: string;
  trigger: string;
  agentId: string;
  modelId?: string;
  status: AgentRunStatus;
  /** Epoch milliseconds. A running session ends visually at data.end. */
  startedAt: number;
  endedAt: number | null;
  /** Null means not yet reported; never interpreted as a zero-cost session. */
  usage: Record<AgentRunUsageKind, AgentRunUsage> | null;
  /** Optional savings supplied by the billing service, in major currency units. */
  cacheSavings?: number;
}
export interface AgentRunsData {
  /** Stable project/window identity; change this to reset local disclosures. */
  id: string;
  project: { name: string; identifier?: string };
  currency: string;
  /** Complete reporting window, in epoch milliseconds. */
  start: number;
  end: number;
  agents: readonly AgentRunsAgent[];
  models: readonly AgentRunsModel[];
  /** Complete sessions for this window. All displayed totals derive from these records. */
  runs: readonly AgentRun[];
}
export interface AgentRunsLabels {
  title: string;
  spent: string;
  tokens: string;
  output: string;
  agentTime: string;
  sessions: string;
  fromCache: (percent: string) => string;
  elapsed: (duration: string) => string;
  runCount: (count: string) => string;
  runStates: (active: string, cancelled: string) => string;
  duration: (hours: string, minutes: string) => string;
  underMinute: string;
  cumulative: string;
  perRun: string;
  chartTitle: string;
  chartMode: string;
  activity: string;
  durationHint: string;
  byAgent: string;
  byModel: string;
  time: string;
  trigger: string;
  agent: string;
  model: string;
  durationColumn: string;
  cost: string;
  status: string;
  running: string;
  completed: string;
  cancelled: string;
  failed: string;
  costBreakdown: string;
  input: string;
  cacheRead: string;
  cacheWrite: string;
  total: string;
  cacheHit: string;
  saved: (cost: string) => string;
  sessionTime: string;
  expand: (trigger: string) => string;
  collapse: (trigger: string) => string;
  previous: string;
  next: string;
  /** @deprecated Native DataTable pagination uses pageSummary; retained for existing label objects. */
  pagination: (from: string, to: string, total: string) => string;
  firstPage: string;
  lastPage: string;
  rowsPerPage: string;
  pageSummary: (page: string, count: string) => string;
  openSession: string;
  close: string;
  viewData: string;
  unreported: string;
  reportedOnly: string;
  loading: string;
  loadError: string;
  invalid: string;
  retry: string;
  empty: string;
  emptyDescription: string;
}
export interface AgentRunsProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  data: AgentRunsData;
  locale?: string;
  timeZone?: string;
  labels?: Partial<AgentRunsLabels>;
  mode?: AgentRunsMode;
  defaultMode?: AgentRunsMode;
  onModeChange?: (mode: AgentRunsMode) => void;
  defaultExpandedRunId?: string;
  /** Initial sessions per page, clamped to 1–100. Changes reset the table to its first page. Default: 6. */
  pageSize?: number;
  /** Optional host-owned route/navigation into a full session. */
  onOpenSession?: (run: AgentRun) => void;
  onClose?: () => void;
  state?: "ready" | "loading" | "error";
  errorMessage?: string;
  onRetry?: () => void;
}
