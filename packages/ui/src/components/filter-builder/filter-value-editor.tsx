"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import type { DateRange, Matcher } from "react-day-picker";
import { Button } from "#components/button";
import { Calendar } from "#components/calendar";
import { Input } from "#components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#components/popover";
import { useIcon } from "#system/icon-context";
import type { ControlSize } from "../../tokens/control-size";
import type {
  FilterClauseValue,
  FilterClause,
  FilterClauseEditorUpdate,
  FilterField,
  FilterOption,
  FilterOperator,
  FilterScalar,
  SelectFilterField,
} from "./filter-types";
import { FilterOptionList } from "./filter-option-list";
import {
  isDateRange,
  operatorNeedsValue,
  validateFilterValue,
} from "./filter-utils";

interface FilterValueEditorProps {
  autoFocus?: boolean;
  disabled?: boolean;
  field: FilterField;
  clause: FilterClause;
  locale?: string;
  messages: {
    loadOptionsError: string;
    loadingOptions: string;
    noOptions: string;
    retry: string;
    searchOptions: string;
    selectedCount: (count: number) => string;
  };
  onChange: (value: FilterClauseValue | undefined) => void;
  onClauseChange: (update: FilterClauseEditorUpdate) => void;
  operator: FilterOperator;
  readOnly?: boolean;
  size: ControlSize;
  value: FilterClauseValue | undefined;
}

export function FilterValueEditor(props: FilterValueEditorProps) {
  if (!operatorNeedsValue(props.operator)) return null;

  if (props.field.type === "custom") {
    if (props.readOnly && props.field.renderValue) {
      return (
        <div className="min-w-0">
          {props.field.renderValue(props.value, {
            clause: props.clause,
            meta: props.clause.meta,
          })}
        </div>
      );
    }

    return <div className="min-w-0">{props.field.renderEditor({
      clause: props.clause,
      field: props.field,
      operator: props.operator,
      value: props.value,
      meta: props.clause.meta,
      onChange: props.onChange,
      onMetaChange: (meta) => props.onClauseChange({ meta }),
      onClauseChange: props.onClauseChange,
      disabled: props.disabled,
      readOnly: props.readOnly,
    })}</div>;
  }

  if (props.field.type === "select" || props.field.type === "multiSelect") {
    return <OptionValueEditor {...props} field={props.field} />;
  }

  if (props.field.type === "date" || props.field.type === "dateRange") {
    return <DateValueEditor {...props} field={props.field} />;
  }

  return <InputValueEditor {...props} />;
}

function InputValueEditor({
  autoFocus,
  disabled,
  field,
  onChange,
  operator,
  readOnly,
  size,
  value,
}: FilterValueEditorProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(() => toInputDraft(value));
  const [error, setError] = React.useState<string>();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isRange = field.type === "number" && operator === "isBetween";

  React.useEffect(() => setDraft(toInputDraft(value)), [value]);
  React.useEffect(() => {
    if (open || !autoFocus) return;
    setOpen(true);
  }, [autoFocus, open]);
  React.useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const commit = React.useCallback(() => {
    const next = parseInputDraft(draft, field, isRange);
    const result = validateFilterValue(field, operator, next);
    if (!result.valid) {
      setError(result.message);
      return false;
    }
    setError(undefined);
    onChange(next);
    return true;
  }, [draft, field, isRange, onChange, operator]);

  const summary = formatInputValue(value, field, isRange);
  if (readOnly) return <span className="inline-flex min-w-0 items-center truncate px-2.5 text-body text-fg-muted">{summary}</span>;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            active={open}
            aria-invalid={Boolean(error) || undefined}
            aria-label={`${field.label}: ${summary}`}
            disabled={disabled}
            size={size}
            variant="tertiary"
          >
            <span className="max-w-44 truncate">{summary}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[min(92vw,20rem)] p-3" sideOffset={4}>
        <div className="flex flex-col gap-2">
          {isRange ? (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Input
                aria-label={`${field.label} minimum`}
                inputMode="decimal"
                onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
                placeholder="Min"
                size={size}
                type="number"
                value={draft.from}
              />
              <span className="text-body text-fg-muted">–</span>
              <Input
                aria-label={`${field.label} maximum`}
                inputMode="decimal"
                onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && commit()) setOpen(false);
                  if (event.key === "Escape") setOpen(false);
                }}
                placeholder="Max"
                size={size}
                type="number"
                value={draft.to}
              />
            </div>
          ) : (
            <Input
              aria-invalid={Boolean(error) || undefined}
              aria-label={field.label}
              autoFocus
              inputMode={field.type === "number" ? "decimal" : undefined}
              onBlur={() => { void commit(); }}
              onChange={(event) => setDraft({ from: event.target.value, to: "" })}
              onKeyDown={(event) => {
                if (event.key === "Enter" && commit()) setOpen(false);
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder={field.type === "text" ? field.placeholder : "Enter a value"}
              ref={inputRef}
              size={size}
              type={field.type === "number" ? "number" : "text"}
              value={draft.from}
            />
          )}
          {error && <p className="text-label text-fg-danger" role="alert">{error}</p>}
          {isRange && (
            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={() => setOpen(false)} size={size} variant="ghost">Cancel</Button>
              <Button onClick={() => { if (commit()) setOpen(false); }} size={size}>Apply</Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OptionValueEditor({
  disabled,
  field,
  messages,
  onChange,
  readOnly,
  size,
  value,
}: FilterValueEditorProps & { field: SelectFilterField }) {
  const Search = useIcon("search");
  const Rotate = useIcon("rotate-ccw");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { options, loading, error, retry, optionCache } = useFilterOptions(field, query, open);
  const multiple = field.type === "multiSelect";
  const selectedValues = React.useMemo(() => new Set(toOptionValues(value)), [value]);
  const selectedOptions = React.useMemo(
    () => Array.from(selectedValues).map((selectedValue) => optionCache.get(selectedValue) ?? {
      value: selectedValue,
      label: String(selectedValue),
      textValue: String(selectedValue),
    }),
    [optionCache, selectedValues],
  );

  React.useEffect(() => {
    if (!open || !field.searchable) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [field.searchable, open]);

  const visibleOptions = React.useMemo(() => {
    if (field.loadOptions || !query.trim()) return options;
    const normalisedQuery = query.trim().toLocaleLowerCase();
    return options.filter((option) => optionText(option).toLocaleLowerCase().includes(normalisedQuery));
  }, [field.loadOptions, options, query]);

  const summary = optionSummary(field, selectedOptions, messages.selectedCount);
  if (readOnly) return <span className="inline-flex min-w-0 items-center truncate px-2.5 text-body text-fg-muted">{summary}</span>;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            active={open}
            aria-label={`${field.label}: ${summary}`}
            disabled={disabled}
            size={size}
            variant="tertiary"
          >
            <span className="max-w-44 truncate">{summary}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[min(92vw,22rem)] p-2" sideOffset={4}>
        {field.searchable !== false && (
          <div className="relative mb-2">
            <Input
              aria-label={messages.searchOptions}
              className="pr-8"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={messages.searchOptions}
              ref={inputRef}
              size={size}
              value={query}
            />
            <Search aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
          </div>
        )}
        {loading ? (
          <p className="px-2.5 py-5 text-center text-body text-fg-muted" role="status">{messages.loadingOptions}</p>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 px-2.5 py-5 text-center">
            <p className="text-body text-fg-danger">{messages.loadOptionsError}</p>
            <Button leadingIcon={Rotate} onClick={retry} size={size} variant="tertiary">{messages.retry}</Button>
          </div>
        ) : visibleOptions.length === 0 ? (
          <p className="px-2.5 py-5 text-center text-body text-fg-muted">{messages.noOptions}</p>
        ) : (
          <FilterOptionList
            maxSelections={field.maxSelections}
            multiple={multiple}
            onToggle={(option) => {
              if (multiple) {
                const next = new Set(selectedValues);
                if (next.has(option.value)) next.delete(option.value);
                else next.add(option.value);
                onChange(next.size ? Array.from(next) : undefined);
                return;
              }
              onChange(option.value);
              setOpen(false);
            }}
            options={visibleOptions}
            selectedValues={selectedValues}
            virtualize={field.virtualize}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function DateValueEditor({
  disabled,
  field,
  locale,
  onChange,
  readOnly,
  size,
  value,
}: FilterValueEditorProps & { field: Extract<FilterField, { type: "date" | "dateRange" }> }) {
  const CalendarIcon = useIcon("calendar");
  const [open, setOpen] = React.useState(false);
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>();
  const isRange = field.type === "dateRange";
  const summary = formatDateValue(value, locale);
  const calendarDisabled = React.useMemo<Matcher | undefined>(() => {
    const before = field.minDate ? toDate(field.minDate) : undefined;
    const after = field.maxDate ? toDate(field.maxDate) : undefined;
    if (before && after) return { before, after };
    if (before) return { before };
    if (after) return { after };
    return undefined;
  }, [field.maxDate, field.minDate]);

  React.useEffect(() => {
    if (!open) setDraftRange(toDateRange(value));
  }, [open, value]);

  if (readOnly) return <span className="inline-flex min-w-0 items-center truncate px-2.5 text-body text-fg-muted">{summary}</span>;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button active={open} disabled={disabled} leadingIcon={CalendarIcon} size={size} variant="tertiary">
            <span className="max-w-48 truncate">{summary}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="p-1" sideOffset={4}>
        {isRange ? (
          <Calendar
            locale={field.locale}
            mode="range"
            numberOfMonths={1}
            disabled={calendarDisabled}
            onSelect={(range) => {
              setDraftRange(range);
              if (range?.from && range.to) {
                onChange({ from: toIsoDate(range.from), to: toIsoDate(range.to) });
                setOpen(false);
              }
            }}
            selected={draftRange}
          />
        ) : (
          <Calendar
            locale={field.locale}
            mode="single"
            disabled={calendarDisabled}
            onSelect={(date) => {
              if (!date) return;
              onChange(toIsoDate(date));
              setOpen(false);
            }}
            selected={typeof value === "string" ? toDate(value) : undefined}
          />
        )}
        <div className="flex justify-end px-2 pb-2">
          <Button onClick={() => { onChange(undefined); setOpen(false); }} size={size} variant="ghost">Clear</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function useFilterOptions(field: SelectFilterField, query: string, enabled: boolean) {
  const [options, setOptions] = React.useState<readonly FilterOption[]>(field.options ?? []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const cacheRef = React.useRef(new Map<string | number | boolean, FilterOption>());
  const sequenceRef = React.useRef(0);

  React.useEffect(() => {
    for (const option of field.options ?? []) cacheRef.current.set(option.value, option);
    if (!field.loadOptions) setOptions(field.options ?? []);
  }, [field.options, field.loadOptions]);

  React.useEffect(() => {
    if (!enabled || !field.loadOptions) return;
    const controller = new AbortController();
    const sequence = ++sequenceRef.current;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(false);
      field.loadOptions!(query, { signal: controller.signal, field })
        .then((nextOptions) => {
          if (controller.signal.aborted || sequence !== sequenceRef.current) return;
          for (const option of nextOptions) cacheRef.current.set(option.value, option);
          setOptions(nextOptions);
          setLoading(false);
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted || sequence !== sequenceRef.current) return;
          if (reason instanceof DOMException && reason.name === "AbortError") return;
          setError(true);
          setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, field, query, retryCount]);

  return {
    options,
    loading,
    error,
    optionCache: cacheRef.current,
    retry: () => setRetryCount((count) => count + 1),
  };
}

function toInputDraft(value: FilterClauseValue | undefined) {
  if (Array.isArray(value)) return { from: value[0] === undefined ? "" : String(value[0]), to: value[1] === undefined ? "" : String(value[1]) };
  return { from: value === undefined ? "" : String(value), to: "" };
}

function parseInputDraft(
  draft: { from: string; to: string },
  field: FilterField,
  isRange: boolean,
): FilterClauseValue | undefined {
  if (!draft.from.trim() || (isRange && !draft.to.trim())) return undefined;
  const parse = (input: string) => field.type === "number" ? Number(input) : input;
  if (isRange) return [parse(draft.from) as number, parse(draft.to) as number];
  if (field.type === "text") return field.parse?.(draft.from) ?? draft.from;
  return parse(draft.from) as FilterClauseValue;
}

function formatInputValue(value: FilterClauseValue | undefined, field: FilterField, isRange: boolean) {
  if (value === undefined || value === "") return field.type === "text" ? field.placeholder ?? "Enter a value" : "Enter a value";
  if (isRange && Array.isArray(value)) return `${value[0] ?? ""} – ${value[1] ?? ""}`;
  return String(value);
}

function toOptionValues(value: FilterClauseValue | undefined): Array<string | number | boolean> {
  return Array.isArray(value) ? value : value === undefined ? [] : [value as string | number | boolean];
}

function optionText(option: FilterOption<FilterScalar>) {
  return option.textValue ?? (typeof option.label === "string" ? option.label : String(option.value));
}

function optionSummary(
  field: SelectFilterField,
  selected: readonly FilterOption<FilterScalar>[],
  selectedCount: (count: number) => string,
) {
  if (selected.length === 0) return "Select…";
  if (field.renderValue) return field.renderValue(selected) as string;
  if (selected.length === 1) return optionText(selected[0]!);
  if (selected.length === 2) return selected.map(optionText).join(", ");
  return selectedCount(selected.length);
}

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : undefined;
}

function toDateRange(value: FilterClauseValue | undefined): DateRange | undefined {
  if (!isDateRange(value)) return undefined;
  return { from: value.from ? toDate(value.from) : undefined, to: value.to ? toDate(value.to) : undefined };
}

function formatDateValue(value: FilterClauseValue | undefined, locale?: string) {
  if (typeof value === "string") {
    const date = toDate(value);
    return date ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date) : "Pick a date";
  }
  if (isDateRange(value)) {
    const from = value.from ? toDate(value.from) : undefined;
    const to = value.to ? toDate(value.to) : undefined;
    const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
    if (from && to) return `${formatter.format(from)} – ${formatter.format(to)}`;
    if (from) return formatter.format(from);
  }
  return "Pick a date";
}
