import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { Locale } from "date-fns";
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
import type { ControlSize } from "../../tokens/control-size";

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

export type FilterLogic = "and" | "or";

export interface FilterClause {
  id: string;
  field: string;
  operator: FilterOperator;
  value?: FilterClauseValue;
  /** Host-defined, JSON-safe state that participates in a clause's meaning. */
  meta?: Record<string, JSONValue>;
}

export interface FilterOption<TValue extends FilterScalar = string> {
  value: TValue;
  label: ReactNode;
  /** Plain text used for searching and when an option label is non-textual. */
  textValue?: string;
  icon?: IconComponent;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FilterOperatorDefinition {
  value: FilterOperator;
  label: string;
}

export type FilterValidationResult =
  | { valid: true }
  | { valid: false; message: string };

export interface FilterValidationContext {
  field: FilterField;
  operator: FilterOperator;
}

export type FilterValidator<TValue> = (
  value: TValue,
  context: FilterValidationContext,
) => FilterValidationResult;

export interface FilterFieldBase {
  id: string;
  label: string;
  group?: string;
  icon?: IconComponent;
  description?: string;
  operators?: readonly FilterOperatorDefinition[];
  defaultOperator?: FilterOperator;
  disabled?: boolean;
  /** Optional row reader used by the framework-agnostic client predicate helper. */
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

export type FilterClauseEditorUpdate = Partial<
  Pick<FilterClause, "value" | "meta">
>;

export interface CustomFilterField extends FilterFieldBase {
  type: "custom";
  renderEditor: (props: FilterEditorRenderProps) => ReactNode;
  renderValue?: (
    value: FilterClauseValue | undefined,
    context: Pick<FilterEditorRenderProps, "clause" | "meta">,
  ) => ReactNode;
}

export type FilterField =
  | TextFilterField
  | NumberFilterField
  | SelectFilterField
  | BooleanFilterField
  | DateFilterField
  | CustomFilterField;

export interface FilterOptionLoaderContext {
  signal: AbortSignal;
  field: SelectFilterField;
}

export type FilterOptionLoader = (
  query: string,
  context: FilterOptionLoaderContext,
) => Promise<readonly FilterOption[]>;

export interface FilterBuilderMessages {
  addFilter: string;
  clearFilters: string;
  searchFields: string;
  searchOptions: string;
  noFields: string;
  noOptions: string;
  loadingOptions: string;
  loadOptionsError: string;
  retry: string;
  removeFilter: (fieldLabel: string) => string;
  selectedCount: (count: number) => string;
  matchAll: string;
  matchAny: string;
  operators: Record<BuiltInFilterOperator, string>;
}

export type FilterBuilderMessagesInput = Omit<
  Partial<FilterBuilderMessages>,
  "operators"
> & {
  operators?: Partial<Record<BuiltInFilterOperator, string>>;
};

export interface FilterBuilderProps
  extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  fields: readonly FilterField[];
  filters?: readonly FilterClause[];
  defaultFilters?: readonly FilterClause[];
  onFiltersChange?: (filters: FilterClause[]) => void;
  logic?: FilterLogic;
  defaultLogic?: FilterLogic;
  onLogicChange?: (logic: FilterLogic) => void;
  /** The logic modes the host query backend can represent. */
  supportedLogic?: readonly FilterLogic[];
  showLogic?: boolean;
  size?: ControlSize;
  disabled?: boolean;
  readOnly?: boolean;
  allowDuplicateFields?: boolean;
  maxFilters?: number;
  trigger?: ReactNode;
  messages?: FilterBuilderMessagesInput;
  locale?: string;
}

export interface FilterState {
  filters: FilterClause[];
  logic: FilterLogic;
}

export interface FilterStateParseResult {
  state: FilterState;
  error?: string;
}
