import type {
  BuiltInFilterOperator,
  FilterBuilderMessages,
  FilterBuilderMessagesInput,
  FilterClause,
  FilterClauseValue,
  FilterDateRangeValue,
  FilterField,
  FilterLogic,
  FilterOperator,
  FilterOperatorDefinition,
  JSONValue,
  FilterState,
  FilterStateParseResult,
} from "./filter-types";

const emptyOperators = ["isEmpty", "isNotEmpty"] as const satisfies readonly BuiltInFilterOperator[];
const booleanOperators = ["isTrue", "isFalse"] as const satisfies readonly BuiltInFilterOperator[];
const valuelessOperators: readonly string[] = [...emptyOperators, ...booleanOperators];

const defaultOperatorValues: Record<FilterField["type"], readonly BuiltInFilterOperator[]> = {
  text: [
    "contains",
    "notContains",
    "equals",
    "notEquals",
    "startsWith",
    "endsWith",
    ...emptyOperators,
  ],
  number: [
    "equals",
    "notEquals",
    "lessThan",
    "lessThanOrEqual",
    "greaterThan",
    "greaterThanOrEqual",
    "isBetween",
    ...emptyOperators,
  ],
  select: ["is", "isNot", ...emptyOperators],
  multiSelect: ["isAnyOf", "isNoneOf", "includesAll", "excludesAll", ...emptyOperators],
  boolean: booleanOperators,
  date: ["equals", "notEquals", "before", "after", "onOrBefore", "onOrAfter", "isBetween", ...emptyOperators],
  dateRange: ["isBetween", ...emptyOperators],
  custom: ["equals", ...emptyOperators],
};

const operatorLabels: Record<BuiltInFilterOperator, string> = {
  contains: "contains",
  notContains: "does not contain",
  equals: "equals",
  notEquals: "does not equal",
  startsWith: "starts with",
  endsWith: "ends with",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
  lessThan: "less than",
  lessThanOrEqual: "at most",
  greaterThan: "greater than",
  greaterThanOrEqual: "at least",
  isBetween: "between",
  before: "before",
  after: "after",
  onOrBefore: "on or before",
  onOrAfter: "on or after",
  is: "is",
  isNot: "is not",
  isAnyOf: "is any of",
  isNoneOf: "is none of",
  includesAll: "includes all",
  excludesAll: "excludes all",
  isTrue: "is true",
  isFalse: "is false",
};

export const DEFAULT_FILTER_BUILDER_MESSAGES: FilterBuilderMessages = {
  addFilter: "Add filter",
  clearFilters: "Clear filters",
  searchFields: "Search filters…",
  searchOptions: "Search options…",
  noFields: "No filters found.",
  noOptions: "No options found.",
  loadingOptions: "Loading options…",
  loadOptionsError: "Could not load options.",
  retry: "Retry",
  removeFilter: (fieldLabel) => `Remove ${fieldLabel} filter`,
  selectedCount: (count) => `${count} selected`,
  matchAll: "Match all",
  matchAny: "Match any",
  operators: operatorLabels,
};

export function resolveFilterBuilderMessages(
  input?: FilterBuilderMessagesInput,
): FilterBuilderMessages {
  return {
    ...DEFAULT_FILTER_BUILDER_MESSAGES,
    ...input,
    operators: {
      ...DEFAULT_FILTER_BUILDER_MESSAGES.operators,
      ...input?.operators,
    },
  };
}

export function operatorsForField(field: FilterField): FilterOperatorDefinition[] {
  if (field.operators) return [...field.operators];
  return defaultOperatorValues[field.type].map((value) => ({
    value,
    label: DEFAULT_FILTER_BUILDER_MESSAGES.operators[value],
  }));
}

export function operatorNeedsValue(operator: FilterOperator) {
  return !valuelessOperators.includes(operator);
}

export function defaultOperatorForField(field: FilterField): FilterOperator {
  const operators = operatorsForField(field);
  return field.defaultOperator && operators.some(({ value }) => value === field.defaultOperator)
    ? field.defaultOperator
    : operators[0]?.value ?? "equals";
}

export function createFilterClause(field: FilterField, id = createFilterId()): FilterClause {
  return { id, field: field.id, operator: defaultOperatorForField(field) };
}

export function createFilterId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `filter-${Math.random().toString(36).slice(2, 10)}`;
}

export function normaliseValueForOperator(
  value: FilterClauseValue | undefined,
  nextOperator: FilterOperator,
): FilterClauseValue | undefined {
  if (!operatorNeedsValue(nextOperator)) return undefined;
  if (!isBuiltInFilterOperator(nextOperator)) return value;
  if (nextOperator === "isBetween") {
    if (typeof value === "number") return [value];
    if (typeof value === "string") return { from: value };
  }
  if (Array.isArray(value) && nextOperator !== "isAnyOf" && nextOperator !== "isNoneOf" && nextOperator !== "includesAll" && nextOperator !== "excludesAll") {
    return value[0];
  }
  if (isDateRange(value) && nextOperator !== "isBetween") return value.from;
  return value;
}

export function isBuiltInFilterOperator(
  operator: FilterOperator,
): operator is BuiltInFilterOperator {
  return Object.prototype.hasOwnProperty.call(operatorLabels, operator);
}

export function validateFilterValue(
  field: FilterField,
  operator: FilterOperator,
  value: FilterClauseValue | undefined,
) {
  if (!operatorNeedsValue(operator)) return { valid: true } as const;
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    return { valid: false, message: "Enter a value." } as const;
  }

  if (field.type === "number") {
    const values = Array.isArray(value) ? value : [value];
    if (!values.every((item) => typeof item === "number" && Number.isFinite(item))) {
      return { valid: false, message: "Enter a valid number." } as const;
    }
    if (field.min !== undefined && values.some((item) => (item as number) < field.min!)) {
      return { valid: false, message: `Value must be at least ${field.min}.` } as const;
    }
    if (field.max !== undefined && values.some((item) => (item as number) > field.max!)) {
      return { valid: false, message: `Value must be at most ${field.max}.` } as const;
    }
    if (operator === "isBetween" && values.length === 2 && (values[0] as number) > (values[1] as number)) {
      return { valid: false, message: "The first value must be before the second." } as const;
    }
  }

  if (field.type === "date" || field.type === "dateRange") {
    if (typeof value === "string" && !isIsoDate(value)) {
      return { valid: false, message: "Enter a valid date." } as const;
    }
    if (isDateRange(value)) {
      if (value.from && !isIsoDate(value.from)) return { valid: false, message: "Enter a valid start date." } as const;
      if (value.to && !isIsoDate(value.to)) return { valid: false, message: "Enter a valid end date." } as const;
      if (value.from && value.to && value.from > value.to) {
        return { valid: false, message: "The start date must be before the end date." } as const;
      }
    }
  }

  if (field.type === "select" || field.type === "multiSelect") {
    if (field.maxSelections && Array.isArray(value) && value.length > field.maxSelections) {
      return { valid: false, message: `Choose at most ${field.maxSelections} options.` } as const;
    }
  }

  const validator = "validate" in field ? field.validate : undefined;
  return validator ? validator(value as never, { field, operator }) : ({ valid: true } as const);
}

export function serializeFilterState(state: FilterState) {
  return JSON.stringify(state);
}

export function parseFilterState(
  input: string | null | undefined,
  fields: readonly FilterField[],
): FilterStateParseResult {
  const empty: FilterState = { filters: [], logic: "and" };
  if (!input) return { state: empty };
  try {
    const parsed = JSON.parse(input) as Partial<FilterState>;
    if (!Array.isArray(parsed.filters) || (parsed.logic !== "and" && parsed.logic !== "or")) {
      return { state: empty, error: "Invalid filter state." };
    }
    const fieldMap = new Map(fields.map((field) => [field.id, field]));
    const filters = parsed.filters.filter((candidate): candidate is FilterClause => {
      if (!candidate || typeof candidate !== "object") return false;
      const clause = candidate as Partial<FilterClause>;
      if (typeof clause.id !== "string" || typeof clause.field !== "string" || typeof clause.operator !== "string") return false;
      if (clause.meta !== undefined && !isFilterClauseMeta(clause.meta)) return false;
      const field = fieldMap.get(clause.field);
      return Boolean(
        field &&
          operatorsForField(field).some(({ value }) => value === clause.operator) &&
          validateFilterValue(field, clause.operator as FilterOperator, clause.value).valid,
      );
    });
    return { state: { filters, logic: parsed.logic } };
  } catch {
    return { state: empty, error: "Invalid filter state." };
  }
}

export interface FilterPredicateConfig<TData> {
  fields: readonly FilterField[];
  filters: readonly FilterClause[];
  logic?: FilterLogic;
  getValue?: (row: TData, field: FilterField) => unknown;
}

export function createFilterPredicate<TData>({
  fields,
  filters,
  logic = "and",
  getValue,
}: FilterPredicateConfig<TData>) {
  const fieldMap = new Map(fields.map((field) => [field.id, field]));
  return (row: TData) => {
    if (filters.length === 0) return true;
    const results = filters.map((filter) => {
      const field = fieldMap.get(filter.field);
      if (!field) return false;
      const value = getValue?.(row, field) ?? field.accessor?.(row) ?? readPath(row, field.id);
      return matchesFilter(value, filter);
    });
    return logic === "and" ? results.every(Boolean) : results.some(Boolean);
  };
}

export function matchesFilter(value: unknown, filter: FilterClause): boolean {
  const query = filter.value;
  if (filter.operator === "isEmpty") return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  if (filter.operator === "isNotEmpty") return !matchesFilter(value, { ...filter, operator: "isEmpty" });
  if (filter.operator === "isTrue") return value === true;
  if (filter.operator === "isFalse") return value === false;

  const haystack = String(value ?? "").toLocaleLowerCase();
  const needle = String(query ?? "").toLocaleLowerCase();
  const values = Array.isArray(value) ? value.map(String) : [String(value ?? "")];
  const queryValues = Array.isArray(query) ? query.map(String) : [String(query ?? "")];

  switch (filter.operator) {
    case "contains": return haystack.includes(needle);
    case "notContains": return !haystack.includes(needle);
    case "startsWith": return haystack.startsWith(needle);
    case "endsWith": return haystack.endsWith(needle);
    case "equals": case "is": return String(value) === String(query);
    case "notEquals": case "isNot": return String(value) !== String(query);
    case "isAnyOf": return queryValues.includes(String(value));
    case "isNoneOf": return !queryValues.includes(String(value));
    case "includesAll": return queryValues.every((item) => values.includes(item));
    case "excludesAll": return queryValues.every((item) => !values.includes(item));
    case "lessThan": return Number(value) < Number(query);
    case "lessThanOrEqual": return Number(value) <= Number(query);
    case "greaterThan": return Number(value) > Number(query);
    case "greaterThanOrEqual": return Number(value) >= Number(query);
    case "before": return String(value) < String(query);
    case "after": return String(value) > String(query);
    case "onOrBefore": return String(value) <= String(query);
    case "onOrAfter": return String(value) >= String(query);
    case "isBetween": {
      if (isDateRange(query)) {
        return (!query.from || String(value) >= query.from) && (!query.to || String(value) <= query.to);
      }
      if (Array.isArray(query)) return Number(value) >= Number(query[0]) && Number(value) <= Number(query[1]);
      return false;
    }
    default: return false;
  }
}

export function isDateRange(value: FilterClauseValue | undefined): value is FilterDateRangeValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && ("from" in value || "to" in value));
}

function isFilterClauseMeta(value: unknown): value is Record<string, JSONValue> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.values(value).every(isJSONValue),
  );
}

function isJSONValue(value: unknown): value is JSONValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJSONValue);
  if (typeof value === "object") return Object.values(value).every(isJSONValue);
  return false;
}

export function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) =>
    current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined,
  value);
}
