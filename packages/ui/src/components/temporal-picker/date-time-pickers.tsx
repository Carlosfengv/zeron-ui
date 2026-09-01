"use client";

import * as React from "react";
import { Button } from "#components/button";
import { Calendar } from "#components/calendar";
import { TimeField } from "./time-field";
import { PickerHeader, PresetList, dateDisabled, pickerCalendarFormatters, pickerCalendarLabels, useActivePreset, usePickerCore } from "./date-and-time-pickers";
import { TemporalPickerActions, TemporalPickerShell } from "./temporal-picker-shell";
import type {
  DateTimePickerProps,
  DateTimeRangePickerProps,
  DateTimeRangeValue,
  ISODateString,
  ISODateTimeString,
  ISOTimeString,
  TemporalPreset,
  TemporalRangeEndpoint,
} from "./temporal-types";
import {
  calendarDateToISODate,
  compareISODateTime,
  dateToCalendarDate,
  formatISODateTime,
  instantToZonedDateTime,
  resolveZonedDateTime,
  temporalValueEquals,
  type ZonedDateTimeResolution,
} from "./temporal-utils";

interface DateTimeDraft {
  date?: ISODateString;
  time?: ISOTimeString;
  selectedInstant?: ISODateTimeString;
}

type DateTimeFieldOptions = Pick<DateTimePickerProps, "granularity" | "hourCycle" | "minuteStep" | "secondStep"> & {
  isTimeUnavailable?: (time: ISOTimeString, context: { date: ISODateString; timeZone: string; endpoint?: TemporalRangeEndpoint }) => boolean;
  maxTime?: ISOTimeString;
  minTime?: ISOTimeString;
};

function draftFromInstant(value: ISODateTimeString | undefined, timeZone: string): DateTimeDraft {
  if (!value) return {};
  const local = instantToZonedDateTime(value, timeZone);
  return { date: local.date, time: local.time, selectedInstant: value };
}

function formatOffset(offsetMinutes: number) {
  const sign = offsetMinutes >= 0 ? "+" : "−";
  const absolute = Math.abs(offsetMinutes);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

function resolutionForDraft(
  draft: DateTimeDraft,
  timeZone: string,
  disambiguation: "earlier" | "later" | "reject",
): ZonedDateTimeResolution | undefined {
  if (!draft.date || !draft.time) return undefined;
  const resolution = resolveZonedDateTime(draft.date, draft.time, timeZone, disambiguation);
  if (resolution.kind !== "ambiguous" || !draft.selectedInstant) return resolution;
  const selected = resolution.candidates.find((candidate) => candidate.value === draft.selectedInstant);
  return selected ? { kind: "resolved", ...selected } : resolution;
}

function resolutionValue(resolution: ZonedDateTimeResolution | undefined): ISODateTimeString | undefined {
  return resolution?.kind === "resolved" ? resolution.value : undefined;
}

function DateTimeFields({
  active,
  draft,
  endpoint,
  messages,
  onChange,
  onSelectAmbiguous,
  resolution,
  props,
  timeZone,
}: {
  active?: boolean;
  draft: DateTimeDraft;
  endpoint?: TemporalRangeEndpoint;
  messages: { start: string; end: string; selectTime: string; unavailableValue: string; ambiguousTime: string; nonexistentTime: string; earlierOccurrence: string; laterOccurrence: string };
  onChange: (next: DateTimeDraft) => void;
  onSelectAmbiguous: (value: ISODateTimeString) => void;
  resolution: ZonedDateTimeResolution | undefined;
  props: DateTimeFieldOptions;
  timeZone: string;
}) {
  const label = endpoint === "start" ? messages.start : endpoint === "end" ? messages.end : messages.selectTime;
  const unavailable = draft.date && draft.time
    ? props.isTimeUnavailable?.(draft.time, { date: draft.date, timeZone, ...(endpoint ? { endpoint } : {}) })
    : false;
  return (
    <div className={active === undefined ? "grid gap-1.5" : "grid gap-1.5 p-2"} data-active={active || undefined}>
      {endpoint && <span className="text-label font-medium text-fg-muted">{label}</span>}
      <TimeField
        aria-label={label}
        className="w-full [&_[data-slot=time-field-column]]:min-w-0"
        granularity={props.granularity}
        hourCycle={props.hourCycle}
        invalid={Boolean(unavailable || resolution?.kind === "nonexistent" || resolution?.kind === "ambiguous")}
        maxValue={props.maxTime}
        minValue={props.minTime}
        minuteStep={props.minuteStep}
        onValueChange={(time) => onChange({ ...draft, time, selectedInstant: undefined })}
        secondStep={props.secondStep}
        value={draft.time}
      />
      {unavailable && <p className="text-label text-fg-danger" role="alert">{messages.unavailableValue}</p>}
      {resolution?.kind === "nonexistent" && <p className="text-label text-fg-danger" role="alert">{messages.nonexistentTime}</p>}
      {resolution?.kind === "ambiguous" && (
        <div className="grid gap-1 rounded-md bg-emphasis p-1.5" role="group" aria-label={messages.ambiguousTime}>
          <span className="px-1 text-label text-fg-muted">{messages.ambiguousTime}</span>
          {resolution.candidates.map((candidate, index) => (
            <Button key={candidate.value} onClick={() => onSelectAmbiguous(candidate.value)} size="sm" type="button" variant="tertiary">
              {index === 0 ? messages.earlierOccurrence : messages.laterOccurrence} · {formatOffset(candidate.offsetMinutes)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function instantValid(
  value: ISODateTimeString | undefined,
  options: Pick<DateTimePickerProps, "minValue" | "maxValue" | "isDateTimeUnavailable">,
) {
  return Boolean(value
    && (!options.minValue || compareISODateTime(value, options.minValue) >= 0)
    && (!options.maxValue || compareISODateTime(value, options.maxValue) <= 0)
    && !options.isDateTimeUnavailable?.(value));
}

export const DateTimePicker = React.forwardRef<HTMLButtonElement, DateTimePickerProps>(function DateTimePicker(props, ref) {
  const core = usePickerCore(props, "apply");
  const locale = props.locale ?? "en-US";
  const timeZone = props.timeZone ?? "UTC";
  const disambiguation = props.disambiguation ?? "reject";
  const [draft, setDraft] = React.useState<DateTimeDraft>(() => draftFromInstant(core.committedValue, timeZone));
  const { activePresetId, clearActivePreset, selectPreset: setActivePreset } = useActivePreset(core.committedValue);
  React.useEffect(() => { if (!core.isOpen) setDraft(draftFromInstant(core.committedValue, timeZone)); }, [core.committedValue, core.isOpen, timeZone]);
  const resolution = resolutionForDraft(draft, timeZone, disambiguation);
  const value = resolutionValue(resolution);
  const draftTimeUnavailable = draft.date && draft.time ? props.isTimeUnavailable?.(draft.time, { date: draft.date, timeZone }) : false;
  const valid = Boolean(value && (!draft.date || !props.isDateUnavailable?.(draft.date)) && !draftTimeUnavailable && instantValid(value, props));
  const update = (next: DateTimeDraft) => { setDraft(next); core.updateDraft(resolutionValue(resolutionForDraft(next, timeZone, disambiguation))); clearActivePreset(); };
  const selectPreset = (preset: TemporalPreset<ISODateTimeString>) => {
    const nextValue = preset.resolve({ now: (props.now ?? (() => new Date()))(), locale, timeZone });
    if (!instantValid(nextValue, props)) return;
    setActivePreset(preset.id, nextValue);
    setDraft(draftFromInstant(nextValue, timeZone));
    core.updateDraft(nextValue);
    if (core.presetBehavior === "commit") core.submit(nextValue, { source: "preset", presetId: preset.id });
  };
  const summary = core.committedValue ? props.formatValue?.(core.committedValue, timeZone) ?? formatISODateTime(core.committedValue, locale, timeZone, props.granularity === "second") : props.placeholder ?? core.messages.selectDateTime;
  const panel = (
    <div className="w-[19rem] max-w-full" data-slot="date-time-picker-panel">
      <PickerHeader>{core.messages.selectDateTime}</PickerHeader>
      <PresetList activePresetId={activePresetId} onSelect={selectPreset} presets={props.presets} title={core.messages.presets} />
      <div className="p-1">
        <Calendar
          className="w-full"
          disabled={(date) => dateDisabled(date, { isDateUnavailable: props.isDateUnavailable })}
          formatters={pickerCalendarFormatters(locale)}
          labels={pickerCalendarLabels(locale)}
          lang={locale}
          mode="single"
          onSelect={(date) => update({ ...draft, date: date ? calendarDateToISODate(date) : undefined, selectedInstant: undefined })}
          selected={draft.date ? dateToCalendarDate(draft.date) : undefined}
        />
      </div>
      <div className="border-t border-border-subtle"><DateTimeFields draft={draft} messages={core.messages} onChange={update} onSelectAmbiguous={(selectedInstant) => update({ ...draft, selectedInstant })} props={{ granularity: props.granularity, hourCycle: props.hourCycle, minuteStep: props.minuteStep, secondStep: props.secondStep, isTimeUnavailable: props.isTimeUnavailable }} resolution={resolution} timeZone={timeZone} /></div>
      <TemporalPickerActions applyDisabled={!valid || temporalValueEquals(value, core.committedValue)} clearable={Boolean(core.committedValue || draft.date || draft.time)} messages={core.messages} onApply={() => valid && value && core.submit(value, { source: "apply", presetId: activePresetId })} onCancel={core.cancel} onClear={() => { clearActivePreset(); setDraft({}); core.submit(undefined, { source: "clear" }); }} showApply={core.commitMode === "apply"} />
    </div>
  );
  return <TemporalPickerShell ariaDescribedBy={props["aria-describedby"]} ariaLabel={props["aria-label"] ?? `${core.messages.selectDateTime}: ${String(summary)}`} ariaLabelledBy={props["aria-labelledby"]} className={props.className} disabled={props.disabled} isOpen={core.isOpen} onRequestClose={core.cancel} onRequestOpen={core.open} presentation={props.presentation} readOnly={props.readOnly} ref={ref} size={props.size} summary={summary} triggerId={props.id}>{panel}</TemporalPickerShell>;
});

interface DateTimeRangeDraft { start: DateTimeDraft; end: DateTimeDraft; }

function rangeDraftFromValue(value: DateTimeRangeValue | undefined, timeZone: string): DateTimeRangeDraft {
  return { start: draftFromInstant(value?.from, timeZone), end: draftFromInstant(value?.to, timeZone) };
}

export const DateTimeRangePicker = React.forwardRef<HTMLButtonElement, DateTimeRangePickerProps>(function DateTimeRangePicker(props, ref) {
  const core = usePickerCore(props, "apply");
  const locale = props.locale ?? "en-US";
  const timeZone = props.timeZone ?? "UTC";
  const disambiguation = props.disambiguation ?? "reject";
  const [draft, setDraft] = React.useState<DateTimeRangeDraft>(() => rangeDraftFromValue(core.committedValue, timeZone));
  const [activeEndpoint, setActiveEndpoint] = React.useState<TemporalRangeEndpoint>("start");
  const { activePresetId, clearActivePreset, selectPreset: setActivePreset } = useActivePreset(core.committedValue);
  React.useEffect(() => { if (!core.isOpen) { setDraft(rangeDraftFromValue(core.committedValue, timeZone)); setActiveEndpoint("start"); } }, [core.committedValue, core.isOpen, timeZone]);
  const startResolution = resolutionForDraft(draft.start, timeZone, disambiguation);
  const endResolution = resolutionForDraft(draft.end, timeZone, disambiguation);
  const startValue = resolutionValue(startResolution);
  const endValue = resolutionValue(endResolution);
  const endpointValid = (value: ISODateTimeString | undefined, endpoint: TemporalRangeEndpoint, local: DateTimeDraft) => {
    const localTimeUnavailable = local.date && local.time ? props.isTimeUnavailable?.(local.time, { date: local.date, timeZone, endpoint }) : false;
    return Boolean(value
      && (!local.date || !props.isDateUnavailable?.(local.date, endpoint))
      && !localTimeUnavailable
      && (!props.minValue || compareISODateTime(value, props.minValue) >= 0)
      && (!props.maxValue || compareISODateTime(value, props.maxValue) <= 0)
      && !props.isDateTimeUnavailable?.(value, endpoint));
  };
  const value = startValue && endValue && endpointValid(startValue, "start", draft.start) && endpointValid(endValue, "end", draft.end)
    && compareISODateTime(startValue, endValue) <= 0
    && (!props.minDurationMs || Date.parse(endValue) - Date.parse(startValue) >= props.minDurationMs)
    && (!props.maxDurationMs || Date.parse(endValue) - Date.parse(startValue) <= props.maxDurationMs)
    ? { from: startValue, to: endValue }
    : undefined;
  const updateEndpoint = (endpoint: TemporalRangeEndpoint, next: DateTimeDraft) => {
    const nextDraft = { ...draft, [endpoint]: next };
    setDraft(nextDraft);
    const nextStart = resolutionValue(resolutionForDraft(nextDraft.start, timeZone, disambiguation));
    const nextEnd = resolutionValue(resolutionForDraft(nextDraft.end, timeZone, disambiguation));
    const nextValue = nextStart && nextEnd && endpointValid(nextStart, "start", nextDraft.start) && endpointValid(nextEnd, "end", nextDraft.end) && compareISODateTime(nextStart, nextEnd) <= 0 ? { from: nextStart, to: nextEnd } : undefined;
    core.updateDraft(nextValue);
    clearActivePreset();
  };
  const selectPreset = (preset: TemporalPreset<DateTimeRangeValue>) => {
    const next = preset.resolve({ now: (props.now ?? (() => new Date()))(), locale, timeZone });
    if (compareISODateTime(next.from, next.to) > 0) return;
    setActivePreset(preset.id, next);
    setDraft(rangeDraftFromValue(next, timeZone));
    core.updateDraft(next);
    if (core.presetBehavior === "commit") core.submit(next, { source: "preset", presetId: preset.id });
  };
  const activeDraft = draft[activeEndpoint];
  const endpointsShareDate = Boolean(draft.start.date && draft.start.date === draft.end.date);
  const summary = core.committedValue ? props.formatValue?.(core.committedValue, timeZone) ?? `${formatISODateTime(core.committedValue.from, locale, timeZone, props.granularity === "second")} – ${formatISODateTime(core.committedValue.to, locale, timeZone, props.granularity === "second")}` : props.placeholder ?? core.messages.selectDateTime;
  const panel = (
    <div className="w-[34rem] max-w-[92vw]" data-slot="date-time-range-picker-panel">
      <PickerHeader>{core.messages.selectDateTime}</PickerHeader>
      <PresetList activePresetId={activePresetId} onSelect={selectPreset} presets={props.presets} title={core.messages.presets} />
      <div className="grid divide-y divide-border-subtle md:grid-cols-[minmax(0,1.2fr)_minmax(15rem,1fr)] md:divide-x md:divide-y-0">
        <div className="min-w-0 p-1">
          <Calendar
            className="w-full"
            disabled={(date) => dateDisabled(date, { isDateUnavailable: (value) => props.isDateUnavailable?.(value, activeEndpoint) ?? false })}
            formatters={pickerCalendarFormatters(locale)}
            labels={pickerCalendarLabels(locale)}
            lang={locale}
            mode="single"
            numberOfMonths={props.numberOfMonths ?? 1}
            onSelect={(date) => updateEndpoint(activeEndpoint, { ...activeDraft, date: date ? calendarDateToISODate(date) : undefined, selectedInstant: undefined })}
            selected={activeDraft.date ? dateToCalendarDate(activeDraft.date) : undefined}
          />
        </div>
        <div className="grid min-w-0 content-start gap-2">
          <div className="text-left" onFocus={() => setActiveEndpoint("start")} onPointerDown={() => setActiveEndpoint("start")}>
            <DateTimeFields active={activeEndpoint === "start"} draft={draft.start} endpoint="start" messages={core.messages} onChange={(next) => updateEndpoint("start", next)} onSelectAmbiguous={(selectedInstant) => updateEndpoint("start", { ...draft.start, selectedInstant })} props={{ granularity: props.granularity, hourCycle: props.hourCycle, maxTime: endpointsShareDate ? draft.end.time : undefined, minuteStep: props.minuteStep, secondStep: props.secondStep, isTimeUnavailable: (time, context) => props.isTimeUnavailable?.(time, { ...context, endpoint: context.endpoint ?? "start" }) ?? false }} resolution={startResolution} timeZone={timeZone} />
          </div>
          <div className="text-left" onFocus={() => setActiveEndpoint("end")} onPointerDown={() => setActiveEndpoint("end")}>
            <DateTimeFields active={activeEndpoint === "end"} draft={draft.end} endpoint="end" messages={core.messages} onChange={(next) => updateEndpoint("end", next)} onSelectAmbiguous={(selectedInstant) => updateEndpoint("end", { ...draft.end, selectedInstant })} props={{ granularity: props.granularity, hourCycle: props.hourCycle, minTime: endpointsShareDate ? draft.start.time : undefined, minuteStep: props.minuteStep, secondStep: props.secondStep, isTimeUnavailable: (time, context) => props.isTimeUnavailable?.(time, { ...context, endpoint: context.endpoint ?? "end" }) ?? false }} resolution={endResolution} timeZone={timeZone} />
          </div>
          {startValue && endValue && compareISODateTime(startValue, endValue) > 0 && <p className="text-label text-fg-danger" role="alert">{core.messages.startAfterEnd}</p>}
        </div>
      </div>
      <TemporalPickerActions applyDisabled={!value || temporalValueEquals(value, core.committedValue)} clearable={Boolean(core.committedValue || draft.start.date || draft.end.date)} messages={core.messages} onApply={() => value && core.submit(value, { source: "apply", presetId: activePresetId })} onCancel={core.cancel} onClear={() => { clearActivePreset(); setDraft({ start: {}, end: {} }); core.submit(undefined, { source: "clear" }); }} showApply={core.commitMode === "apply"} />
    </div>
  );
  return <TemporalPickerShell ariaDescribedBy={props["aria-describedby"]} ariaLabel={props["aria-label"] ?? `${core.messages.selectDateTime}: ${String(summary)}`} ariaLabelledBy={props["aria-labelledby"]} className={props.className} disabled={props.disabled} isOpen={core.isOpen} onRequestClose={core.cancel} onRequestOpen={core.open} presentation={props.presentation} readOnly={props.readOnly} ref={ref} size={props.size} summary={summary} triggerId={props.id}>{panel}</TemporalPickerShell>;
});
