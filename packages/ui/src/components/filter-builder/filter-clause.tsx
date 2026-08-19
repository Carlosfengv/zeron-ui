"use client";

import * as React from "react";
import { Button } from "#components/button";
import { ButtonGroup, ButtonGroupText } from "#components/button-group";
import { useIcon } from "#system/icon-context";
import type { ControlSize } from "../../tokens/control-size";
import type {
  FilterBuilderMessages,
  FilterClause,
  FilterClauseValue,
  FilterField,
  FilterOperator,
} from "./filter-types";
import { FilterOperatorMenu } from "./filter-operator-menu";
import { FilterValueEditor } from "./filter-value-editor";

interface FilterClauseRowProps {
  autoFocus?: boolean;
  clause: FilterClause;
  disabled?: boolean;
  field: FilterField;
  locale?: string;
  messages: FilterBuilderMessages;
  onOperatorChange: (operator: FilterOperator) => void;
  onRemove: () => void;
  onValueChange: (value: FilterClauseValue | undefined) => void;
  readOnly?: boolean;
  size: ControlSize;
}

export function FilterClauseRow({
  autoFocus,
  clause,
  disabled,
  field,
  locale,
  messages,
  onOperatorChange,
  onRemove,
  onValueChange,
  readOnly,
  size,
}: FilterClauseRowProps) {
  const X = useIcon("x");
  const FieldIcon = field.icon;
  return (
    <ButtonGroup className="max-w-full" data-slot="filter-builder-clause">
      <ButtonGroupText className="min-w-0 bg-muted px-2.5" data-size={size}>
        {FieldIcon && <FieldIcon aria-hidden className="shrink-0" size={16} />}
        <span className="truncate">{field.label}</span>
      </ButtonGroupText>
      <FilterOperatorMenu
        disabled={disabled}
        field={field}
        messages={messages.operators}
        onValueChange={onOperatorChange}
        readOnly={readOnly}
        size={size}
        value={clause.operator}
      />
      <FilterValueEditor
        autoFocus={autoFocus}
        disabled={disabled}
        field={field}
        locale={locale}
        messages={messages}
        onChange={onValueChange}
        operator={clause.operator}
        readOnly={readOnly}
        size={size}
        value={clause.value}
      />
      {!readOnly && (
        <Button
          aria-label={messages.removeFilter(field.label)}
          disabled={disabled}
          iconOnly
          onClick={onRemove}
          size={size}
          variant="tertiary"
        >
          <X aria-hidden />
        </Button>
      )}
    </ButtonGroup>
  );
}
