import type { FleetGpu, FleetHealthLabels, FleetHealthMetric } from "./fleet-health-types";

export const fleetHealthLabels: FleetHealthLabels = {
  title: "Fleet health", info: "Live inference throughput and GPU telemetry.", cluster: "Cluster",
  tokens: "Tokens served / s", comparison: "vs 1h ago", ttft: "TTFT P50", models: "models",
  lastWindow: "Last 64 s", utilization: "Fleet util", queue: "Queue depth", power: "Power",
  gpus: "GPUs", nodes: "nodes", hot: "running hot", healthy: "All within limits",
  draining: "draining", idle: "Idle", offline: "Offline", memory: "Memory", temperature: "Temp",
  job: "Job", noJob: "No job", hint: "Hover a GPU · click a node to focus", clearFocus: "Clear node focus",
  focusNode: "Focus node", live: "Live", paused: "Paused", every: "every", rebalance: "Rebalance",
  rebalancing: "Rebalancing", settings: "Fleet settings",
  empty: "No GPU nodes in this cluster", unknown: "Unknown", matrix: "GPU telemetry",
};

export const fleetHealthZhLabels: FleetHealthLabels = {
  title: "集群健康", info: "实时推理吞吐量与 GPU 遥测。", cluster: "集群",
  tokens: "每秒处理 Token", comparison: "相比 1 小时前", ttft: "首 Token 延迟 P50", models: "个模型",
  lastWindow: "最近 64 秒", utilization: "集群利用率", queue: "排队请求", power: "功耗",
  gpus: "GPU", nodes: "个节点", hot: "张过热", healthy: "均在阈值内",
  draining: "张排空中", idle: "空闲", offline: "离线", memory: "显存", temperature: "温度",
  job: "任务", noJob: "无任务", hint: "悬停查看 GPU · 点击节点聚焦", clearFocus: "取消节点聚焦",
  focusNode: "聚焦节点", live: "实时", paused: "已暂停", every: "每", rebalance: "重新均衡",
  rebalancing: "均衡中", settings: "集群设置",
  empty: "此集群暂无 GPU 节点", unknown: "未知", matrix: "GPU 遥测",
};

/** Unknown and invalid observations stay unknown, never turn into idle/zero. */
export function fleetMetricValue(gpu: FleetGpu, metric: FleetHealthMetric): number | null {
  const value = metric === "memory"
    ? gpu.memoryUsedGb !== null && gpu.memoryTotalGb !== null && gpu.memoryTotalGb > 0
      && Number.isFinite(gpu.memoryUsedGb) && Number.isFinite(gpu.memoryTotalGb)
      && gpu.memoryUsedGb >= 0 && gpu.memoryUsedGb <= gpu.memoryTotalGb
      ? gpu.memoryUsedGb / gpu.memoryTotalGb * 100 : null
    : metric === "temperature" ? gpu.temperatureC : gpu.utilization;
  return value !== null && Number.isFinite(value) && value >= 0
    && (metric === "temperature" || value <= 100) ? value : null;
}

export function fleetNodeAverage(gpus: readonly FleetGpu[], metric: FleetHealthMetric): number | null {
  // Offline hardware has no current observation; do not dilute live averages with zero.
  let total = 0;
  let count = 0;
  for (const gpu of gpus) {
    if (gpu.status === "offline") continue;
    const value = fleetMetricValue(gpu, metric);
    if (value === null) return null;
    total += value;
    count++;
  }
  return count ? total / count : null;
}

export function fleetMetricColor(value: number | null, metric: FleetHealthMetric): string {
  if (value === null) return "var(--surface-base)";
  const ratio = Math.max(0, Math.min(1, metric === "temperature" ? (value - 30) / 60 : value / 100));
  return `color-mix(in oklab, var(--brand) ${Math.round(12 + ratio * 88)}%, var(--surface-floating))`;
}
