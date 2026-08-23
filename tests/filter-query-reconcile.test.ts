import { describe, expect, it } from "vitest";
import { mergeFilterQueryClauses } from "../packages/ui/src/components/filter-query-core/filter-query-reconcile";
import type { FilterClause } from "../packages/ui/src/system/filter-core";

const represented: FilterClause = { id: "status", field: "status", operator: "is", value: "paid" };
const unsupported: FilterClause = { id: "tenant", field: "tenant", operator: "is", value: "acme" };

describe("mergeFilterQueryClauses", () => {
  it("retains clauses the codec cannot express in replace-representable mode", () => {
    expect(mergeFilterQueryClauses(
      [represented, unsupported],
      [{ ...represented, value: "refunded" }],
      { query: "status:refunded", representedClauseIds: ["status"], unsupportedClauses: [unsupported] },
      "replace-representable",
    )).toEqual([{ ...represented, value: "refunded" }, unsupported]);
  });

  it("drops all old clauses only when explicitly requested", () => {
    expect(mergeFilterQueryClauses(
      [represented, unsupported],
      [{ ...represented, value: "refunded" }],
      { query: "status:refunded", representedClauseIds: ["status"], unsupportedClauses: [unsupported] },
      "replace-all",
    )).toEqual([{ ...represented, value: "refunded" }]);
  });
});
