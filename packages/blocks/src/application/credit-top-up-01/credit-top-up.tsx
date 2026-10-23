"use client";

import { memo, useId, useMemo, useRef, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Card, CardContent } from "@zeron/ui/card";
import { ChartLegend, SegmentedBar, chartColor } from "@zeron/ui/chart-primitives";
import { Container, ContainerBody } from "@zeron/ui/container";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { RadioGroup, RadioGroupItem } from "@zeron/ui/radio-group";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { CreditTopUpChart } from "./credit-top-up-chart";
import { creditTopUpCoverage, creditTopUpSummary, validateCreditTopUpData } from "./credit-top-up-data";
import { creditTopUpEnLabels } from "./credit-top-up-labels";
import { createCreditTopUpFormatters } from "./credit-top-up-formatters";
import type { CreditTopUpLabels, CreditTopUpProps, CreditTopUpUsage } from "./credit-top-up-types";

const UsageCard = memo(function UsageCard({ usage, labels, format }: { usage: CreditTopUpUsage; labels: CreditTopUpLabels; format: (value: number) => string }) {
  const Icon = useIcon(usage.chart === "stem" ? "message-circle" : usage.chart === "area" ? "doc-input" : "file-text");
  return <Card><CardContent>
    <div className="grid min-w-0 gap-4 @sm/credit-top-up:grid-cols-2 @sm/credit-top-up:gap-2">
      <div className="flex min-w-0 flex-col items-start justify-between gap-6">
        <h3 className="flex min-w-0 max-w-full items-center gap-2 text-body font-medium" style={{ color: chartColor(usage.colorIndex) }}><span aria-hidden="true" className="flex shrink-0">{usage.icon ?? <Icon size={16} />}</span><span className="min-w-0 break-words">{usage.label}</span></h3>
        <div><p className="flex flex-wrap items-baseline gap-x-1.5"><span className="break-all text-heading font-semibold tabular-nums text-fg-default">{format(usage.recentCredits)}</span><span className="text-label text-fg-muted">{labels.credits}</span></p>{usage.description && <p className="mt-1 break-words text-label text-fg-subtle">{usage.description}</p>}</div>
      </div>
      <CreditTopUpChart usage={usage} labels={labels} format={format} />
    </div>
  </CardContent></Card>;
});

/** Usage context and package selection; the host owns checkout and credit balance updates. */
export function CreditTopUp({ data, locale = "en-US", timeZone = "UTC", labels: suppliedLabels, packageId, defaultPackageId, onPackageChange,
  onConfirm, onCancel, disabled = false, isSubmitting = false, state = "ready", errorMessage, onRetry, className, ...props }: CreditTopUpProps) {
  const titleId = useId();
  const groupId = useId();
  const firstAvailableId = data.packages.find(item => !item.disabled)?.id;
  const [localPackageId, setLocalPackageId] = useState(() => defaultPackageId ?? firstAvailableId);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const labels = useMemo(() => ({ ...creditTopUpEnLabels, ...suppliedLabels }), [suppliedLabels]);
  const busy = pending || isSubmitting;
  const { number: format, date, money: price } = useMemo(() => createCreditTopUpFormatters(locale, timeZone), [locale, timeZone]);
  const { valid, summary, segments } = useMemo(() => ({
    valid: validateCreditTopUpData(data),
    summary: creditTopUpSummary(data),
    segments: data.usage.map(item => ({ id: item.id, label: item.label, value: item.periodCredits, color: chartColor(item.colorIndex) })),
  }), [data]);
  // Set the initial default once async data supplies it; retain explicit or stale selections.
  if (packageId === undefined && localPackageId === undefined && firstAvailableId !== undefined) {
    setLocalPackageId(firstAvailableId);
  }
  const selectedId = packageId ?? localPackageId ?? firstAvailableId;
  const selected = data.packages.find(item => item.id === selectedId && !item.disabled);
  const quoteKey = selected ? JSON.stringify([selected.id, selected.credits, selected.price, selected.currency]) : null;
  const [checkoutFeedback, setCheckoutFeedback] = useState<{ quoteKey: string | null; failed: boolean }>({ quoteKey, failed: false });
  // A host selection or quote replacement starts a fresh feedback state before commit.
  if (checkoutFeedback.quoteKey !== quoteKey) {
    setCheckoutFeedback({ quoteKey, failed: false });
  }
  const confirmFailed = checkoutFeedback.quoteKey === quoteKey && checkoutFeedback.failed;
  const confirm = async () => {
    if (!selected || !onConfirm || disabled || busy || submitting.current || !valid || state !== "ready") return;
    submitting.current = true;
    setPending(true);
    const requestFeedback = { quoteKey, failed: false };
    setCheckoutFeedback(requestFeedback);
    try {
      await onConfirm(selected);
    } catch {
      setCheckoutFeedback(current => current === requestFeedback ? { quoteKey, failed: true } : current);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return <section {...props} aria-labelledby={titleId} aria-busy={busy || state === "loading"} data-slot="credit-top-up" className={cn("@container/credit-top-up min-w-0", className)}>
    <Container><ContainerBody>
      {state === "loading" ? <div role="status" className="flex min-h-80 items-center justify-center"><h2 id={titleId} className="sr-only">{labels.title}</h2><p className="text-body text-fg-muted">{labels.loading}</p></div>
        : state === "error" || !valid ? <div className="flex min-h-80 flex-col items-center justify-center gap-4"><h2 id={titleId} className="sr-only">{labels.title}</h2><InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent>{!valid ? labels.invalid : errorMessage ?? labels.loadError}</InlineNoticeContent></InlineNotice>{onRetry && <Button onClick={onRetry}>{labels.retry}</Button>}</div>
        : <div className="grid min-w-0 gap-6 @3xl/credit-top-up:grid-cols-2 @3xl/credit-top-up:gap-8">
          <div className="grid min-w-0 content-start gap-3" role="group" aria-label={labels.activity}>
            {data.usage.length ? data.usage.map(usage => <UsageCard key={usage.id} usage={usage} labels={labels} format={format} />) : <p className="flex min-h-40 items-center justify-center text-body text-fg-muted">{labels.emptyUsage}</p>}
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <header className="space-y-2"><h2 id={titleId} className="text-title font-medium text-fg-default">{labels.title}</h2><p className="text-body leading-relaxed text-fg-muted">{data.averageDailyUsage === 0 ? labels.idle(date(data.resetsAt)) : summary.runsOutBeforeReset ? labels.forecast(format(data.averageDailyUsage), date(summary.runsOutAt!), date(data.resetsAt)) : labels.sufficient(format(data.averageDailyUsage), date(data.resetsAt))}</p></header>
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-label"><span className="text-fg-muted">{labels.usedIn(data.periodLabel)}</span><span className="tabular-nums text-fg-default">{labels.usageTotal(format(summary.used), format(data.totalCredits))}</span></div>
              <SegmentedBar mode="capacity" total={data.totalCredits} segments={segments} valueText={labels.usageTotal(format(summary.used), format(data.totalCredits))} />
              <ChartLegend className="flex flex-wrap gap-x-4 gap-y-2" items={[...segments.map(item => ({ id: `usage:${item.id}`, label: item.label, color: item.color, value: format(item.value) })), { id: "remaining", label: labels.remaining, color: "var(--muted)", value: format(summary.remaining) }]} />
            </div>
            {data.packages.length ? <RadioGroup name={groupId} aria-label={labels.packages} value={selectedId ?? ""} disabled={disabled || busy} className="grid gap-3" onValueChange={id => { if (packageId === undefined) setLocalPackageId(id); setCheckoutFeedback({ quoteKey, failed: false }); onPackageChange?.(id); }}>
              {data.packages.map((item, index) => {
                const coverage = creditTopUpCoverage(item.credits, data);
                const coverageText = coverage ? coverage.days < 1 ? labels.lessThanDay : labels.coverage(format(coverage.days), coverage.pastReset) : undefined;
                const optionId = `${groupId}-${index}`;
                return <label key={item.id} htmlFor={optionId} className={cn("flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-4 transition-colors duration-fast hover:bg-hover", selectedId === item.id && "border-brand bg-active", (item.disabled || disabled || busy) && "cursor-not-allowed opacity-50")}>
                  <RadioGroupItem id={optionId} value={item.id} disabled={item.disabled} />
                  <span className="min-w-0 flex-1"><span className="block break-words text-body font-medium text-fg-default">{labels.packageCredits(format(item.credits))}</span>{coverageText && <> <span className="mt-1 block break-words text-label text-fg-subtle">{coverageText}</span></>}</span>{" "}
                  <span className="max-w-1/2 shrink-0 break-all text-right text-body font-medium tabular-nums text-fg-default">{price(item.price, item.currency)}</span>
                </label>;
              })}
            </RadioGroup> : <p className="text-body text-fg-muted">{labels.emptyPackages}</p>}
            <footer className="mt-auto space-y-3 pt-4">
              {confirmFailed && <InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent>{labels.confirmError}</InlineNoticeContent></InlineNotice>}
              <div className="grid gap-3 @sm/credit-top-up:grid-cols-2">
                {onCancel && <Button variant="secondary" size="lg" disabled={busy} onClick={onCancel}>{labels.cancel}</Button>}
                <Button variant="primary" size="lg" className={cn("min-w-0", !onCancel && "col-span-full")} loading={busy} disabled={disabled || busy || !selected || !onConfirm} onClick={confirm}><span className="block truncate">{selected ? labels.confirm(format(selected.credits), price(selected.price, selected.currency)) : labels.selectPackage}</span></Button>
              </div>
            </footer>
          </div>
        </div>}
    </ContainerBody></Container>
  </section>;
}
