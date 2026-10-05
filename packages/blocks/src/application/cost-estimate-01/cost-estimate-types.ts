import type { ComponentPropsWithoutRef } from "react";

export type CostEstimateBilling = "monthly" | "annual";
export type CostEstimateCategory = "ingest" | "storage" | "queries" | "seats";
export type CostEstimateField = "ingestGBPerDay" | "retentionDays" | "scannedTBPerMonth" | "seats";
export interface CostEstimateUsage { ingestGBPerDay: number; retentionDays: number; scannedTBPerMonth: number; seats: number }
export interface CostEstimateInputs extends CostEstimateUsage { regionId: string; billing: CostEstimateBilling }
export interface CostEstimateRateCard {
  id: string; version: string; regionId: string; currency: string; minorUnitDigits: number;
  billingDays: number; compressionRatio: number; includedSeats: number;
  annualDiscountBps: number; minimumMonthlyMinor: number;
  /** Integer millionths of a major currency unit, as decimal strings. */
  ratesMicros: Record<CostEstimateCategory, string>;
}
export type CostEstimateLimits = Record<CostEstimateField, { min: number; max: number; step: number }>;
export interface CostEstimatePreset { id: string; label: string; usage: CostEstimateUsage }
export interface CostEstimateRegion { id: string; label: string; location: string }
export interface CostEstimateResult {
  inputs: CostEstimateInputs;
  rateCardId: string; rateCardVersion: string; currency: string; minorUnitDigits: number;
  amountsMinor: Record<CostEstimateCategory, number>;
  percentages: Record<CostEstimateCategory, number>;
  usageSubtotalMinor: number; minimumAdjustmentMinor: number; monthlyEquivalentMinor: number;
  monthlyBaselineMinor: number; annualTotalMinor: number | null; annualSavingsMinor: number | null;
  ingestGBMonth: number; storedGB: number; billableSeats: number; effectiveCostPerGB: number | null;
  /** Covers inputs and all pricing fields, not merely the version label. */
  fingerprint: string;
}
export type CostEstimateSaveState = { status: "idle" | "pending" } | { status: "succeeded"; fingerprint: string } | { status: "error"; message: string };
export interface CostEstimateLabels {
  title: string; description: string;
  estimated: string; perMonth: string; monthly: string; annual: string; billing: string;
  annualAmount: string; savings: string; discount: string; breakdown: string; zeroUsage: string;
  usage: string; custom: string; preset: string; presets: string;
  ingest: string; storage: string; queries: string; seats: string;
  ingestUnit: string; retentionUnit: string; queriesUnit: string; seatsUnit: string;
  monthlyIngest: string; stored: string; compressed: string; includedSeats: string; billableSeats: string;
  minimumAdjustment: string; subtotal: string; effective: string; perGB: string;
  excludingTax: string; rateVersion: string; save: string; saving: string; saved: string; reset: string;
  loading: string; error: string; noRates: string; stale: string; invalid: string; invalidInput: string; retry: string;
}
export interface CostEstimateProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange" | "title"> {
  value: CostEstimateInputs;
  onValueChange: (next: CostEstimateInputs, reason: "field" | "preset" | "reset" | "region" | "billing") => void;
  rateCard: CostEstimateRateCard | null;
  regions: readonly CostEstimateRegion[];
  presets?: readonly CostEstimatePreset[];
  limits?: CostEstimateLimits;
  defaultInputs?: CostEstimateInputs;
  state?: "ready" | "loading" | "stale" | "error";
  statusMessage?: string;
  saveState?: CostEstimateSaveState;
  actions?: { onSave?: (snapshot: CostEstimateResult) => void; onRetry?: () => void };
  labels?: Partial<CostEstimateLabels>;
  title?: string;
  locale?: string;
}
