import type { BadgeColor } from "@zeron/ui/badge";
import type { SecurityOverviewCounts, SecurityOverviewFinding, SecurityOverviewLabels, SecurityOverviewSnapshot } from "./security-overview-types";

export const securitySeverities = ["critical", "high", "medium", "low"] as const;
export const securitySeverityColors = { critical: "red", high: "orange", medium: "amber", low: "gray" } as const satisfies Record<typeof securitySeverities[number], BadgeColor>;

export const securityOverviewLabels: SecurityOverviewLabels = {
  title: "安全概览", description: "评估当前安全状况，跟进风险与资产。", range: "统计时间范围",
  days7: "近 7 天", days30: "近 30 天", days90: "近 90 天",
  trend: "趋势", findings: "风险项", posture: "态势", assets: "资产", navigation: "安全概览视图",
  securityScore: "安全评分", compare: "较前期", points: "分", open: "未解决", resolved: "已解决",
  scannedAssets: "扫描资产", fixTime: "修复时间", median: "中位数", days: "天", hours: "小时",
  critical: "严重", high: "高风险", medium: "中风险", low: "低风险", unknown: "—",
  runScan: "开始扫描", starting: "正在启动", scanning: "扫描中", refreshing: "正在更新结果",
  scanComplete: "扫描完成", newFindings: "新增风险项", previousSnapshot: "展示上次扫描快照",
  progress: "已扫描", lastScan: "最近扫描", neverScanned: "暂无扫描记录",
  export: "导出报告", exporting: "正在导出", exportError: "导出失败，请重试", close: "关闭安全概览", retry: "重试",
  loading: "正在加载安全概览", error: "安全概览暂不可用", stale: "数据已过期，展示上次快照",
  noData: "暂无可用数据", noFindings: "当前没有未解决风险", noAssets: "当前没有受影响资产",
  trendDescription: "按风险级别展示未解决数量，面积为累计数量。", total: "合计", viewValues: "查看数值",
  sortedByScore: "按评分降序", viewAllFindings: "查看全部风险项", viewAllAssets: "查看全部资产",
  affectedAssets: "受影响资产", current: "当前", previous: "前期", postureDescription: "各维度评分 · 满分 100", change: "变化",
};

export function securityValidNumber(value: unknown, max = Infinity): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

export function securityValidCount(value: unknown): value is number {
  return securityValidNumber(value) && Number.isSafeInteger(value);
}

export function securityValidTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 8.64e15;
}

export function securityCountTotal(counts: SecurityOverviewCounts | null): number | null {
  if (!counts || securitySeverities.some((severity) => !securityValidCount(counts[severity]))) return null;
  const total = securitySeverities.reduce((sum, severity) => sum + counts[severity], 0);
  return Number.isSafeInteger(total) ? total : null;
}

export function securityFormatNumber(value: number | null, locale: string, max = Infinity): string {
  return securityValidNumber(value, max) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value) : "—";
}

export function securityFormatCount(value: number | null, locale: string): string {
  return securityValidCount(value) ? new Intl.NumberFormat(locale).format(value) : "—";
}

export function securityFormatDate(value: number | null, locale: string, timeZone: string): string {
  return securityValidTimestamp(value) ? new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone }).format(value) : "—";
}

export function securitySortFindings(findings: readonly SecurityOverviewFinding[]): SecurityOverviewFinding[] {
  return [...findings].sort((a, b) => {
    const scoreA = securityValidNumber(a.score, 10) ? a.score : -1;
    const scoreB = securityValidNumber(b.score, 10) ? b.score : -1;
    const atA = securityValidTimestamp(a.detectedAt) ? a.detectedAt : -Infinity;
    const atB = securityValidTimestamp(b.detectedAt) ? b.detectedAt : -Infinity;
    return scoreB - scoreA || (atA === atB ? 0 : atB - atA) || a.id.localeCompare(b.id);
  });
}

export function securityTrendPoints(snapshot: SecurityOverviewSnapshot) {
  const { window, trend } = snapshot;
  if (!trend || !securityValidTimestamp(window.start) || !securityValidTimestamp(window.end) || window.end <= window.start) return null;
  if (trend.some((point, index) => !securityValidTimestamp(point.at) || point.at < window.start || point.at > window.end || (index > 0 && point.at <= trend[index - 1].at))) return null;
  return trend.map((point) => {
    const total = securityCountTotal(point.counts);
    return { at: point.at, total, critical: total === null ? null : point.counts!.critical,
      high: total === null ? null : point.counts!.high, medium: total === null ? null : point.counts!.medium,
      low: total === null ? null : point.counts!.low };
  });
}
