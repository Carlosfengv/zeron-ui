"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Badge, badgeColors } from "@zeron/ui/badge";
import { ChartContainer, type ChartConfig } from "@zeron/ui/chart";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { costEstimateCategories, costEstimateColors, costEstimateMoney } from "./cost-estimate-data";
import type { CostEstimateLabels, CostEstimateRateCard, CostEstimateResult } from "./cost-estimate-types";

export function CostEstimateSummary({ result, rateCard, labels, locale, onBillingChange }: {
  result: CostEstimateResult; rateCard: CostEstimateRateCard; labels: CostEstimateLabels; locale: string;
  onBillingChange: (billing: "monthly" | "annual") => void;
}) {
  const money = (minor: number) => costEstimateMoney(minor, result, locale);
  const annual = result.inputs.billing === "annual";
  const config: ChartConfig = Object.fromEntries(costEstimateCategories.map((key) => [key, { label: labels[key], color: badgeColors[costEstimateColors[key]] }]));
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
      {result.usageSubtotalMinor > 0 ? <ChartContainer className="h-5 min-h-0" config={config} aria-hidden="true">
        <BarChart layout="vertical" data={[{ category: "usage", ...result.amountsMinor }]} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barSize={12} accessibilityLayer={false}>
          <XAxis type="number" hide domain={[0, result.usageSubtotalMinor]} /><YAxis type="category" dataKey="category" hide />
          {costEstimateCategories.map((key) => <Bar key={key} dataKey={key} stackId="cost" fill={`var(--color-${key})`} isAnimationActive={false} />)}
        </BarChart>
      </ChartContainer> : <p className="text-label text-fg-muted">{labels.zeroUsage}</p>}
      <dl className="grid grid-cols-2 gap-3">{costEstimateCategories.map((key) => <div className="flex min-w-0 items-center justify-between gap-0.5 @lg:gap-2" key={key}>
        <dt className="shrink-0"><Badge variant="dot" color={costEstimateColors[key]} size="sm">{labels[key]}</Badge></dt>
        <dd className="flex min-w-0 flex-wrap items-baseline justify-end gap-x-1.5 gap-y-0.5 text-right text-label tabular-nums @lg:text-body"><span className="break-all font-medium text-fg-default">{money(result.amountsMinor[key])}</span><span className="text-label text-fg-subtle">{result.percentages[key]}%</span></dd>
      </div>)}</dl>
    </div>
      </>}
    </TabPanel>)}
  </Tabs>;
}
