import type { IntegrationMonitorCategory, IntegrationMonitorItem, IntegrationMonitorResult, IntegrationMonitorsLabels, IntegrationMonitorsQuery } from "./integration-monitors-types";

export const integrationMonitorsLabels: IntegrationMonitorsLabels = {
  title: "集成监控", all: "全部", failing: "存在失败", compliant: "全部通过", inactive: "未启用",
  navigation: "监控分类", allIntegrations: "所有集成", integration: "集成筛选", anyStatus: "所有状态", status: "运行状态筛选",
  active: "运行中", paused: "已暂停", "needs-setup": "待配置", search: "搜索名称或描述…", clearSearch: "清空搜索",
  add: "添加监控", available: "连接集成", noAvailable: "没有可添加的集成", more: "更多操作", rowMore: "监控操作",
  details: "查看详情", assets: "资产", check: "立即检查", checkAll: "检查全部监控", configure: "完成配置", edit: "编辑监控",
  pause: "暂停监控", resume: "恢复监控", remove: "移除监控", copy: "复制链接", share: "复制分享链接", export: "导出 CSV",
  mute: "静音一小时", unmute: "取消静音", muted: "静音至", manage: "管理集成",
  checks: "检查项", passed: "通过", failed: "失败", warning: "警告", unknown: "未知",
  allPassed: "所有检查已通过", failureSummary: "项检查失败", incomplete: "检查数据不完整", noChecks: "暂无检查项", notConfigured: "尚未配置检查项", pausedHistory: "监控已暂停 · 显示历史结果",
  lastChecked: "上次检查", neverChecked: "尚未检查", unclassified: "项结果待确认", matching: "条匹配结果",
  loading: "正在加载集成监控", error: "集成监控加载失败", stale: "当前显示上次快照，等待更新", refreshing: "正在刷新 · 保留上次快照", retry: "重试",
  empty: "尚未添加监控", noMatches: "没有匹配的监控", reset: "清除筛选", operationError: "操作失败，请重试", copied: "链接已复制",
  previous: "上一页", next: "下一页", page: "页", pages: "监控分页",
};
export const defaultIntegrationMonitorsQuery: IntegrationMonitorsQuery = {
  category: "all", integrationId: "all", lifecycle: "all", search: "", pageIndex: 0, pageSize: 3,
};
/** Service responses may contain results newer than this client supports. */
export function normalizeMonitorResult(result: unknown): IntegrationMonitorResult {
  switch (result) {
    case "passed": case "failed": case "warning": case "unknown": return result;
    default: return "unknown";
  }
}
export function monitorCheckCounts(item: IntegrationMonitorItem) {
  if (item.checks === null) return null;
  const counts = { passed: 0, failed: 0, warning: 0, unknown: 0, total: item.checks.length };
  for (const check of item.checks) {
    counts[normalizeMonitorResult(check.result)] += 1;
  }
  return counts;
}
export function monitorCategory(item: IntegrationMonitorItem): Exclude<IntegrationMonitorCategory, "all"> | "unclassified" {
  if (item.lifecycle !== "active") return "inactive";
  const counts = monitorCheckCounts(item);
  if (counts?.failed) return "failing";
  if (counts && counts.total > 0 && counts.passed === counts.total) return "compliant";
  return "unclassified";
}
export function monitorCategoryCounts(items: readonly IntegrationMonitorItem[]) {
  const counts = { all: items.length, failing: 0, compliant: 0, inactive: 0, unclassified: 0 };
  for (const item of items) counts[monitorCategory(item)] += 1;
  return counts;
}
export function filterIntegrationMonitors(items: readonly IntegrationMonitorItem[], query: IntegrationMonitorsQuery) {
  const search = query.search.trim().toLocaleLowerCase();
  return items.filter((item) =>
    (query.category === "all" || monitorCategory(item) === query.category) &&
    (query.integrationId === "all" || item.integrationId === query.integrationId) &&
    (query.lifecycle === "all" || item.lifecycle === query.lifecycle) &&
    (!search || `${item.name}\n${item.description}`.toLocaleLowerCase().includes(search)));
}
export function normalizeMonitorPagination(query: IntegrationMonitorsQuery, total: number) {
  const pageSize = Number.isSafeInteger(query.pageSize) && query.pageSize > 0 ? query.pageSize : 3;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const requested = Number.isSafeInteger(query.pageIndex) && query.pageIndex >= 0 ? query.pageIndex : 0;
  return { pageIndex: Math.min(requested, pageCount - 1), pageSize, pageCount };
}
export function monitorPageNumbers(index: number, count: number): (number | "gap-start" | "gap-end")[] {
  const pages = [...new Set([0, index - 1, index, index + 1, count - 1].filter((page) => page >= 0 && page < count))].sort((a, b) => a - b);
  const result: (number | "gap-start" | "gap-end")[] = [];
  for (const [i, page] of pages.entries()) {
    if (i > 0 && page - pages[i - 1] > 1) result.push(page < index ? "gap-start" : "gap-end");
    result.push(page);
  }
  return result;
}
export function monitorFormatNumber(value: number | null, locale: string) {
  return value !== null && Number.isSafeInteger(value) && value >= 0 ? new Intl.NumberFormat(locale).format(value) : "—";
}
export function monitorFormatDate(value: number | null | undefined, locale: string, timeZone: string, now?: number) {
  if (value == null || !Number.isFinite(value) || !Number.isFinite(new Date(value).getTime())) return "—";
  if (now !== undefined && Number.isFinite(now)) {
    const seconds = Math.round((value - now) / 1000);
    const unit = Math.abs(seconds) < 60 ? "second" : Math.abs(seconds) < 3600 ? "minute" : Math.abs(seconds) < 86400 ? "hour" : "day";
    const divisor = { second: 1, minute: 60, hour: 3600, day: 86400 }[unit];
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(Math.round(seconds / divisor), unit);
  }
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: "short", timeStyle: "short" }).format(value);
}
export function monitorShareHref(value: string | undefined) {
  // Browsers normalize backslashes and remove these characters before parsing.
  if (!value || value.includes("\\") || /[\t\n\r]/.test(value)) return null;
  if (/^\/(?!\/)/.test(value)) return value;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : null; } catch { return null; }
}
/** Quoted CSV cells also neutralize spreadsheet formulas, including leading whitespace. */
export function integrationMonitorsCsv(items: readonly IntegrationMonitorItem[]) {
  const cell = (value: string | number | null) => {
    let text = value == null ? "" : String(value);
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = items.map((item) => { const counts = monitorCheckCounts(item); return [item.name, item.description, item.lifecycle, counts?.failed ?? null, counts?.total ?? null, item.assetCount]; });
  return "\uFEFF" + [["Name", "Description", "Status", "Failed checks", "Total checks", "Assets"], ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}
