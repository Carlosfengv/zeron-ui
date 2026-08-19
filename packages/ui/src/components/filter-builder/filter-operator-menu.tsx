"use client";

import * as React from "react";
import { Button } from "#components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#components/popover";
import { cn } from "#system/utils";
import type { ControlSize } from "../../tokens/control-size";
import type { FilterField, FilterOperator } from "./filter-types";
import { operatorsForField } from "./filter-utils";

interface FilterOperatorMenuProps {
  disabled?: boolean;
  field: FilterField;
  messages: Record<FilterOperator, string>;
  onValueChange: (operator: FilterOperator) => void;
  readOnly?: boolean;
  size: ControlSize;
  value: FilterOperator;
}

export function FilterOperatorMenu({
  disabled,
  field,
  messages,
  onValueChange,
  readOnly,
  size,
  value,
}: FilterOperatorMenuProps) {
  const [open, setOpen] = React.useState(false);
  const operators = operatorsForField(field);
  const label = messages[value] ?? operators.find((operator) => operator.value === value)?.label;

  if (readOnly) {
    return <span className="inline-flex items-center px-2.5 text-body text-fg-muted">{label}</span>;
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            active={open}
            aria-label={`${field.label}: ${label}`}
            disabled={disabled}
            size={size}
            variant="tertiary"
          >
            {label}
          </Button>
        }
      />
      <PopoverContent align="start" className="min-w-48 p-1" sideOffset={4}>
        <div className="flex flex-col gap-0.5" role="menu">
          {operators.map((operator) => (
            <Button
              aria-pressed={value === operator.value}
              className={cn(
                "justify-start",
                value === operator.value && "text-fg-default",
              )}
              key={operator.value}
              onClick={() => {
                onValueChange(operator.value);
                setOpen(false);
              }}
              size={size}
              variant={value === operator.value ? "secondary" : "ghost"}
            >
              {messages[operator.value] ?? operator.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
