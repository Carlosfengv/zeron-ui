import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { ChartColorIndex } from "@zeron/ui/chart-primitives";

export interface CreditTopUpUsage {
  id: string;
  label: string;
  /** Current billing-period usage; independent of the recent activity total. */
  periodCredits: number;
  recentCredits: number;
  description?: string;
  icon?: ReactNode;
  /** Stable chart-palette index (1–7), shared by the category title, chart, allocation and legend. */
  colorIndex: ChartColorIndex;
  chart: "stem" | "area" | "bar";
  history: readonly { label: string; value: number }[];
}

export interface CreditTopUpPackage {
  id: string;
  credits: number;
  /** Host-provided price in major currency units, e.g. 10 for $10. */
  price: number;
  currency: string;
  disabled?: boolean;
}

export interface CreditTopUpData {
  periodLabel: string;
  totalCredits: number;
  averageDailyUsage: number;
  /** Epoch milliseconds; forecasts use this snapshot, never the browser clock. */
  snapshotAt: number;
  resetsAt: number;
  usage: readonly CreditTopUpUsage[];
  packages: readonly CreditTopUpPackage[];
}

export interface CreditTopUpLabels {
  title: string;
  activity: string;
  credits: string;
  remaining: string;
  packages: string;
  cancel: string;
  selectPackage: string;
  loading: string;
  emptyUsage: string;
  emptyHistory: string;
  emptyPackages: string;
  invalid: string;
  loadError: string;
  confirmError: string;
  retry: string;
  lessThanDay: string;
  historyColumn: string;
  usedIn: (period: string) => string;
  usageTotal: (used: string, total: string) => string;
  forecast: (daily: string, runsOut: string, resets: string) => ReactNode;
  sufficient: (daily: string, resets: string) => ReactNode;
  idle: (resets: string) => ReactNode;
  packageCredits: (credits: string) => string;
  coverage: (days: string, pastReset: boolean) => string;
  confirm: (credits: string, price: string) => string;
}

export interface CreditTopUpProps extends Omit<ComponentPropsWithoutRef<"section">, "children" | "onChange"> {
  data: CreditTopUpData;
  locale?: string;
  /** Used for billing dates; defaults to UTC. */
  timeZone?: string;
  labels?: Partial<CreditTopUpLabels>;
  packageId?: string;
  defaultPackageId?: string;
  onPackageChange?: (packageId: string) => void;
  /** Resolve after checkout handoff; reject to show a retryable error. No payment is made by the block. */
  onConfirm?: (selectedPackage: CreditTopUpPackage) => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  state?: "ready" | "loading" | "error";
  errorMessage?: string;
  onRetry?: () => void;
}
