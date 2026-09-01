"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import AlertSquareIcon from "@hugeicons/core-free-icons/AlertSquareIcon";
import CheckmarkSquare01Icon from "@hugeicons/core-free-icons/CheckmarkSquare01Icon";
import CloudOffIcon from "@hugeicons/core-free-icons/CloudOffIcon";
import Fire02Icon from "@hugeicons/core-free-icons/Fire02Icon";
import { Badge, type BadgeColor, type BadgeStatus } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Card, CardContent, CardFooter, CardGroup } from "@zeron/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Input } from "@zeron/ui/input";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { MenuItem } from "@zeron/ui/menu-item";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageHeader, PageHeaderContent, PageLayout } from "@zeron/ui/page-layout";
import { Sidebar, SidebarContent, SidebarFooter, SidebarFloatingTrigger, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarProvider, SidebarTrigger } from "@zeron/ui/sidebar";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { createHugeIcon } from "@zeron/ui/system/huge-icon";
import { cn } from "@zeron/ui/system/utils";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";

export type ClusterEnvironmentHealth = "critical" | "warning" | "normal" | "offline";
export type ClusterEnvironmentFreshness = "current" | "expired";
export type ClusterEnvironmentFilter = "all" | ClusterEnvironmentHealth | "expired";
type NavigationItem = { value: string; label: string; icon: IconComponent };

const operationsHomeHref = "/block-demo/zaiops-operations-01";
const clusterEnvironmentHref = "/block-demo/cluster-environment-list-01";
const subscribeToPlatform = () => () => undefined;
const getServerPlatformShortcut = () => null;
const getPlatformShortcut = () => /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

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

function PlatformShortcutHint() {
  const label = useSyncExternalStore(subscribeToPlatform, getPlatformShortcut, getServerPlatformShortcut);
  if (!label) return <KbdGroup aria-hidden="true" className="invisible ms-auto min-w-13 justify-end"><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>;
  return <KbdGroup aria-label={label} className="ms-auto min-w-13 justify-end">{label.split(" ").map((part) => <Kbd key={part}>{part}</Kbd>)}</KbdGroup>;
}

function ClusterEnvironmentSearchTrigger({ onOpen }: { onOpen: () => void }) {
  const Search = useIcon("search");
  return <Button aria-keyshortcuts="Meta+K Control+K" className="h-control-lg w-full justify-start px-1.5" onClick={onOpen} size="lg" type="button" variant="ghost"><span className="flex w-full min-w-0 items-center gap-1"><Search aria-hidden className="size-4 shrink-0" strokeWidth={1.5} /><span>搜索</span><PlatformShortcutHint /></span></Button>;
}

interface ClusterEnvironmentNavigationPanelProps {
  organization: string;
  onOrganizationChange: (organization: string) => void;
  onSearchOpen: () => void;
  onNavigate?: () => void;
  showSidebarTrigger?: boolean;
}

function ClusterEnvironmentNavigationPanel({ organization, onOrganizationChange, onSearchOpen, onNavigate, showSidebarTrigger = false }: ClusterEnvironmentNavigationPanelProps) {
  const ChevronDown = useIcon("chevron-down");
  const Home = useIcon("home");
  const List = useIcon("list");
  const Check = useIcon("check-square");
  const Clock = useIcon("clock");
  const User = useIcon("user");
  const Layers = useIcon("doc-surfaces");
  const Chat = useIcon("message-circle");
  const More = useIcon("ellipsis");
  const primary: NavigationItem[] = [{ value: operationsHomeHref, label: "首页", icon: Home }, { value: clusterEnvironmentHref, label: "集群环境", icon: List }, { value: "/reports", label: "巡检报告", icon: Check }];
  const services: NavigationItem[] = [{ value: "/service-progress", label: "服务进度", icon: Clock }, { value: "/service-authorizations", label: "服务授权", icon: User }, { value: "/operation-history", label: "操作记录", icon: Layers }];
  const renderItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isHome = item.value === operationsHomeHref;
    return <NavItem key={item.value} value={item.value}><NavItemTrigger className="px-1.5 text-body data-[active=true]:text-fg-brand" onClick={(event) => { if (isHome) onNavigate?.(); else event.preventDefault(); }} render={<Link href={item.value} />}><NavItemLeading className="group-data-[active=true]/nav-item:text-fg-brand"><Icon aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>;
  };

  return <>
    <SidebarHeader className="space-y-1 px-2 py-1.5">
      <div className="flex min-w-0 items-center gap-1">
        <DropdownMenu><DropdownTrigger render={<SidebarIdentityRow as="button" leading={<SidebarIdentityAvatar className="rounded-lg" tone="brand">C</SidebarIdentityAvatar>} primary={organization} trailing={<ChevronDown className="size-4" />} />} />
          <DropdownContent align="center" alignOffset={20} className="!w-60 !min-w-60 !max-w-60">{["华东金融", "华南制造"].map((name) => <button aria-pressed={organization === name} className="flex h-control-lg w-full items-center rounded-lg px-2 text-left text-body text-fg-default transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring" key={name} onClick={() => onOrganizationChange(name)} type="button">{name}</button>)}</DropdownContent>
        </DropdownMenu>
        {showSidebarTrigger && <SidebarTrigger className="shrink-0" label="收起操作导航" size="xs" />}
      </div>
      <ClusterEnvironmentSearchTrigger onOpen={onSearchOpen} />
    </SidebarHeader>
    <SidebarContent contentClassName="gap-3 px-2 py-1">
      <SidebarGroup><SidebarGroupContent><NavMenu activeValue={clusterEnvironmentHref} aria-label="主要导航" keyboardNavigation="roving">{primary.map(renderItem)}</NavMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup><SidebarGroupLabel>我的服务</SidebarGroupLabel><SidebarGroupContent><NavMenu activeValue={null} aria-label="我的服务" keyboardNavigation="roving">{services.map(renderItem)}</NavMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup>
        <div className="flex items-center justify-between px-1.5 pb-1"><SidebarGroupLabel className="p-0">诊断会话</SidebarGroupLabel><Button className="h-auto px-0 text-label text-fg-brand underline underline-offset-2" size="xs" type="button" variant="ghost">新建会话</Button></div>
        <NavMenu activeValue={null} aria-label="诊断会话" keyboardNavigation="roving">{["使用 specialist-network - 新会话", "在使用率最高的那台设备上…"].map((session) => <NavItem key={session} value={session}><NavItemTrigger className="px-1.5" onClick={(event) => event.preventDefault()} render={<a href="#diagnostic-sessions" />}><NavItemLeading><Chat aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{session}</NavItemLabel></NavItemContent></NavItemTrigger><span className="relative me-1 flex h-control-md w-8 shrink-0 items-center justify-end"><span className="whitespace-nowrap text-label text-fg-subtle transition-opacity group-hover/nav-item:opacity-0 group-focus-within/nav-item:opacity-0">2分钟</span><DropdownMenu><DropdownTrigger render={<Button aria-label={`${session} 更多操作`} className="pointer-events-none absolute right-0 opacity-0 group-hover/nav-item:pointer-events-auto group-hover/nav-item:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100" iconOnly size="xs" type="button" variant="ghost"><More aria-hidden size={16} strokeWidth={1.5} /></Button>} /><DropdownContent align="end" className="w-36"><MenuItem index={0} label="重命名会话" onSelect={() => undefined} /><MenuItem index={1} label="删除会话" onSelect={() => undefined} /></DropdownContent></DropdownMenu></span></NavItem>)}</NavMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter className="px-2 py-1.5"><SidebarIdentityRow description="wei.feng@zstack.io" leading={<SidebarIdentityAvatar className="rounded-lg">CF</SidebarIdentityAvatar>} primary="carlos" trailing={<More className="size-4" />} trailingPlacement="edge" /></SidebarFooter>
  </>;
}

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
  const [organization, setOrganization] = useState("华东金融");
  const [searchOpen, setSearchOpen] = useState(false);
  const Search = useIcon("search");
  const List = useIcon("list");
  const filters: readonly ClusterEnvironmentFilter[] = ["all", "critical", "warning", "normal", "offline", "expired"];
  const filterLabel: Record<ClusterEnvironmentFilter, string> = { all: "全部", critical: "严重", warning: "告警", normal: "正常", offline: "离线", expired: "数据过期" };
  const filtered = useMemo(() => environments.filter((item) => (filter === "all" || filter === "expired" ? filter === "all" || item.freshness === "expired" : item.health === filter) && `${item.name} ${item.location}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [environments, filter, query]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.defaultPrevented || event.isComposing || event.repeat || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k" || target?.closest("input, textarea, select, [contenteditable], [role=textbox]")) return;
      event.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const navigationPanelProps = { organization, onOrganizationChange: setOrganization };

  return <SidebarProvider breakpointBehavior="collapse"><div className={cn("flex h-full min-h-[42rem] min-w-0 w-full overflow-hidden bg-surface-base", className)} {...props}>
    <Sidebar ariaLabel="操作导航" className="relative h-full" collapsible="offcanvas" mobileWidth="min(260px, calc(100vw - 24px))" width="260px"><ClusterEnvironmentNavigationPanel {...navigationPanelProps} onSearchOpen={() => setSearchOpen(true)} showSidebarTrigger /></Sidebar>
    <PageLayout className="h-full min-w-0 flex-1"><PageHeader className="h-control-sm py-0 max-sm:flex-row"><div className="flex h-full min-w-0 items-center gap-2"><SidebarFloatingTrigger className="shrink-0" collapsedBehavior="offcanvas" contentClassName="h-[min(36rem,calc(100svh-4rem))] w-[260px] max-w-[calc(100vw-12px)] rounded-xl p-0" label="展开操作导航" menuLabel="打开操作导航菜单" renderContent={({ close }) => <ClusterEnvironmentNavigationPanel {...navigationPanelProps} onNavigate={close} onSearchOpen={() => { close(); setSearchOpen(true); }} />} size="xs" surfaceClassName="border-[0.5px] border-border-subtle" surfaceShadow="floating-drop" /><PageHeaderContent className="h-full" icon={List}><nav aria-label="当前位置" className="text-body font-medium text-fg-default">集群环境</nav></PageHeaderContent></div></PageHeader><PageContent><div className="shrink-0 border-b border-border-subtle p-3 pb-0"><div className="flex flex-wrap items-center justify-between gap-3 pb-3"><Tabs value={filter} onValueChange={(value) => setFilter(value as ClusterEnvironmentFilter)} variant="segment"><TabsList>{filters.map((value) => <TabItem key={value} value={value} label={filterLabel[value]} icon={filterIcons[value]} badge={value === "all" ? undefined : value === "expired" ? environments.filter((item) => item.freshness === "expired").length : environments.filter((item) => item.health === value).length} />)}</TabsList></Tabs><div className="flex w-full items-center gap-3 lg:w-auto"><label className="relative min-w-0 flex-1 lg:w-[28rem]"><span className="sr-only">搜索环境</span><Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索" className="pl-8" /></label><Button type="button" size="sm" variant="neutral" onClick={onRefresh}>刷新</Button></div></div></div><PageBody className="max-w-[101.25rem] p-3"><div className="flex items-center justify-between gap-3 py-4 text-body text-fg-subtle"><span>当前供 {filtered.length} 个环境</span><span>数据更新于 3 分钟前</span></div><CardGroup columns={3} separated proximityHover={false} className="items-start" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 25.625rem), 1fr))" }}>{filtered.map((item) => <EnvironmentCard key={item.id} item={item} onViewDetails={onViewDetails} />)}</CardGroup></PageBody></PageContent></PageLayout>
  </div><Dialog onOpenChange={setSearchOpen} open={searchOpen}><DialogContent size="sm"><DialogHeader><DialogTitle>搜索 ZAIops</DialogTitle><DialogDescription>搜索会话、集群环境、巡检报告和服务记录。</DialogDescription></DialogHeader><div className="rounded-lg border border-border-subtle px-3 py-2 text-body text-fg-subtle">输入关键词开始搜索…</div></DialogContent></Dialog></SidebarProvider>;
}
