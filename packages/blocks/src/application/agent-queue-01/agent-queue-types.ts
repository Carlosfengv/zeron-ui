import type { ReactNode } from "react";

export type AgentQueueJobKind = "llm" | "tool" | "agent" | "human";
export type AgentQueueJobStatus = "queued" | "running" | "done" | "failed";
export type AgentQueuePriority = "high" | "normal" | "low";

export interface AgentQueueJob {
  id: string;
  name: string;
  kind: AgentQueueJobKind;
  status: AgentQueueJobStatus;
  enqueuedAt: number;
  startedAt?: number;
  endedAt?: number;
  worker?: string;
  priority?: AgentQueuePriority;
  /** Optional sort key within the same priority group. Lower values are first. */
  queueOrder?: number;
  /** A fraction from 0 to 1. When absent, `estimate` can drive the bar. */
  progress?: number;
  /** Estimated execution time in milliseconds. */
  estimate?: number;
  attempt?: number;
  maxAttempts?: number;
  detail?: ReactNode;
  icon?: ReactNode;
  error?: string;
}

export interface AgentQueueWorker {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface AgentQueueRateLimit {
  from: number;
  until: number;
  label?: string;
}

export interface AgentQueueDepthSample {
  at: number;
  depth: number;
}

export interface AgentQueueLabels {
  title: string;
  waiting: string;
  running: string;
  workers: string;
  throughput: string;
  perMinute: string;
  waitP95: string;
  done: string;
  failed: string;
  live: string;
  idle: string;
  empty: string;
  unassigned: string;
  paused: string;
  pause: string;
  resume: string;
  increase: string;
  decrease: string;
  depth: string;
  now: string;
  position: string;
  priority: string;
  attempt: string;
  promote: string;
  cancel: string;
  closeDetails: string;
  kinds: Record<AgentQueueJobKind, string>;
  priorities: Record<AgentQueuePriority, string>;
  duration: (milliseconds: number) => string;
  ago: (duration: string) => string;
  outOf: (value: number, total: number) => string;
  rateLimited: (remaining: string) => string;
  rateLimitLifted: string;
  backpressure: (depth: number) => string;
  failures: (total: number) => string;
  retry: (attempt: number) => string;
  depthSummary: (waiting: number, peak: number, rateLimits: number) => string;
}

export interface AgentQueueProps {
  jobs: readonly AgentQueueJob[];
  workers: readonly AgentQueueWorker[];
  /** Time in milliseconds on the same clock as the jobs, events and samples. */
  now?: number;
  paused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  onConcurrencyChange?: (workers: number) => void;
  minConcurrency?: number;
  maxConcurrency?: number;
  rateLimits?: readonly AgentQueueRateLimit[];
  backpressure?: number;
  /** Length of the history window in milliseconds. Defaults to two minutes. */
  windowMs?: number;
  /** Supply samples when `jobs` holds a partial history. Otherwise depth is derived from job timings. */
  depthHistory?: readonly AgentQueueDepthSample[];
  totals?: { done: number; failed: number };
  openId?: string | null;
  defaultOpenId?: string | null;
  onOpenChange?: (id: string | null, job?: AgentQueueJob) => void;
  onPromote?: (job: AgentQueueJob) => void;
  onCancel?: (job: AgentQueueJob) => void;
  title?: string;
  name?: string;
  labels?: Partial<AgentQueueLabels>;
  className?: string;
}
