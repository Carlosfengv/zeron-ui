import { describe, expect, it } from "vitest";
import { defaultFilterQueryCodec } from "../packages/ui/src/components/filter-query-core/filter-query-parser";
import type { FilterClause, FilterField } from "../packages/ui/src/system/filter-core";

const fields: readonly FilterField[] = [
  { id: "query", type: "text", label: "Search" },
  { id: "status", type: "multiSelect", label: "Status" },
  { id: "latency", type: "number", label: "Latency" },
  { id: "enabled", type: "boolean", label: "Enabled" },
  { id: "date", type: "date", label: "Date" },
];

function context(previousFilters: readonly FilterClause[] = []) {
  return {
    fields,
    queryFields: [
      { fieldId: "query", suggest: false },
      { fieldId: "status", aliases: ["code"] },
      { fieldId: "latency" },
      { fieldId: "enabled" },
      { fieldId: "date" },
    ],
    freeText: { fieldId: "query", serialize: (value: unknown) => String(value) },
    previousFilters,
    createClauseId: (() => {
      let id = 0;
      return () => `new-${++id}`;
    })(),
  } as const;
}

describe("defaultFilterQueryCodec", () => {
  it("parses free text, aliases, multi-values, ranges, and boolean operators", () => {
    const result = defaultFilterQueryCodec.parse("slow request code:500,503 latency:-10-30 enabled:true", context());

    expect(result.complete).toBe(true);
    expect(result.clauses.map(({ field, operator, value }) => ({ field, operator, value }))).toEqual([
      { field: "status", operator: "isAnyOf", value: ["500", "503"] },
      { field: "latency", operator: "isBetween", value: [-10, 30] },
      { field: "enabled", operator: "isTrue", value: undefined },
      { field: "query", operator: "contains", value: "slow request" },
    ]);
  });

  it("preserves matching clause ids across a parse round trip", () => {
    const previous = [{ id: "existing-status", field: "status", operator: "isAnyOf", value: ["500"] }];
    const result = defaultFilterQueryCodec.parse("status:500", context(previous));

    expect(result.clauses[0]?.id).toBe("existing-status");
  });

  it("serializes free text while keeping it out of field suggestions", () => {
    const result = defaultFilterQueryCodec.serialize([
      { id: "query", field: "query", operator: "contains", value: "slow request" },
      { id: "status", field: "status", operator: "isAnyOf", value: ["500", "503"] },
    ], context());

    expect(result).toMatchObject({
      query: 'slow request status:500,503',
      representedClauseIds: ["query", "status"],
      unsupportedClauses: [],
    });
  });

  it("keeps numeric ranges in their parseable range syntax after a round trip", () => {
    const parsed = defaultFilterQueryCodec.parse("latency:-10-30", context());
    const serialized = defaultFilterQueryCodec.serialize(parsed.clauses, context());

    expect(serialized.query).toBe("latency:-10-30");
    expect(defaultFilterQueryCodec.parse(serialized.query, context()).clauses[0]).toMatchObject({
      field: "latency",
      operator: "isBetween",
      value: [-10, 30],
    });
  });

  it("reports unknown fields without discarding valid clauses", () => {
    const result = defaultFilterQueryCodec.parse("status:500 unknown:value", context());

    expect(result.complete).toBe(false);
    expect(result.clauses).toHaveLength(1);
    expect(result.errors[0]?.message).toMatch(/Unknown filter/);
  });

  it("keeps quoted commas intact and waits for an unfinished quote", () => {
    const complete = defaultFilterQueryCodec.parse('status:"500, internal",503', context());
    const incomplete = defaultFilterQueryCodec.parse('status:"500', context());

    expect(complete.clauses[0]?.value).toEqual(["500, internal", "503"]);
    expect(incomplete.complete).toBe(false);
    expect(incomplete.tokens[0]?.kind).toBe("incomplete");
  });

  it("rejects invalid dates and field validation failures", () => {
    const invalidDate = defaultFilterQueryCodec.parse("date:not-a-date", context());
    const validated = defaultFilterQueryCodec.parse("query:forbidden", {
      ...context(),
      fields: [{ id: "query", type: "text", label: "Search", validate: (value) => value === "forbidden" ? { valid: false, message: "Blocked" } : { valid: true } }],
      queryFields: [{ fieldId: "query" }],
      freeText: false,
    });

    expect(invalidDate.complete).toBe(false);
    expect(invalidDate.errors[0]?.message).toMatch(/ISO date/);
    expect(validated.errors[0]?.message).toBe("Blocked");
  });

  it("uses field-level parse and serialize overrides without changing the codec", () => {
    const customContext = {
      ...context(),
      fields: [{ id: "priority", type: "number", label: "Priority" }] as const,
      queryFields: [{
        fieldId: "priority",
        parseValue: (raw: string) => raw.startsWith("P") ? { valid: true as const, operator: "equals", value: Number(raw.slice(1)) } : { valid: false as const, message: "Use P<number>" },
        serializeValue: (clause: FilterClause) => `P${clause.value}`,
      }],
      freeText: false,
    } as const;
    const parsed = defaultFilterQueryCodec.parse("priority:P3", customContext);
    const serialized = defaultFilterQueryCodec.serialize(parsed.clauses, customContext);

    expect(parsed.clauses[0]).toMatchObject({ field: "priority", operator: "equals", value: 3 });
    expect(serialized.query).toBe("priority:P3");
  });

  it("replaces the exact duplicate token selected by its parser span", () => {
    const input = "status:500 status:500";
    const parsed = defaultFilterQueryCodec.parse(input, context());
    const replacement = defaultFilterQueryCodec.replaceToken(input, parsed.tokens[1], "status:503");

    expect(replacement).toEqual({ text: "status:500 status:503", caret: input.length + 0 });
  });
});
