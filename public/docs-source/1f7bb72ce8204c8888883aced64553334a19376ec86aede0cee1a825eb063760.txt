import type { CSSProperties } from "react";
import {
  DetailList,
  DetailListItem,
  DetailListLabel,
  type DetailListProps,
  DetailListValue,
} from "@zeron/ui/detail-list";
import { SegmentedBar, chartColor } from "@zeron/ui/chart-primitives";
import { cn } from "@zeron/ui/system/utils";

import clusterIcon from "./assets/cluster.svg";
import hostIcon from "./assets/host.svg";
import networkIcon from "./assets/network.svg";
import platformIcon from "./assets/platform.svg";
import storageIcon from "./assets/storage.svg";
import vmIcon from "./assets/vm.svg";

export type ResourceMetricTone = "brand" | "warning" | "danger" | "neutral";

export interface ResourceMetricSegment {
  value: number;
  tone: ResourceMetricTone;
  label: string;
}

export interface ResourceMetricItem {
  description: string;
  iconSrc: string;
  label: string;
  segments: readonly ResourceMetricSegment[];
  value: number;
}

export interface ResourceMetricListProps
  extends Omit<DetailListProps, "children"> {
  items?: readonly ResourceMetricItem[];
}

function assetSource(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

const defaultResourceMetrics = [
  {
    label: "平台层级资源",
    description: "环境 / 区域 / 管理节点",
    value: 3,
    iconSrc: assetSource(platformIcon),
    segments: [{ value: 3, tone: "brand", label: "正常" }],
  },
  {
    label: "集群",
    description: "Cluster",
    value: 10,
    iconSrc: assetSource(clusterIcon),
    segments: [
      { value: 6, tone: "brand", label: "正常" },
      { value: 4, tone: "warning", label: "警告" },
    ],
  },
  {
    label: "宿主机",
    description: "HostVO",
    value: 37,
    iconSrc: assetSource(hostIcon),
    segments: [
      { value: 32, tone: "brand", label: "正常" },
      { value: 5, tone: "warning", label: "警告" },
    ],
  },
  {
    label: "云主机",
    description: "VM Instance",
    value: 1125,
    iconSrc: assetSource(vmIcon),
    segments: [
      { value: 1083, tone: "brand", label: "正常" },
      { value: 28, tone: "warning", label: "警告" },
      { value: 14, tone: "neutral", label: "未知" },
    ],
  },
  {
    label: "网络资源",
    description: "L2/ L3 / Router 等",
    value: 315,
    iconSrc: assetSource(networkIcon),
    segments: [
      { value: 282, tone: "brand", label: "正常" },
      { value: 21, tone: "warning", label: "警告" },
      { value: 4, tone: "danger", label: "异常" },
      { value: 8, tone: "neutral", label: "未知" },
    ],
  },
  {
    label: "存储资源",
    description: "PS / BS",
    value: 11,
    iconSrc: assetSource(storageIcon),
    segments: [
      { value: 10, tone: "brand", label: "正常" },
      { value: 1, tone: "danger", label: "异常" },
    ],
  },
] as const satisfies readonly ResourceMetricItem[];

const segmentColors: Record<ResourceMetricTone, string> = {
  brand: chartColor(1),
  warning: chartColor(3),
  danger: chartColor(5),
  neutral: chartColor(2),
};

function ResourceIcon({ src }: { src: string }) {
  const maskStyle = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
  } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      className="size-5 shrink-0 bg-fg-default [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
      style={maskStyle}
    />
  );
}

function ResourceStatusBar({ item }: { item: ResourceMetricItem }) {
  const statusLabel = item.segments
    .filter((segment) => segment.value > 0)
    .map((segment) => `${segment.label} ${segment.value}`)
    .join("，");

  const assigned = item.segments.reduce((sum, segment) => sum + (Number.isFinite(segment.value) ? Math.max(0, segment.value) : 0), 0);
  const remainder = Math.max(0, item.value - assigned);
  return <SegmentedBar mode="distribution" total={item.value} segments={item.segments.map((segment, index) => ({ id: `${segment.tone}-${index}`, label: segment.label, value: segment.value, color: segmentColors[segment.tone] }))} valueText={`${item.label}共 ${item.value} 个：${statusLabel}${remainder > 0 ? `，未覆盖 ${remainder}` : ""}${assigned > item.value ? "，分类计数超过总数" : ""}`} className="h-3 w-40 shrink-0" />;
}

/** A compact resource inventory with per-status distribution bars. */
export function ResourceMetricList({
  "aria-label": ariaLabel = "资源指标列表",
  className,
  items = defaultResourceMetrics,
  ...props
}: ResourceMetricListProps) {
  return (
    <DetailList
      aria-label={ariaLabel}
      className={cn(
        "w-full max-w-[700px] gap-0 p-0 py-[3.5px]",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <DetailListItem
          key={`${item.label}-${item.description}`}
          className="flex min-h-10 min-w-0 flex-wrap items-center justify-between gap-4 px-3 py-2.5"
        >
          <DetailListLabel className="flex min-w-0 flex-wrap items-center gap-1">
            <ResourceIcon src={item.iconSrc} />
            <span className="shrink-0 font-medium text-fg-default">{item.label}</span>
            <span className="truncate font-normal text-fg-subtle">{item.description}</span>
          </DetailListLabel>

          <DetailListValue className="flex w-[200px] max-w-none shrink-0 items-center justify-end gap-2.5">
            <span className="min-w-0 flex-1 whitespace-nowrap text-right text-body tabular-nums text-fg-muted">
              {item.value}
            </span>
            <ResourceStatusBar item={item} />
          </DetailListValue>
        </DetailListItem>
      ))}
    </DetailList>
  );
}

export { defaultResourceMetrics };
