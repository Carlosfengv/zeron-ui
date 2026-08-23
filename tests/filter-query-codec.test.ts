import { describe, expect, it } from "vitest";
import { defaultFilterQueryCodec } from "../packages/ui/src/components/filter-query-core/filter-query-codec";
import type { FilterClause, FilterField } from "../packages/ui/src/system/filter-core";

const fields: readonly FilterField[] = [
  { id: "owner", label: "Owner", type: "text" },
  { id: "priority", label: "Priority", type: "number" },
];

function context(previousFilters: readonly FilterClause[] = []) {
  let sequence = 0;
  return {
    fields,
    queryFields: [
      { fieldId: "owner", key: "assignee", aliases: ["owner"] },
      { fieldId: "priority" },
    ],
    freeText: false,
    previousFilters,
    createClauseId: () => `generated-${++sequence}`,
  } as const;
}

describe("filter-query codec public entry", () => {
  it("round-trips configured query keys while preserving unsupported clauses", () => {
    const unsupported: FilterClause = { id: "server-only", field: "tenant", operator: "is", value: "acme" };
    const parsed = defaultFilterQueryCodec.parse("assignee:Lee priority:3", context([unsupported]));
    const serialized = defaultFilterQueryCodec.serialize([...parsed.clauses, unsupported], context());

    expect(parsed.complete).toBe(true);
    expect(parsed.clauses.map((clause) => clause.field)).toEqual(["owner", "priority"]);
    expect(serialized.query).toBe("assignee:Lee priority:3");
    expect(serialized.unsupportedClauses).toEqual([unsupported]);
  });

  it("replaces only the active token and leaves adjacent text intact", () => {
    const input = "assignee:Lee priority:3";
    const token = defaultFilterQueryCodec.parse(input, context()).tokens[1];

    expect(defaultFilterQueryCodec.replaceToken(input, token, "priority:5")).toEqual({
      text: "assignee:Lee priority:5",
      caret: input.length,
    });
  });
});
