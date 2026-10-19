"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody } from "@zeron/ui/container";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { UsageBudgetForecastChart } from "./usage-budget-forecast-chart";
import { findUsageBudgetCrossing, usageBudgetModel, USAGE_BUDGET_DAY, validateUsageBudgetData } from "./usage-budget-forecast-data";
import { usageBudgetForecastEnLabels } from "./usage-budget-forecast-labels";
import type { UsageBudgetForecastData, UsageBudgetForecastLabels, UsageBudgetForecastProps, UsageBudgetMetric, UsageBudgetThreshold } from "./usage-budget-forecast-types";

const thresholds: readonly UsageBudgetThreshold[] = [50, 80, 100];
const defaultThresholds: readonly UsageBudgetThreshold[] = [80, 100];

function metricAlerts(preferences: Readonly<Record<string, readonly UsageBudgetThreshold[]>>, id: string) {
  return Object.hasOwn(preferences, id) ? preferences[id] ?? defaultThresholds : defaultThresholds;
}

function thresholdText(metric: UsageBudgetMetric, threshold: number, labels: UsageBudgetForecastLabels, date: (timestamp: number) => string) {
  const amount = metric.budget * threshold / 100;
  if (metric.history[0].value >= amount) return labels.since(date(metric.history[0].timestamp));
  const reached = findUsageBudgetCrossing(metric.history, amount);
  if (reached !== null) return labels.reached(date(reached));
  const expected = findUsageBudgetCrossing(metric.forecast, amount);
  return expected !== null ? labels.expected(date(expected)) : labels.notExpected;
}

function MetricContent({ data, metric, labels, locale, alerts, onAlertsChange }: {
  data: UsageBudgetForecastData; metric: UsageBudgetMetric; labels: UsageBudgetForecastLabels; locale: string;
  alerts: readonly UsageBudgetThreshold[]; onAlertsChange: (thresholds: UsageBudgetThreshold[]) => void;
}) {
  const Check = useIcon("check");
  const { date, number, format, money, rateMoney } = useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: metric.fractionDigits });
    const currency = (digits: number) => new Intl.NumberFormat(locale, { style: "currency", currency: metric.overage.currency, minimumFractionDigits: digits, maximumFractionDigits: 20 });
    return { date: (timestamp: number) => dateFormatter.format(timestamp), number,
      format: (value: number) => `${number.format(value)}${metric.unit === "M" ? "" : " "}${metric.unit}`,
      money: currency(0).format, rateMoney: currency(metric.overage.rate < 1 ? 2 : 0).format };
  }, [locale, metric.fractionDigits, metric.unit, metric.overage.currency, metric.overage.rate]);
  const model = useMemo(() => usageBudgetModel(metric), [metric]);
  const end = date(data.periodEnd);
  const upperDate = (timestamp: number) => date(Math.min(data.periodEnd, Math.ceil(timestamp / USAGE_BUDGET_DAY) * USAGE_BUDGET_DAY));
  let title: string;
  let description: string;
  if (model.status === "exceeded") {
    title = model.historyCrossing === null ? labels.exceededSinceTitle(date(metric.history[0].timestamp)) : labels.exceededTitle(date(model.historyCrossing));
    description = model.current.value === metric.budget ? labels.atBudgetDescription(format(model.projected.value), end)
      : labels.exceededDescription(Math.max(0, model.usedPercent - 100), format(model.projected.value), end);
  } else if (model.status === "expected") {
    const crossing = model.expectedCrossing!;
    const days = Math.floor(data.periodEnd / USAGE_BUDGET_DAY) - Math.floor(crossing / USAGE_BUDGET_DAY);
    const earliest = date(model.earliestCrossing ?? crossing);
    title = labels.expectedTitle(date(crossing));
    description = model.latestCrossing === null ? labels.openRangeDescription(days, earliest) : labels.expectedDescription(days, earliest, upperDate(model.latestCrossing));
  } else {
    title = labels.underTitle;
    description = labels.underDescription(format(model.projected.value), end, model.projectedPercent, model.earliestCrossing !== null ? upperDate(model.earliestCrossing) : undefined);
  }
  return <div className="space-y-7">
    <div aria-live="polite" aria-atomic="true" className="space-y-1">
      <h3 className="text-body font-medium text-fg-default">{title}</h3>
      <p className="text-label text-fg-muted">{description}</p>
    </div>
    <dl className="grid gap-4 @xl/budget:grid-cols-3 @xl/budget:gap-6">
      {[
        { label: labels.used, value: number.format(model.current.value), unit: metric.unit, detail: labels.ofBudget(model.usedPercent), danger: false },
        { label: labels.projected(end), value: number.format(model.projected.value), unit: metric.unit, detail: labels.likely(`${format(model.projected.lower)}–${format(model.projected.upper)}`), danger: false },
        { label: labels.cost, value: money(metric.overage.amount), detail: metric.overage.amount > 0 ? labels.rate(rateMoney(metric.overage.rate), metric.overage.per, metric.unit === "M" ? (locale.startsWith("zh") ? "次调用" : "calls") : metric.unit === "seats" ? "seat" : metric.unit) : labels.within, danger: metric.overage.amount > 0 },
      ].map((item, index) => <div key={item.label} className={cn("min-w-0", index > 0 && "border-t-hairline border-border-subtle pt-4 @xl/budget:border-l-hairline @xl/budget:border-t-0 @xl/budget:pl-6 @xl/budget:pt-0")}>
        <dt className="text-body text-fg-muted">{item.label}</dt>
        <dd className={cn("mt-1 flex flex-wrap items-baseline gap-x-1", item.danger ? "text-fg-danger" : "text-fg-default")}>
          <span className="min-w-0 break-words text-heading font-semibold tabular-nums">{item.value}</span>{item.unit && <span className="text-body font-medium text-fg-muted"> {item.unit}</span>}
        </dd>
        <dd className="mt-1 text-label text-fg-subtle">{item.detail}</dd>
      </div>)}
    </dl>
    <UsageBudgetForecastChart data={data} metric={metric} model={model} labels={labels} date={date} format={format} />
    <fieldset className="flex min-w-0 flex-wrap items-center gap-3 border-t-hairline border-border-subtle pt-5">
      <legend className="sr-only">{labels.alerts}</legend><span aria-hidden="true" className="text-body text-fg-muted">{labels.alerts}</span>
      {thresholds.map(threshold => <Button key={threshold} variant="tertiary" contentSized className="max-w-full" active={alerts.includes(threshold)} aria-pressed={alerts.includes(threshold)}
        leadingIcon={alerts.includes(threshold) ? Check : undefined} aria-label={labels.alert(threshold, metric.label)} aria-description={thresholdText(metric, threshold, labels, date)}
        onClick={() => onAlertsChange(thresholds.filter(value => value === threshold ? !alerts.includes(threshold) : alerts.includes(value)))}>
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 whitespace-normal text-left"><span className="font-medium tabular-nums">{threshold}%</span><span className="min-w-0 break-all text-label text-fg-subtle">{thresholdText(metric, threshold, labels, date)}</span></span>
      </Button>)}
    </fieldset>
  </div>;
}

/** A single-period usage forecast with independent metric selection and alert preferences. */
export function UsageBudgetForecast({ data, locale: requestedLocale = "en-US", labels: suppliedLabels, metricId, defaultMetricId, onMetricChange,
  alerts, defaultAlerts = {}, onAlertsChange, state = "ready", errorMessage, onRetry, className, ...props }: UsageBudgetForecastProps) {
  const [localMetric, setLocalMetric] = useState(defaultMetricId);
  const [localAlerts, setLocalAlerts] = useState(defaultAlerts);
  const titleId = useId();
  const labels = useMemo(() => ({ ...usageBudgetForecastEnLabels, ...suppliedLabels }), [suppliedLabels]);
  const locale = useMemo(() => { try { return new Intl.NumberFormat(requestedLocale).resolvedOptions().locale; } catch { return "en-US"; } }, [requestedLocale]);
  const valid = useMemo(() => validateUsageBudgetData(data), [data]);
  const selected = data.metrics.find(metric => metric.id === (metricId ?? localMetric)) ?? data.metrics[0];
  const changeAlerts = (id: string, values: UsageBudgetThreshold[]) => {
    if (alerts === undefined) setLocalAlerts(previous => ({ ...previous, [id]: values }));
    onAlertsChange?.(id, values);
  };
  const date = (timestamp: number) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(timestamp);
  return <section aria-labelledby={titleId} data-slot="usage-budget-forecast" className={cn("@container/budget min-w-0", className)} {...props}>
    <Container><ContainerBody>
      {(state !== "ready" || !valid || !selected) && <h2 id={titleId} className="sr-only">{labels.title}</h2>}
      {state === "loading" ? <div className="flex min-h-80 items-center justify-center" role="status"><InlineNotice><InlineNoticeContent>{labels.loading}</InlineNoticeContent></InlineNotice></div>
        : state === "error" || !valid ? <div className="flex min-h-80 flex-col items-center justify-center gap-4"><InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent>{!valid ? labels.invalid : errorMessage ?? labels.error}</InlineNoticeContent></InlineNotice>{onRetry && <Button onClick={onRetry}>{labels.retry}</Button>}</div>
        : !selected ? <p className="flex min-h-80 items-center justify-center text-body text-fg-subtle">{labels.empty}</p>
        : <Tabs value={selected.id} onValueChange={value => { if (metricId === undefined) setLocalMetric(value); onMetricChange?.(value); }} variant="pill" color="default">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1"><h2 id={titleId} className="text-body font-medium text-fg-default">{labels.title}</h2><p className="break-words text-label text-fg-subtle">{data.organization} · {data.plan} · {labels.renews(date(data.renewsAt))}</p></div>
            <TabsList aria-label={labels.metric}>{data.metrics.map(metric => <TabItem key={metric.id} value={metric.id} label={metric.label} />)}</TabsList>
          </div>
          {data.metrics.map(metric => <TabPanel key={metric.id} value={metric.id}><MetricContent data={data} metric={metric} labels={labels} locale={locale} alerts={metricAlerts(alerts ?? localAlerts, metric.id)} onAlertsChange={values => changeAlerts(metric.id, values)} /></TabPanel>)}
        </Tabs>}
    </ContainerBody></Container>
  </section>;
}
