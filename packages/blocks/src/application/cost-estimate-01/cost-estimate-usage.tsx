"use client";

import { useEffect, useId, useRef, useState } from "react";
import { badgeColors } from "@zeron/ui/badge";
import { Field, FieldDescription, FieldLabel } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
import { Slider } from "@zeron/ui/slider";
import { costEstimateColors, costEstimateMoney } from "./cost-estimate-data";
import type { CostEstimateCategory, CostEstimateField, CostEstimateLabels, CostEstimateLimits, CostEstimateRateCard, CostEstimateResult, CostEstimateUsage } from "./cost-estimate-types";

const fields: { field: CostEstimateField; category: CostEstimateCategory; unit: "ingestUnit" | "retentionUnit" | "queriesUnit" | "seatsUnit" }[] = [
  { field: "ingestGBPerDay", category: "ingest", unit: "ingestUnit" }, { field: "retentionDays", category: "storage", unit: "retentionUnit" },
  { field: "scannedTBPerMonth", category: "queries", unit: "queriesUnit" }, { field: "seats", category: "seats", unit: "seatsUnit" },
];

function UsageField({ field, category, unit, value, limit, labels, amount, detail, unitPrice, tooltipDetail, disabled, revision, onChange, onInvalid }: {
  field: CostEstimateField; category: CostEstimateCategory; unit: string; value: number; limit: CostEstimateLimits[CostEstimateField];
  labels: CostEstimateLabels; amount: string; detail: string; unitPrice: string; tooltipDetail: (next: number) => string; disabled: boolean; revision: number;
  onChange: (field: CostEstimateField, next: number) => void; onInvalid: (field: CostEstimateField, invalid: boolean) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState(false);
  const cancelBlur = useRef(false);
  // Controlled changes (slider/preset/reset) also replace an unfinished draft.
  useEffect(() => { setDraft(String(value)); setError(false); onInvalid(field, false); }, [value, revision, field, onInvalid]);
  function commit() {
    if (cancelBlur.current) { cancelBlur.current = false; return; }
    const number = Number(draft);
    if (!draft.trim() || !/^\d+(\.\d*)?$/.test(draft.trim()) || !Number.isFinite(number) || number < limit.min || number > limit.max) {
      setError(true); onInvalid(field, true); return;
    }
    const snapped = Number((limit.min + Math.round((number - limit.min) / limit.step) * limit.step).toFixed(6));
    if (snapped < limit.min || snapped > limit.max) { setError(true); onInvalid(field, true); return; }
    setDraft(String(snapped)); setError(false); onInvalid(field, false);
    if (snapped !== value) onChange(field, snapped);
  }
  return <Field className="space-y-1">
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 @lg:flex-nowrap">
      <div className="min-w-0 flex-1 @lg:w-28 @lg:flex-none"><FieldLabel className="px-0"><span className="flex items-center gap-2"><span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: badgeColors[costEstimateColors[category]] }} />{labels[category]}<span className="sr-only"> ({unit})</span></span></FieldLabel>
      <div className="flex min-w-0 items-center gap-1"><Input size="xs" variant="ghost" inputMode="decimal" aria-invalid={error || undefined} aria-describedby={error ? `${id}-error` : `${id}-detail`} disabled={disabled} value={draft} onFocus={() => { cancelBlur.current = false; }}
        onChange={(event) => { setDraft(event.target.value); onInvalid(field, true); }} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") commit(); if (event.key === "Escape") { cancelBlur.current = true; setDraft(String(value)); setError(false); onInvalid(field, false); event.currentTarget.blur(); } }} /><span className="shrink-0 text-label text-fg-subtle">{unit}</span></div>
      </div>
      <div className="order-3 w-full min-w-0 @lg:order-none @lg:w-auto @lg:flex-1"><Slider variant="ticks" tickCount={41} label={`${labels[category]} (${unit})`} value={value} min={limit.min} max={limit.max} step={limit.step} showSteps={false} showValue valuePosition="tooltip" showHoverPreview={false} fillStyle={{ backgroundColor: badgeColors[costEstimateColors[category]] }} renderTooltip={(next) => <div className="max-w-64 space-y-1"><p>{next} {unit}</p><p className="font-normal opacity-75">{tooltipDetail(next)}</p></div>} disabled={disabled} onChange={(next) => { if (typeof next === "number") { setDraft(String(next)); setError(false); onInvalid(field, false); onChange(field, next); } }} aria-describedby={`${id}-detail`} /></div>
      <div className="min-w-0 space-y-1 text-right @lg:w-28"><p className="break-all text-body font-medium tabular-nums text-fg-default">{amount}</p><p className="text-label tabular-nums text-fg-subtle">{unitPrice}</p></div>
    </div>
    <FieldDescription id={`${id}-detail`} className="px-0 @lg:sr-only">{detail}</FieldDescription>
    {error && <p id={`${id}-error`} role="alert" className="text-label text-fg-danger">{labels.invalidInput} {limit.min}–{limit.max}</p>}
  </Field>;
}

export function CostEstimateUsage({ value, result, rateCard, limits, labels, locale, disabled, revision, onChange, onInvalid }: {
  value: CostEstimateUsage; result: CostEstimateResult | null; rateCard: CostEstimateRateCard | null; limits: CostEstimateLimits;
  labels: CostEstimateLabels; locale: string; disabled: boolean; revision: number;
  onChange: (field: CostEstimateField, next: number) => void; onInvalid: (field: CostEstimateField, invalid: boolean) => void;
}) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  const details = {
    ingest: result ? `${labels.monthlyIngest} ${number.format(result.ingestGBMonth)} GB · ${rateCard!.billingDays} ${labels.retentionUnit}` : "—",
    storage: result ? `${labels.stored} ${number.format(result.storedGB)} GB · ${labels.compressed} ${rateCard!.compressionRatio}×` : "—",
    queries: `${number.format(value.scannedTBPerMonth)} ${labels.queriesUnit}`,
    seats: result ? `${labels.includedSeats} ${rateCard!.includedSeats} · ${labels.billableSeats} ${result.billableSeats}` : "—",
  };
  const tooltipDetails = {
    ingest: (next: number) => result ? `${labels.monthlyIngest} ${number.format(next * rateCard!.billingDays)} GB` : "—",
    storage: (next: number) => result ? `${labels.stored} ${number.format(value.ingestGBPerDay * next / rateCard!.compressionRatio)} GB · ${labels.compressed} ${rateCard!.compressionRatio}×` : "—",
    queries: (next: number) => `${number.format(next)} ${labels.queriesUnit}`,
    seats: (next: number) => result ? `${labels.includedSeats} ${rateCard!.includedSeats} · ${labels.billableSeats} ${Math.max(next - rateCard!.includedSeats, 0)}` : "—",
  };
  const rateUnits = { ingest: "GB", storage: "GB-mo", queries: "TB", seats: labels.seatsUnit };
  const unitPrice = (category: CostEstimateCategory) => result ? `${new Intl.NumberFormat(locale, { style: "currency", currency: result.currency, maximumFractionDigits: 6 }).format(Number(rateCard!.ratesMicros[category]) / 1_000_000)} / ${rateUnits[category]}` : "—";
  return <div className="space-y-4">{fields.map(({ field, category, unit }) => <UsageField key={field} field={field} category={category} unit={labels[unit]} value={value[field]} limit={limits[field]} labels={labels}
    amount={result ? costEstimateMoney(result.amountsMinor[category], result, locale) : "—"} detail={details[category]} unitPrice={unitPrice(category)} tooltipDetail={tooltipDetails[category]} disabled={disabled} revision={revision} onChange={onChange} onInvalid={onInvalid} />)}</div>;
}
