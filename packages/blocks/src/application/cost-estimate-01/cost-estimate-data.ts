import type { CostEstimateCategory, CostEstimateInputs, CostEstimateLabels, CostEstimateLimits, CostEstimateRateCard, CostEstimateResult, CostEstimateUsage } from "./cost-estimate-types";

export const costEstimateCategories: CostEstimateCategory[] = ["ingest", "storage", "queries", "seats"];
export const costEstimateColors = { ingest: "orange", storage: "blue", queries: "teal", seats: "purple" } as const;
export const costEstimateDefaultLimits: CostEstimateLimits = {
  ingestGBPerDay: { min: 0, max: 1000, step: 0.5 }, retentionDays: { min: 1, max: 365, step: 1 },
  scannedTBPerMonth: { min: 0, max: 500, step: 0.5 }, seats: { min: 0, max: 100, step: 1 },
};
export const costEstimateLabels: CostEstimateLabels = {
  title: "费用估算", description: "调整用量，比较月付与年付的预计费用。",
  estimated: "预计费用", perMonth: "/ 月", monthly: "月付", annual: "年付", billing: "计费方式", annualAmount: "年付总额", savings: "预计节省", discount: "用量单价优惠",
  breakdown: "用量费用构成", zeroUsage: "当前用量费用为零", usage: "用量", custom: "自定义用量", preset: "当前预设", presets: "用量预设",
  ingest: "Ingest", storage: "Storage", queries: "Queries", seats: "Seats", ingestUnit: "GB / 天", retentionUnit: "天", queriesUnit: "TB / 月", seatsUnit: "席位",
  monthlyIngest: "月摄入", stored: "预计存储", compressed: "压缩比", includedSeats: "免费席位", billableSeats: "计费席位",
  minimumAdjustment: "最低消费补差", subtotal: "用量费用", effective: "每 GB 综合费用", perGB: "/ GB", excludingTax: "未含税", rateVersion: "费率版本",
  save: "保存估算", saving: "正在保存", saved: "已保存当前估算", reset: "重置", loading: "正在加载费率", error: "费率加载失败", noRates: "暂无可用费率",
  stale: "费率已过期，请刷新后保存。", invalid: "用量、范围或费率无效，无法估算。", invalidInput: "请输入范围内的有效数字。", retry: "重试",
};

// Six fractional digits are supported for quantities; pricing is calculated as integer ratios.
function quantity(value: number): bigint | null {
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return null;
  const scaled = Math.round(value * 1_000_000);
  if (scaled === 0 && value !== 0) return null;
  if (Math.abs(value - scaled / 1_000_000) > Number.EPSILON * Math.max(1, value) * 4) return null;
  return BigInt(scaled);
}
export function costEstimateLimitsValid(limits: CostEstimateLimits): boolean {
  return (Object.keys(costEstimateDefaultLimits) as (keyof CostEstimateUsage)[]).every((field) => {
    const limit = limits[field];
    return limit && quantity(limit.min) !== null && quantity(limit.max) !== null && quantity(limit.step) !== null && limit.step > 0 && limit.min < limit.max
      && ((quantity(limit.max)! - quantity(limit.min)!) % quantity(limit.step)! === BigInt(0))
      && ((field !== "seats" && field !== "retentionDays") || [limit.min, limit.max, limit.step].every(Number.isInteger));
  }) && limits.retentionDays.min >= 1;
}
export function costEstimateUsageValid(value: CostEstimateUsage, limits: CostEstimateLimits): boolean {
  if (!costEstimateLimitsValid(limits)) return false;
  return (Object.keys(costEstimateDefaultLimits) as (keyof CostEstimateUsage)[]).every((field) => {
    const q = quantity(value[field]); const { min, max, step } = limits[field];
    return q !== null && value[field] >= min && value[field] <= max && (q - quantity(min)!) % quantity(step)! === BigInt(0);
  });
}
export function costEstimateUsageMatches(a: CostEstimateUsage, b: CostEstimateUsage): boolean {
  return a.ingestGBPerDay === b.ingestGBPerDay && a.retentionDays === b.retentionDays && a.scannedTBPerMonth === b.scannedTBPerMonth && a.seats === b.seats;
}
function roundRatio(numerator: bigint, denominator: bigint): bigint {
  return (numerator * BigInt(2) + denominator) / (denominator * BigInt(2));
}

/** Returns null on invalid input, mismatched pricing, or unsafe output; never substitutes zero. */
export function calculateCostEstimate(value: CostEstimateInputs, rate: CostEstimateRateCard, limits: CostEstimateLimits = costEstimateDefaultLimits): CostEstimateResult | null {
  if (!costEstimateUsageValid(value, limits) || !value.regionId || rate.regionId !== value.regionId || !["monthly", "annual"].includes(value.billing)
    || !rate.id || !rate.version || !/^[A-Z]{3}$/.test(rate.currency) || !Number.isInteger(rate.minorUnitDigits) || rate.minorUnitDigits < 0 || rate.minorUnitDigits > 6
    || !Number.isSafeInteger(rate.billingDays) || rate.billingDays <= 0 || rate.billingDays > 366 || quantity(rate.compressionRatio) === null || rate.compressionRatio <= 0
    || !Number.isSafeInteger(rate.includedSeats) || rate.includedSeats < 0 || !Number.isInteger(rate.annualDiscountBps) || rate.annualDiscountBps < 0 || rate.annualDiscountBps > 10000
    || !Number.isSafeInteger(rate.minimumMonthlyMinor) || rate.minimumMonthlyMinor < 0 || !rate.ratesMicros
    || costEstimateCategories.some((key) => typeof rate.ratesMicros[key] !== "string" || !/^\d{1,18}$/.test(rate.ratesMicros[key]))) return null;
  const scale = BigInt(1_000_000);
  const compression = quantity(rate.compressionRatio)!;
  const ingest = quantity(value.ingestGBPerDay)!;
  const scanned = quantity(value.scannedTBPerMonth)!;
  const billableSeats = Math.max(value.seats - rate.includedSeats, 0);
  const ratios: Record<CostEstimateCategory, [bigint, bigint]> = {
    ingest: [ingest * BigInt(rate.billingDays), scale],
    storage: [ingest * BigInt(value.retentionDays), compression],
    queries: [scanned, scale], seats: [BigInt(billableSeats), BigInt(1)],
  };
  function amounts(discountBps: number) {
    return costEstimateCategories.map((key) => {
      const [n, d] = ratios[key];
      return roundRatio(n * BigInt(rate.ratesMicros[key]) * BigInt(10 ** rate.minorUnitDigits) * BigInt(10000 - discountBps), d * scale * BigInt(10000));
    });
  }
  const lines = amounts(value.billing === "annual" ? rate.annualDiscountBps : 0);
  const subtotal = lines.reduce((sum, amount) => sum + amount, BigInt(0));
  const minimum = BigInt(rate.minimumMonthlyMinor);
  const monthly = subtotal > minimum ? subtotal : minimum;
  const baseSubtotal = amounts(0).reduce((sum, amount) => sum + amount, BigInt(0));
  const baseline = baseSubtotal > minimum ? baseSubtotal : minimum;
  // Reserve enough integer precision for the annual projection and percentages.
  if (baseline * BigInt(12) > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  const fractions = lines.map((amount, index) => ({ index, whole: subtotal > BigInt(0) ? Number(amount * BigInt(100) / subtotal) : 0, remainder: subtotal > BigInt(0) ? amount * BigInt(100) % subtotal : BigInt(0) }));
  let remaining = subtotal > BigInt(0) ? 100 - fractions.reduce((sum, item) => sum + item.whole, 0) : 0;
  [...fractions].sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1).forEach((item) => { if (remaining > 0) { item.whole++; remaining--; } });
  const ingestGBMonth = value.ingestGBPerDay * rate.billingDays;
  return {
    inputs: { ...value }, rateCardId: rate.id, rateCardVersion: rate.version, currency: rate.currency, minorUnitDigits: rate.minorUnitDigits,
    amountsMinor: Object.fromEntries(costEstimateCategories.map((key, i) => [key, Number(lines[i])])) as CostEstimateResult["amountsMinor"],
    percentages: Object.fromEntries(costEstimateCategories.map((key, i) => [key, fractions[i].whole])) as CostEstimateResult["percentages"],
    usageSubtotalMinor: Number(subtotal), minimumAdjustmentMinor: Number(monthly - subtotal), monthlyEquivalentMinor: Number(monthly), monthlyBaselineMinor: Number(baseline),
    annualTotalMinor: value.billing === "annual" ? Number(monthly * BigInt(12)) : null,
    annualSavingsMinor: value.billing === "annual" ? Number((baseline - monthly) * BigInt(12)) : null,
    ingestGBMonth, storedGB: value.ingestGBPerDay * value.retentionDays / rate.compressionRatio, billableSeats,
    effectiveCostPerGB: ingestGBMonth > 0 ? Number(monthly) / 10 ** rate.minorUnitDigits / ingestGBMonth : null,
    fingerprint: JSON.stringify([value.regionId, value.billing, value.ingestGBPerDay, value.retentionDays, value.scannedTBPerMonth, value.seats, rate.id, rate.version, rate.currency, rate.minorUnitDigits, rate.billingDays, rate.compressionRatio, rate.includedSeats, rate.annualDiscountBps, rate.minimumMonthlyMinor, ...costEstimateCategories.map((key) => rate.ratesMicros[key])]),
  };
}

export function costEstimateMoney(amountMinor: number, result: Pick<CostEstimateResult, "currency" | "minorUnitDigits">, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: result.currency, minimumFractionDigits: result.minorUnitDigits, maximumFractionDigits: result.minorUnitDigits }).format(amountMinor / 10 ** result.minorUnitDigits);
}
