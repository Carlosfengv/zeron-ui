"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Skeleton } from "@zeron/ui/skeleton";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { calculateCostEstimate, costEstimateDefaultLimits, costEstimateLabels, costEstimateLimitsValid, costEstimateUsageMatches, costEstimateUsageValid } from "./cost-estimate-data";
import { CostEstimateSummary } from "./cost-estimate-summary";
import { CostEstimateUsage } from "./cost-estimate-usage";
import type { CostEstimateField, CostEstimateProps } from "./cost-estimate-types";

export function CostEstimate({ value, onValueChange, rateCard, regions, presets = [], limits = costEstimateDefaultLimits, defaultInputs, state = "ready", statusMessage,
  saveState = { status: "idle" }, actions, labels: overrides, title, locale = "zh-CN", className, ...props }: CostEstimateProps) {
  const labels = { ...costEstimateLabels, ...overrides };
  const Info = useIcon("doc-info-item"); const Save = useIcon("arrow-down");
  const [invalidDrafts, setInvalidDrafts] = useState<CostEstimateField[]>([]);
  const [revision, setRevision] = useState(0);
  const saving = useRef(false);
  const onInvalid = useCallback((field: CostEstimateField, invalid: boolean) => setInvalidDrafts((current) => {
    if (current.includes(field) === invalid) return current;
    return invalid ? [...current, field] : current.filter((item) => item !== field);
  }), []);
  const region = regions.find((item) => item.id === value.regionId);
  const loading = state === "loading" || (state !== "error" && rateCard !== null && rateCard.regionId !== value.regionId);
  const limitsValid = costEstimateLimitsValid(limits);
  const usageValid = costEstimateUsageValid(value, limits);
  const result = state !== "error" && !loading && region && rateCard ? calculateCostEstimate(value, rateCard, limits) : null;
  const preset = presets.find((item) => costEstimateUsageMatches(item.usage, value));
  const pending = saveState.status === "pending";
  useEffect(() => { if (!pending) saving.current = false; }, [pending]);
  const saved = saveState.status === "succeeded" && saveState.fingerprint === result?.fingerprint && invalidDrafts.length === 0;
  const resetValid = defaultInputs && costEstimateUsageValid(defaultInputs, limits) && regions.some((item) => item.id === defaultInputs.regionId);
  const resetUnchanged = defaultInputs && costEstimateUsageMatches(defaultInputs, value) && defaultInputs.regionId === value.regionId && defaultInputs.billing === value.billing && invalidDrafts.length === 0;
  function save() {
    if (saving.current || pending || state !== "ready" || !result || invalidDrafts.length || !actions?.onSave) return;
    saving.current = true;
    try { actions.onSave(result); } finally { queueMicrotask(() => { saving.current = false; }); }
  }
  return <Container {...props} data-block="cost-estimate" data-state={state} aria-busy={loading || undefined} className={cn("@container w-full max-w-xl", className)}>
    <ContainerHeader className="py-1.5">
      <div className="flex min-w-0 items-center gap-2"><h2 className="break-words text-body font-medium text-fg-default">{title ?? labels.title}</h2><Tooltip content={labels.description}><Button iconOnly variant="ghost" size="xs" aria-label={labels.description}><Info aria-hidden /></Button></Tooltip></div>
    </ContainerHeader>
    <ContainerBody>
      {state === "stale" && <div className="mb-4"><InlineNotice tone="warning" variant="emphasized"><InlineNoticeContent>{statusMessage ?? labels.stale}</InlineNoticeContent></InlineNotice></div>}
      {loading ? <div role="status" className="space-y-3"><span className="sr-only">{labels.loading}</span><Skeleton className="h-8 w-40" /><Skeleton className="h-5 w-full" /><Skeleton className="h-14 w-full" /></div> : result ? <CostEstimateSummary result={result} rateCard={rateCard!} labels={labels} locale={locale} onBillingChange={(billing) => onValueChange({ ...value, billing }, "billing")} /> : state === "error" || rateCard !== null || !region ? <InlineNotice tone="danger" role="alert" variant="emphasized"><InlineNoticeContent>{statusMessage ?? (state === "error" ? labels.error : labels.invalid)}</InlineNoticeContent></InlineNotice> : <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.noRates}</EmptyDescription></Empty>}
      {(!result || state === "stale") && actions?.onRetry && <Button size="sm" variant="secondary" className="mt-3" onClick={actions.onRetry}>{labels.retry}</Button>}
    </ContainerBody>
    <ContainerBody>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-body font-medium text-fg-default">{labels.usage}</h3><p className="mt-1 text-label text-fg-subtle">{preset ? `${labels.preset} · ${preset.label}` : labels.custom}</p></div>
        {presets.length > 0 && <div role="group" aria-label={labels.presets} className="flex flex-wrap gap-1">{presets.map((item) => <Button key={item.id} size="sm" variant="tertiary" active={preset?.id === item.id} disabled={!costEstimateUsageValid(item.usage, limits)} onClick={() => { setRevision((current) => current + 1); onValueChange({ ...value, ...item.usage }, "preset"); }}>{item.label}</Button>)}</div>}
      </div>
      {limitsValid && usageValid ? <CostEstimateUsage value={value} result={result} rateCard={rateCard} limits={limits} labels={labels} locale={locale} disabled={false} revision={revision} onInvalid={onInvalid} onChange={(field, next) => onValueChange({ ...value, [field]: next }, "field")} /> : <p role="alert" className="text-label text-fg-danger">{labels.invalid}</p>}
    </ContainerBody>
    <ContainerFooter className="justify-between gap-3">
      <div className="min-w-0 space-y-1 text-label text-fg-subtle"><p className="break-words">{result?.currency ?? "—"} · {labels.excludingTax} · {region?.location ?? "—"}</p>{result && <p>{labels.rateVersion} {result.rateCardVersion}</p>}
        {saved && <p role="status" className="text-fg-success">{labels.saved}</p>}{saveState.status === "error" && <p role="alert" className="text-fg-danger">{saveState.message}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{defaultInputs && <Button variant="ghost" size="sm" disabled={!resetValid || resetUnchanged} onClick={() => { setRevision((current) => current + 1); onValueChange({ ...defaultInputs }, "reset"); }}>{labels.reset}</Button>}{actions?.onSave && <Button size="sm" leadingIcon={Save} loading={pending} disabled={!result || state !== "ready" || invalidDrafts.length > 0} onClick={save}>{pending ? labels.saving : labels.save}</Button>}</div>
    </ContainerFooter>
  </Container>;
}
