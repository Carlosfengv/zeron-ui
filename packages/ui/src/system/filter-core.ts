import type { Locale } from "date-fns";
import type { ReactNode } from "react";
import type { IconComponent } from "#system/icon-context";
import type {
  BooleanFilterOperator,
  BuiltInFilterOperator,
  DateFilterOperator,
  FilterClauseValue,
  FilterDateRangeValue,
  FilterOperator,
  FilterScalar,
  JSONValue,
  NumberFilterOperator,
  SelectFilterOperator,
  TextFilterOperator,
} from "#system/filter-types";

export type {
  BooleanFilterOperator,
  BuiltInFilterOperator,
  DateFilterOperator,
  FilterClauseValue,
  FilterDateRangeValue,
  FilterOperator,
  FilterScalar,
  JSONValue,
  NumberFilterOperator,
  SelectFilterOperator,
  TextFilterOperator,
};

export interface FilterClause {
  id: string;
  field: string;
  operator: FilterOperator;
  value?: FilterClauseValue;
  meta?: Record<string, JSONValue>;
}

export interface FilterOption<TValue extends FilterScalar = string> {
  value: TValue;
  label: ReactNode;
  textValue?: string;
  icon?: IconComponent;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FilterOperatorDefinition {
  value: FilterOperator;
  label: string;
}

export type FilterValidationResult = { valid: true } | { valid: false; message: string };

export interface FilterValidationContext {
  field: FilterField;
  operator: FilterOperator;
}

export type FilterValidator<TValue> = (value: TValue, context: FilterValidationContext) => FilterValidationResult;

export interface FilterFieldBase {
  id: string;
  label: string;
  group?: string;
  icon?: IconComponent;
  description?: string;
  operators?: readonly FilterOperatorDefinition[];
  defaultOperator?: FilterOperator;
  disabled?: boolean;
  accessor?: (row: unknown) => unknown;
}

export interface TextFilterField extends FilterFieldBase {
  type: "text";
  placeholder?: string;
  parse?: (draft: string) => string;
  validate?: FilterValidator<string>;
}

export interface NumberFilterField extends FilterFieldBase {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  validate?: FilterValidator<number | number[]>;
}

export interface SelectFilterField extends FilterFieldBase {
  type: "select" | "multiSelect";
  options?: readonly FilterOption[];
  loadOptions?: FilterOptionLoader;
  searchable?: boolean;
  maxSelections?: number;
  virtualize?: boolean | "auto";
  renderValue?: (options: readonly FilterOption<FilterScalar>[]) => ReactNode;
}

export interface BooleanFilterField extends FilterFieldBase {
  type: "boolean";
  trueLabel?: string;
  falseLabel?: string;
}

export interface DateFilterField extends FilterFieldBase {
  type: "date" | "dateRange";
  minDate?: string;
  maxDate?: string;
  locale?: Locale;
  validate?: FilterValidator<string | FilterDateRangeValue>;
}

export interface FilterEditorRenderProps {
  clause: Readonly<FilterClause>;
  field: CustomFilterField;
  operator: FilterOperator;
  value: FilterClauseValue | undefined;
  meta: Record<string, JSONValue> | undefined;
  onChange: (value: FilterClauseValue | undefined) => void;
  onMetaChange: (meta: Record<string, JSONValue> | undefined) => void;
  onClauseChange: (update: FilterClauseEditorUpdate) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export type FilterClauseEditorUpdate = Partial<Pick<FilterClause, "value" | "meta">>;

export interface CustomFilterField extends FilterFieldBase {
  type: "custom";
  renderEditor: (props: FilterEditorRenderProps) => ReactNode;
  renderValue?: (
    value: FilterClauseValue | undefined,
    context: Pick<FilterEditorRenderProps, "clause" | "meta">,
  ) => ReactNode;
}

export type FilterField = TextFilterField | NumberFilterField | SelectFilterField | BooleanFilterField | DateFilterField | CustomFilterField;

export interface FilterOptionLoaderContext {
  signal: AbortSignal;
  field: SelectFilterField;
}

export type FilterOptionLoader = (query: string, context: FilterOptionLoaderContext) => Promise<readonly FilterOption[]>;
