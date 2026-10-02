import { describe, expect, it } from "vitest";
import {
  createInfiniteLogPage,
  getInfiniteLogCursorSnapshotRevision,
  sortInfiniteLogRecords,
} from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-data-source";
import { defaultInfiniteLogFilters } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-types";

const records = [
  { id: "日志-🦊", timestamp: "2026-08-23T00:00:00.000Z", 名称: "中文一🚀" },
  { id: "日志-🐼", timestamp: "2026-08-23T00:00:01.000Z", 名称: "中文二🌍" },
  { id: "日志-é", timestamp: "2026-08-23T00:00:02.000Z", 名称: "café" },
];

describe("Unicode log cursors", () => {
  it.each(["timestamp", "名称"])("round-trips Unicode IDs, values and snapshot revisions when sorting by %s", (field) => {
    const sort = { field, direction: "asc" as const };
    const found: string[] = [];
    let cursor: string | undefined;
    for (let index = 0; index < records.length; index += 1) {
      const page = createInfiniteLogPage(records, { cursor, filters: defaultInfiniteLogFilters, pageSize: 1, sort }, "快照-🔖");
      found.push(...page.rows.map((record) => record.id));
      cursor = page.nextCursor;
      if (cursor) expect(getInfiniteLogCursorSnapshotRevision(cursor)).toBe("快照-🔖");
    }
    expect(found).toEqual(sortInfiniteLogRecords(records, sort).map((record) => record.id));
    expect(cursor).toBeUndefined();
  });

  it("continues to read existing ASCII cursors", () => {
    const rows = [{ id: "a", timestamp: "2026-01-01" }, { id: "b", timestamp: "2026-01-02" }];
    const cursor = btoa(JSON.stringify({ version: 1, snapshotRevision: "v1", field: "id", direction: "asc", value: "a", id: "a" }));
    const page = createInfiniteLogPage(rows, { cursor, filters: defaultInfiniteLogFilters, pageSize: 1, sort: { field: "id", direction: "asc" } }, "v1");
    expect(page.rows).toEqual([rows[1]]);
  });

  it.each(["not base64!", "/w==", btoa("not JSON")])("rejects malformed cursor %s with a stable error", (cursor) => {
    expect(() => getInfiniteLogCursorSnapshotRevision(cursor)).toThrow("The log page cursor is invalid or expired.");
  });
});
