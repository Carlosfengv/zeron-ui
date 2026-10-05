import type { CostEstimateInputs, CostEstimatePreset, CostEstimateRateCard, CostEstimateRegion } from "./cost-estimate-types";

export const costEstimateDemoInputs: CostEstimateInputs = { regionId: "us-east", billing: "monthly", ingestGBPerDay: 80, retentionDays: 30, scannedTBPerMonth: 40, seats: 12 };
export const costEstimateDemoPresets: CostEstimatePreset[] = [
  { id: "hobby", label: "Hobby", usage: { ingestGBPerDay: 4, retentionDays: 14, scannedTBPerMonth: 2, seats: 2 } },
  { id: "startup", label: "Startup", usage: { ingestGBPerDay: 80, retentionDays: 30, scannedTBPerMonth: 40, seats: 12 } },
  { id: "scale", label: "Scale", usage: { ingestGBPerDay: 900, retentionDays: 90, scannedTBPerMonth: 400, seats: 60 } },
];
export const costEstimateDemoRegions: CostEstimateRegion[] = [
  { id: "us-east", label: "us-east", location: "Virginia · 示例" }, { id: "eu-demo", label: "eu-demo", location: "Europe · 示例" },
];
export const costEstimateDemoRateCards: Record<string, CostEstimateRateCard> = {
  "us-east": { id: "example-us-east", version: "2026-10-05", regionId: "us-east", currency: "USD", minorUnitDigits: 2, billingDays: 30, compressionRatio: 5, includedSeats: 3, annualDiscountBps: 1500, minimumMonthlyMinor: 4900, ratesMicros: { ingest: "120000", storage: "150000", queries: "2500000", seats: "14000000" } },
  "eu-demo": { id: "example-europe", version: "2026-10-05", regionId: "eu-demo", currency: "USD", minorUnitDigits: 2, billingDays: 30, compressionRatio: 5, includedSeats: 3, annualDiscountBps: 1500, minimumMonthlyMinor: 4900, ratesMicros: { ingest: "132000", storage: "165000", queries: "2750000", seats: "15400000" } },
};
