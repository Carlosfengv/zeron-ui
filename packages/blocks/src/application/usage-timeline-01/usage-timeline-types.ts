import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { TimeWindowMarker } from "@zeron/ui/time-window-timeline";

export type UsageTimelineMode = "weekly" | "five-hour" | "cycle";
export type UsageTimelineMeasure = "used" | "left";
export interface UsageTimelineWindow {
  start: number;
  end: number;
  usedPercent: number;
  /** Real previous-window start; omitted history is not inferred. */
  previousStart?: number;
  /** Optional next reset. A next window is shown only when explicitly supplied. */
  nextEnd?: number;
}
export interface UsageTimelineLimit { id: string; label: string; usedPercent: number }
export interface UsageTimelineAccount {
  id: string;
  name: string;
  plan?: string;
  email: string;
  limits: readonly UsageTimelineLimit[];
  windows: Partial<Record<UsageTimelineMode, UsageTimelineWindow>>;
  markers?: readonly TimeWindowMarker[];
  disconnected?: boolean;
}
export interface UsageTimelineProvider {
  id: string;
  name: string;
  brand?: "openai" | "anthropic" | "xai" | "google" | "antigravity" | "cursor";
  logo?: ReactNode;
  accounts: readonly UsageTimelineAccount[];
}
export interface UsageTimelineLabels {
  title: string; account: string; limits: string; today: string; previous: string; next: string;
  period: string; weekly: string; fiveHour: string; cycle: string; measure: string; used: string; left: string;
  now: string; ended: string; nextWindow: string; currentWindow: string; timePassed: string; earlier: string;
  expiry: string; reset: string; plenty: string; low: string; out: string; disconnected: string; noWindow: string;
  empty: string; loading: string; error: string; invalid: string; retry: string;
  accountCount: (count: number) => string;
  dayCount: (count: number) => string;
}
export interface UsageTimelineProps extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  providers: readonly UsageTimelineProvider[];
  /** Explicit snapshot time, in epoch milliseconds. */
  now: number;
  locale?: string;
  timeZone?: string;
  labels?: Partial<UsageTimelineLabels>;
  mode?: UsageTimelineMode;
  defaultMode?: UsageTimelineMode;
  onModeChange?: (mode: UsageTimelineMode) => void;
  measure?: UsageTimelineMeasure;
  defaultMeasure?: UsageTimelineMeasure;
  onMeasureChange?: (measure: UsageTimelineMeasure) => void;
  /** Start of the visible 14 calendar days, or 24 hours in five-hour mode. */
  rangeStart?: number;
  defaultRangeStart?: number;
  onRangeStartChange?: (start: number) => void;
  state?: "ready" | "loading" | "error";
  errorMessage?: string;
  onRetry?: () => void;
}
