import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/traffic-rules-v2.tsx"),
  "utf8"
);

describe("traffic rule change history dialog contract", () => {
  it("keeps rule and limit history in one shared dialog backed by DataTable", () => {
    expect(source).toContain("function ChangeHistoryDialog");
    expect(source).toContain("<DialogContent");
    expect(source).toContain("<DataTable");
    expect(source).toContain('const [historyTarget, setHistoryTarget] = useState<HistoryTarget | null>(null)');
    expect(source).toContain('onHistory={() => setHistoryTarget("rule")}');
    expect(source).toContain('onHistory={() => setHistoryTarget("limit")}');
  });

  it("does not navigate away from detail to standalone history pages", () => {
    expect(source).not.toContain('"rule-history"');
    expect(source).not.toContain('"limit-history"');
    expect(source).not.toContain("function RuleHistory");
    expect(source).not.toContain("function LimitHistory");
  });

  it("preserves search, localized pagination, and an icon-only restore control", () => {
    expect(source).toContain('placeholder="搜索修改记录"');
    expect(source).toContain('className="mb-3 p-px"');
    expect(source).toContain('rowsPerPage: "每页行数"');
    expect(source).toContain('restorable />');
    expect(source).toContain('<Tooltip content="回到这一版">');
    expect(source).toContain('aria-label="回到这一版"');
    expect(source).toContain("<Restore aria-hidden />");
  });

  it("does not show a status column in change history", () => {
    expect(source).not.toContain('id: "status", cell: () => <Status enabled />, header: "状态"');
  });
});
