import type { ReactNode } from "react";

export type FallbackAttemptStatus = "waiting" | "trying" | "failed" | "answered" | "skipped";

export interface FallbackChainDetail {
  label: string;
  value: string;
}

export interface FallbackChainEnd {
  name: string;
  icon?: ReactNode;
  text?: string;
  details?: readonly FallbackChainDetail[];
}

export interface FallbackAttempt {
  id: string;
  model: string;
  provider?: string;
  region?: string;
  icon?: ReactNode;
  providerIcon?: ReactNode;
  status: FallbackAttemptStatus;
  reason?: string;
  /** Unix timestamp in milliseconds. Used to time a running attempt. */
  startedAt?: number;
  durationMs?: number;
  timeoutMs?: number;
  costUsd?: number;
  outputTokens?: number;
  details?: readonly FallbackChainDetail[];
}

export interface FallbackChainLabels extends Record<FallbackAttemptStatus, string> {
  request: string;
  response: string;
  responseWaiting: string;
  exhausted: string;
  noAttempts: string;
  upNext: string;
  retry: string;
  models: string;
  model: string;
  time: string;
  cost: string;
  attempts: string;
  totalTime: string;
  totalCost: string;
  output: string;
  why: string;
  attempt: (current: number, total: number) => string;
  attemptCount: (current: number, total: number) => string;
  tokens: (formattedCount: string) => string;
  fromModel: (model: string) => string;
  duration: (formattedValue: string, unit: "ms" | "s") => string;
  timeBudget: (elapsed: string | undefined, limit: string) => string;
}

export interface FallbackChainProps {
  /** Attempts in routing order, with an ID that is stable across updates. */
  attempts: readonly FallbackAttempt[];
  title?: string;
  route?: string;
  request?: FallbackChainEnd;
  response?: FallbackChainEnd;
  /** Override the running clock with a Unix timestamp in milliseconds. */
  now?: number;
  /** Called when the route is exhausted and the user requests another run. */
  onRetry?: () => void;
  labels?: FallbackChainLabels;
  locale?: string;
  className?: string;
}
