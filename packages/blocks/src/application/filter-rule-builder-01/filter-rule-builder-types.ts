import type { ComponentPropsWithoutRef } from "react";
import type { BadgeColorInput } from "@zeron/ui/badge";
import type {
  BooleanFilterField,
  FilterClause,
  FilterClauseValue,
  FilterOperator,
  NumberFilterField,
  SelectFilterField,
  TextFilterField,
} from "@zeron/ui/system/filter-core";

export type FilterRuleClause = FilterClause;
export type FilterRuleClauseValue = FilterClauseValue;
export type FilterRuleOperator = FilterOperator;

export type FilterRuleField = (
  | TextFilterField
  | NumberFilterField
  | SelectFilterField
  | BooleanFilterField
) & {
  /** Categorical accent used by the rule summary. */
  color?: BadgeColorInput;
  /** Short unit rendered after number values, for example %, ms, or m. */
  unit?: string;
};

export interface FilterRulePreset {
  id: string;
  label: string;
  filters: readonly FilterRuleClause[];
}

export interface FilterRuleDraft {
  field: string;
  operator: FilterRuleOperator;
  value?: FilterRuleClauseValue;
}

export interface FilterRuleBuilderLabels {
  title: string;
  description: (count: number) => string;
  counts: (active: number, drafting: number) => string;
  presets: string;
  rule: (index: number) => string;
  drafting: string;
  conjunction: string;
  property: string;
  operator: string;
  threshold: string;
  selectProperty: string;
  selectOperator: string;
  selectValue: string;
  searchValues: string;
  noValues: string;
  addRule: string;
  addAnotherRule: string;
  cancelDraft: string;
  removeRule: (field: string) => string;
  clearAll: string;
  cancel: string;
  apply: string;
  applying: string;
  dismiss: string;
  valueRequired: string;
  valueTooSmall: (minimum: number) => string;
  valueTooLarge: (maximum: number) => string;
  finishDraft: string;
  applyError: string;
  trueValue: string;
  falseValue: string;
}

export interface FilterRuleBuilderProps
  extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  fields: readonly FilterRuleField[];
  presets?: readonly FilterRulePreset[];
  value?: readonly FilterRuleClause[];
  defaultValue?: readonly FilterRuleClause[];
  defaultDraft?: Partial<FilterRuleDraft>;
  onValueChange?: (filters: FilterRuleClause[]) => void;
  onApply?: (filters: FilterRuleClause[]) => Promise<void> | void;
  onCancel?: (filters: FilterRuleClause[]) => void;
  onDismiss?: () => void;
  labels?: Partial<FilterRuleBuilderLabels>;
  applying?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  maxRules?: number;
  maxBodyHeight?: string | number;
  /** Number of records currently matched by the working filter set. */
  resultCount?: number;
}
