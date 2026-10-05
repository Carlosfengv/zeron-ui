import { describe, expect, it } from "vitest";
import { calculateCostEstimate, costEstimateDefaultLimits } from "../packages/blocks/src/application/cost-estimate-01/cost-estimate-data";
import { costEstimateDemoInputs, costEstimateDemoPresets, costEstimateDemoRateCards } from "../packages/blocks/src/application/cost-estimate-01/cost-estimate-demo-data";
const rate = costEstimateDemoRateCards["us-east"];
const value = costEstimateDemoInputs;

describe("integer cost estimates", () => {
  it("reconciles the three presets, including a separately recorded minimum", () => {
    const results = costEstimateDemoPresets.map((preset) => calculateCostEstimate({ ...value, ...preset.usage }, rate)!);
    expect(results.map((result) => result.monthlyEquivalentMinor)).toEqual([4900, 58600, 746800]);
    expect(results[0].usageSubtotalMinor).toBe(2108); expect(results[0].minimumAdjustmentMinor).toBe(2792);
    expect(results[1].amountsMinor).toEqual({ ingest: 28800, storage: 7200, queries: 10000, seats: 12600 });
    for (const result of results) {
      expect(Object.values(result.amountsMinor).reduce((a, b) => a + b, 0) + result.minimumAdjustmentMinor).toBe(result.monthlyEquivalentMinor);
      expect(Object.values(result.percentages).reduce((a, b) => a + b, 0)).toBe(100);
    }
  });
  it("projects annual costs from original rates without applying the discount twice", () => {
    const scale = { ...value, ...costEstimateDemoPresets[2].usage, billing: "annual" as const };
    const result = calculateCostEstimate(scale, rate)!;
    expect([result.monthlyEquivalentMinor, result.annualTotalMinor, result.annualSavingsMinor]).toEqual([634780, 7617360, 1344240]);
    expect(calculateCostEstimate({ ...scale, billing: "monthly" }, rate)!.monthlyEquivalentMinor).toBe(746800);
    expect(calculateCostEstimate({ ...value, billing: "annual" }, rate)!.monthlyEquivalentMinor).toBe(49810);
    const hobby = calculateCostEstimate({ ...value, ...costEstimateDemoPresets[0].usage, billing: "annual" }, rate)!;
    expect(hobby.annualSavingsMinor).toBe(0); expect(hobby.monthlyEquivalentMinor).toBe(4900);
  });
  it("keeps zero values, full discounts, free seats and absent per-GB denominators honest", () => {
    const zero = calculateCostEstimate({ ...value, ingestGBPerDay: 0, scannedTBPerMonth: 0, seats: 3 }, rate)!;
    expect(zero.usageSubtotalMinor).toBe(0); expect(zero.effectiveCostPerGB).toBeNull(); expect(Object.values(zero.percentages)).toEqual([0, 0, 0, 0]);
    expect(calculateCostEstimate(value, { ...rate, annualDiscountBps: 0 })!.monthlyEquivalentMinor).toBe(58600);
    expect(calculateCostEstimate({ ...value, billing: "annual" }, { ...rate, annualDiscountBps: 10000 })!.usageSubtotalMinor).toBe(0);
  });
  it("rejects invalid quantities, pricing, ownership and output overflow", () => {
    for (const invalid of [NaN, Infinity, -1, 1001, 80.1]) expect(calculateCostEstimate({ ...value, ingestGBPerDay: invalid }, rate)).toBeNull();
    expect(calculateCostEstimate({ ...value, seats: 1.5 }, rate)).toBeNull();
    expect(calculateCostEstimate(value, { ...rate, regionId: "eu-demo" })).toBeNull();
    expect(calculateCostEstimate(value, { ...rate, compressionRatio: 0 })).toBeNull();
    expect(calculateCostEstimate(value, { ...rate, annualDiscountBps: -1 })).toBeNull();
    expect(calculateCostEstimate(value, { ...rate, ratesMicros: { ...rate.ratesMicros, ingest: "-1" } })).toBeNull();
    expect(calculateCostEstimate(value, { ...rate, ratesMicros: { ...rate.ratesMicros, ingest: "999999999999999999" } })).toBeNull();
    expect(calculateCostEstimate(value, rate, { ...costEstimateDefaultLimits, seats: { min: 0, max: 100, step: 0 } })).toBeNull();
  });
  it("rejects sub-precision divisors and ranges whose endpoint is off the step grid", () => {
    expect(calculateCostEstimate(value, { ...rate, compressionRatio: 1e-20 })).toBeNull();
    expect(calculateCostEstimate(value, rate, { ...costEstimateDefaultLimits, scannedTBPerMonth: { min: 0, max: 500, step: 1e-20 } })).toBeNull();
    expect(calculateCostEstimate({ ...value, scannedTBPerMonth: 0.9 }, rate, { ...costEstimateDefaultLimits, scannedTBPerMonth: { min: 0, max: 1, step: 0.3 } })).toBeNull();
  });
  it("uses exact HALF_UP including fractional cents and non-USD precision", () => {
    const fractional = { ...value, ingestGBPerDay: 0.5, retentionDays: 1, scannedTBPerMonth: 0, seats: 0 };
    const result = calculateCostEstimate(fractional, { ...rate, minimumMonthlyMinor: 0, compressionRatio: 1, ratesMicros: { ingest: "1000", storage: "10000", queries: "0", seats: "0" } })!;
    expect(result.amountsMinor.ingest).toBe(2); expect(result.amountsMinor.storage).toBe(1);
    const yen = calculateCostEstimate(value, { ...rate, currency: "JPY", minorUnitDigits: 0, minimumMonthlyMinor: 0 })!;
    expect(yen.monthlyEquivalentMinor).toBe(586);
    expect(calculateCostEstimate(fractional, { ...rate, minimumMonthlyMinor: 2, ratesMicros: { ingest: "0", storage: "0", queries: "0", seats: "0" } })!.minimumAdjustmentMinor).toBe(2);
  });
  it("produces serializable immutable snapshots with pricing-sensitive fingerprints", () => {
    const input = { ...value }; const result = calculateCostEstimate(input, rate)!;
    input.seats = 90; expect(result.inputs.seats).toBe(12); expect(() => JSON.stringify(result)).not.toThrow();
    expect(calculateCostEstimate(value, { ...rate, ratesMicros: { ...rate.ratesMicros, seats: "14000001" } })!.fingerprint).not.toBe(result.fingerprint);
    expect(calculateCostEstimate(value, rate)!.fingerprint).toBe(result.fingerprint);
  });
});
