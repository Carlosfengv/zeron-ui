import type { ComponentPropsWithoutRef } from "react";

export type UsageBudgetThreshold = 50 | 80 | 100;
export interface UsageBudgetPoint { timestamp: number; value: number }
export interface UsageBudgetProjectionPoint extends UsageBudgetPoint { lower: number; upper: number }

export interface UsageBudgetMetric {
  id: string;
  label: string;
  /** Display units; numeric observations remain in these units (e.g. millions, TB, seats). */
  unit: string;
  fractionDigits: number;
  budget: number;
  history: readonly UsageBudgetPoint[];
  forecast: readonly UsageBudgetProjectionPoint[];
  /** A billing quote, independent of rounded chart observations. */
  overage: { amount: number; currency: string; rate: number; per: number };
  /** Optional stable chart bounds and ticks; must enclose all observations and the budget. */
  domain?: readonly [number, number];
  ticks?: readonly number[];
}

export interface UsageBudgetForecastData {
  organization: string;
  plan: string;
  periodStart: number;
  periodEnd: number;
  renewsAt: number;
  now: number;
  metrics: readonly UsageBudgetMetric[];
}

export interface UsageBudgetForecastLabels {
  title: string;
  renews: (date: string) => string;
  metric: string;
  used: string;
  projected: (date: string) => string;
  cost: string;
  ofBudget: (percent: number) => string;
  likely: (range: string) => string;
  within: string;
  rate: (price: string, per: number, unit: string) => string;
  underTitle: string;
  expectedTitle: (date: string) => string;
  exceededTitle: (date: string) => string;
  exceededSinceTitle: (date: string) => string;
  underDescription: (value: string, date: string, percent: number, riskDate?: string) => string;
  expectedDescription: (days: number, from: string, to: string) => string;
  openRangeDescription: (days: number, from: string) => string;
  exceededDescription: (percent: number, value: string, date: string) => string;
  atBudgetDescription: (value: string, date: string) => string;
  today: string;
  budget: string;
  actual: string;
  forecast: string;
  range: string;
  over: string;
  alerts: string;
  alert: (percent: number, metric: string) => string;
  reached: (date: string) => string;
  since: (date: string) => string;
  expected: (date: string) => string;
  notExpected: string;
  chart: string;
  viewData: string;
  date: string;
  loading: string;
  empty: string;
  error: string;
  invalid: string;
  retry: string;
}

export interface UsageBudgetForecastProps extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  data: UsageBudgetForecastData;
  locale?: string;
  labels?: Partial<UsageBudgetForecastLabels>;
  metricId?: string;
  defaultMetricId?: string;
  onMetricChange?: (metricId: string) => void;
  /** Threshold subscriptions are independent for each metric. No notifications are sent by this block. */
  alerts?: Readonly<Record<string, readonly UsageBudgetThreshold[]>>;
  defaultAlerts?: Readonly<Record<string, readonly UsageBudgetThreshold[]>>;
  onAlertsChange?: (metricId: string, thresholds: UsageBudgetThreshold[]) => void;
  state?: "ready" | "loading" | "error";
  errorMessage?: string;
  onRetry?: () => void;
}
