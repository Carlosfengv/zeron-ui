import { describe, expect, it } from "vitest";
import {
  createInfiniteLogFilterFields,
  createInfiniteLogQueryFields,
  fromInfiniteLogFilters,
  toInfiniteLogFilters,
} from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-query-adapter";
import { defaultInfiniteLogFilters } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-types";
import { defaultFilterQueryCodec } from "../packages/ui/src/components/filter-query-core/filter-query-parser";

describe("Infinite Log query adapter", () => {
  it("maps log filters to structured clauses and back", () => {
    const source = {
      ...defaultInfiniteLogFilters,
      query: "gateway",
      host: "api.example.com",
      statuses: [500, 503],
      methods: ["GET"] as const,
      latency: { min: 10, max: 50 },
      timeRange: { from: "2026-08-01T00:00:00.000Z", to: "2026-08-02T00:00:00.000Z" },
      timing: { dns: { min: 1, max: 5 }, ttfb: { min: 20, max: 40 } },
    };
    const clauses = fromInfiniteLogFilters(source);

    expect(toInfiniteLogFilters(clauses, defaultInfiniteLogFilters)).toMatchObject(source);
  });

  it("uses the readable date-time format in the query and parses it back", () => {
    const filters = {
      ...defaultInfiniteLogFilters,
      timeRange: { from: "2026-08-01T00:00:00.000Z", to: "2026-08-02T12:34:56.000Z" },
    };
    const fields = createInfiniteLogFilterFields();
    const queryFields = createInfiniteLogQueryFields("UTC");
    const clauses = fromInfiniteLogFilters(filters);
    const context = {
      fields,
      queryFields,
      freeText: false as const,
      previousFilters: clauses,
      createClauseId: () => "generated",
    };

    const serialized = defaultFilterQueryCodec.serialize(clauses, context);
    expect(serialized.query).toBe('time:"2026 08-01 00:00:00..2026 08-02 12:34:56"');

    const parsed = defaultFilterQueryCodec.parse(serialized.query, context);
    expect(parsed.complete).toBe(true);
    expect(toInfiniteLogFilters(parsed.clauses, defaultInfiniteLogFilters).timeRange).toEqual(filters.timeRange);
  });
});
