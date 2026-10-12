import type { ComponentPropsWithoutRef } from "react";
import type { ChartColorIndex } from "@zeron/ui/chart-primitives";

export interface PlanUsagePlan {
  id: string;
  name: string;
  /** Monthly price in major currency units. */
  monthlyPrice: number;
  description: string;
  features: readonly string[];
}

export interface PlanUsageModel {
  id: string;
  name: string;
  credits: number;
  colorIndex: ChartColorIndex;
}

export interface PlanUsageDay {
  /** ISO calendar date; rendered in UTC, without a browser timezone shift. */
  date: string;
  credits: number;
  kind: "actual" | "today" | "projected";
}

export interface PlanUsageInvoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "refunded";
}

export interface PlanUsageData {
  currency: string;
  currentPlanId: string;
  renewalDate: string;
  cancelAtPeriodEnd?: boolean;
  plans: readonly PlanUsagePlan[];
  cycle: {
    startDate: string;
    endDate: string;
    includedCredits: number;
    daysUntilReset: number;
    models: readonly PlanUsageModel[];
    dailyUsage: readonly PlanUsageDay[];
    /** Host-provided projection; the block does not fabricate a forecast. */
    projection?: { credits: number; depletionDate: string; daysBeforeReset: number };
    dailyAllowance: number;
  };
  limits: {
    alertPercent: number;
    extraUsageEnabled: boolean;
    extraUsagePricePer100Credits: number;
  };
  payment?: { brand: string; last4: string; expires: string; holder: string };
  invoices: readonly PlanUsageInvoice[];
}

export interface PlanUsageActions {
  onAlertPercentChange?: (percent: number) => void;
  onExtraUsageChange?: (enabled: boolean) => void;
  onSelectPlan?: (planId: string) => void;
  onUpdatePayment?: () => void;
  onDownloadInvoice?: (invoice: PlanUsageInvoice) => void;
  onCancelPlan?: () => void;
}

export interface PlanUsageLabels {
  title: string;
  description: string;
  active: string;
  canceled: string;
  perMonth: string;
  renewal: (date: string, price: string) => string;
  usage: string;
  included: (total: string) => string;
  remaining: (credits: string, days: string) => string;
  progress: (used: string, total: string) => string;
  projected: (credits: string) => string;
  alertAt: (percent: string) => string;
  depletion: (date: string, days: string) => string;
  enableExtraUsage: string;
  seePlans: string;
  dailyUsage: string;
  today: (credits: string) => string;
  evenPace: (credits: string) => string;
  projectionNote: string;
  emptyUsage: string;
  limits: string;
  usageAlert: string;
  usageAlertDescription: string;
  extraUsage: string;
  extraUsageDescription: string;
  extraUsageNote: (price: string) => string;
  plans: string;
  current: string;
  yourPlan: string;
  downgrade: string;
  upgrade: string;
  payment: string;
  paymentCard: (brand: string, last4: string) => string;
  paymentDetails: (expires: string, holder: string) => string;
  noPayment: string;
  update: string;
  invoices: string;
  date: string;
  invoiceDescription: string;
  amount: string;
  status: string;
  paid: string;
  refunded: string;
  download: (id: string) => string;
  showOlder: (count: string) => string;
  emptyInvoices: string;
  cancelPlan: string;
  cancelDescription: (plan: string, date: string) => string;
  cancelScheduled: (plan: string, date: string) => string;
}

export interface PlanUsageProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  data: PlanUsageData;
  actions?: PlanUsageActions;
  labels?: Partial<PlanUsageLabels>;
  locale?: string;
  /** Caller owns asynchronous pending/error state and refreshed snapshots. */
  pending?: boolean;
  error?: string | null;
}
