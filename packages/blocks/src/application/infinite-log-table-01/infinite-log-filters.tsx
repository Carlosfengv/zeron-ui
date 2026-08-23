"use client";

import { Button } from "@zeron/ui/button";
import { CheckboxGroup, CheckboxItem } from "@zeron/ui/checkbox-group";
import { AccordionContent, AccordionGroup, AccordionItem, AccordionTrigger } from "@zeron/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@zeron/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@zeron/ui/input-group";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger } from "@zeron/ui/select";
import { SliderComfortable } from "@zeron/ui/slider";
import { useIcon } from "@zeron/ui/system/icon-context";
import { DateTimeRangePicker, createRecentDateTimePreset, parseISODateTime } from "@zeron/ui/temporal-picker";
import type { DateTimeRangeValue, TemporalPreset } from "@zeron/ui/temporal-picker";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { infiniteLogOutcomeVisuals } from "./infinite-log-outcome";
import { formatInfiniteLogTimeRange } from "./infinite-log-time-range";
import { defaultInfiniteLogFilters } from "./infinite-log-types";
import type {
  HttpLogOutcome,
  InfiniteLogFilters as InfiniteLogFilterState,
  InfiniteLogMetadata,
  InfiniteLogTableLabels,
  LogRangeFacet,
  LogMethod,
  LogTiming,
  NumericRange,
} from "./infinite-log-types";

interface InfiniteLogFiltersProps {
  filters: InfiniteLogFilterState;
  metadata?: InfiniteLogMetadata;
  labels: InfiniteLogTableLabels;
  locale: string;
  onChange: (filters: InfiniteLogFilterState) => void;
  timeZone: string;
}

function toggleValue<T>(values: readonly T[], value: T) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

type LogTimeRangePresetId = "30m" | "1h" | "12h" | "24h" | "3d" | "7d" | "14d";
type LogTimeRangeLabelKey = "last30Minutes" | "lastHour" | "last12Hours" | "lastDay" | "last3Days" | "lastWeek" | "last2Weeks";

const logTimeRangePresetDefinitions: readonly {
  id: LogTimeRangePresetId;
  labelKey: LogTimeRangeLabelKey;
  amount: number;
  unit: "minute" | "hour" | "day";
}[] = [
  { id: "30m", labelKey: "last30Minutes", amount: 30, unit: "minute" },
  { id: "1h", labelKey: "lastHour", amount: 1, unit: "hour" },
  { id: "12h", labelKey: "last12Hours", amount: 12, unit: "hour" },
  { id: "24h", labelKey: "lastDay", amount: 24, unit: "hour" },
  { id: "3d", labelKey: "last3Days", amount: 3, unit: "day" },
  { id: "7d", labelKey: "lastWeek", amount: 7, unit: "day" },
  { id: "14d", labelKey: "last2Weeks", amount: 14, unit: "day" },
];

function timeRangeKey(timeRange?: InfiniteLogFilterState["timeRange"]) {
  return timeRange ? `${timeRange.from}/${timeRange.to}` : "";
}

function toDateTimeRangeValue(timeRange?: InfiniteLogFilterState["timeRange"]): DateTimeRangeValue | undefined {
  if (!timeRange?.from || !timeRange.to) return undefined;
  const from = parseISODateTime(timeRange.from);
  const to = parseISODateTime(timeRange.to);
  return from && to ? { from, to } : undefined;
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat(undefined, {
    compactDisplay: "short",
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

function FilterGroup({
  children,
  index,
  title,
  value,
}: {
  children: ReactNode;
  index: number;
  title: string;
  value: string;
}) {
  return (
    <AccordionItem index={index} value={value}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

function FacetOption<T extends string | number>({
  index,
  label,
  value,
  selected,
  count,
  detail,
  onToggle,
  markerClassName,
}: {
  index: number;
  label: string;
  value: T;
  selected: boolean;
  count?: number;
  detail?: string;
  onToggle: (value: T) => void;
  markerClassName?: string;
}) {
  const trailing = detail || count !== undefined ? (
    <span className="flex items-center gap-2">
      {detail && <span aria-hidden className={`size-2.5 shrink-0 rounded-sm ${markerClassName ?? "bg-fg-muted"}`} />}
      {detail && <span className="font-mono text-label text-fg-subtle">{detail}</span>}
      {count !== undefined && <span className="font-mono text-label tabular-nums text-fg-subtle">{formatCompactCount(count)}</span>}
    </span>
  ) : undefined;

  return (
    <CheckboxItem
      checked={selected}
      index={index}
      label={label}
      onToggle={() => onToggle(value)}
      trailing={trailing}
    />
  );
}

function FacetList({ checkedIndices, children, label }: { checkedIndices: Set<number>; children: ReactNode; label: string }) {
  return (
    <ScrollArea className="max-h-52 min-w-0 w-full rounded-lg border border-border-subtle bg-surface-floating" viewportClassName="min-w-0 w-full">
      <CheckboxGroup aria-label={label} checkedIndices={checkedIndices} className="min-w-0 w-full p-1">
        {children}
      </CheckboxGroup>
    </ScrollArea>
  );
}

export function RangeEditor({
  label,
  value,
  onApply,
}: {
  label: string;
  value?: NumericRange;
  onApply: (range?: NumericRange) => void;
}) {
  const [min, setMin] = useState(value?.min?.toString() ?? "");
  const [max, setMax] = useState(value?.max?.toString() ?? "");

  useEffect(() => {
    setMin(value?.min?.toString() ?? "");
    setMax(value?.max?.toString() ?? "");
  }, [value?.max, value?.min]);

  return (
    <FieldGroup className="grid-cols-2 gap-2">
      <Field className="gap-1.5">
        <FieldLabel className="px-1 text-label font-normal">Min.</FieldLabel>
        <InputGroup size="sm"><InputGroupInput aria-label={`${label} minimum`} inputMode="numeric" onChange={(event) => setMin(event.target.value)} placeholder="From" value={min} /></InputGroup>
      </Field>
      <Field className="gap-1.5">
        <FieldLabel className="px-1 text-label font-normal">Max.</FieldLabel>
        <InputGroup size="sm"><InputGroupInput aria-label={`${label} maximum`} inputMode="numeric" onChange={(event) => setMax(event.target.value)} placeholder="To" value={max} /></InputGroup>
      </Field>
      <Button className="col-span-2 justify-center" onClick={() => {
        const next = {
          min: min.trim() === "" ? undefined : Number(min),
          max: max.trim() === "" ? undefined : Number(max),
        };
        onApply(next.min === undefined && next.max === undefined ? undefined : next);
      }} size="sm" type="button" variant="tertiary">Apply</Button>
    </FieldGroup>
  );
}

const timingPhaseDefinitions: readonly {
  key: keyof LogTiming;
  label: string;
}[] = [
  { key: "dns", label: "DNS lookup" },
  { key: "connection", label: "TCP connection" },
  { key: "tls", label: "TLS handshake" },
  { key: "ttfb", label: "Time to first byte" },
  { key: "transfer", label: "Response transfer" },
];

function createTimingSliderDomain(facet?: LogRangeFacet, value?: NumericRange) {
  const observedMaximum = Math.max(1, facet?.max ?? 0, value?.min ?? 0, value?.max ?? 0);
  const step = observedMaximum <= 100 ? 1 : observedMaximum <= 1_000 ? 10 : observedMaximum <= 5_000 ? 50 : 100;
  return { min: 0, max: Math.ceil(observedMaximum / step) * step, step };
}

function TimingPhaseSliderEditor({
  facet,
  label,
  onApply,
  value,
}: {
  facet?: LogRangeFacet;
  label: string;
  onApply: (range?: NumericRange) => void;
  value?: NumericRange;
}) {
  // Keep the scale stable across Live facet updates so a handle does not move
  // under the pointer while the user is editing the range.
  const hasFacetDomain = useRef(facet?.max !== undefined);
  const [domain, setDomain] = useState(() => createTimingSliderDomain(facet, value));
  const facetMaximum = facet?.max;
  const valueMinimum = value?.min;
  const valueMaximum = value?.max;

  useEffect(() => {
    if (hasFacetDomain.current || facetMaximum === undefined) return;
    hasFacetDomain.current = true;
    setDomain(createTimingSliderDomain({ max: facetMaximum }, {
      max: valueMaximum,
      min: valueMinimum,
    }));
  }, [facetMaximum, valueMaximum, valueMinimum]);

  const clamp = useCallback((next: number) => Math.max(domain.min, Math.min(domain.max, next)), [domain.max, domain.min]);
  const [range, setRange] = useState<[number, number]>(() => [
    clamp(value?.min ?? domain.min),
    clamp(value?.max ?? domain.max),
  ]);

  useEffect(() => {
    setRange([
      clamp(value?.min ?? domain.min),
      clamp(value?.max ?? domain.max),
    ]);
  }, [clamp, domain.max, domain.min, value?.max, value?.min]);

  const commitRange = (committedRange: [number, number]) => {
    const next: NumericRange = {};
    if (committedRange[0] > domain.min) next.min = committedRange[0];
    if (committedRange[1] < domain.max) next.max = committedRange[1];
    onApply(Object.keys(next).length > 0 ? next : undefined);
  };

  return (
    <Field className="flex min-w-0 flex-col gap-2.5">
      <FieldLabel className="px-1 text-label font-normal">{label}</FieldLabel>
      <SliderComfortable
        disabled={facet?.max === undefined}
        formatValue={(current) => `${current} ms`}
        label={label}
        max={domain.max}
        min={domain.min}
        onChange={setRange}
        onValueCommit={commitRange}
        step={domain.step}
        showLabel={false}
        value={range}
        variant="scrubber"
      />
    </Field>
  );
}

function TimingPhaseFilters({
  metadata,
  onApply,
  timing,
}: {
  metadata?: InfiniteLogMetadata;
  onApply: (key: keyof LogTiming, range?: NumericRange) => void;
  timing?: InfiniteLogFilterState["timing"];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 py-1">
      {timingPhaseDefinitions.map((phase) => (
        <TimingPhaseSliderEditor
          facet={metadata?.facets.timing[phase.key]}
          key={phase.key}
          label={phase.label}
          onApply={(range) => onApply(phase.key, range)}
          value={timing?.[phase.key]}
        />
      ))}
    </div>
  );
}

export function TimeRangeFilter({
  labels,
  locale,
  onChange,
  timeRange,
  timeZone,
}: {
  labels: InfiniteLogTableLabels;
  locale: string;
  onChange: (timeRange?: InfiniteLogFilterState["timeRange"]) => void;
  timeRange?: InfiniteLogFilterState["timeRange"];
  timeZone: string;
}) {
  const Calendar = useIcon("calendar");
  const presets = useMemo<readonly TemporalPreset<DateTimeRangeValue>[]>(() => (
    logTimeRangePresetDefinitions.map((preset) => createRecentDateTimePreset({
      amount: preset.amount,
      id: preset.id,
      label: labels[preset.labelKey],
      unit: preset.unit,
    }))
  ), [labels]);
  const rangeKey = timeRangeKey(timeRange);
  const customRangeLabel = timeRange ? formatInfiniteLogTimeRange(timeRange, timeZone) : labels.customTimeRange;
  const previousRangeKey = useRef(rangeKey);
  const pendingCustomOpen = useRef(false);
  const appliedPreset = useRef<{ id: string; rangeKey: string } | undefined>(undefined);
  const [selection, setSelection] = useState<string>(() => timeRange ? "custom" : "");
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  useEffect(() => {
    if (rangeKey === previousRangeKey.current) return;
    previousRangeKey.current = rangeKey;
    const preset = appliedPreset.current;
    setSelection(rangeKey ? preset?.rangeKey === rangeKey ? preset.id : "custom" : "");
    if (!rangeKey) setCustomDialogOpen(false);
  }, [rangeKey]);

  return (
    <FieldGroup className="min-w-0 w-full gap-1.5">
      <Select
        itemDensity="compact"
        onOpenChange={(open) => {
          if (!open && pendingCustomOpen.current) {
            pendingCustomOpen.current = false;
            setCustomDialogOpen(true);
          }
        }}
        onValueChange={(value) => {
          if (value === "custom") {
            pendingCustomOpen.current = true;
            return;
          }
          pendingCustomOpen.current = false;
          setCustomDialogOpen(false);
          const preset = presets.find((item) => item.id === value);
          if (preset) {
            const nextRange = preset.resolve({ locale, now: new Date(), timeZone });
            appliedPreset.current = { id: preset.id, rangeKey: timeRangeKey(nextRange) };
            setSelection(preset.id);
            onChange(nextRange);
          }
        }}
        size="sm"
        value={selection}
      >
        <SelectTrigger
          aria-label={labels.timeRange}
          className="w-full min-w-0 max-w-full overflow-hidden"
          icon={Calendar}
          placeholder={labels.timeRangePlaceholder}
          title={customRangeLabel}
          wrapperClassName="min-w-0 w-full"
        />
        <SelectContent>
          {presets.map((preset) => <SelectItem key={preset.id} value={preset.id}>{preset.label}</SelectItem>)}
          <SelectSeparator />
          <SelectItem
            label={customRangeLabel}
            onClick={() => { pendingCustomOpen.current = true; }}
            textValue={labels.customTimeRange}
            value="custom"
          >
            {labels.customTimeRange}
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog onOpenChange={setCustomDialogOpen} open={customDialogOpen}>
        <DialogContent className="max-h-[min(90svh,46rem)] max-w-[42rem] overflow-y-auto p-0" size="lg">
          <DialogHeader className="sr-only"><DialogTitle>{labels.customTimeRange}</DialogTitle></DialogHeader>
          <DateTimeRangePicker
            className="w-full [&_[data-slot=date-time-range-picker-panel]]:min-w-0"
            closeOnCommit
            commitMode="apply"
            locale={locale}
            onOpenChange={setCustomDialogOpen}
            onValueChange={(value) => {
              appliedPreset.current = undefined;
              onChange(value);
            }}
            open={customDialogOpen}
            presentation="inline"
            size="sm"
            timeZone={timeZone}
            value={toDateTimeRangeValue(timeRange)}
          />
        </DialogContent>
      </Dialog>
    </FieldGroup>
  );
}

export const InfiniteLogFilters = memo(function InfiniteLogFilters({ filters, metadata, labels, locale, onChange, timeZone }: InfiniteLogFiltersProps) {
  const Filter = useIcon("settings");
  const Search = useIcon("search");
  const outcomeCounts = useMemo(
    () => new Map(metadata?.facets.outcomes.values.map((entry) => [entry.value, entry.count])),
    [metadata?.facets.outcomes.values],
  );

  const patch = (next: Partial<InfiniteLogFilterState>) => onChange({ ...filters, ...next });
  const patchTiming = (key: keyof NonNullable<InfiniteLogFilterState["timing"]>, range?: NumericRange) => {
    const nextTiming = { ...(filters.timing ?? {}) };
    if (range) nextTiming[key] = range;
    else delete nextTiming[key];
    patch({ timing: Object.keys(nextTiming).length > 0 ? nextTiming : undefined });
  };

  return (
    <aside aria-label="Log filters" className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-surface-base">
      <div className="flex min-h-control-lg items-center justify-between border-b border-border-subtle px-3 py-2.5">
        <span className="flex items-center gap-2 text-body font-medium text-fg-default"><Filter aria-hidden className="size-4" />{labels.filters}</span>
        <Button onClick={() => onChange(defaultInfiniteLogFilters)} size="sm" type="button" variant="ghost">{labels.clearAll}</Button>
      </div>
      <ScrollArea className="min-h-0 flex-1" viewportClassName="overscroll-contain p-2">
        <AccordionGroup className="min-w-0 w-full" defaultValue={["time-range", "outcome"]} type="multiple">
        <FilterGroup index={0} title={labels.timeRange} value="time-range">
          <TimeRangeFilter labels={labels} locale={locale} onChange={(timeRange) => patch({ timeRange })} timeRange={filters.timeRange} timeZone={timeZone} />
        </FilterGroup>

        <FilterGroup index={1} title={labels.outcome} value="outcome">
          <FacetList checkedIndices={new Set((["success", "warning", "error"] as const).flatMap((outcome, index) => filters.outcomes.includes(outcome) ? [index] : []))} label={labels.outcome}>
            {(["success", "warning", "error"] as const).map((outcome: HttpLogOutcome, index) => (
              <FacetOption
                count={outcomeCounts.get(outcome)}
                detail={outcome === "success" ? "2xx" : outcome === "warning" ? "4xx" : "5xx"}
                index={index}
                key={outcome}
                label={outcome}
                markerClassName={infiniteLogOutcomeVisuals[outcome].markerClassName}
                onToggle={(value) => patch({ outcomes: toggleValue(filters.outcomes, value) })}
                selected={filters.outcomes.includes(outcome)}
                value={outcome}
              />
            ))}
          </FacetList>
        </FilterGroup>

        <FilterGroup index={2} title={labels.status} value="status">
          <FacetList checkedIndices={new Set(metadata?.facets.statuses.values.flatMap((entry, index) => filters.statuses.includes(entry.value) ? [index] : []))} label={labels.status}>{metadata?.facets.statuses.values.map((entry, index) => <FacetOption count={entry.count} index={index} key={entry.value} label={String(entry.value)} onToggle={(value) => patch({ statuses: toggleValue(filters.statuses, value) })} selected={filters.statuses.includes(entry.value)} value={entry.value} />)}</FacetList>
        </FilterGroup>

        <FilterGroup index={3} title={labels.method} value="method">
          <FacetList checkedIndices={new Set(metadata?.facets.methods.values.flatMap((entry, index) => filters.methods.includes(entry.value) ? [index] : []))} label={labels.method}>{metadata?.facets.methods.values.map((entry, index) => <FacetOption count={entry.count} index={index} key={entry.value} label={entry.value} onToggle={(value: LogMethod) => patch({ methods: toggleValue(filters.methods, value) })} selected={filters.methods.includes(entry.value)} value={entry.value} />)}</FacetList>
        </FilterGroup>

        <FilterGroup index={4} title={labels.region} value="region">
          <FacetList checkedIndices={new Set(metadata?.facets.regions.values.flatMap((entry, index) => filters.regions.includes(entry.value) ? [index] : []))} label={labels.region}>{metadata?.facets.regions.values.map((entry, index) => <FacetOption count={entry.count} index={index} key={entry.value} label={entry.value} onToggle={(value) => patch({ regions: toggleValue(filters.regions, value) })} selected={filters.regions.includes(entry.value)} value={entry.value} />)}</FacetList>
        </FilterGroup>

        <FilterGroup index={5} title={labels.host} value="host">
          <InputGroup size="sm"><InputGroupAddon><Search aria-hidden /></InputGroupAddon><InputGroupInput aria-label={labels.host} onChange={(event) => patch({ host: event.target.value })} placeholder="Search" value={filters.host} /></InputGroup>
        </FilterGroup>
        <FilterGroup index={6} title={labels.pathname} value="pathname">
          <InputGroup size="sm"><InputGroupAddon><Search aria-hidden /></InputGroupAddon><InputGroupInput aria-label={labels.pathname} onChange={(event) => patch({ pathname: event.target.value })} placeholder="Search" value={filters.pathname} /></InputGroup>
        </FilterGroup>
        <FilterGroup index={7} title={labels.latency} value="latency">
          <RangeEditor label={labels.latency} onApply={(latency) => patch({ latency })} value={filters.latency} />
        </FilterGroup>
        <FilterGroup index={8} title={labels.timingPhases} value="timing-phases">
          <TimingPhaseFilters metadata={metadata} onApply={patchTiming} timing={filters.timing} />
        </FilterGroup>
        </AccordionGroup>
      </ScrollArea>
    </aside>
  );
});
