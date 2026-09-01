"use client";

import * as React from "react";
import { Button } from "#components/button";
import { ScrollArea } from "#components/scroll-area";
import { cn } from "#system/utils";
import type { ISOTimeString, TimeFieldProps } from "./temporal-types";
import { compareISOTime, normaliseTime, parseISOTime, timeToSeconds } from "./temporal-utils";
import { isControlledProp, useTemporalValueState } from "./use-temporal-picker-state";

interface TimeDraft {
  hour: string;
  minute: string;
  second: string;
  period: "AM" | "PM" | "";
}

function validStep(value: ISOTimeString, step: number, unit: "minute" | "second") {
  const seconds = timeToSeconds(value);
  return unit === "minute" ? Math.floor(seconds / 60) % step === 0 : seconds % step === 0;
}

function usesTwelveHourClock(hourCycle: TimeFieldProps["hourCycle"]) {
  if (hourCycle === 12) return true;
  if (hourCycle === 24) return false;
  return Intl.DateTimeFormat().resolvedOptions().hourCycle?.startsWith("h12") ?? false;
}

function toDraft(value: ISOTimeString | undefined, twelveHour: boolean, includeSeconds: boolean): TimeDraft {
  if (!value) return { hour: "", minute: "", second: "", period: "" };
  const seconds = timeToSeconds(value);
  const hour = Math.floor(seconds / 3600);
  return {
    hour: String(twelveHour ? hour % 12 || 12 : hour).padStart(twelveHour ? 1 : 2, "0"),
    minute: String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"),
    second: includeSeconds ? String(seconds % 60).padStart(2, "0") : "",
    period: twelveHour ? hour >= 12 ? "PM" : "AM" : "",
  };
}

function toValue(draft: TimeDraft, twelveHour: boolean, includeSeconds: boolean): ISOTimeString | undefined {
  if (!draft.hour || !draft.minute || (includeSeconds && !draft.second) || (twelveHour && !draft.period)) return undefined;
  const displayHour = Number(draft.hour);
  const hour = twelveHour ? displayHour % 12 + (draft.period === "PM" ? 12 : 0) : displayHour;
  return parseISOTime(`${String(hour).padStart(2, "0")}:${draft.minute}${includeSeconds ? `:${draft.second}` : ""}`);
}

function optionValues(max: number, step: number, padding = 2) {
  return Array.from({ length: Math.floor(max / step) + 1 }, (_, index) => String(index * step).padStart(padding, "0"));
}

interface TimeColumnProps {
  ariaLabel: string;
  disabled?: boolean;
  isValueDisabled?: (value: string) => boolean;
  invalid?: boolean;
  label: string;
  onSelect: (value: string) => void;
  size: NonNullable<TimeFieldProps["size"]>;
  value: string;
  values: string[];
}

function TimeColumn({ ariaLabel, disabled, isValueDisabled, invalid, label, onSelect, size, value, values }: TimeColumnProps) {
  const selectedItemRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    selectedItemRef.current?.scrollIntoView?.({ block: "center" });
  }, [value]);

  return (
    <section aria-invalid={invalid || undefined} aria-label={ariaLabel} className="flex min-w-40 flex-col" data-slot="time-field-column">
      <div className="border-b border-border-subtle px-2 py-1.5 text-center text-label text-fg-muted">{label}</div>
      <ScrollArea className="h-40" viewportClassName="overscroll-contain p-1">
        <div className="flex flex-col gap-0.5" role="group" aria-label={ariaLabel}>
          {values.map((item) => {
            const selected = item === value;
            return (
              <Button
                key={item}
                ref={selected ? selectedItemRef : undefined}
                aria-label={`${item} ${label}`}
                aria-pressed={selected}
                className="w-full justify-center tabular-nums"
                disabled={disabled || isValueDisabled?.(item)}
                onClick={() => onSelect(item)}
                size={size}
                type="button"
                variant={selected ? "primary" : "ghost"}
              >
                {item}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </section>
  );
}

export const TimeField = React.forwardRef<HTMLDivElement, TimeFieldProps>(function TimeField(props, ref) {
  const {
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
    defaultValue,
    disabled,
    form,
    granularity = "minute",
    hourCycle = "locale",
    id,
    invalid,
    maxValue,
    minValue,
    minuteStep = 1,
    name,
    onValueChange,
    readOnly,
    required,
    secondStep = 1,
    size = "md",
    value,
    ...groupProps
  } = props;
  const controlled = isControlledProp(props, "value");
  const { committedValue, commit } = useTemporalValueState({ controlled, value, defaultValue, onValueChange: (next) => onValueChange?.(next) });
  const includeSeconds = granularity === "second";
  const twelveHour = usesTwelveHourClock(hourCycle);
  const displayValue = committedValue ? normaliseTime(committedValue, includeSeconds) : undefined;
  const [draft, setDraft] = React.useState<TimeDraft>(() => toDraft(displayValue, twelveHour, includeSeconds));
  const formValueRef = React.useRef<HTMLInputElement>(null);
  const min = minValue ? normaliseTime(minValue, includeSeconds) : undefined;
  const max = maxValue ? normaliseTime(maxValue, includeSeconds) : undefined;
  const disabledSelect = disabled || readOnly;
  const baseLabel = ariaLabel ?? "Time";

  React.useEffect(() => {
    setDraft(toDraft(displayValue, twelveHour, includeSeconds));
  }, [displayValue, includeSeconds, twelveHour]);

  const valid = React.useCallback((next: ISOTimeString) => (
    validStep(next, minuteStep, "minute")
    && validStep(next, secondStep, "second")
    && (!min || compareISOTime(next, min) >= 0)
    && (!max || compareISOTime(next, max) <= 0)
  ), [max, min, minuteStep, secondStep]);

  const change = (part: keyof TimeDraft, nextPart: string) => {
    const next = { ...draft, [part]: nextPart } as TimeDraft;
    setDraft(next);
    const nextValue = toValue(next, twelveHour, includeSeconds);
    if (nextValue && valid(nextValue)) commit(nextValue, { source: "time-field" });
  };

  const hourValues = twelveHour
    ? Array.from({ length: 12 }, (_, index) => String(index + 1))
    : optionValues(23, 1);
  const minuteValues = optionValues(59, minuteStep);
  const secondValues = optionValues(59, secondStep);

  const isPartDisabled = (part: keyof TimeDraft) => (nextPart: string) => {
    const next = { ...draft, [part]: nextPart } as TimeDraft;
    let hours = next.hour ? [next.hour] : hourValues;
    let minutes = next.minute ? [next.minute] : minuteValues;
    let seconds = includeSeconds ? next.second ? [next.second] : secondValues : [""];
    let periods: TimeDraft["period"][] = twelveHour
      ? next.period ? [next.period] : ["AM", "PM"]
      : [""];

    // A higher-order choice must stay available whenever one valid lower-order
    // completion exists. Otherwise an invalid draft such as 00:00 with a 23:59
    // minimum cannot move to 23:59 because both 23 and 59 disable each other.
    if (part === "hour") {
      minutes = minuteValues;
      seconds = includeSeconds ? secondValues : [""];
    } else if (part === "minute") {
      seconds = includeSeconds ? secondValues : [""];
    } else if (part === "period") {
      hours = hourValues;
      minutes = minuteValues;
      seconds = includeSeconds ? secondValues : [""];
      periods = [next.period];
    }

    const hasValidCompletion = periods.some((period) => hours.some((hour) => minutes.some((minute) => seconds.some((second) => {
      const candidate = toValue({ hour, minute, second, period }, twelveHour, includeSeconds);
      return Boolean(candidate && valid(candidate));
    }))));
    return !hasValidCompletion;
  };

  React.useEffect(() => {
    const formElement = formValueRef.current?.form;
    if (!formElement) return;
    const reset = () => {
      if (!controlled) commit(defaultValue, { source: "clear" });
    };
    formElement.addEventListener("reset", reset);
    return () => formElement.removeEventListener("reset", reset);
  }, [commit, controlled, defaultValue]);

  const columnCount = 2 + Number(includeSeconds) + Number(twelveHour);

  return (
    <div
      {...groupProps}
      ref={ref}
      aria-describedby={ariaDescribedBy}
      aria-invalid={invalid || undefined}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      className={cn("grid w-fit max-w-full overflow-x-auto", columnCount === 2 && "grid-cols-2", columnCount === 3 && "grid-cols-3", columnCount === 4 && "grid-cols-4", className)}
      data-slot="time-field"
      id={id}
      role="group"
    >
      <TimeColumn ariaLabel={`${baseLabel} hour`} disabled={disabledSelect} isValueDisabled={isPartDisabled("hour")} invalid={invalid} label="HH" onSelect={(next) => change("hour", next)} size={size} value={draft.hour} values={hourValues} />
      <TimeColumn ariaLabel={`${baseLabel} minute`} disabled={disabledSelect} isValueDisabled={isPartDisabled("minute")} invalid={invalid} label="MM" onSelect={(next) => change("minute", next)} size={size} value={draft.minute} values={minuteValues} />
      {includeSeconds && (
        <TimeColumn ariaLabel={`${baseLabel} second`} disabled={disabledSelect} isValueDisabled={isPartDisabled("second")} invalid={invalid} label="SS" onSelect={(next) => change("second", next)} size={size} value={draft.second} values={secondValues} />
      )}
      {twelveHour && (
        <TimeColumn ariaLabel={`${baseLabel} period`} disabled={disabledSelect} isValueDisabled={isPartDisabled("period")} invalid={invalid} label="AM/PM" onSelect={(next) => change("period", next)} size={size} value={draft.period} values={["AM", "PM"]} />
      )}
      {name && <input ref={formValueRef} aria-hidden className="sr-only" form={form} name={name} readOnly required={required} tabIndex={-1} type="text" value={displayValue ?? ""} />}
    </div>
  );
});

TimeField.displayName = "TimeField";
