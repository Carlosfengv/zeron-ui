import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { BadgeColor } from "@zeron/ui/badge";
import type { ChartColorIndex } from "@zeron/ui/chart-primitives";
import type { IconName } from "@zeron/ui/system/icon-context";

export type ProjectMonitorTab = "overview" | "storage" | "reports" | "advisor";
export type ProjectMonitorState = "ready" | "loading" | "stale" | "error";

export interface ProjectMonitorMetric {
  id: string;
  label: string;
  /** value 和 capacity 使用相同单位；未知值为 null，不能用零代替。 */
  value: number | null;
  capacity?: number | null;
  unit: string;
}

export interface ProjectMonitorBucket {
  id: string;
  name: string;
  access: "public" | "private";
  files: number | null;
  bytes: number | null;
  updatedAt: number | null;
}

export interface ProjectMonitorService {
  id: string;
  name: string;
  /** @deprecated Legacy categorical name; colorIndex takes precedence. */
  color: BadgeColor;
  colorIndex?: ChartColorIndex;
  /** 每一项对应时间窗口内连续、等长的一个时间桶。null 表示未收到数据。 */
  buckets: readonly ({ success: number; warning: number; errors: number } | null)[];
}

export interface ProjectMonitorWindow {
  id: string;
  label: string;
  start: number;
  end: number;
  services: readonly ProjectMonitorService[];
  /** 服务端聚合分位数，单位毫秒。 */
  latency: { p50: number | null; p95: number | null; p99: number | null };
  /** 延迟条形图的共同标尺，单位毫秒。 */
  latencyScaleMs: number;
}

export interface ProjectMonitorData {
  project: {
    id: string;
    name: string;
    region: string;
    endpoint: string;
    health: "healthy" | "degraded" | "down" | "unknown";
    facts: readonly { id: string; label: string; value: string | null; icon?: IconName }[];
  };
  metrics: readonly ProjectMonitorMetric[];
  storage: {
    /** 存储值统一使用字节。 */
    capacityBytes: number | null;
    categories: readonly { id: string; label: string; bytes: number | null; color: BadgeColor; colorIndex?: ChartColorIndex }[];
    buckets: readonly ProjectMonitorBucket[];
  };
  windows: readonly ProjectMonitorWindow[];
  updatedAt: number | null;
}

export interface ProjectMonitorLabels {
  overview: string; storage: string; reports: string; advisor: string;
  navigation: string; openDashboard: string; copy: string; copied: string; copyError: string;
  customize: string; updated: string; unknown: string; health: string;
  healthy: string; degraded: string; down: string; unknownHealth: string;
  resources: string; requests: string; total: string; peak: string; range: string;
  activity: string; success: string; warning: string; errors: string; noRequests: string;
  noData: string; storageUsage: string; buckets: string; public: string; private: string;
  files: string; serviceDistribution: string; latency: string; milliseconds: string;
  loading: string; stale: string; error: string; retry: string; incomplete: string;
  refreshing?: string; refresh?: string; previousData?: string;
}

export interface ProjectMonitorProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "defaultValue" | "onChange" | "onClick"> {
  data: ProjectMonitorData;
  tab?: ProjectMonitorTab;
  defaultTab?: ProjectMonitorTab;
  onTabChange?: (tab: ProjectMonitorTab) => void;
  range?: string;
  defaultRange?: string;
  onRangeChange?: (range: string) => void;
  state?: ProjectMonitorState;
  /** Background progress can coexist with stale data. */
  refreshing?: boolean;
  /** Keep an existing snapshot when a subsequent request fails. Defaults to the existing replacement behavior. */
  retainDataOnError?: boolean;
  statusMessage?: string;
  actions?: { onOpenDashboard?: () => void; onCustomize?: () => void; onRetry?: () => void; onRefresh?: () => void };
  visibleSections?: { resources?: boolean; activity?: boolean };
  advisor?: ReactNode;
  labels?: Partial<ProjectMonitorLabels>;
  locale?: string;
  timeZone?: string;
}
