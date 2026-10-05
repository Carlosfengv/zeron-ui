import type { ProjectMonitorService, ProjectMonitorWindow } from "./project-monitor-types";

export const projectMonitorLabels = {
  overview: "概览", storage: "存储", reports: "报告", advisor: "优化建议",
  navigation: "项目监控视图", openDashboard: "打开控制台", copy: "复制项目地址", copied: "项目地址已复制", copyError: "复制失败，请选择地址后手动复制",
  customize: "自定义", updated: "更新于", unknown: "—", health: "运行状态",
  healthy: "运行正常", degraded: "性能下降", down: "服务异常", unknownHealth: "状态未知",
  resources: "资源用量", requests: "请求", total: "总请求数", peak: "单时段峰值", range: "统计时间范围",
  activity: "服务活动", success: "成功", warning: "告警", errors: "错误", noRequests: "暂无请求",
  noData: "暂无可用数据", storageUsage: "存储用量", buckets: "存储桶", public: "公开", private: "私有",
  files: "个文件", serviceDistribution: "服务占比", latency: "请求延迟", milliseconds: "毫秒",
  loading: "正在加载项目数据", stale: "数据更新延迟，当前显示上次获取的结果。", error: "项目数据加载失败，请稍后重试。", retry: "重新加载", incomplete: "部分时段数据缺失，统计暂不可用。",
};

export function validNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function validTimestamp(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(new Date(value).getTime());
}

export function bucketTotal(bucket: ProjectMonitorService["buckets"][number]): number | null {
  return bucket && [bucket.success, bucket.warning, bucket.errors].every(validNumber)
    ? bucket.success + bucket.warning + bucket.errors : null;
}

/** 两个视图共享唯一的请求来源；任何缺失分桶都不会被解释为零。 */
export function summarizeWindow(window: ProjectMonitorWindow) {
  const count = window.services[0]?.buckets.length ?? 0;
  const validRange = validTimestamp(window.start) && validTimestamp(window.end) && window.end > window.start;
  const aligned = count > 0 && window.services.every((service) => service.buckets.length === count);
  const services = window.services.map((service) => {
    const values = service.buckets.map(bucketTotal);
    return { ...service, total: values.length && values.every(validNumber) ? values.reduce((sum, value) => sum + value, 0) : null };
  });
  const complete = validRange && aligned && services.every((service) => validNumber(service.total));
  const points = validRange && aligned ? Array.from({ length: count }, (_, index) => {
    const values = window.services.map((service) => bucketTotal(service.buckets[index]));
    return { timestamp: window.start + (window.end - window.start) * index / count, requests: values.every(validNumber) ? values.reduce((sum, value) => sum + value, 0) : null };
  }) : [];
  const totals = { success: 0, warning: 0, errors: 0 };
  if (complete) for (const service of window.services) for (const bucket of service.buckets) {
    if (bucket) { totals.success += bucket.success; totals.warning += bucket.warning; totals.errors += bucket.errors; }
  }
  return { services, points, complete, total: complete ? totals.success + totals.warning + totals.errors : null,
    peak: complete ? Math.max(...points.map((point) => point.requests ?? 0)) : null, totals };
}

export function formatMetric(value: number | null | undefined, locale: string, maximumFractionDigits = 1) {
  return validNumber(value) ? new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value) : "—";
}

export function formatBytes(bytes: number | null, locale: string) {
  if (!validNumber(bytes)) return "—";
  const unit = bytes >= 1e9 ? "GB" : bytes >= 1e6 ? "MB" : bytes >= 1e3 ? "KB" : "字节";
  const divisor = unit === "GB" ? 1e9 : unit === "MB" ? 1e6 : unit === "KB" ? 1e3 : 1;
  return `${formatMetric(bytes / divisor, locale, 2)} ${unit}`;
}
