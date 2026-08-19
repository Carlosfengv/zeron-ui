import { describe, expect, it } from "vitest";
import {
  createFilterClause,
  createFilterPredicate,
  defaultOperatorForField,
  matchesFilter,
  normaliseValueForOperator,
  parseFilterState,
  serializeFilterState,
  validateFilterValue,
} from "../packages/ui/src/components/filter-builder/filter-utils";
import type {
  FilterField,
  FilterState,
} from "../packages/ui/src/components/filter-builder/filter-types";

const fields: FilterField[] = [
  { id: "name", label: "Name", type: "text" },
  { id: "amount", label: "Amount", type: "number", min: 0, max: 100 },
  { id: "status", label: "Status", type: "select" },
  { id: "tags", label: "Tags", type: "multiSelect" },
  { id: "createdAt", label: "Created", type: "dateRange" },
];

describe("FilterBuilder state utilities", () => {
  it("creates clauses from type-specific defaults", () => {
    expect(defaultOperatorForField(fields[0]!)).toBe("contains");
    expect(defaultOperatorForField(fields[2]!)).toBe("is");
    expect(defaultOperatorForField(fields[4]!)).toBe("isBetween");
    expect(createFilterClause(fields[1]!, "amount-filter")).toEqual({
      id: "amount-filter",
      field: "amount",
      operator: "equals",
    });
  });

  it("normalises incompatible values when the operator changes", () => {
    expect(normaliseValueForOperator("2026-01-20", "isBetween")).toEqual({ from: "2026-01-20" });
    expect(normaliseValueForOperator([10, 20], "greaterThan")).toBe(10);
    expect(normaliseValueForOperator("unused", "isEmpty")).toBeUndefined();
  });

  it("validates numeric and date-range values", () => {
    expect(validateFilterValue(fields[1]!, "isBetween", [20, 10])).toMatchObject({ valid: false });
    expect(validateFilterValue(fields[1]!, "equals", 101)).toMatchObject({ valid: false });
    expect(validateFilterValue(fields[4]!, "isBetween", { from: "2026-03-10", to: "2026-03-01" })).toMatchObject({ valid: false });
    expect(validateFilterValue(fields[4]!, "isBetween", { from: "2026-03-01", to: "2026-03-10" })).toEqual({ valid: true });
  });

  it("round-trips only known, valid filter clauses", () => {
    const state: FilterState = {
      logic: "and",
      filters: [
        { id: "name", field: "name", operator: "contains", value: "zeron" },
        { id: "bad", field: "missing", operator: "contains", value: "discard" },
      ],
    };
    expect(parseFilterState(serializeFilterState(state), fields)).toEqual({
      state: { logic: "and", filters: [state.filters[0]] },
    });
    expect(parseFilterState("not json", fields)).toMatchObject({ error: "Invalid filter state." });
  });
});

describe("FilterBuilder client predicate", () => {
  it("supports text, multi-select, ranges, and empty filter sets", () => {
    expect(matchesFilter(["enterprise", "priority"], {
      id: "tags",
      field: "tags",
      operator: "includesAll",
      value: ["priority"],
    })).toBe(true);

    const predicate = createFilterPredicate<{ name: string; amount: number }>({
      fields,
      filters: [
        { id: "name", field: "name", operator: "contains", value: "zer" },
        { id: "amount", field: "amount", operator: "isBetween", value: [10, 20] },
      ],
    });
    expect(predicate({ name: "Zeron UI", amount: 16 })).toBe(true);
    expect(predicate({ name: "Zeron UI", amount: 25 })).toBe(false);

    const emptyPredicate = createFilterPredicate<{ name: string }>({ fields, filters: [], logic: "or" });
    expect(emptyPredicate({ name: "Anything" })).toBe(true);
  });
});
