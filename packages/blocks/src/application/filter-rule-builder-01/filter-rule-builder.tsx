"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zeron/ui/card";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@zeron/ui/combobox";
import {
  Container,
  ContainerBody,
  ContainerFooter,
  ContainerHeader,
} from "@zeron/ui/container";
import { Field, FieldError, FieldLabel } from "@zeron/ui/field";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Input } from "@zeron/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zeron/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@zeron/ui/select";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import type { FilterOption, FilterScalar, SelectFilterField } from "@zeron/ui/system/filter-core";
import type {
  FilterRuleBuilderLabels,
  FilterRuleBuilderProps,
  FilterRuleClause,
  FilterRuleClauseValue,
  FilterRuleDraft,
  FilterRuleField,
  FilterRuleOperator,
} from "./filter-rule-builder-types";

const defaultLabels: FilterRuleBuilderLabels = {
  title: "Filter view",
  description: (count) => `All conversations · ${count} items`,
  counts: (active, drafting) => `${active} active · ${drafting} drafting`,
  presets: "Presets",
  rule: (index) => `Rule ${index}`,
  drafting: "Drafting",
  conjunction: "AND",
  property: "Property",
  operator: "Operator",
  threshold: "Threshold",
  selectProperty: "Select a property",
  selectOperator: "Select an operator",
  selectValue: "Select a value",
  searchValues: "Search values",
  noValues: "No values found.",
  addRule: "Add rule",
  addAnotherRule: "Add another rule",
  cancelDraft: "Cancel",
  removeRule: (field) => `Remove ${field} rule`,
  clearAll: "Clear all",
  cancel: "Cancel",
  apply: "Apply now",
  applying: "Applying",
  dismiss: "Close filter view",
  valueRequired: "Choose or enter a value.",
  valueTooSmall: (minimum) => `Enter ${minimum} or more.`,
  valueTooLarge: (maximum) => `Enter ${maximum} or less.`,
  finishDraft: "Add or cancel the draft rule before applying these filters.",
  applyError: "The filters could not be applied. Try again.",
  trueValue: "True",
  falseValue: "False",
};

function cloneValue(value: FilterRuleClauseValue | undefined): FilterRuleClauseValue | undefined {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === "object") return { ...value };
  return value;
}

function cloneClauses(filters: readonly FilterRuleClause[]): FilterRuleClause[] {
  return filters.map((filter) => ({ ...filter, value: cloneValue(filter.value) }));
}

function serializableFilters(filters: readonly FilterRuleClause[]) {
  return filters.map(({ field, operator, value }) => ({ field, operator, value }));
}

function sameFilters(left: readonly FilterRuleClause[], right: readonly FilterRuleClause[]) {
  return JSON.stringify(serializableFilters(left)) === JSON.stringify(serializableFilters(right));
}

function valueIsEmpty(value: FilterRuleClauseValue | undefined) {
  return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function createRuleId() {
  return globalThis.crypto?.randomUUID?.() ?? `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function resolveOperatorLabel(field: FilterRuleField, operator: FilterRuleOperator) {
  return field.operators?.find((candidate) => candidate.value === operator)?.label ?? operator;
}

function optionLabel(option: FilterOption | undefined, fallback: FilterScalar): ReactNode {
  return option?.label ?? String(fallback);
}

function optionText(option: FilterOption | undefined, fallback: FilterScalar) {
  if (option?.textValue) return option.textValue;
  if (typeof option?.label === "string" || typeof option?.label === "number") return String(option.label);
  return String(fallback);
}

function RuleValue({ field, value }: { field: FilterRuleField; value: FilterRuleClauseValue | undefined }) {
  if (value === undefined) return null;
  if (Array.isArray(value)) {
    return (
      <span className="flex min-w-0 flex-wrap gap-1">
        {value.map((item) => {
          const option = "options" in field
            ? field.options?.find((candidate) => candidate.value === item)
            : undefined;
          return <Badge color={field.color ?? "gray"} key={String(item)} size="sm">{optionLabel(option, item)}</Badge>;
        })}
      </span>
    );
  }
  if (typeof value === "object") {
    const range = value as { from?: string; to?: string };
    return <Badge color={field.color ?? "gray"} size="sm">{[range.from, range.to].filter(Boolean).join(" – ")}</Badge>;
  }
  const option = "options" in field
    ? field.options?.find((candidate) => candidate.value === value)
    : undefined;
  return (
    <Badge color={field.color ?? "gray"} size="sm">
      {optionLabel(option, value)}{field.unit ? ` ${field.unit}` : ""}
    </Badge>
  );
}

function MultiSelectEditor({
  disabled,
  field,
  labels,
  onChange,
  value,
}: {
  disabled: boolean;
  field: SelectFilterField & Pick<FilterRuleField, "color" | "unit">;
  labels: FilterRuleBuilderLabels;
  onChange: (value: FilterScalar[]) => void;
  value: FilterScalar[];
}) {
  const anchor = useComboboxAnchor();
  const options = field.options ?? [];
  const items = options.map((option) => String(option.value));
  const selected = value.map(String);
  const optionByValue = new Map(options.map((option) => [String(option.value), option]));

  return (
    <Combobox
      disabled={disabled}
      itemDensity="compact"
      items={items}
      multiple
      onValueChange={(next) => {
        const resolved = next.map((item) => optionByValue.get(item)?.value ?? item);
        onChange(resolved);
      }}
      size="md"
      value={selected}
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(current: string[]) => (
            <>
              {current.map((item) => (
                <ComboboxChip key={item} removeAriaLabel={`Remove ${optionText(optionByValue.get(item), item)}`}>
                  {optionLabel(optionByValue.get(item), item)}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                aria-label={labels.searchValues}
                placeholder={current.length ? "" : labels.selectValue}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{labels.noValues}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {optionLabel(optionByValue.get(item), item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ValueEditor({
  disabled,
  field,
  labels,
  onChange,
  value,
}: {
  disabled: boolean;
  field: FilterRuleField;
  labels: FilterRuleBuilderLabels;
  onChange: (value: FilterRuleClauseValue | undefined) => void;
  value: FilterRuleClauseValue | undefined;
}) {
  if (field.type === "multiSelect") {
    return (
      <MultiSelectEditor
        disabled={disabled}
        field={field}
        labels={labels}
        onChange={onChange}
        value={Array.isArray(value) ? value : []}
      />
    );
  }

  if (field.type === "select") {
    const options = field.options ?? [];
    return (
      <Select
        disabled={disabled}
        itemDensity="compact"
        onValueChange={(next) => {
          const option = options.find((candidate) => String(candidate.value) === next);
          onChange(option?.value ?? next);
        }}
        size="md"
        value={value === undefined ? "" : String(value)}
      >
        <SelectTrigger placeholder={labels.selectValue} />
        <SelectContent animated={false}>
          {options.map((option) => (
            <SelectItem disabled={option.disabled} key={String(option.value)} textValue={optionText(option, option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "boolean") {
    return (
      <Select
        disabled={disabled}
        itemDensity="compact"
        onValueChange={(next) => onChange(next === "true")}
        size="md"
        value={value === undefined ? "" : String(value)}
      >
        <SelectTrigger placeholder={labels.selectValue} />
        <SelectContent animated={false}>
          <SelectItem value="true">{field.trueLabel ?? labels.trueValue}</SelectItem>
          <SelectItem value="false">{field.falseLabel ?? labels.falseValue}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "number") {
    return (
      <InputGroup size="md">
        <InputGroupInput
          aria-label={labels.threshold}
          disabled={disabled}
          inputMode="decimal"
          max={field.max}
          min={field.min}
          onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
          placeholder="0"
          step={field.step}
          type="number"
          value={typeof value === "number" ? value : ""}
        />
        {field.unit ? <InputGroupAddon align="inline-end">{field.unit}</InputGroupAddon> : null}
      </InputGroup>
    );
  }

  if (field.type === "text") {
    return (
      <Input
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder ?? labels.selectValue}
        size="md"
        type="text"
        value={typeof value === "string" ? value : ""}
      />
    );
  }

  return null;
}

function validateDraft(draft: FilterRuleDraft, field: FilterRuleField | undefined, labels: FilterRuleBuilderLabels) {
  if (!field || valueIsEmpty(draft.value)) return labels.valueRequired;
  if (field.type === "number" && typeof draft.value === "number") {
    if (field.min !== undefined && draft.value < field.min) return labels.valueTooSmall(field.min);
    if (field.max !== undefined && draft.value > field.max) return labels.valueTooLarge(field.max);
  }
  return null;
}

function newDraft(fields: readonly FilterRuleField[], initial?: Partial<FilterRuleDraft>): FilterRuleDraft | null {
  const field = fields.find((candidate) => candidate.id === initial?.field) ?? fields[0];
  if (!field) return null;
  return {
    field: field.id,
    operator: initial?.operator ?? field.defaultOperator ?? field.operators?.[0]?.value ?? "equals",
    value: cloneValue(initial?.value),
  };
}

export function FilterRuleBuilder({
  applying = false,
  className,
  defaultDraft,
  defaultValue = [],
  disabled = false,
  fields,
  labels: labelOverrides,
  maxBodyHeight = "min(42rem, calc(100vh - 15rem))",
  maxRules,
  onApply,
  onCancel,
  onDismiss,
  onValueChange,
  presets = [],
  readOnly = false,
  resultCount: resultCountProp,
  value,
  ...props
}: FilterRuleBuilderProps) {
  const ListChecks = useIcon("list-checks");
  const X = useIcon("x");
  const Check = useIcon("check");
  const Plus = useIcon("plus");
  const Eraser = useIcon("eraser");
  const labels = { ...defaultLabels, ...labelOverrides };
  const initialFilters = value ?? defaultValue;
  const [filters, setFilters] = useState<FilterRuleClause[]>(() => cloneClauses(initialFilters));
  const committedRef = useRef<FilterRuleClause[]>(cloneClauses(initialFilters));
  const lastEmittedRef = useRef<FilterRuleClause[] | null>(null);
  const [draft, setDraft] = useState<FilterRuleDraft | null>(() => defaultDraft ? newDraft(fields, defaultDraft) : null);
  const [draftTouched, setDraftTouched] = useState(false);
  const [internalApplying, setInternalApplying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const resultCount = resultCountProp ?? filters.length;
  const fieldMap = useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);
  const fieldGroups = useMemo(() => {
    const groups = new Map<string, FilterRuleField[]>();
    for (const field of fields) {
      const group = field.group ?? labels.property;
      groups.set(group, [...(groups.get(group) ?? []), field]);
    }
    return [...groups.entries()];
  }, [fields, labels.property]);
  const draftField = draft ? fieldMap.get(draft.field) : undefined;
  const draftError = draft ? validateDraft(draft, draftField, labels) : null;
  const isBusy = applying || internalApplying;
  const isDisabled = disabled || isBusy;
  const canAddMore = maxRules === undefined || filters.length < maxRules;

  useEffect(() => {
    if (value === undefined) return;
    const next = cloneClauses(value);
    setFilters(next);
    if (lastEmittedRef.current && JSON.stringify(lastEmittedRef.current) === JSON.stringify(next)) {
      lastEmittedRef.current = null;
      return;
    }
    committedRef.current = cloneClauses(next);
  }, [value]);

  function updateFilters(next: FilterRuleClause[]) {
    setFilters(next);
    setFeedback(null);
    lastEmittedRef.current = cloneClauses(next);
    onValueChange?.(cloneClauses(next));
  }

  function changeDraftField(fieldId: string) {
    const field = fieldMap.get(fieldId);
    if (!field) return;
    setDraft({
      field: field.id,
      operator: field.defaultOperator ?? field.operators?.[0]?.value ?? "equals",
      value: undefined,
    });
    setDraftTouched(false);
    setFeedback(null);
  }

  function addDraft() {
    if (!draft || !draftField || draftError) {
      setDraftTouched(true);
      return;
    }
    updateFilters([
      ...filters,
      { id: createRuleId(), field: draft.field, operator: draft.operator, value: cloneValue(draft.value) },
    ]);
    setDraft(null);
    setDraftTouched(false);
  }

  function cancelChanges() {
    const restored = cloneClauses(committedRef.current);
    setFilters(restored);
    setDraft(null);
    setDraftTouched(false);
    setFeedback(null);
    lastEmittedRef.current = cloneClauses(restored);
    onValueChange?.(cloneClauses(restored));
    onCancel?.(cloneClauses(restored));
  }

  async function applyFilters() {
    if (draft) {
      setFeedback(labels.finishDraft);
      setDraftTouched(true);
      return;
    }
    setInternalApplying(true);
    setFeedback(null);
    try {
      await onApply?.(cloneClauses(filters));
      committedRef.current = cloneClauses(filters);
    } catch (error) {
      setFeedback(error instanceof Error && error.message ? error.message : labels.applyError);
    } finally {
      setInternalApplying(false);
    }
  }

  const activePreset = presets.find((preset) => sameFilters(filters, preset.filters));

  return (
    <Container className={cn("w-full max-w-3xl gap-1.5 rounded-2xl p-1.5", className)} {...props}>
      <ContainerHeader className="px-2.5 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emphasis text-fg-default" aria-hidden>
            <ListChecks />
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <h2 className="text-body font-semibold text-fg-default">{labels.title}</h2>
              <Badge color="gray" size="sm">{labels.counts(filters.length, draft ? 1 : 0)}</Badge>
            </div>
            <p className="truncate text-label text-fg-muted">{labels.description(resultCount)}</p>
          </div>
        </div>
        {onDismiss ? (
          <Button aria-label={labels.dismiss} disabled={isBusy} iconOnly onClick={onDismiss} size="md" type="button" variant="ghost">
            <X aria-hidden />
          </Button>
        ) : null}
      </ContainerHeader>

      <ContainerBody className="rounded-xl p-3" maxHeight={maxBodyHeight}>
        {presets.length ? (
          <section aria-labelledby="filter-rule-presets" className="border-b-hairline border-border-subtle pb-3">
            <h3 className="mb-1.5 text-label font-medium text-fg-muted" id="filter-rule-presets">{labels.presets}</h3>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <Button
                  aria-pressed={activePreset?.id === preset.id}
                  disabled={isDisabled || readOnly}
                  key={preset.id}
                  onClick={() => {
                    updateFilters(cloneClauses(preset.filters));
                    setDraft(null);
                    setDraftTouched(false);
                  }}
                  size="md"
                  type="button"
                  variant={activePreset?.id === preset.id ? "secondary" : "tertiary"}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </section>
        ) : null}

        <div className={cn(presets.length && "pt-3")}>
          {filters.map((filter, index) => {
            const field = fieldMap.get(filter.field);
            if (!field) return null;
            return (
              <div key={filter.id}>
                {index > 0 ? (
                  <div className="flex justify-center py-1">
                    <Badge color="gray" size="sm">{labels.conjunction}</Badge>
                  </div>
                ) : null}
                <Card className="min-h-0 border-hairline border-border-subtle pb-3">
                  <CardHeader className="px-3 pt-3">
                    <CardTitle>
                      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span>{labels.rule(index + 1)} ·</span>
                        <Badge color={field.color ?? "gray"} size="sm" variant="dot">{field.label}</Badge>
                      </span>
                    </CardTitle>
                    {!readOnly ? (
                      <CardAction>
                        <Button
                          aria-label={labels.removeRule(field.label)}
                          disabled={isDisabled}
                          iconOnly
                          onClick={() => updateFilters(filters.filter((candidate) => candidate.id !== filter.id))}
                          size="xs"
                          type="button"
                          variant="ghost"
                        >
                          <X aria-hidden />
                        </Button>
                      </CardAction>
                    ) : null}
                  </CardHeader>
                  <CardContent className="flex min-w-0 flex-wrap items-center gap-1.5 px-3 pt-1.5">
                    <span className="text-body text-fg-muted">{resolveOperatorLabel(field, filter.operator)}</span>
                    <RuleValue field={field} value={filter.value} />
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {draft && draftField ? (
            <div>
              {filters.length ? (
                <div className="flex justify-center py-1">
                  <Badge color="gray" size="sm">{labels.conjunction}</Badge>
                </div>
              ) : null}
              <Card className="min-h-0 border border-brand pb-3">
                <CardHeader className="px-3 pt-3">
                  <CardTitle>
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span>{labels.rule(filters.length + 1)} · {draftField.label}</span>
                      <Badge color="purple" size="sm">{labels.drafting}</Badge>
                    </span>
                  </CardTitle>
                  <CardAction>
                    <Button
                      aria-label={labels.cancelDraft}
                      disabled={isDisabled}
                      iconOnly
                      onClick={() => {
                        setDraft(null);
                        setDraftTouched(false);
                        setFeedback(null);
                      }}
                      size="xs"
                      type="button"
                      variant="ghost"
                    >
                      <X aria-hidden />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="px-3 pt-2">
                  <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-3">
                    <Field className="gap-1">
                      <FieldLabel className="px-0 text-label">{labels.property}</FieldLabel>
                      <Select disabled={isDisabled} itemDensity="compact" onValueChange={changeDraftField} size="md" value={draft.field}>
                        <SelectTrigger placeholder={labels.selectProperty} />
                        <SelectContent animated={false}>
                          {fieldGroups.map(([group, groupFields], groupIndex) => (
                            <SelectGroup key={group}>
                              {groupIndex > 0 ? <SelectSeparator /> : null}
                              <SelectLabel>{group}</SelectLabel>
                              {groupFields.map((field) => (
                                <SelectItem disabled={field.disabled} icon={field.icon} key={field.id} value={field.id}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field className="gap-1">
                      <FieldLabel className="px-0 text-label">{labels.operator}</FieldLabel>
                      <Select
                        disabled={isDisabled}
                        itemDensity="compact"
                        onValueChange={(operator) => setDraft({ ...draft, operator })}
                        size="md"
                        value={draft.operator}
                      >
                        <SelectTrigger placeholder={labels.selectOperator} />
                        <SelectContent animated={false}>
                          {(draftField.operators ?? []).map((operator) => (
                            <SelectItem key={operator.value} value={operator.value}>{operator.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field className="gap-1" invalid={Boolean(draftTouched && draftError)}>
                      <FieldLabel className="px-0 text-label">{labels.threshold}</FieldLabel>
                      <ValueEditor
                        disabled={isDisabled}
                        field={draftField}
                        labels={labels}
                        onChange={(next) => {
                          setDraft({ ...draft, value: next });
                          setFeedback(null);
                        }}
                        value={draft.value}
                      />
                      {draftTouched && draftError ? <FieldError match>{draftError}</FieldError> : null}
                    </Field>
                  </div>
                </CardContent>
                <CardFooter className="justify-end px-3 pt-2">
                  <Button disabled={isDisabled} onClick={() => { setDraft(null); setDraftTouched(false); }} size="md" type="button" variant="ghost">
                    {labels.cancelDraft}
                  </Button>
                  <Button disabled={isDisabled} leadingIcon={Check} onClick={addDraft} size="md" type="button" variant="secondary">
                    {labels.addRule}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : !readOnly && canAddMore ? (
            <Button
              className="mt-3 w-full"
              dashed
              disabled={isDisabled || fields.length === 0}
              leadingIcon={Plus}
              onClick={() => setDraft(newDraft(fields))}
              size="md"
              type="button"
              variant="tertiary"
            >
              {labels.addAnotherRule}
            </Button>
          ) : null}

          {feedback ? (
            <InlineNotice className="mt-3 flex w-full" role="alert" tone="danger" variant="emphasized">
              <InlineNoticeContent>{feedback}</InlineNoticeContent>
            </InlineNotice>
          ) : null}
        </div>
      </ContainerBody>

      {!readOnly ? (
        <ContainerFooter className="justify-between px-2.5 py-1.5">
          <Button
            disabled={isDisabled || filters.length === 0}
            leadingIcon={Eraser}
            onClick={() => updateFilters([])}
            size="md"
            type="button"
            variant="ghost"
          >
            {labels.clearAll}
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button disabled={isBusy} onClick={cancelChanges} size="md" type="button" variant="tertiary">
              {labels.cancel}
            </Button>
            <Button disabled={disabled} loading={isBusy} onClick={applyFilters} size="md" type="button" variant="primary">
              {isBusy ? labels.applying : labels.apply}
            </Button>
          </div>
        </ContainerFooter>
      ) : null}
    </Container>
  );
}
