"use client";

import { Badge } from "@zeron/ui/badge";
import { chartColor, SegmentedBar } from "@zeron/ui/chart-primitives";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { costEstimateCategories, costEstimateColorIndices, costEstimateMoney } from "./cost-estimate-data";
import type { CostEstimateLabels, CostEstimateRateCard, CostEstimateResult } from "./cost-estimate-types";

export function CostEstimateSummary({ result, rateCard, labels, locale, onBillingChange }: {
  result: CostEstimateResult; rateCard: CostEstimateRateCard; labels: CostEstimateLabels; locale: string;
  onBillingChange: (billing: "monthly" | "annual") => void;
}) {
  const money = (minor: number) => costEstimateMoney(minor, result, locale);
  const annual = result.inputs.billing === "annual";
  const segments = costEstimateCategories.map((key) => ({ id: key, label: labels[key], value: result.amountsMinor[key], color: chartColor(costEstimateColorIndices[key]) }));
  return <Tabs value={result.inputs.billing} variant="pill" color="default" onValueChange={(value) => { if (value === "monthly" || value === "annual") onBillingChange(value); }} className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-label text-fg-subtle">{labels.estimated}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-2">{annual && result.monthlyBaselineMinor !== result.monthlyEquivalentMinor && <del className="text-body tabular-nums text-fg-subtle">{money(result.monthlyBaselineMinor)}</del>}<span data-slot="cost-estimate-total" className="break-all text-heading font-semibold tabular-nums text-fg-default">{money(result.monthlyEquivalentMinor)}</span><span className="text-label text-fg-subtle">{labels.perMonth}</span></p>
      </div>
      <TabsList aria-label={labels.billing} className="ml-auto shrink-0">
        <TabItem value="monthly" label={labels.monthly} /><TabItem value="annual" label={labels.annual} />
      </TabsList>
    </div>
    {(["monthly", "annual"] as const).map((billing) => <TabPanel key={billing} value={billing} className="space-y-4">
      {billing === result.inputs.billing && <>
    <div className="space-y-1 text-label text-fg-muted">
      {rateCard.annualDiscountBps > 0 && <Badge status="success" size="sm">{labels.annual} · {labels.discount} {new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(rateCard.annualDiscountBps / 10000)}</Badge>}
      {annual && <p>{labels.annualAmount} {money(result.annualTotalMinor!)} · {labels.savings} {money(result.annualSavingsMinor!)}</p>}
      {result.minimumAdjustmentMinor > 0 && <p>{labels.subtotal} {money(result.usageSubtotalMinor)} + {labels.minimumAdjustment} {money(result.minimumAdjustmentMinor)} = {money(result.monthlyEquivalentMinor)}</p>}
      <p>{labels.effective} {result.effectiveCostPerGB === null ? "—" : new Intl.NumberFormat(locale, { style: "currency", currency: result.currency, minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(result.effectiveCostPerGB)} {labels.perGB}</p>
    </div>
    <div className="space-y-3">
      <h3 className="text-body font-medium text-fg-default">{labels.breakdown}</h3>
      {result.usageSubtotalMinor > 0 ? <div className="flex h-5 items-center"><SegmentedBar mode="distribution" total={result.usageSubtotalMinor} segments={segments} valueText={`${labels.breakdown}: ${costEstimateCategories.map((key) => `${labels[key]} ${money(result.amountsMinor[key])} (${result.percentages[key]}%)`).join("; ")}`} /></div> : <p className="text-label text-fg-muted">{labels.zeroUsage}</p>}
      <dl className="grid grid-cols-2 gap-3">{costEstimateCategories.map((key) => <div className="flex min-w-0 items-center justify-between gap-0.5 @lg:gap-2" key={key}>
        <dt className="shrink-0"><Badge variant="dot" color={{ base: chartColor(costEstimateColorIndices[key]), onStrong: "var(--fg-default)" }} size="sm">{labels[key]}</Badge></dt>
        <dd className="flex min-w-0 flex-wrap items-baseline justify-end gap-x-1.5 gap-y-0.5 text-right text-label tabular-nums @lg:text-body"><span className="break-all font-medium text-fg-default">{money(result.amountsMinor[key])}</span><span className="text-label text-fg-subtle">{result.percentages[key]}%</span></dd>
      </div>)}</dl>
    </div>
      </>}
    </TabPanel>)}
  </Tabs>;
}
