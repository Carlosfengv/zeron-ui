import type * as React from "react";
import type { ControlSize } from "../../tokens/control-size";

declare const isoDateBrand: unique symbol;
declare const isoTimeBrand: unique symbol;
declare const isoDateTimeBrand: unique symbol;

/** A validated `YYYY-MM-DD` calendar date. */
export type ISODateString = string & { readonly [isoDateBrand]: true };
/** A validated `HH:mm` or `HH:mm:ss` wall-clock time. */
export type ISOTimeString = string & { readonly [isoTimeBrand]: true };
/** A validated RFC 3339 instant containing `Z` or a numeric offset. */
export type ISODateTimeString = string & { readonly [isoDateTimeBrand]: true };

export interface DateRangeValue {
  from: ISODateString;
  to: ISODateString;
}

export interface TimeRangeValue {
  from: ISOTimeString;
  to: ISOTimeString;
  /** The end belongs to the following calendar day. */
  overnight?: boolean;
}

export interface DateTimeRangeValue {
  from: ISODateTimeString;
  to: ISODateTimeString;
}

export type TemporalPickerPresentation = "auto" | "popover" | "drawer" | "inline";
export type TemporalCommitMode = "complete" | "apply";
export type TemporalPresetBehavior = "draft" | "commit";
export type TemporalGranularity = "minute" | "second";
export type HourCycle = "locale" | 12 | 24;
export type TemporalRangeEndpoint = "start" | "end";

export type TemporalChangeSource =
  | "calendar"
  | "time-field"
  | "preset"
  | "apply"
  | "clear";

export interface TemporalChangeContext {
  source: TemporalChangeSource;
  presetId?: string;
}

export interface TemporalPickerMessages {
  selectDate: string;
  selectTime: string;
  selectDateTime: string;
  start: string;
  end: string;
  apply: string;
  cancel: string;
  clear: string;
  presets: string;
  nextDay: string;
  invalidValue: string;
  incompleteRange: string;
  startAfterEnd: string;
  unavailableValue: string;
  ambiguousTime: string;
  nonexistentTime: string;
  earlierOccurrence: string;
  laterOccurrence: string;
}

export const defaultTemporalPickerMessages: TemporalPickerMessages = {
  selectDate: "Select date",
  selectTime: "Select time",
  selectDateTime: "Select date and time",
  start: "Start",
  end: "End",
  apply: "Apply",
  cancel: "Cancel",
  clear: "Clear",
  presets: "Presets",
  nextDay: "Next day",
  invalidValue: "Enter a valid value.",
  incompleteRange: "Choose both a start and end value.",
  startAfterEnd: "The end must not be before the start.",
  unavailableValue: "This value is unavailable.",
  ambiguousTime: "This local time occurs twice. Choose one occurrence.",
  nonexistentTime: "This local time does not exist in the selected time zone.",
  earlierOccurrence: "Earlier occurrence",
  laterOccurrence: "Later occurrence",
};

export interface TemporalPickerCommonProps {
  id?: string;
  size?: ControlSize;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  placeholder?: string;
  locale?: string;
  presentation?: TemporalPickerPresentation;
  commitMode?: TemporalCommitMode;
  presetBehavior?: TemporalPresetBehavior;
  closeOnCommit?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  now?: () => Date;
  messages?: Partial<TemporalPickerMessages>;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  className?: string;
}

export interface TemporalPresetContext {
  now: Date;
  locale: string;
  timeZone?: string;
}

export interface TemporalShortcut {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export interface TemporalPreset<TValue> {
  id: string;
  label: string;
  description?: string;
  shortcut?: TemporalShortcut;
  resolve: (context: TemporalPresetContext) => TValue;
}

export interface DateTimeAvailabilityContext {
  date: ISODateString;
  timeZone: string;
  endpoint?: TemporalRangeEndpoint;
}

export interface TimeFieldProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  value?: ISOTimeString;
  defaultValue?: ISOTimeString;
  onValueChange?: (value: ISOTimeString | undefined) => void;
  name?: string;
  form?: string;
  granularity?: TemporalGranularity;
  minuteStep?: number;
  secondStep?: number;
  hourCycle?: HourCycle;
  minValue?: ISOTimeString;
  maxValue?: ISOTimeString;
  size?: ControlSize;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export interface TimePickerProps extends TemporalPickerCommonProps {
  value?: ISOTimeString;
  defaultValue?: ISOTimeString;
  onValueChange?: (value: ISOTimeString | undefined, context: TemporalChangeContext) => void;
  granularity?: TemporalGranularity;
  minuteStep?: number;
  secondStep?: number;
  hourCycle?: HourCycle;
  minValue?: ISOTimeString;
  maxValue?: ISOTimeString;
  presets?: readonly TemporalPreset<ISOTimeString>[];
  formatValue?: (value: ISOTimeString) => React.ReactNode;
}

export interface TimeRangePickerProps extends TemporalPickerCommonProps {
  value?: TimeRangeValue;
  defaultValue?: TimeRangeValue;
  onValueChange?: (value: TimeRangeValue | undefined, context: TemporalChangeContext) => void;
  granularity?: TemporalGranularity;
  minuteStep?: number;
  secondStep?: number;
  hourCycle?: HourCycle;
  minValue?: ISOTimeString;
  maxValue?: ISOTimeString;
  allowOvernight?: boolean;
  presets?: readonly TemporalPreset<TimeRangeValue>[];
  formatValue?: (value: TimeRangeValue) => React.ReactNode;
}

export interface DatePickerProps extends TemporalPickerCommonProps {
  value?: ISODateString;
  defaultValue?: ISODateString;
  onValueChange?: (value: ISODateString | undefined, context: TemporalChangeContext) => void;
  minValue?: ISODateString;
  maxValue?: ISODateString;
  calendarTimeZone?: string;
  isDateUnavailable?: (date: ISODateString) => boolean;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showOutsideDays?: boolean;
  presets?: readonly TemporalPreset<ISODateString>[];
  formatValue?: (value: ISODateString) => React.ReactNode;
}

export interface DateRangePickerProps extends TemporalPickerCommonProps {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onValueChange?: (value: DateRangeValue | undefined, context: TemporalChangeContext) => void;
  minValue?: ISODateString;
  maxValue?: ISODateString;
  calendarTimeZone?: string;
  minDays?: number;
  maxDays?: number;
  isDateUnavailable?: (date: ISODateString) => boolean;
  allowUnavailableInRange?: boolean;
  numberOfMonths?: 1 | 2;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showOutsideDays?: boolean;
  presets?: readonly TemporalPreset<DateRangeValue>[];
  formatValue?: (value: DateRangeValue) => React.ReactNode;
}

export interface DateTimePickerProps extends TemporalPickerCommonProps {
  value?: ISODateTimeString;
  defaultValue?: ISODateTimeString;
  onValueChange?: (value: ISODateTimeString | undefined, context: TemporalChangeContext) => void;
  timeZone?: string;
  disambiguation?: "earlier" | "later" | "reject";
  granularity?: TemporalGranularity;
  minuteStep?: number;
  secondStep?: number;
  hourCycle?: HourCycle;
  minValue?: ISODateTimeString;
  maxValue?: ISODateTimeString;
  isDateUnavailable?: (date: ISODateString) => boolean;
  isTimeUnavailable?: (time: ISOTimeString, context: DateTimeAvailabilityContext) => boolean;
  isDateTimeUnavailable?: (value: ISODateTimeString) => boolean;
  presets?: readonly TemporalPreset<ISODateTimeString>[];
  formatValue?: (value: ISODateTimeString, timeZone: string) => React.ReactNode;
}

export interface DateTimeRangePickerProps extends TemporalPickerCommonProps {
  value?: DateTimeRangeValue;
  defaultValue?: DateTimeRangeValue;
  onValueChange?: (value: DateTimeRangeValue | undefined, context: TemporalChangeContext) => void;
  timeZone?: string;
  disambiguation?: "earlier" | "later" | "reject";
  granularity?: TemporalGranularity;
  minuteStep?: number;
  secondStep?: number;
  hourCycle?: HourCycle;
  minValue?: ISODateTimeString;
  maxValue?: ISODateTimeString;
  minDurationMs?: number;
  maxDurationMs?: number;
  numberOfMonths?: 1 | 2;
  isDateUnavailable?: (date: ISODateString, endpoint: TemporalRangeEndpoint) => boolean;
  isTimeUnavailable?: (
    time: ISOTimeString,
    context: DateTimeAvailabilityContext & { endpoint: TemporalRangeEndpoint },
  ) => boolean;
  isDateTimeUnavailable?: (value: ISODateTimeString, endpoint: TemporalRangeEndpoint) => boolean;
  presets?: readonly TemporalPreset<DateTimeRangeValue>[];
  formatValue?: (value: DateTimeRangeValue, timeZone: string) => React.ReactNode;
}
