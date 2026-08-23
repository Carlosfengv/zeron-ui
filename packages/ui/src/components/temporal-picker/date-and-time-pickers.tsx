"use client";

import * as React from "react";
import { Calendar } from "#components/calendar";
import { Button } from "#components/button";
import type { DateRange } from "react-day-picker";
import { TimeField } from "./time-field";
import { TemporalPickerActions, TemporalPickerShell } from "./temporal-picker-shell";
import type {
  DatePickerProps,
  DateRangePickerProps,
  DateRangeValue,
  ISODateString,
  ISOTimeString,
  TemporalChangeContext,
  TemporalPickerCommonProps,
  TemporalPreset,
  TimePickerProps,
  TimeRangePickerProps,
  TimeRangeValue,
} from "./temporal-types";
import { defaultTemporalPickerMessages } from "./temporal-types";
import {
  calendarDateToISODate,
  compareISODate,
  compareISOTime,
  dateToCalendarDate,
  formatISODate,
  formatISOTime,
  selectedDayCount,
  temporalValueEquals,
} from "./temporal-utils";
import { isControlledProp, useTemporalOpenState, useTemporalValueState } from "./use-temporal-picker-state";

interface CoreProps<TValue> extends TemporalPickerCommonProps {
  value?: TValue;
  defaultValue?: TValue;
  onValueChange?: (value: TValue | undefined, context: TemporalChangeContext) => void;
}

export function usePickerCore<TValue>(props: CoreProps<TValue>, defaultCommitMode: "complete" | "apply") {
  const valueControlled = isControlledProp(props, "value");
  const openControlled = isControlledProp(props, "open");
  const { committedValue, commit } = useTemporalValueState({
    controlled: valueControlled,
    value: props.value,
    defaultValue: props.defaultValue,
    onValueChange: props.onValueChange,
  });
  const { isOpen, setOpen } = useTemporalOpenState({
    controlled: openControlled,
    open: props.open,
    defaultOpen: props.defaultOpen,
    onOpenChange: props.onOpenChange,
  });
  const [draft, setDraftState] = React.useState<TValue | undefined>(committedValue);
  const [dirty, setDirty] = React.useState(false);
  const commitMode = props.commitMode ?? defaultCommitMode;
  const presetBehavior = commitMode === "complete" ? "commit" : props.presetBehavior ?? "draft";
  const closeOnCommit = props.closeOnCommit ?? props.presentation !== "inline";
  const messages = { ...defaultTemporalPickerMessages, ...props.messages };

  React.useEffect(() => {
    if (!isOpen) {
      setDraftState(committedValue);
      setDirty(false);
    }
  }, [committedValue, isOpen]);

  const open = React.useCallback(() => {
    if (props.disabled || props.readOnly) return;
    setDraftState(committedValue);
    setDirty(false);
    setOpen(true);
  }, [committedValue, props.disabled, props.readOnly, setOpen]);
  const cancel = React.useCallback(() => {
    setDraftState(committedValue);
    setDirty(false);
    setOpen(false);
  }, [committedValue, setOpen]);
  const updateDraft = React.useCallback((next: TValue | undefined) => {
    setDraftState(next);
    setDirty(!temporalValueEquals(next, committedValue));
  }, [committedValue]);
  const submit = React.useCallback((next: TValue | undefined, context: TemporalChangeContext) => {
    commit(next, context);
    setDraftState(next);
    setDirty(false);
    if (closeOnCommit) setOpen(false);
  }, [closeOnCommit, commit, setOpen]);

  return { cancel, closeOnCommit, commitMode, committedValue, dirty, draft, isOpen, messages, open, presetBehavior, setOpen, submit, updateDraft };
}

/** Keeps a semantic preset selected across a controlled value echo, but clears it for outside changes. */
export function useActivePreset<TValue>(committedValue: TValue | undefined) {
  const [activePreset, setActivePreset] = React.useState<{ id: string; value: TValue }>();
  const previousCommittedValue = React.useRef(committedValue);

  React.useEffect(() => {
    if (temporalValueEquals(previousCommittedValue.current, committedValue)) return;
    previousCommittedValue.current = committedValue;
    setActivePreset((current) => current && temporalValueEquals(current.value, committedValue) ? current : undefined);
  }, [committedValue]);

  return {
    activePresetId: activePreset?.id,
    clearActivePreset: () => setActivePreset(undefined),
    selectPreset: (id: string, value: TValue) => setActivePreset({ id, value }),
  };
}

export function PickerHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-border-subtle px-3 py-2.5 text-body font-medium text-fg-default">{children}</div>;
}

export function PresetList<TValue>({
  activePresetId,
  onSelect,
  presets,
  title,
}: {
  activePresetId?: string;
  onSelect: (preset: TemporalPreset<TValue>) => void;
  presets?: readonly TemporalPreset<TValue>[];
  title: string;
}) {
  if (!presets?.length) return null;
  const shortcutLabel = (preset: TemporalPreset<TValue>) => {
    const shortcut = preset.shortcut;
    if (!shortcut) return undefined;
    return [shortcut.ctrlKey ? "Control" : undefined, shortcut.altKey ? "Alt" : undefined, shortcut.shiftKey ? "Shift" : undefined, shortcut.metaKey ? "Meta" : undefined, shortcut.key.toUpperCase()].filter(Boolean).join("+");
  };
  return (
    <div
      className="border-b border-border-subtle p-2"
      data-slot="temporal-preset-list"
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        const matched = presets.find((preset) => {
          const shortcut = preset.shortcut;
          return shortcut
            && shortcut.key.toLowerCase() === event.key.toLowerCase()
            && Boolean(shortcut.altKey) === event.altKey
            && Boolean(shortcut.ctrlKey) === event.ctrlKey
            && Boolean(shortcut.metaKey) === event.metaKey
            && Boolean(shortcut.shiftKey) === event.shiftKey;
        });
        if (!matched) return;
        event.preventDefault();
        onSelect(matched);
      }}
    >
      <p className="px-1.5 pb-1 text-label font-medium text-fg-muted">{title}</p>
      <div className="grid gap-0.5 sm:grid-cols-2">
        {presets.map((preset) => (
          <Button
            active={activePresetId === preset.id}
            aria-keyshortcuts={shortcutLabel(preset)}
            className="justify-start text-left"
            key={preset.id}
            onClick={() => onSelect(preset)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <span className="min-w-0 truncate">{preset.label}</span>
            {shortcutLabel(preset) && <span className="ml-auto text-fg-subtle">{shortcutLabel(preset)}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function pickerCalendarFormatters(locale: string) {
  return {
    formatCaption: (date: Date) => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date),
    formatDay: (date: Date) => new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date),
    formatMonthDropdown: (date: Date) => new Intl.DateTimeFormat(locale, { month: "long" }).format(date),
    formatWeekdayName: (date: Date) => new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
    formatYearDropdown: (date: Date) => new Intl.DateTimeFormat(locale, { year: "numeric" }).format(date),
  };
}

export function pickerCalendarLabels(locale: string) {
  const fullDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", weekday: "long", year: "numeric" });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" });
  return {
    labelDayButton: (date: Date) => fullDate.format(date),
    labelWeekday: (date: Date) => weekday.format(date),
  };
}

export function dateDisabled(date: Date, options: {
  minValue?: ISODateString;
  maxValue?: ISODateString;
  isDateUnavailable?: (value: ISODateString) => boolean;
}) {
  const value = calendarDateToISODate(date);
  return Boolean((options.minValue && compareISODate(value, options.minValue) < 0)
    || (options.maxValue && compareISODate(value, options.maxValue) > 0)
    || options.isDateUnavailable?.(value));
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(props, ref) {
  const core = usePickerCore(props, "complete");
  const { activePresetId, clearActivePreset, selectPreset: setActivePreset } = useActivePreset(core.committedValue);
  const locale = props.locale ?? "en-US";
  const summary = core.committedValue
    ? props.formatValue?.(core.committedValue) ?? formatISODate(core.committedValue, locale)
    : props.placeholder ?? core.messages.selectDate;
  const valid = (value: ISODateString | undefined) => value !== undefined && !dateDisabled(dateToCalendarDate(value), props);
  const select = (value: ISODateString | undefined, context: TemporalChangeContext) => {
    if (!valid(value)) return;
    core.updateDraft(value);
    if (context.source !== "preset") clearActivePreset();
    if (core.commitMode === "complete") core.submit(value, context);
  };
  const selectPreset = (preset: TemporalPreset<ISODateString>) => {
    const value = preset.resolve({ now: (props.now ?? (() => new Date()))(), locale, timeZone: props.calendarTimeZone ?? "UTC" });
    if (!valid(value)) return;
    setActivePreset(preset.id, value);
    core.updateDraft(value);
    if (core.presetBehavior === "commit") core.submit(value, { source: "preset", presetId: preset.id });
  };
  const panel = (
    <div className="min-w-[18rem]" data-slot="date-picker-panel">
      <PickerHeader>{core.messages.selectDate}</PickerHeader>
      <PresetList activePresetId={activePresetId} onSelect={selectPreset} presets={props.presets} title={core.messages.presets} />
      <Calendar
        disabled={(date) => dateDisabled(date, props)}
        formatters={pickerCalendarFormatters(locale)}
        labels={pickerCalendarLabels(locale)}
        lang={locale}
        mode="single"
        onSelect={(date) => select(date ? calendarDateToISODate(date) : undefined, { source: "calendar" })}
        selected={core.draft ? dateToCalendarDate(core.draft) : undefined}
        showOutsideDays={props.showOutsideDays}
        weekStartsOn={props.firstDayOfWeek}
      />
      <TemporalPickerActions
        applyDisabled={!valid(core.draft) || temporalValueEquals(core.draft, core.committedValue)}
        clearable={Boolean(core.committedValue || core.draft)}
        messages={core.messages}
        onApply={() => valid(core.draft) && core.submit(core.draft, { source: "apply", presetId: activePresetId })}
        onCancel={core.cancel}
        onClear={() => { clearActivePreset(); core.submit(undefined, { source: "clear" }); }}
        showApply={core.commitMode === "apply"}
      />
    </div>
  );
  return <TemporalPickerShell ariaDescribedBy={props["aria-describedby"]} ariaLabel={props["aria-label"] ?? `${core.messages.selectDate}: ${String(summary)}`} ariaLabelledBy={props["aria-labelledby"]} className={props.className} disabled={props.disabled} isOpen={core.isOpen} onRequestClose={core.cancel} onRequestOpen={core.open} presentation={props.presentation} readOnly={props.readOnly} ref={ref} size={props.size} summary={summary} triggerId={props.id}>{panel}</TemporalPickerShell>;
});

type DateRangeDraft = Partial<DateRangeValue>;

function completeDateRange(value: DateRangeDraft | undefined): value is DateRangeValue {
  return Boolean(value?.from && value.to);
}

function rangeHasUnavailable(value: DateRangeValue, unavailable?: (date: ISODateString) => boolean) {
  if (!unavailable) return false;
  for (let cursor = dateToCalendarDate(value.from); cursor <= dateToCalendarDate(value.to); cursor.setDate(cursor.getDate() + 1)) {
    if (unavailable(calendarDateToISODate(cursor))) return true;
  }
  return false;
}

export const DateRangePicker = React.forwardRef<HTMLButtonElement, DateRangePickerProps>(function DateRangePicker(props, ref) {
  const core = usePickerCore(props, "complete");
  const [draft, setDraft] = React.useState<DateRangeDraft>(core.committedValue ?? {});
  const { activePresetId, clearActivePreset, selectPreset: setActivePreset } = useActivePreset(core.committedValue);
  const locale = props.locale ?? "en-US";
  React.useEffect(() => { if (!core.isOpen) setDraft(core.committedValue ?? {}); }, [core.committedValue, core.isOpen]);
  const valid = (value: DateRangeDraft): value is DateRangeValue => {
    if (!completeDateRange(value) || compareISODate(value.from, value.to) > 0) return false;
    if ((props.minValue && compareISODate(value.from, props.minValue) < 0) || (props.maxValue && compareISODate(value.to, props.maxValue) > 0)) return false;
    const days = selectedDayCount(value);
    if ((props.minDays && days < props.minDays) || (props.maxDays && days > props.maxDays)) return false;
    if (props.isDateUnavailable?.(value.from) || props.isDateUnavailable?.(value.to)) return false;
    if (!props.allowUnavailableInRange && rangeHasUnavailable(value, props.isDateUnavailable)) return false;
    return true;
  };
  const selectRange = (range: DateRange | undefined, context: TemporalChangeContext) => {
    const next: DateRangeDraft = { from: range?.from ? calendarDateToISODate(range.from) : undefined, to: range?.to ? calendarDateToISODate(range.to) : undefined };
    setDraft(next);
    core.updateDraft(valid(next) ? next : undefined);
    clearActivePreset();
    if (core.commitMode === "complete" && valid(next)) core.submit(next, context);
  };
  const selectPreset = (preset: TemporalPreset<DateRangeValue>) => {
    const next = preset.resolve({ now: (props.now ?? (() => new Date()))(), locale, timeZone: props.calendarTimeZone ?? "UTC" });
    if (!valid(next)) return;
    setActivePreset(preset.id, next);
    setDraft(next);
    core.updateDraft(next);
    if (core.presetBehavior === "commit") core.submit(next, { source: "preset", presetId: preset.id });
  };
  const summary = core.committedValue
    ? props.formatValue?.(core.committedValue) ?? `${formatISODate(core.committedValue.from, locale)} – ${formatISODate(core.committedValue.to, locale)}`
    : props.placeholder ?? core.messages.selectDate;
  const panel = (
    <div className="min-w-[18rem]" data-slot="date-range-picker-panel">
      <PickerHeader>{core.messages.selectDate}</PickerHeader>
      <PresetList activePresetId={activePresetId} onSelect={selectPreset} presets={props.presets} title={core.messages.presets} />
      <Calendar
        disabled={(date) => dateDisabled(date, props)}
        formatters={pickerCalendarFormatters(locale)}
        labels={pickerCalendarLabels(locale)}
        lang={locale}
        mode="range"
        numberOfMonths={props.numberOfMonths ?? 1}
        onSelect={(range) => selectRange(range, { source: "calendar" })}
        selected={draft.from ? { from: dateToCalendarDate(draft.from), to: draft.to ? dateToCalendarDate(draft.to) : undefined } : undefined}
        showOutsideDays={props.showOutsideDays}
        weekStartsOn={props.firstDayOfWeek}
      />
      <TemporalPickerActions
        applyDisabled={!valid(draft) || temporalValueEquals(draft as DateRangeValue | undefined, core.committedValue)}
        clearable={Boolean(core.committedValue || draft.from || draft.to)}
        messages={core.messages}
        onApply={() => valid(draft) && core.submit(draft, { source: "apply", presetId: activePresetId })}
        onCancel={core.cancel}
        onClear={() => { clearActivePreset(); setDraft({}); core.submit(undefined, { source: "clear" }); }}
        showApply={core.commitMode === "apply"}
      />
    </div>
  );
  return <TemporalPickerShell ariaDescribedBy={props["aria-describedby"]} ariaLabel={props["aria-label"] ?? `${core.messages.selectDate}: ${String(summary)}`} ariaLabelledBy={props["aria-labelledby"]} className={props.className} disabled={props.disabled} isOpen={core.isOpen} onRequestClose={core.cancel} onRequestOpen={core.open} presentation={props.presentation} readOnly={props.readOnly} ref={ref} size={props.size} summary={summary} triggerId={props.id}>{panel}</TemporalPickerShell>;
});

function timeValid(value: ISOTimeString | undefined, minValue?: ISOTimeString, maxValue?: ISOTimeString) {
  return Boolean(value && (!minValue || compareISOTime(value, minValue) >= 0) && (!maxValue || compareISOTime(value, maxValue) <= 0));
}

export const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(props, ref) {
  const core = usePickerCore(props, "complete");
  const { activePresetId, clearActivePreset, selectPreset: setActivePreset } = useActivePreset(core.committedValue);
  const locale = props.locale ?? "en-US";
  const valid = (value: ISOTimeString | undefined) => timeValid(value, props.minValue, props.maxValue);
  const select = (value: ISOTimeString | undefined, context: TemporalChangeContext) => {
    core.updateDraft(value);
    clearActivePreset();
    if (core.commitMode === "complete" && valid(value)) core.submit(value, context);
  };
  const selectPreset = (preset: TemporalPreset<ISOTimeString>) => {
    const value = preset.resolve({ now: (props.now ?? (() => new Date()))(), locale });
    if (!valid(value)) return;
    setActivePreset(preset.id, value);
    core.updateDraft(value);
    if (core.presetBehavior === "commit") core.submit(value, { source: "preset", presetId: preset.id });
  };
  const summary = core.committedValue ? props.formatValue?.(core.committedValue) ?? formatISOTime(core.committedValue, locale, props.hourCycle) : props.placeholder ?? core.messages.selectTime;
  const panel = (
    <div className="w-fit max-w-full" data-slot="time-picker-panel">
      <PickerHeader>{core.messages.selectTime}</PickerHeader>
      <PresetList activePresetId={activePresetId} onSelect={selectPreset} presets={props.presets} title={core.messages.presets} />
      <div className="p-3"><TimeField aria-label={core.messages.selectTime} granularity={props.granularity} hourCycle={props.hourCycle} maxValue={props.maxValue} minValue={props.minValue} minuteStep={props.minuteStep} onValueChange={(value) => select(value, { source: "time-field" })} secondStep={props.secondStep} size={props.size} value={core.draft} /></div>
      <TemporalPickerActions applyDisabled={!valid(core.draft) || temporalValueEquals(core.draft, core.committedValue)} clearable={Boolean(core.committedValue || core.draft)} messages={core.messages} onApply={() => valid(core.draft) && core.submit(core.draft, { source: "apply", presetId: activePresetId })} onCancel={core.cancel} onClear={() => { clearActivePreset(); core.submit(undefined, { source: "clear" }); }} showApply={core.commitMode === "apply"} />
    </div>
  );
  return <TemporalPickerShell ariaDescribedBy={props["aria-describedby"]} ariaLabel={props["aria-label"] ?? `${core.messages.selectTime}: ${String(summary)}`} ariaLabelledBy={props["aria-labelledby"]} className={props.className} disabled={props.disabled} icon="clock" isOpen={core.isOpen} onRequestClose={core.cancel} onRequestOpen={core.open} presentation={props.presentation} readOnly={props.readOnly} ref={ref} size={props.size} summary={summary} triggerId={props.id}>{panel}</TemporalPickerShell>;
});

type TimeRangeDraft = Partial<TimeRangeValue>;
function completeTimeRange(value: TimeRangeDraft | undefined): value is TimeRangeValue { return Boolean(value?.from && value.to); }

export const TimeRangePicker = React.forwardRef<HTMLButtonElement, TimeRangePickerProps>(function TimeRangePicker(props, ref) {
  const core = usePickerCore(props, "apply");
  const [draft, setDraft] = React.useState<TimeRangeDraft>(core.committedValue ?? {});
  const { activePresetId, clearActivePreset, selectPreset: setActivePreset } = useActivePreset(core.committedValue);
  const locale = props.locale ?? "en-US";
  React.useEffect(() => { if (!core.isOpen) setDraft(core.committedValue ?? {}); }, [core.committedValue, core.isOpen]);
  const valid = (value: TimeRangeDraft): value is TimeRangeValue => {
    if (!completeTimeRange(value) || !timeValid(value.from, props.minValue, props.maxValue) || !timeValid(value.to, props.minValue, props.maxValue)) return false;
    const comparison = compareISOTime(value.from, value.to);
    if (value.overnight) return Boolean(props.allowOvernight) && comparison > 0;
    return comparison <= 0;
  };
  const update = (next: TimeRangeDraft) => { setDraft(next); core.updateDraft(valid(next) ? next : undefined); clearActivePreset(); };
  const selectPreset = (preset: TemporalPreset<TimeRangeValue>) => {
    const next = preset.resolve({ now: (props.now ?? (() => new Date()))(), locale });
    if (!valid(next)) return;
    setActivePreset(preset.id, next); setDraft(next); core.updateDraft(next);
    if (core.presetBehavior === "commit") core.submit(next, { source: "preset", presetId: preset.id });
  };
  const summary = core.committedValue ? props.formatValue?.(core.committedValue) ?? `${formatISOTime(core.committedValue.from, locale, props.hourCycle)} – ${formatISOTime(core.committedValue.to, locale, props.hourCycle)}${core.committedValue.overnight ? ` (${core.messages.nextDay})` : ""}` : props.placeholder ?? core.messages.selectTime;
  const panel = (
    <div className="w-fit max-w-full" data-slot="time-range-picker-panel">
      <PickerHeader>{core.messages.selectTime}</PickerHeader>
      <PresetList activePresetId={activePresetId} onSelect={selectPreset} presets={props.presets} title={core.messages.presets} />
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <label className="grid gap-1 text-label text-fg-muted"><span>{core.messages.start}</span><TimeField aria-label={core.messages.start} granularity={props.granularity} hourCycle={props.hourCycle} maxValue={props.maxValue} minValue={props.minValue} minuteStep={props.minuteStep} onValueChange={(from) => update({ ...draft, from })} secondStep={props.secondStep} size={props.size} value={draft.from} /></label>
        <label className="grid gap-1 text-label text-fg-muted"><span>{core.messages.end}</span><TimeField aria-label={core.messages.end} granularity={props.granularity} hourCycle={props.hourCycle} maxValue={props.maxValue} minValue={props.minValue} minuteStep={props.minuteStep} onValueChange={(to) => update({ ...draft, to })} secondStep={props.secondStep} size={props.size} value={draft.to} /></label>
      </div>
      {props.allowOvernight && <label className="flex items-center gap-2 px-3 pb-3 text-label text-fg-muted"><input checked={Boolean(draft.overnight)} onChange={(event) => update({ ...draft, overnight: event.target.checked || undefined })} type="checkbox" /><span>{core.messages.nextDay}</span></label>}
      <TemporalPickerActions applyDisabled={!valid(draft) || temporalValueEquals(draft as TimeRangeValue | undefined, core.committedValue)} clearable={Boolean(core.committedValue || draft.from || draft.to)} messages={core.messages} onApply={() => valid(draft) && core.submit(draft, { source: "apply", presetId: activePresetId })} onCancel={core.cancel} onClear={() => { clearActivePreset(); setDraft({}); core.submit(undefined, { source: "clear" }); }} showApply={core.commitMode === "apply"} />
    </div>
  );
  return <TemporalPickerShell ariaDescribedBy={props["aria-describedby"]} ariaLabel={props["aria-label"] ?? `${core.messages.selectTime}: ${String(summary)}`} ariaLabelledBy={props["aria-labelledby"]} className={props.className} disabled={props.disabled} icon="clock" isOpen={core.isOpen} onRequestClose={core.cancel} onRequestOpen={core.open} presentation={props.presentation} readOnly={props.readOnly} ref={ref} size={props.size} summary={summary} triggerId={props.id}>{panel}</TemporalPickerShell>;
});
