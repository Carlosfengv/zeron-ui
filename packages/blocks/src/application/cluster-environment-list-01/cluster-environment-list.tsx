"use client";

import { useMemo, useState, type ComponentPropsWithoutRef } from "react";
import AlertSquareIcon from "@hugeicons/core-free-icons/AlertSquareIcon";
import CheckmarkSquare01Icon from "@hugeicons/core-free-icons/CheckmarkSquare01Icon";
import CloudOffIcon from "@hugeicons/core-free-icons/CloudOffIcon";
import Fire02Icon from "@hugeicons/core-free-icons/Fire02Icon";
import { Badge, type BadgeColor, type BadgeStatus } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Card, CardContent, CardFooter, CardGroup } from "@zeron/ui/card";
import { Input } from "@zeron/ui/input";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { PageBody, PageContent, PageHeader, PageHeaderContent, PageLayout } from "@zeron/ui/page-layout";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { createHugeIcon } from "@zeron/ui/system/huge-icon";
import { cn } from "@zeron/ui/system/utils";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";

export type ClusterEnvironmentHealth = "critical" | "warning" | "normal" | "offline";
export type ClusterEnvironmentFreshness = "current" | "expired";
export type ClusterEnvironmentFilter = "all" | ClusterEnvironmentHealth | "expired";

export interface ClusterEnvironmentMetric {
  label: string;
  value: string;
  tone: ClusterEnvironmentHealth | "normal";
}

export interface ClusterEnvironmentIncident {
  title: string;
  description: string;
  impact: string;
  duration: string;
  related: string;
}

export interface ClusterEnvironmentItem {
  id: string;
  name: string;
  location: string;
  health: ClusterEnvironmentHealth;
  freshness?: ClusterEnvironmentFreshness;
  metrics: readonly ClusterEnvironmentMetric[];
  incident?: ClusterEnvironmentIncident;
  reportLabel?: string;
}

export interface ClusterEnvironmentListProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  environments?: readonly ClusterEnvironmentItem[];
  onRefresh?: () => void;
  onViewDetails?: (environment: ClusterEnvironmentItem) => void;
}

export const defaultClusterEnvironments = [
  { id: "prod-shanghai", name: "生产 · 上海一号机房", location: "生产环境", health: "critical", metrics: [{ label: "计算", value: "1 Host 失联", tone: "critical" }, { label: "存储", value: "可用 12.8%", tone: "warning" }, { label: "网络", value: "链路稳定", tone: "normal" }], incident: { title: "宿主机-01 管理失联", description: "需要确认其上 12 台虚拟机的运行与高可用状态。", impact: "12 VM", duration: "18 分钟", related: "另有一项告警" }, reportLabel: "最新报告生成于 10 分钟前" },
  { id: "finance-core", name: "金融核心环境", location: "生产环境", health: "critical", metrics: [{ label: "计算", value: "CPU 高负载", tone: "warning" }, { label: "存储", value: "容量充足", tone: "normal" }, { label: "网络", value: "双链路降级", tone: "critical" }], incident: { title: "核心业务网双链路降级", description: "当前仅剩单路径承载，故障冗余能力已经丢失。", impact: "2 Switch / 46 VM", duration: "18 分钟", related: "另有一项告警" }, reportLabel: "最新报告生成于 10 分钟前" },
  { id: "payment", name: "支付业务环境", location: "生产环境", health: "warning", metrics: [{ label: "计算", value: "负载稳定", tone: "normal" }, { label: "存储", value: "可用 14.2%", tone: "warning" }, { label: "网络", value: "链路稳定", tone: "normal" }], incident: { title: "主存储可用容量低于 15%", description: "按近 7 日趋势预计 9 天后触达红线。", impact: "1 PS / 82 VM", duration: "18 分钟", related: "另有一项告警" } },
  { id: "south-china", name: "支付业务环境", location: "边缘 · 华南节点", health: "offline", metrics: [{ label: "计算", value: "未知", tone: "offline" }, { label: "存储", value: "未知", tone: "offline" }, { label: "网络", value: "未知", tone: "offline" }], incident: { title: "与平台失去连接", description: "资源健康状态不可判断，不能沿用上一次正常结论。", impact: "不可用", duration: "50 分钟", related: "另有一项告警" }, reportLabel: "本轮巡检未开始" },
  { id: "chengdu", name: "生产环境 B", location: "生产 · 成都机房", health: "normal", metrics: [{ label: "计算", value: "12/12 宿主机", tone: "normal" }, { label: "存储", value: "可用 45.23%", tone: "normal" }, { label: "网络", value: "链路稳定", tone: "normal" }] },
  { id: "chengdu-stale", name: "生产环境 C", location: "生产 · 成都机房", health: "normal", freshness: "expired", metrics: [{ label: "计算", value: "12/12 宿主机", tone: "normal" }, { label: "存储", value: "可用 45.23%", tone: "normal" }, { label: "网络", value: "链路稳定", tone: "normal" }] },
] as const satisfies readonly ClusterEnvironmentItem[];

const healthPresentation: Record<ClusterEnvironmentHealth, { cardSurface: string; badge: BadgeStatus; label: string }> = {
  critical: { cardSurface: "bg-danger-surface-subtle", badge: "danger", label: "P0·严重" },
  warning: { cardSurface: "bg-warning-surface-subtle", badge: "warning", label: "P1·告警" },
  normal: { cardSurface: "bg-hover", badge: "info", label: "正常" },
  offline: { cardSurface: "bg-neutral-status-surface", badge: "neutral", label: "离线" },
};

const strongFooterBadgeColors: Partial<Record<ClusterEnvironmentHealth, BadgeColor>> = {
  critical: "red",
  warning: "amber",
  offline: "gray",
};

const healthIcons: Record<ClusterEnvironmentHealth, IconComponent> = {
  critical: createHugeIcon(Fire02Icon),
  warning: createHugeIcon(AlertSquareIcon),
  normal: createHugeIcon(CheckmarkSquare01Icon),
  offline: createHugeIcon(CloudOffIcon),
};

const filterIcons: Partial<Record<ClusterEnvironmentFilter, IconComponent>> = healthIcons;

function EnvironmentCard({ item, onViewDetails }: { item: ClusterEnvironmentItem; onViewDetails?: (item: ClusterEnvironmentItem) => void }) {
  const presentation = healthPresentation[item.health];
  const Environment = useIcon("square-library");
  const footerStatus = item.freshness === "expired"
    ? { badge: "neutral" as const, label: "数据已过期" }
    : presentation;
  const strongFooterBadgeColor = item.freshness === "expired" ? undefined : strongFooterBadgeColors[item.health];
  return <Card className={cn("overflow-hidden rounded-2xl border-[0.5px] border-border p-2", presentation.cardSurface)} label={`查看 ${item.name}`}>
    <CardContent className="flex min-h-0 flex-col gap-2 p-0">
      <div className="flex min-w-0 items-start gap-2 p-1">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-floating text-fg-brand"><Environment size={22} strokeWidth={1.5} /></span>
        <div className="min-w-0"><p className="truncate text-label text-fg-subtle">{item.location}</p><h2 className="truncate text-title font-semibold text-fg-default">{item.name}</h2></div>
      </div>
      <dl className="grid grid-cols-3 rounded-xl bg-surface-floating p-1.5">
        {item.metrics.map((metric) => {
          const MetricIcon = healthIcons[metric.tone];

          return <div key={metric.label} className="min-w-0 px-1.5 py-1"><dt className="text-body text-fg-muted">{metric.label}</dt><dd className="mt-1 flex min-w-0 items-center gap-1 text-body font-medium text-fg-default"><MetricIcon className={cn("size-4 shrink-0", metric.tone === "critical" && "text-fg-danger", metric.tone === "warning" && "text-fg-warning", metric.tone === "normal" && "text-fg-info", metric.tone === "offline" && "text-fg-subtle")} strokeWidth={2} /><span className="truncate">{metric.value}</span></dd></div>;
        })}
      </dl>
    </CardContent>
    <CardFooter className="mt-2 justify-between gap-2 p-0"><InlineNotice variant="emphasized" tone={footerStatus.badge} className="min-w-0">{strongFooterBadgeColor ? <Badge variant="strong" color={strongFooterBadgeColor} size="sm" className="shrink-0">{footerStatus.label}</Badge> : <Badge status={footerStatus.badge} size="sm" className="shrink-0 border-0">{footerStatus.label}</Badge>}<InlineNoticeContent className="truncate">{item.incident?.title ?? item.reportLabel ?? "巡检 21 / 21 完成"}</InlineNoticeContent></InlineNotice><Button type="button" size="sm" variant="ghost" onClick={() => onViewDetails?.(item)}>查看详情</Button></CardFooter>
  </Card>;
}

/** A responsive, filterable cluster-environment overview composed entirely from Zeron primitives. */
export function ClusterEnvironmentList({ environments = defaultClusterEnvironments, className, onRefresh, onViewDetails, ...props }: ClusterEnvironmentListProps) {
  const [filter, setFilter] = useState<ClusterEnvironmentFilter>("all");
  const [query, setQuery] = useState("");
  const Search = useIcon("search"); const Cluster = useIcon("square-library");
  const filters: readonly ClusterEnvironmentFilter[] = ["all", "critical", "warning", "normal", "offline", "expired"];
  const filterLabel: Record<ClusterEnvironmentFilter, string> = { all: "全部", critical: "严重", warning: "告警", normal: "正常", offline: "离线", expired: "数据过期" };
  const filtered = useMemo(() => environments.filter((item) => (filter === "all" || filter === "expired" ? filter === "all" || item.freshness === "expired" : item.health === filter) && `${item.name} ${item.location}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [environments, filter, query]);
  return <PageLayout className={cn("h-full min-h-[42rem] bg-surface-base", className)} {...props}><PageHeader className="px-2 py-1"><PageHeaderContent icon={Cluster}><span className="text-title font-semibold">集群环境</span></PageHeaderContent></PageHeader><PageContent><div className="shrink-0 border-b border-border-subtle p-3 pb-0"><div className="flex flex-wrap items-center justify-between gap-3 pb-3"><Tabs value={filter} onValueChange={(value) => setFilter(value as ClusterEnvironmentFilter)} variant="segment"><TabsList>{filters.map((value) => <TabItem key={value} value={value} label={filterLabel[value]} icon={filterIcons[value]} badge={value === "all" ? undefined : value === "expired" ? environments.filter((item) => item.freshness === "expired").length : environments.filter((item) => item.health === value).length} />)}</TabsList></Tabs><div className="flex w-full items-center gap-3 lg:w-auto"><label className="relative min-w-0 flex-1 lg:w-[28rem]"><span className="sr-only">搜索环境</span><Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索" className="pl-8" /></label><Button type="button" size="sm" variant="neutral" onClick={onRefresh}>刷新</Button></div></div></div><PageBody className="max-w-[101.25rem] p-3"><div className="flex items-center justify-between gap-3 py-4 text-body text-fg-subtle"><span>当前供 {filtered.length} 个环境</span><span>数据更新于 3 分钟前</span></div><CardGroup columns={3} separated proximityHover={false} className="items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 25.625rem), 1fr))" }}>{filtered.map((item) => <EnvironmentCard key={item.id} item={item} onViewDetails={onViewDetails} />)}</CardGroup></PageBody></PageContent></PageLayout>;
}
