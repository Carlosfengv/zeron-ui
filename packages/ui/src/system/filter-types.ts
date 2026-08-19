/**
 * Shared filter vocabulary used by the data grid and FilterBuilder. Values are
 * deliberately framework-agnostic and JSON-safe so callers can persist them
 * in URLs or send them to a server without a second conversion step.
 */
export type TextFilterOperator =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty";

export type NumberFilterOperator =
  | "equals"
  | "notEquals"
  | "lessThan"
  | "lessThanOrEqual"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "isBetween"
  | "isEmpty"
  | "isNotEmpty";

export type DateFilterOperator =
  | "equals"
  | "notEquals"
  | "before"
  | "after"
  | "onOrBefore"
  | "onOrAfter"
  | "isBetween"
  | "isEmpty"
  | "isNotEmpty";

export type SelectFilterOperator =
  | "is"
  | "isNot"
  | "isAnyOf"
  | "isNoneOf"
  | "includesAll"
  | "excludesAll"
  | "isEmpty"
  | "isNotEmpty";

export type BooleanFilterOperator = "isTrue" | "isFalse";

export type FilterOperator =
  | TextFilterOperator
  | NumberFilterOperator
  | DateFilterOperator
  | SelectFilterOperator
  | BooleanFilterOperator;

export interface FilterDateRangeValue {
  from?: string;
  to?: string;
}

export type FilterScalar = string | number | boolean;

export type FilterClauseValue =
  | FilterScalar
  | FilterScalar[]
  | FilterDateRangeValue;

/** Backwards-compatible value shape used by the existing DataGrid. */
export interface FilterValue {
  operator: FilterOperator;
  value?: FilterScalar | FilterScalar[];
  endValue?: string | number;
}
