import { describe, expect, it } from "vitest";
import { defaultFilterQueryCodec as codec } from "../packages/ui/src/components/filter-query-core/filter-query-parser";
import { mergeFilterQueryClauses } from "../packages/ui/src/components/filter-query-core/filter-query-reconcile";
import type { FilterQueryCodecContext } from "../packages/ui/src/components/filter-query-core/filter-query-types";
import type { FilterClause, FilterField } from "../packages/ui/src/system/filter-core";

const fields: readonly FilterField[] = [
  { id: "name", label: "Name", type: "text" },
  { id: "age", label: "Age", type: "number" },
  { id: "status", label: "Status", type: "select" },
  { id: "tags", label: "Tags", type: "multiSelect" },
  { id: "enabled", label: "Enabled", type: "boolean" },
  { id: "date", label: "Date", type: "date" },
  { id: "dates", label: "Dates", type: "dateRange" },
];

function context(overrides: Partial<FilterQueryCodecContext> = {}): FilterQueryCodecContext {
  return { fields, queryFields: fields.map((field) => ({ fieldId: field.id })), freeText: false, previousFilters: [], createClauseId: () => "new", ...overrides };
}

const unsupported: FilterClause[] = [
  { id: "greater", field: "age", operator: "greaterThan", value: 18 },
  { id: "less", field: "age", operator: "lessThan", value: 65 },
  { id: "not-status", field: "status", operator: "isNot", value: "active" },
  { id: "not-name", field: "name", operator: "notContains", value: "secret" },
  { id: "none", field: "tags", operator: "isNoneOf", value: ["private"] },
];

describe("review: lossless filter query serialization", () => {
  it.each(unsupported)("preserves $operator rules during the default merge", (clause) => {
    const ctx = context({ previousFilters: [clause] });
    const serialized = codec.serialize([clause], ctx);
    expect(serialized).toEqual({ query: "", representedClauseIds: [], unsupportedClauses: [clause] });
    const parsed = codec.parse(serialized.query, ctx);
    expect(mergeFilterQueryClauses([clause], parsed.clauses, serialized, "replace-representable")).toEqual([clause]);
  });

  it("replaces supported rules while retaining every unsupported clause", () => {
    const supported: FilterClause = { id: "name", field: "name", operator: "contains", value: "old" };
    const previous = [...unsupported, supported];
    const ctx = context({ previousFilters: previous });
    const serialized = codec.serialize(previous, ctx);
    const next = codec.parse("name:new", ctx);
    expect(serialized.query).toBe("name:old");
    expect(mergeFilterQueryClauses(previous, next.clauses, serialized, "replace-representable")).toEqual([...next.clauses, ...unsupported]);
    expect(mergeFilterQueryClauses(previous, next.clauses, serialized, "replace-all")).toEqual(next.clauses);
  });

  it.each(["O'Reilly", 'a"b', String.raw`a\\b`, "C:\\path\\", "two words", "a,b:c", ""])("round-trips quoted text %j", (value) => {
    const original: FilterClause = { id: "original", field: "name", operator: "contains", value };
    const ctx = context({ previousFilters: [original] });
    const serialized = codec.serialize([original], ctx);
    expect(serialized.unsupportedClauses).toEqual([]);
    const parsed = codec.parse(serialized.query, ctx);
    expect(parsed.complete).toBe(true);
    expect(parsed.clauses).toEqual([expect.objectContaining(original)]);
  });

  it("round-trips escaped multi-select values without splitting quoted commas", () => {
    const original: FilterClause = { id: "tags", field: "tags", operator: "isAnyOf", value: ["O'Reilly", 'a"b', String.raw`a\\b`, "a,b"] };
    const ctx = context({ previousFilters: [original] });
    const serialized = codec.serialize([original], ctx);
    expect(serialized.unsupportedClauses).toEqual([]);
    expect(codec.parse(serialized.query, ctx).clauses).toEqual([expect.objectContaining(original)]);
  });

  it.each<FilterClause>([
    { id: "age", field: "age", operator: "equals", value: 18 },
    { id: "range", field: "age", operator: "isBetween", value: [-10, 30] },
    { id: "status", field: "status", operator: "is", value: "active" },
    { id: "true", field: "enabled", operator: "isTrue" },
    { id: "false", field: "enabled", operator: "isFalse" },
    { id: "date", field: "date", operator: "equals", value: "2026-10-02" },
    { id: "dates", field: "dates", operator: "isBetween", value: { from: "2026-10-01", to: "2026-10-02" } },
  ])("still represents $id with its original semantics", (original) => {
    const ctx = context({ previousFilters: [original] });
    const serialized = codec.serialize([original], ctx);
    expect(serialized.unsupportedClauses).toEqual([]);
    expect(codec.parse(serialized.query, ctx).clauses).toEqual([expect.objectContaining(original)]);
  });

  it("uses a configured default operator rather than assuming the built-in default", () => {
    const original: FilterClause = { id: "age", field: "age", operator: "greaterThan", value: 18 };
    const ctx = context({ fields: [{ id: "age", label: "Age", type: "number", defaultOperator: "greaterThan" }] });
    expect(codec.serialize([original], ctx).representedClauseIds).toEqual([original.id]);
  });

  it("honors custom operator, value, and metadata codecs", () => {
    const original: FilterClause = { id: "custom", field: "age", operator: "greaterThan", value: 18, meta: { unit: "years" } };
    const ctx = context({
      queryFields: [{
        fieldId: "age",
        serializeValue: (clause) => `>${clause.value}`,
        parseValue: (raw) => ({ valid: true, operator: "greaterThan", value: Number(raw.slice(1)), meta: { unit: "years" } }),
      }],
      previousFilters: [original],
    });
    const serialized = codec.serialize([original], ctx);
    expect(serialized.query).toBe("age:>18");
    expect(serialized.unsupportedClauses).toEqual([]);
    expect(codec.parse(serialized.query, ctx).clauses).toEqual([original]);
  });

  it("allows custom field serializers when their parser restores the clause", () => {
    const original: FilterClause = { id: "custom", field: "status", operator: "serverMatches", value: "active" };
    const ctx = context({
      fields: [{ id: "status", label: "Status", type: "custom", renderEditor: () => null }],
      queryFields: [{ fieldId: "status", serializeValue: () => "active", parseValue: (raw) => ({ valid: true, operator: "serverMatches", value: raw }) }],
    });
    expect(codec.serialize([original], ctx)).toEqual({ query: "status:active", representedClauseIds: [original.id], unsupportedClauses: [] });
  });

  it("does not silently drop metadata or change scalar types", () => {
    const clauses: FilterClause[] = [
      { id: "meta", field: "name", operator: "contains", value: "hello", meta: { caseSensitive: true } },
      { id: "numeric-option", field: "status", operator: "is", value: 123 },
    ];
    expect(codec.serialize(clauses, context()).unsupportedClauses).toEqual(clauses);
  });
});
