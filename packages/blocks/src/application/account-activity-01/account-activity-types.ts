import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type AccountActivityView = "matrix" | "weeks" | "range" | "accounts";
export type AccountActivityDayType = "all" | "weekdays" | "weekends";
export interface AccountActivityAccount { id: string; name: string; logo?: ReactNode }
/** Activity intensity in the host's units. Zero is idle; null is an unavailable reading. */
export interface AccountActivitySample { accountId: string; timestamp: number; value: number | null }
export interface AccountActivityEvent { id: string; accountId: string; timestamp: number; unlockedAt: number }
export interface AccountActivityWindow {
  id: string; accountId: string; start: number; end: number; peakPercent: number | null;
  readings: readonly { timestamp: number; percent: number | null }[];
  current?: boolean;
}
export interface AccountActivityData {
  /** Epoch milliseconds; end is exclusive. Samples should use hourly buckets. */
  start: number; end: number;
  accounts: readonly AccountActivityAccount[];
  samples: readonly AccountActivitySample[];
  events: readonly AccountActivityEvent[];
  windows: readonly AccountActivityWindow[];
}
export interface AccountActivityQuery {
  view: AccountActivityView;
  accountId: string;
  dayType: AccountActivityDayType;
  range: { start: number; end: number };
  hiddenAccountIds: readonly string[];
}
export interface AccountActivityLabels {
  matrix: string; weeks: string; range: string; accounts: string; views: string;
  allAccounts: string; accountFilter: string; all: string; weekdays: string; weekends: string; dayFilter: string;
  active: string; averageActive: string; dayProfile: string; ranOut: string; locked: string; neverLocked: string;
  weekday: string; weekend: string; missing: string; quiet: string; quietActivity: string; busiestHour: string;
  typicalWeek: string; averageHour: string; night: string; peak: string; windowFilling: string;
  usageWindows: string; usageWindowsHint: string; windowPeak: string; hitLimit: string; thisWindow: string;
  selectedDays: string; selectRange: string; rangeHint: string; accountHint: string; scaleHint: string;
  empty: string; loading: string; error: string; retry: string; unknown: string;
  busiest: (time: string, day: string) => string;
  summary: (events: number, days: number, weekdayEvents: number) => string;
  rangeSummary: (accounts: number) => string;
  runOuts: (count: number) => string;
  lockedHours: (hours: string) => string;
  accountSummary: (name: string, time: string) => string;
  weekAverage: (weeks: string) => string;
}
export interface AccountActivityProps extends Omit<ComponentPropsWithoutRef<"section">, "children" | "onChange"> {
  data: AccountActivityData;
  locale?: string;
  timeZone?: string;
  labels?: Partial<AccountActivityLabels>;
  query?: AccountActivityQuery;
  defaultQuery?: Partial<AccountActivityQuery>;
  onQueryChange?: (query: AccountActivityQuery) => void;
  state?: "ready" | "loading" | "error";
  errorMessage?: string;
  onRetry?: () => void;
}
