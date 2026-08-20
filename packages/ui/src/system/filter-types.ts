/**
 * Shared filter vocabulary used by the data grid and FilterBuilder. Values are
 * JSON-safe so callers can serialize them, but their operator names are UI
 * vocabulary rather than a backend query protocol. Server-backed consumers
 * should validate fields and translate operators at their application boundary.
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

export type BuiltInFilterOperator =
  | TextFilterOperator
  | NumberFilterOperator
  | DateFilterOperator
  | SelectFilterOperator
  | BooleanFilterOperator;

/**
 * A FilterBuilder operator. Built-in values retain autocomplete while hosts
 * can declare protocol-specific operators on individual fields.
 */
export type FilterOperator = BuiltInFilterOperator | (string & {});

export interface FilterDateRangeValue {
  from?: string;
  to?: string;
}

export type FilterScalar = string | number | boolean;

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type FilterClauseValue =
  | FilterScalar
  | FilterScalar[]
  | FilterDateRangeValue;

/** Backwards-compatible value shape used by the existing DataGrid. */
export interface FilterValue {
  operator: BuiltInFilterOperator;
  value?: FilterScalar | FilterScalar[];
  endValue?: string | number;
}
