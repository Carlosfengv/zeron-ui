"use client";

import * as React from "react";
import { Button } from "#components/button";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";
import { FilterClauseRow } from "./filter-clause";
import { FilterFieldMenu } from "./filter-field-menu";
import type {
  FilterBuilderProps,
  FilterClause,
  FilterClauseValue,
  FilterField,
  FilterLogic,
  FilterOperator,
} from "./filter-types";
import {
  createFilterClause,
  normaliseValueForOperator,
  resolveFilterBuilderMessages,
} from "./filter-utils";

function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const resolvedValue = value ?? internalValue;
  const setValue = React.useCallback((next: T) => {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  }, [onChange, value]);
  return [resolvedValue, setValue] as const;
}

export function FilterBuilder({
  allowDuplicateFields = true,
  className,
  defaultFilters = [],
  defaultLogic = "and",
  disabled = false,
  fields,
  filters: filtersProp,
  locale,
  logic: logicProp,
  maxFilters,
  messages: messagesInput,
  onFiltersChange,
  onLogicChange,
  readOnly = false,
  showLogic,
  size = "md",
  trigger,
  ...props
}: FilterBuilderProps) {
  const Eraser = useIcon("eraser");
  const [filters, setFilters] = useControllableState<FilterClause[]>(
    filtersProp === undefined ? undefined : [...filtersProp],
    [...defaultFilters],
    onFiltersChange,
  );
  const [logic, setLogic] = useControllableState<FilterLogic>(logicProp, defaultLogic, onLogicChange);
  const [lastAddedId, setLastAddedId] = React.useState<string>();
  const messages = React.useMemo(() => resolveFilterBuilderMessages(messagesInput), [messagesInput]);
  const fieldMap = React.useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);
  const selectedFieldIds = React.useMemo(() => new Set(filters.map((filter) => filter.field)), [filters]);
  const isDisabled = disabled || readOnly;

  React.useEffect(() => {
    if (!lastAddedId) return;
    const timer = window.setTimeout(() => setLastAddedId(undefined), 500);
    return () => window.clearTimeout(timer);
  }, [lastAddedId]);

  const addFilter = React.useCallback((field: FilterField) => {
    if (disabled || readOnly || (maxFilters !== undefined && filters.length >= maxFilters)) return;
    const clause = createFilterClause(field);
    setFilters([...filters, clause]);
    setLastAddedId(clause.id);
  }, [disabled, filters, maxFilters, readOnly, setFilters]);

  const updateClause = React.useCallback((id: string, update: Partial<FilterClause>) => {
    setFilters(filters.map((clause) => clause.id === id ? { ...clause, ...update } : clause));
  }, [filters, setFilters]);

  const updateOperator = React.useCallback((clause: FilterClause, operator: FilterOperator) => {
    updateClause(clause.id, {
      operator,
      value: normaliseValueForOperator(clause.value, operator),
    });
  }, [updateClause]);

  const removeClause = React.useCallback((id: string) => {
    setFilters(filters.filter((clause) => clause.id !== id));
  }, [filters, setFilters]);

  const resolvedShowLogic = showLogic ?? filters.length > 1;
  return (
    <div
      aria-label="Filters"
      className={cn("flex max-w-full flex-wrap items-center gap-2", className)}
      data-size={size}
      data-slot="filter-builder"
      role="toolbar"
      {...props}
    >
      {!readOnly && (
        <FilterFieldMenu
          allowDuplicateFields={allowDuplicateFields}
          disabled={disabled}
          fields={fields}
          filterCount={filters.length}
          maxFilters={maxFilters}
          messages={messages}
          onSelect={addFilter}
          readOnly={readOnly}
          selectedFieldIds={selectedFieldIds}
          size={size}
          trigger={trigger}
        />
      )}
      {resolvedShowLogic && (
        <div className="flex overflow-hidden rounded-lg border border-border shadow-control" role="group">
          <Button
            active={logic === "and"}
            aria-pressed={logic === "and"}
            disabled={isDisabled}
            onClick={() => setLogic("and")}
            size={size}
            variant="tertiary"
          >
            {messages.matchAll}
          </Button>
          <Button
            active={logic === "or"}
            aria-pressed={logic === "or"}
            className="rounded-l-none border-l-0"
            disabled={isDisabled}
            onClick={() => setLogic("or")}
            size={size}
            variant="tertiary"
          >
            {messages.matchAny}
          </Button>
        </div>
      )}
      {filters.map((clause) => {
        const field = fieldMap.get(clause.field);
        if (!field) return null;
        return (
          <FilterClauseRow
            autoFocus={lastAddedId === clause.id}
            clause={clause}
            disabled={disabled}
            field={field}
            key={clause.id}
            locale={locale}
            messages={messages}
            onOperatorChange={(operator) => updateOperator(clause, operator)}
            onRemove={() => removeClause(clause.id)}
            onValueChange={(value: FilterClauseValue | undefined) => updateClause(clause.id, { value })}
            readOnly={readOnly}
            size={size}
          />
        );
      })}
      {!readOnly && filters.length > 0 && (
        <Button
          aria-label={messages.clearFilters}
          leadingIcon={Eraser}
          onClick={() => setFilters([])}
          size={size}
          variant="ghost"
        >
          {messages.clearFilters}
        </Button>
      )}
    </div>
  );
}
