import type { ReactNode } from "react";
import type { LiveLinePoint } from "@zeron/ui/live-line-chart";

export type FleetHealthMetric = "utilization" | "memory" | "temperature";
export interface FleetGpu {
  id: string;
  /** Stable display index within its node, independent of array position. */
  index: number;
  status: "active" | "idle" | "draining" | "offline";
  utilization: number | null;
  memoryUsedGb: number | null;
  memoryTotalGb: number | null;
  temperatureC: number | null;
  powerW: number | null;
  job: string | null;
}
export interface FleetNode { id: string; name: string; model: string; gpus: readonly FleetGpu[] }
export interface FleetHealthSnapshot {
  tokensPerSecond: number | null;
  changePercent: number | null;
  ttftMs: number | null;
  modelCount: number | null;
  utilization: number | null;
  queueDepth: number | null;
  queueCapacity: number | null;
  powerKw: number | null;
  powerCapacityKw: number | null;
  /** Unix seconds, ascending; the host owns sampling and the streaming connection. */
  throughput: LiveLinePoint[];
  nodes: readonly FleetNode[];
}
export interface FleetHealthLabels {
  title: string; info: string; cluster: string; tokens: string; comparison: string;
  ttft: string; models: string; lastWindow: string; utilization: string;
  queue: string; power: string; gpus: string; nodes: string; hot: string;
  healthy: string; draining: string; idle: string; offline: string;
  memory: string; temperature: string; job: string; noJob: string;
  hint: string; clearFocus: string; focusNode: string; live: string; paused: string;
  every: string; rebalance: string; rebalancing: string; settings: string;
  empty: string; unknown: string; matrix: string;
}
export interface FleetHealthProps {
  data: FleetHealthSnapshot;
  clusterId: string;
  clusters: readonly { id: string; label: string }[];
  onClusterChange?: (id: string) => void;
  metric?: FleetHealthMetric;
  onMetricChange?: (metric: FleetHealthMetric) => void;
  selectedNodeId?: string | null;
  onNodeSelect?: (id: string | null) => void;
  /** Defaults to 84°C; hot status is independent of the selected color metric. */
  temperatureThreshold?: number;
  live?: boolean;
  refreshIntervalMs?: number;
  region?: string;
  onRebalance?: () => void;
  rebalancing?: boolean;
  onSettings?: () => void;
  footerActions?: ReactNode;
  notice?: ReactNode;
  labels?: Partial<FleetHealthLabels>;
  locale?: string;
  className?: string;
}
