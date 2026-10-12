"use client";

import { useId, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon";
import CreditCardIcon from "@hugeicons/core-free-icons/CreditCardIcon";
import Download04Icon from "@hugeicons/core-free-icons/Download04Icon";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { renderPatternPreset } from "@zeron/ui/chart-core";
import { ChartLegend, SegmentedBar, chartColor, visualizationLayout } from "@zeron/ui/chart-primitives";
import { Card, CardContent } from "@zeron/ui/card";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Slider } from "@zeron/ui/slider";
import { Switch } from "@zeron/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { PlanUsageChart } from "./plan-usage-chart";
import { planUsageDefaultLabels } from "./plan-usage-labels";
import type { PlanUsageProps } from "./plan-usage-types";

const invoiceStatusColor = {
  base: "var(--brand)",
  onStrong: "var(--fg-on-brand)",
  onSoft: "var(--fg-brand)",
};

/** Embedded billing composition. The host owns mutations and billing services. */
export function PlanUsage({ data, actions, labels: suppliedLabels, locale = "en-US",
  pending = false, error, className, ...props }: PlanUsageProps) {
  const labels = { ...planUsageDefaultLabels, ...suppliedLabels };
  const id = useId();
  const thresholdPatternId = `${id}-usage-alert-pattern`;
  const plansRef = useRef<HTMLElement>(null);
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const Check = useIcon("check");
  const { number, percent, formatMoney, formatDate, longDate } = useMemo(() => {
    const number = new Intl.NumberFormat(locale);
    const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
    const money = new Intl.NumberFormat(locale, { style: "currency", currency: data.currency,
      minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const fractionalMoney = new Intl.NumberFormat(locale, { style: "currency", currency: data.currency });
    const shortDate = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
    const longDate = new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
    return {
      number, percent, longDate,
      formatMoney: (value: number) => Number.isInteger(value) ? money.format(value) : fractionalMoney.format(value),
      formatDate: (date: string) => shortDate.format(new Date(`${date}T00:00:00Z`)),
    };
  }, [locale, data.currency]);
  const renewalDate = longDate.format(new Date(`${data.renewalDate}T00:00:00Z`));
  const currentPlan = data.plans.find((plan) => plan.id === data.currentPlanId);
  const used = data.cycle.models.reduce((sum, model) => sum + model.credits, 0);
  const remaining = Math.max(0, data.cycle.includedCredits - used);
  const alertPercent = Number.isFinite(data.limits.alertPercent)
    ? Math.min(100, Math.max(0, data.limits.alertPercent)) : 80;
  const segments = data.cycle.models.map((model) => ({
    id: model.id, label: model.name, value: model.credits, color: chartColor(model.colorIndex),
  }));
  const { denominator } = visualizationLayout(segments, data.cycle.includedCredits);
  // Capacity bars expand for overage; annotations must use the same denominator.
  const thresholdPosition = denominator > 0
    ? data.cycle.includedCredits * alertPercent / denominator : alertPercent;
  const alertLabel = labels.alertAt(percent.format(alertPercent / 100));
  const projection = data.cycle.projection;
  const visibleInvoices = showAllInvoices ? data.invoices : data.invoices.slice(0, 6);
  const olderCount = Math.max(0, data.invoices.length - 6);

  function seePlans() {
    plansRef.current?.scrollIntoView({ block: "start" });
    plansRef.current?.focus({ preventScroll: true });
  }

  return (
    <div {...props} className={cn("mx-auto w-full max-w-3xl space-y-8 text-body text-fg-default", className)}
      data-block="plan-usage" aria-busy={pending}>
      <header className="space-y-1">
        <h2 className="text-title font-semibold text-fg-default">{labels.title}</h2>
        <p className="text-body text-fg-subtle">{labels.description}</p>
      </header>

      {error && <InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent>{error}</InlineNoticeContent></InlineNotice>}

      {currentPlan && <Card className="border-hairline border-border">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-body font-semibold text-fg-default">{currentPlan.name}</h3>
              <Badge size="sm" status={data.cancelAtPeriodEnd ? "neutral" : "success"} variant="strong">
                {data.cancelAtPeriodEnd ? labels.canceled : labels.active}
              </Badge>
            </div>
            <p className="text-body text-fg-subtle">{data.cancelAtPeriodEnd
              ? labels.cancelScheduled(currentPlan.name, renewalDate)
              : labels.renewal(renewalDate, formatMoney(currentPlan.monthlyPrice))}</p>
          </div>
          <p className="shrink-0 text-fg-subtle"><strong className="text-heading font-semibold text-fg-default">
            {formatMoney(currentPlan.monthlyPrice)}</strong> {labels.perMonth}</p>
        </CardContent>
      </Card>}

      <section aria-labelledby={`${id}-usage`} className="space-y-2">
        <h3 id={`${id}-usage`} className="px-2 text-body font-semibold text-fg-default">{labels.usage}</h3>
        <Card className="border-hairline border-border">
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-fg-subtle"><strong className="text-heading font-semibold tabular-nums text-fg-default">
                {number.format(used)}</strong> {labels.included(number.format(data.cycle.includedCredits))}</p>
              <p className="text-fg-subtle">{labels.remaining(number.format(remaining), number.format(data.cycle.daysUntilReset))}</p>
            </div>
            <div className="relative flex h-5 items-center">
              <SegmentedBar mode="capacity" total={data.cycle.includedCredits} segments={segments}
                valueText={labels.progress(number.format(used), number.format(data.cycle.includedCredits))} />
              {thresholdPosition < 100 && <svg aria-hidden="true" focusable="false"
                data-slot="plan-usage-threshold-pattern"
                className="pointer-events-none absolute top-1 h-3 overflow-hidden rounded-sm"
                style={{ left: `${thresholdPosition}%`, width: `${100 - thresholdPosition}%` }}>
                {renderPatternPreset("diagonal", thresholdPatternId, { color: "var(--danger-strong)" })}
                <rect width="100%" height="100%" fill={`url(#${thresholdPatternId})`} />
              </svg>}
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-fg-default"
                style={{ left: `${thresholdPosition}%` }} />
            </div>
            <div className="space-y-2">
              <ChartLegend className="gap-x-6 gap-y-2 sm:grid-cols-2" items={data.cycle.models.map((model) => ({
                id: model.id, label: model.name, color: chartColor(model.colorIndex), value: number.format(model.credits),
                ratio: percent.format(used > 0 ? model.credits / used : 0),
              }))} />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-fg-subtle">
                {projection && <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-input" aria-hidden="true" />
                  {labels.projected(number.format(projection.credits))}</span>}
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-0.5 bg-fg-default" aria-hidden="true" />{alertLabel}</span>
              </div>
            </div>
            {projection && <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="flex min-w-0 flex-1 items-start gap-2 text-body text-fg-subtle">
                <HugeiconsIcon icon={Alert02Icon} size={16} className="mt-0.5 shrink-0 text-fg-warning" aria-hidden="true" />
                {labels.depletion(formatDate(projection.depletionDate), number.format(projection.daysBeforeReset))}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {!data.limits.extraUsageEnabled && <Button variant="secondary" disabled={pending || !actions?.onExtraUsageChange}
                  onClick={() => actions?.onExtraUsageChange?.(true)}>{labels.enableExtraUsage}</Button>}
                <Button variant="ghost" onClick={seePlans}>{labels.seePlans}</Button>
              </div>
            </div>}
            <div className="border-t-hairline border-border pt-4">
              <PlanUsageChart days={data.cycle.dailyUsage} allowance={data.cycle.dailyAllowance}
                labels={labels} formatDate={formatDate} formatNumber={(value) => number.format(value)} />
            </div>
          </CardContent>
        </Card>
        <p className="px-4 text-label text-fg-subtle">{formatDate(data.cycle.startDate)} – {formatDate(data.cycle.endDate)}.
          {projection && <> {labels.projectionNote}</>}</p>
      </section>

      <section aria-labelledby={`${id}-limits`} className="space-y-2">
        <h3 id={`${id}-limits`} className="px-2 text-body font-semibold text-fg-default">{labels.limits}</h3>
        <Card className="border-hairline border-border">
          <CardContent>
            <div className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="font-semibold text-fg-default">{labels.usageAlert}</h4>
                <p className="text-fg-subtle">{labels.usageAlertDescription}</p>
              </div>
              <div className="flex w-full max-w-full items-center gap-4 sm:w-60">
                <div className="min-w-0 flex-1">
                  <Slider value={alertPercent} onChange={(value) => { if (typeof value === "number") actions?.onAlertPercentChange?.(value); }}
                    color="brand" showValue={false} label={labels.usageAlert} showHoverPreview={false}
                    formatValue={(value) => percent.format(value / 100)} disabled={pending || !actions?.onAlertPercentChange} />
                </div>
                <span className="shrink-0 tabular-nums text-fg-subtle">{percent.format(alertPercent / 100)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t-hairline border-border pt-3">
              <div className="min-w-0 space-y-1">
                <h4 className="font-semibold text-fg-default">{labels.extraUsage}</h4>
                <p className="text-fg-subtle">{labels.extraUsageDescription}</p>
              </div>
              <Switch label={labels.extraUsage} labelVisibility="sr-only" checked={data.limits.extraUsageEnabled}
                onCheckedChange={actions?.onExtraUsageChange} disabled={pending || !actions?.onExtraUsageChange} />
            </div>
          </CardContent>
        </Card>
        <p className="px-4 text-label text-fg-subtle">{labels.extraUsageNote(formatMoney(data.limits.extraUsagePricePer100Credits))}</p>
      </section>

      <section ref={plansRef} tabIndex={-1} aria-labelledby={`${id}-plans`} className="space-y-2 rounded-3xl outline-focus-ring">
        <h3 id={`${id}-plans`} className="px-2 text-body font-semibold text-fg-default">{labels.plans}</h3>
        <Card className="border-hairline border-border">
          <CardContent>
            <div className="grid gap-0 md:grid-cols-3">
              {data.plans.map((plan) => {
                const current = plan.id === data.currentPlanId;
                const upgrade = plan.monthlyPrice > (currentPlan?.monthlyPrice ?? 0);
                return <div key={plan.id} className="flex min-w-0 flex-col gap-3 border-b-hairline border-border p-3 last:border-b-0 md:border-b-0 md:border-r-hairline md:last:border-r-0">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-fg-default">{plan.name}</h4>
                      {current && <Badge size="sm" status="neutral">{labels.current}</Badge>}</div>
                    <p className="text-fg-subtle"><strong className="text-heading font-semibold text-fg-default">
                      {formatMoney(plan.monthlyPrice)}</strong> {labels.perMonth}</p>
                    <p className="text-fg-subtle">{plan.description}</p>
                  </div>
                  <ul className="mb-5 space-y-2">
                    {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden="true" /><span className="min-w-0 break-words">{feature}</span>
                    </li>)}
                  </ul>
                  <div className="mt-auto pt-3"><Button variant={upgrade ? "neutral" : "secondary"}
                    disabled={current || pending || !actions?.onSelectPlan} onClick={() => actions?.onSelectPlan?.(plan.id)}>
                    {current ? labels.yourPlan : upgrade ? labels.upgrade : labels.downgrade}</Button></div>
                </div>;
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby={`${id}-payment`} className="space-y-2">
        <h3 id={`${id}-payment`} className="px-2 text-body font-semibold text-fg-default">{labels.payment}</h3>
        <Card className="border-hairline border-border">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              {data.payment ? <><p className="flex items-center gap-2 font-semibold text-fg-default">
                <HugeiconsIcon icon={CreditCardIcon} size={18} aria-hidden="true" className="shrink-0" />
                {labels.paymentCard(data.payment.brand, data.payment.last4)}</p>
                <p className="text-fg-subtle">{labels.paymentDetails(data.payment.expires, data.payment.holder)}</p></>
                : <p className="text-fg-subtle">{labels.noPayment}</p>}
            </div>
            <Button variant="secondary" disabled={pending || !actions?.onUpdatePayment} onClick={actions?.onUpdatePayment}>{labels.update}</Button>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby={`${id}-invoices`} className="space-y-2">
        <h3 id={`${id}-invoices`} className="px-2 text-body font-semibold text-fg-default">{labels.invoices}</h3>
        <Card className="border-hairline border-border">
          <CardContent className="min-w-0 overflow-x-auto">
            <Table id={`${id}-invoice-table`} aria-label={labels.invoices}>
              <TableHeader><TableRow>
                <TableHead scope="col">{labels.date}</TableHead>
                <TableHead scope="col">{labels.invoiceDescription}</TableHead>
                <TableHead scope="col" className="text-right">{labels.amount}</TableHead>
                <TableHead scope="col">{labels.status}</TableHead>
                <TableHead scope="col"><span className="sr-only">{labels.download("")}</span></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {visibleInvoices.map((invoice, index) => <TableRow key={invoice.id} index={index}>
                  <TableCell><div className="whitespace-nowrap text-fg-default">{formatDate(invoice.date)}</div>
                    <div className="whitespace-nowrap text-label text-fg-subtle">{invoice.id}</div></TableCell>
                  <TableCell><p className="min-w-40 text-fg-default">{invoice.description}</p></TableCell>
                  <TableCell className="text-right tabular-nums text-fg-default">{formatMoney(invoice.amount)}</TableCell>
                  <TableCell><Badge size="sm" color={invoiceStatusColor}
                    variant={invoice.status === "paid" ? "strong" : "solid"}>{labels[invoice.status]}</Badge></TableCell>
                  <TableCell><Button variant="ghost" iconOnly aria-label={labels.download(invoice.id)}
                    disabled={pending || !actions?.onDownloadInvoice} onClick={() => actions?.onDownloadInvoice?.(invoice)}>
                    <HugeiconsIcon icon={Download04Icon} size={16} aria-hidden="true" /></Button></TableCell>
                </TableRow>)}
                {!visibleInvoices.length && <TableRow><TableCell colSpan={5}>{labels.emptyInvoices}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {!showAllInvoices && olderCount > 0 && <div className="px-2"><Button variant="ghost" aria-expanded={showAllInvoices} aria-controls={`${id}-invoice-table`}
          onClick={() => setShowAllInvoices(true)}>{labels.showOlder(number.format(olderCount))}</Button></div>}
      </section>

      {currentPlan && <Card className="border-hairline border-border">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1"><h3 className="font-semibold text-fg-default">{data.cancelAtPeriodEnd ? labels.canceled : labels.cancelPlan}</h3>
            <p className="text-fg-subtle">{data.cancelAtPeriodEnd
              ? labels.cancelScheduled(currentPlan.name, renewalDate) : labels.cancelDescription(currentPlan.name, renewalDate)}</p></div>
          <Button variant="secondary" disabled={pending || data.cancelAtPeriodEnd || !actions?.onCancelPlan}
            onClick={actions?.onCancelPlan}>{labels.cancelPlan}</Button>
        </CardContent>
      </Card>}
    </div>
  );
}
