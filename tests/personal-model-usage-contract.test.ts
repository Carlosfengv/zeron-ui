import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const settings = readFileSync(join(ROOT, "packages/blocks/src/application/personal-settings-01/personal-settings.tsx"), "utf8");
const standalone = readFileSync(join(ROOT, "packages/blocks/src/application/personal-model-usage-01/personal-model-usage.tsx"), "utf8");
const timeRangeHistogram = readFileSync(join(ROOT, "packages/ui/src/components/time-range-histogram.tsx"), "utf8");
const registry = readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8");

describe("Personal model usage call-log contract", () => {
  it("keeps model usage and call logs available in the standalone block", () => {
    expect(standalone).toContain('enabledViews={["modelUsage", "callLogs"]}');
    expect(settings).toContain('{ value: "callLogs", label: "调用日志"');
  });

  it("supports atomic-call and answer-level views", () => {
    expect(settings).toContain('<TabItem label="按调用" value="calls" />');
    expect(settings).toContain('<TabItem label="按回答" value="runs" />');
    expect(settings).toContain("function CallLogDetail");
    expect(settings).toContain("function CallRunDetail");
  });

  it("uses DataTable framing, pagination, and dialog details", () => {
    const callLogs = settings.slice(settings.indexOf("function CallLogDataTable"), settings.indexOf("function ModelUsageSettings"));

    expect(callLogs).toContain('className="overflow-hidden rounded-xl border border-border bg-surface-floating"');
    expect(callLogs).toContain('<div className="overflow-x-auto"><Table');
    expect(callLogs).toContain('<TableHeader className="[&_th]:whitespace-nowrap">');
    expect(callLogs).toContain("function CallLogDataTable");
    expect(callLogs).toContain("function CallRunDataTable");
    expect(callLogs).toContain('pagination: { pageIndex: 0, pageSize: 10 }');
    expect(callLogs).toContain('<DataTablePagination className="px-2" pageSizeOptions={[10, 20, 50]} table={table} />');
    expect(callLogs).toContain('id="call-trend-title">调用趋势');
    expect(callLogs).toContain("const filteredTrendCalls = useMemo");
    expect(callLogs).toContain("data={trendPoints}");
    expect(callLogs).toContain('<ContainerBody className="p-3"><TimeRangeHistogram');
    expect(callLogs).toContain('series={callLogTrendSeries}');
    expect(callLogs).toContain('value={timeSelection}');
    expect(callLogs).toContain("isCallLogTimeInSelection(record.timestamp, timeSelection)");
    expect(callLogs).toContain("isCallLogTimeInSelection(run.timestamp, timeSelection)");
    expect(callLogs).toContain("aggregateCallLogTrend(filteredTrendCalls)");
    expect(callLogs).not.toContain("modelFactor");
    expect(timeRangeHistogram).toContain('<XAxis dataKey="label" hide />');
    expect(timeRangeHistogram).toContain('<BarChart accessibilityLayer={false} data={data}');
    expect(timeRangeHistogram).toContain('h-[68px] min-h-0');
    expect(timeRangeHistogram).toContain('[&_.recharts-tooltip-wrapper]:!z-20');
    expect(timeRangeHistogram).toContain('isAnimationActive={false}');
    expect(timeRangeHistogram).toContain('style={{ left: `${selectionLeft}%`, width: `${selectionWidth}%` }}');
    expect(timeRangeHistogram).toContain('focus-visible:ring-2 focus-visible:ring-focus-ring');
    expect(settings).toContain("const callLogMockData = buildCallLogMockData()");
    expect(settings).toContain("const callLogTrendBuckets = Array.from({ length: CALL_LOG_TIMELINE_BUCKETS }");
    expect(settings).toContain("bucketRecords.filter((record) => record.kind === \"model\").length");
    expect(settings).toContain("bucketRecords.filter((record) => record.kind === \"mcp\").length");
    expect(timeRangeHistogram).toContain('role="slider"');
    expect(timeRangeHistogram).toContain("onPointerMove={handlePointerMove}");
    expect(timeRangeHistogram).toContain('const nextDragMode = nearestBoundaryMode ?? (moveExistingSelection ? "move" : "create")');
    expect(timeRangeHistogram).toContain('dragOriginSelection.current = nextDragMode === "create" ? null : selection');
    expect(timeRangeHistogram).toContain('origin.startIndex + index - dragStartIndex.current');
    expect(callLogs).toContain("拖动选区可整体移动");
    expect(callLogs).toContain("setRange(matchingRange ?? \"custom\")");
    expect(settings).toContain('{ dataKey: "model", label: "模型", color: "light-dark(var(--brand-active), var(--brand))"');
    expect(settings).toContain('{ dataKey: "mcp", label: "MCP", color: "light-dark(var(--brand), var(--brand-active))"');
    expect(settings).toContain("const CALL_LOG_TIMELINE_BUCKETS = 60");
    expect(settings).toContain("start: callLogLatestTimestamp - 30 * DAY_IN_MS");
    expect(callLogs).toContain('className="sticky left-0 z-content w-36 min-w-36 max-w-36 bg-surface-floating">时间');
    expect(callLogs).toContain('className="sticky left-36 z-content w-24 min-w-24 max-w-24 border-r border-border bg-surface-floating">事件类型');
    expect(callLogs).toContain('className="sticky right-0 z-content w-24 min-w-24 max-w-24 border-l border-border bg-surface-floating text-right">费用');
    expect(callLogs).toContain('group-[.is-active]/row:[background-image:linear-gradient(var(--hover),var(--hover))]');
    expect(callLogs).toContain('>事件类型</TableHead><TableHead className="w-52 min-w-52 max-w-52">目标</TableHead><TableHead className="w-52 min-w-52 max-w-52">内容</TableHead><TableHead className="w-24">状态</TableHead><TableHead className="w-40">Request ID<');
    expect(callLogs).toContain('className="sticky left-0 z-content w-36 min-w-36 max-w-36 bg-surface-floating">开始时间');
    expect(callLogs).toContain('>输入消息</TableHead><TableHead className="w-52 min-w-52 max-w-52">回答结果</TableHead><TableHead className="w-52 min-w-52 max-w-52">调用</TableHead>');
    expect(callLogs).toContain('className="sticky right-0 z-content w-20 min-w-20 max-w-20 border-l border-border bg-surface-floating text-right">费用');
    expect(callLogs).toContain('<Badge color="red" size="sm" variant="strong">错误');
    expect(callLogs).toContain('<Badge color="amber" size="sm" variant="strong">降级');
    expect(callLogs).toContain('<UsageFilter label="计费归属"');
    expect(callLogs).toContain('record.runId === run.id && record.attribution === attribution');
    expect(settings).toContain('return <Badge color="green" size="sm">{presentation.label}</Badge>');
    expect(callLogs).toContain("<Dialog onOpenChange={setDetailOpen} open={detailOpen}>");
    expect(callLogs).not.toContain("{selectedCall && <CallLogDetail");
    expect(callLogs).not.toContain("{selectedRun && <CallRunDetail");
  });

  it("keeps routing, billing, MCP side effects, and upstream evidence visible", () => {
    for (const copy of ["请求模型", "实际模型", "计费归属", "外部写入", "上游 Request ID"]) {
      expect(settings).toContain(copy);
    }
  });

  it("registers every Zeron primitive used by the new view", () => {
    expect(registry).toContain('"detail-list"');
    expect(registry).toContain('"inline-notice"');
  });
});
