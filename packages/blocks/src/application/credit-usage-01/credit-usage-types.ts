import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { BadgeColor } from "@zeron/ui/badge";

export type CreditUsageCycle = "current" | "previous";
export type CreditUsageOperation = "auto-switch" | "set-limit" | "upgrade";
export type CreditUsageModelProvider = "anthropic" | "google" | "openai";

export interface CreditUsageModel {
  id: string;
  name: string;
  credits: number;
  color: BadgeColor;
  /** Uses a built-in model brand mark when a custom logo is not supplied. */
  provider?: CreditUsageModelProvider;
  /** Product-owned logo for private or otherwise unsupported model providers. */
  logo?: ReactNode;
}

export interface CreditUsageProjection {
  depletesAt: string;
  daysBeforeReset: number;
}

export interface CreditUsageCycleData {
  resetAt: string;
  models: readonly CreditUsageModel[];
  projection?: CreditUsageProjection;
}

export interface CreditUsageAutoSwitch {
  targetModel: string;
  threshold: number;
  description?: string;
}

export interface CreditUsageData {
  planName: string;
  totalCredits: number;
  currentCycle: CreditUsageCycleData;
  previousCycle?: CreditUsageCycleData;
  autoSwitch?: CreditUsageAutoSwitch;
}

export interface CreditUsageActions {
  onCycleChange?: (cycle: CreditUsageCycle) => void;
  onAutoSwitchChange?: (enabled: boolean) => void | Promise<void>;
  onSetLimit?: () => void | Promise<void>;
  onUpgrade?: () => void | Promise<void>;
}

export interface CreditUsageOperationState {
  pending?: readonly CreditUsageOperation[];
  error?: string | null;
}

export interface CreditUsageLabels {
  title: string;
  currentCycle: string;
  previousCycle: string;
  creditsUsed: string;
  resets: string;
  byModel: string;
  projectedToDeplete: string;
  daysBeforeReset: string;
  autoSwitchPrefix: string;
  autoSwitchAt: string;
  autoSwitchDescription: string;
  credits: string;
  setLimit: string;
  upgrade: string;
  emptyModels: string;
}

export interface CreditUsageFormatters {
  /** Formats the visible "used of total · reset" summary as one localizable sentence. */
  usageSummary?: (values: {
    usedCredits: string;
    totalCredits: string;
    resetAt: string;
    resets: string;
  }) => string;
  /** Formats the progress bar's complete accessible value description. */
  progressValueText?: (values: {
    usedCredits: string;
    totalCredits: string;
    credits: string;
  }) => string;
  /** Formats the automatic-switch heading without imposing English word order. */
  autoSwitchTitle?: (values: {
    targetModel: string;
    threshold: string;
  }) => string;
}

export interface CreditUsageProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onClick"> {
  data: CreditUsageData;
  cycle?: CreditUsageCycle;
  defaultCycle?: CreditUsageCycle;
  autoSwitchEnabled?: boolean;
  defaultAutoSwitchEnabled?: boolean;
  actions?: CreditUsageActions;
  operationState?: CreditUsageOperationState;
  labels?: Partial<CreditUsageLabels>;
  formatters?: CreditUsageFormatters;
  locale?: string;
}
