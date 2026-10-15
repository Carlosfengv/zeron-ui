import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type UsageForecastView = "forecast" | "table";
export type UsageForecastProvider = "anthropic" | "cursor" | "github" | "xai" | "google" | "openai";
export type UsageForecastSortKey = "account" | "used" | "pace" | "outcome" | "reset";
export interface UsageForecastSort { key: UsageForecastSortKey; direction: "asc" | "desc" }
export interface UsageForecastHistoryPoint { timestamp: number; usedPercent: number }
export interface UsageForecastDay {
  /** Stable, non-empty and unique within this account's recentUsage. */
  id: string;
  label: string;
  usedPercent: number;
}

export interface UsageForecastAccount {
  id: string;
  name: string;
  description?: string;
  provider?: UsageForecastProvider;
  logo?: ReactNode;
  usedPercent: number;
  /** Epoch milliseconds for the current quota window. */
  windowStart: number;
  resetsAt: number;
  /** Recent percentage points used per day; zero is a valid idle rate. */
  dailyRate?: number;
  status?: "ready" | "new" | "disconnected";
  history?: readonly UsageForecastHistoryPoint[];
  recentUsage?: readonly UsageForecastDay[];
}

export interface UsageForecastProjection {
  account: UsageForecastAccount;
  elapsedPercent: number;
  dailyRate: number | null;
  pace: number | null;
  projectedPercent: number | null;
  runsOutAt: number | null;
  lockedMs: number;
  allowance: number;
  available: boolean;
}

export interface UsageForecastLabels {
  title: (count: number) => string;
  summary: (name: string, time: string, duration: string) => string;
  healthySummary: string;
  pendingSummary?: string;
  forecast: string; table: string; view: string; account: string; used: string;
  pace: string; outcome: string; resets: string; now: string; reset: string;
  runsOut: string; atReset: string; locked: string; even: string;
  currentPace: string; evenPace: string; recentPace: string; perDay: string;
  allowed: (value: string) => string;
  usedIn: (used: string, elapsed: string) => string;
  projectedUse: string; under: string; newWindow: string; assumption: string;
  selectRow: string; sortHint: string; within: string; over: string;
  allowedPerDay: string; unknown: string; tooEarly: string; reconnect: string;
  empty: string; noHistory: string; noRecentUsage: string; noForecast: string;
  invalid: string; retry: string; loading: string;
  days: string; hours: string; in: string;
}

export interface UsageForecastProps extends Omit<ComponentPropsWithoutRef<"section">, "children" | "onSelect"> {
  accounts: readonly UsageForecastAccount[];
  /** Explicit snapshot time keeps server rendering and forecasts deterministic. */
  now: number;
  locale?: string;
  timeZone?: string;
  labels?: Partial<UsageForecastLabels>;
  view?: UsageForecastView;
  defaultView?: UsageForecastView;
  onViewChange?: (view: UsageForecastView) => void;
  selectedAccountId?: string;
  defaultSelectedAccountId?: string;
  onAccountSelect?: (account: UsageForecastAccount) => void;
  sort?: UsageForecastSort;
  defaultSort?: UsageForecastSort;
  onSortChange?: (sort: UsageForecastSort) => void;
  state?: "ready" | "loading" | "error";
  errorMessage?: string;
  onRetry?: () => void;
}
