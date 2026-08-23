import type { FilterClause } from "#system/filter-core";
import type { FilterQueryMergeMode, FilterQuerySerializeResult } from "./filter-query-types";

export function mergeFilterQueryClauses(
  previous: readonly FilterClause[],
  next: readonly FilterClause[],
  serialized: FilterQuerySerializeResult,
  mode: FilterQueryMergeMode,
) {
  if (mode === "replace-all") return [...next];
  const unsupportedIds = new Set(serialized.unsupportedClauses.map((clause) => clause.id));
  return [...next, ...previous.filter((clause) => unsupportedIds.has(clause.id))];
}
