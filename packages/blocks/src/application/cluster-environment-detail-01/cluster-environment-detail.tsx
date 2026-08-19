"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Children, useEffect, useMemo, useState, useSyncExternalStore, type ComponentPropsWithoutRef, type ReactNode } from "react";
import Link from "next/link";
import {
  ResourceMetricList,
  defaultResourceMetrics,
  type ResourceMetricItem,
} from "@zeron/blocks/resource-metric-list-01";
import {
  ResourceStatusAll,
  type ResourceStatusItem,
} from "@zeron/blocks/resource-status-all-01";
import { Badge } from "@zeron/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@zeron/ui/breadcrumb";
import { Button } from "@zeron/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@zeron/ui/button-group";
import { Card, CardContent } from "@zeron/ui/card";
import { DataTable, DataTableColumnHeader, DataTableToolbar, useDataTable } from "@zeron/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { InlineNotice } from "@zeron/ui/inline-notice";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { MenuItem } from "@zeron/ui/menu-item";
import { MetricCard } from "@zeron/ui/metric-card";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageHeader, PageHeaderContent, PageLayout as BasePageLayout } from "@zeron/ui/page-layout";
import { Popover, PopoverContent, PopoverTrigger } from "@zeron/ui/popover";
import { Separator } from "@zeron/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarFloatingTrigger, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarProvider, SidebarTrigger } from "@zeron/ui/sidebar";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";

export type ClusterEnvironmentDetailSection = "report" | "plan" | "audit";
export type ClusterEnvironmentReportView = "overview" | "resource" | "network" | "issues";
export type HealthScoreTone = "healthy" | "attention";
type NavigationItem = { value: string; label: string; icon: IconComponent };

const operationsHomeHref = "/block-demo/zaiops-operations-01";
const clusterEnvironmentHref = "/block-demo/cluster-environment-list-01";
const subscribeToPlatform = () => () => undefined;
const getServerPlatformShortcut = () => null;
const getPlatformShortcut = () => /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

export interface ClusterEnvironmentSummary {
  name: string;
  id: string;
  region: string;
  clientAddress: string;
  platformVersion: string;
  provider: string;
  lastHeartbeat: string;
  heartbeatDelay?: string;
}

export interface HealthScoreItem {
  label: string;
  score: number;
  status: string;
  tone?: HealthScoreTone;
}

export interface InspectionIncident {
  id: string;
  priority: string;
  resourceName: string;
  resourceType: string;
  resourceKind?: "storage" | "host";
  title: string;
  description: string;
  duration: string;
  trend: string;
  related: string;
  resolutionRecords?: readonly IncidentResolutionRecord[];
}

export interface IncidentResolutionRecord {
  id: string;
  operator: string;
  occurredAt: string;
  detail: string;
}

export interface InspectionReport {
  id: string;
  generatedAt: string;
  score: number;
  healthScores: readonly HealthScoreItem[];
  summary: string;
  resourceStatuses: readonly ResourceStatusItem[];
  resourceMetrics: readonly ResourceMetricItem[];
  incidents: readonly InspectionIncident[];
  incidentTotal?: number;
}

export interface ClusterEnvironmentDetailProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  environment?: ClusterEnvironmentSummary;
  reports?: readonly InspectionReport[];
  selectedReportId?: string;
  defaultSelectedReportId?: string;
  onSelectedReportChange?: (reportId: string) => void;
  activeSection?: ClusterEnvironmentDetailSection;
  defaultActiveSection?: ClusterEnvironmentDetailSection;
  onActiveSectionChange?: (section: ClusterEnvironmentDetailSection) => void;
  onRunInspection?: () => void;
  onRefresh?: () => void;
  onAskAI?: () => void;
  onIncidentAskAI?: (incident: InspectionIncident) => void;
  onIncidentSelect?: (incident: InspectionIncident) => void;
  onIncidentResolve?: (incident: InspectionIncident) => void;
  onIncidentMute?: (incident: InspectionIncident) => void;
  inspectionPlanContent?: ReactNode;
  authorizationAuditContent?: ReactNode;
  resourceTopologyContent?: ReactNode;
  networkTopologyContent?: ReactNode;
  issueHandlingContent?: ReactNode;
}

export const defaultClusterEnvironmentSummary = {
  name: "金融核心环境",
  id: "finance-core",
  region: "北京金融区",
  clientAddress: "10.22.4.10",
  platformVersion: "5.0",
  provider: "ZStack",
  lastHeartbeat: "19:12",
  heartbeatDelay: "延迟 2 分钟",
} as const satisfies ClusterEnvironmentSummary;

const defaultHealthScores = [
  { label: "综合健康分", score: 90, status: "健康 · 较上次 +3", tone: "healthy" },
  { label: "平台", score: 96, status: "健康 · 4项问题", tone: "healthy" },
  { label: "计算", score: 81, status: "需关注 · 18项问题", tone: "attention" },
  { label: "存储", score: 94, status: "健康 · 8项问题", tone: "healthy" },
  { label: "网络", score: 86, status: "需关注 · 12项问题", tone: "attention" },
] as const satisfies readonly HealthScoreItem[];

const defaultIncidents = [
  { id: "mgmt-01", priority: "P0", resourceName: "MGMT-NODE-01", resourceType: "ManagementNode", title: "管理节点不可达", description: "高可用切换未完成，控制面任务已暂停", duration: "持续8分钟", trend: "正在紧急处置", related: "影响全部 1,501 项资源", resolutionRecords: [{ id: "mgmt-01-1", operator: "张晨", occurredAt: "2026/7/30 19:08", detail: "完成管理节点主备切换，并恢复控制面任务调度。" }, { id: "mgmt-01-2", operator: "李宁", occurredAt: "2026/7/30 19:14", detail: "复核管理服务状态，保留告警并持续观察。" }] },
  { id: "host-03", priority: "P1", resourceName: "PROD-HOST-03", resourceType: "HostVO", resourceKind: "host", title: "CPU Ready 持续高于阈值", description: "核心业务虚拟机调度延迟升高", duration: "持续26分钟", trend: "波动上升", related: "关联了 48 VM", resolutionRecords: [{ id: "host-03-1", operator: "王敏", occurredAt: "2026/7/30 18:53", detail: "迁移了 6 台低优先级云主机，释放计算调度压力。" }] },
  { id: "storage-02", priority: "P1", resourceName: "PS-生产存储-02", resourceType: "Ceph主存储", resourceKind: "storage", title: "副本恢复任务积压", description: "数据副本恢复速度低于预期", duration: "持续1小时", trend: "缓慢恢复中", related: "关联了 94 VM", resolutionRecords: [{ id: "storage-02-1", operator: "陈浩", occurredAt: "2026/7/30 18:42", detail: "调整副本恢复优先级，优先处理受影响业务卷。" }] },
  { id: "storage-01", priority: "P2", resourceName: "PS-生产存储-01", resourceType: "Ceph主存储", resourceKind: "storage", title: "容量使用率达到78%", description: "预测18天后超过85%阈值", duration: "已持续了3天", trend: "缓慢恶化中", related: "关联了 186 VM" },
  { id: "host-07", priority: "P2", resourceName: "PROD-HOST-07", resourceType: "HostVO", resourceKind: "host", title: "bond链路降为单链路", description: "业务网络仍可用，冗余已降低", duration: "持续42分钟", trend: "状态稳定", related: "关联了 22 VM" },
  { id: "host-12", priority: "P2", resourceName: "PROD-HOST-12", resourceType: "HostVO", resourceKind: "host", title: "内核版本低于建议基线", description: "业务网络仍可用，冗余已降低", duration: "持续12天", trend: "状态稳定", related: "关联了 22 VM" },
  { id: "image-01", priority: "P2", resourceName: "BS-IMAGE-01", resourceType: "备份存储", resourceKind: "storage", title: "容量使用率达到71%", description: "业务网络仍可用，冗余已降低", duration: "持续7天", trend: "状态稳定", related: "关联了 22 VM" },
  { id: "host-15", priority: "P2", resourceName: "PROD-HOST-15", resourceType: "HostVO", resourceKind: "host", title: "CPU分配率达到88%", description: "业务网络仍可用，冗余已降低", duration: "持续5天", trend: "状态稳定", related: "关联了 22 VM" },
] as const satisfies readonly InspectionIncident[];

export const defaultInspectionReports = [
  {
    id: "2026-07-30T19:00:09",
    generatedAt: "2026/7/30 19:00:09",
    score: 90,
    healthScores: defaultHealthScores,
    summary: "环境从87分恢复至90分，风险总体下降，但存储容量和网络冗余仍需持续关注。",
    resourceStatuses: [
      { label: "正常", value: 1390, tone: "normal", countsTowardCoverage: true },
      { label: "告警", value: 73, tone: "warning", countsTowardCoverage: true },
      { label: "严重", value: 10, tone: "critical", countsTowardCoverage: true },
      { label: "未知", value: 28, tone: "unknown", countsTowardCoverage: false },
    ],
    resourceMetrics: [
      { label: "平台层级资源", description: "环境 / 区域 / 管理节点", value: 3, iconSrc: "", segments: [{ value: 3, tone: "brand", label: "正常" }] },
      { label: "集群", description: "Cluster", value: 10, iconSrc: "", segments: [{ value: 6, tone: "brand", label: "正常" }, { value: 4, tone: "warning", label: "警告" }] },
      { label: "宿主机", description: "HostVO", value: 37, iconSrc: "", segments: [{ value: 32, tone: "brand", label: "正常" }, { value: 5, tone: "warning", label: "警告" }] },
      { label: "云主机", description: "VM Instance", value: 1125, iconSrc: "", segments: [{ value: 1083, tone: "brand", label: "正常" }, { value: 28, tone: "warning", label: "警告" }, { value: 14, tone: "neutral", label: "未知" }] },
      { label: "网络资源", description: "L2/ L3 / Router 等", value: 315, iconSrc: "", segments: [{ value: 282, tone: "brand", label: "正常" }, { value: 21, tone: "warning", label: "警告" }, { value: 4, tone: "danger", label: "异常" }, { value: 8, tone: "neutral", label: "未知" }] },
      { label: "存储资源", description: "PS / BS", value: 11, iconSrc: "", segments: [{ value: 10, tone: "brand", label: "正常" }, { value: 1, tone: "danger", label: "异常" }] },
    ],
    incidents: defaultIncidents,
    incidentTotal: 8,
  },
] as const satisfies readonly InspectionReport[];

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

function PageLayout({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
  const [organization, setOrganization] = useState("华东金融");
  const [searchOpen, setSearchOpen] = useState(false);
  const List = useIcon("list");
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
  const [, ...content] = Children.toArray(children);
  const navigationPanelProps = { organization, onOrganizationChange: setOrganization };

  return <SidebarProvider breakpointBehavior="collapse"><div className={cn("flex h-full min-h-[44rem] min-w-0 w-full overflow-hidden bg-surface-base", className)} {...props}>
    <Sidebar ariaLabel="操作导航" className="relative h-full" collapsible="offcanvas" mobileWidth="min(260px, calc(100vw - 24px))" width="260px"><ClusterEnvironmentNavigationPanel {...navigationPanelProps} onSearchOpen={() => setSearchOpen(true)} showSidebarTrigger /></Sidebar>
    <BasePageLayout className="h-full min-w-0 flex-1"><PageHeader className="h-control-sm py-0 max-sm:flex-row"><div className="flex h-full min-w-0 items-center gap-2"><SidebarFloatingTrigger className="shrink-0" collapsedBehavior="offcanvas" contentClassName="h-[min(36rem,calc(100svh-4rem))] w-[260px] max-w-[calc(100vw-12px)] rounded-xl p-0" label="展开操作导航" menuLabel="打开操作导航菜单" renderContent={({ close }) => <ClusterEnvironmentNavigationPanel {...navigationPanelProps} onNavigate={close} onSearchOpen={() => { close(); setSearchOpen(true); }} />} size="xs" surfaceClassName="border-[0.5px] border-border-subtle" surfaceShadow="floating-drop" /><PageHeaderContent className="h-full" icon={List}><Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>集群环境</BreadcrumbPage></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>金融核心环境</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb></PageHeaderContent></div></PageHeader>{content}</BasePageLayout>
  </div><Dialog onOpenChange={setSearchOpen} open={searchOpen}><DialogContent size="sm"><DialogHeader><DialogTitle>搜索 ZAIops</DialogTitle><DialogDescription>搜索会话、集群环境、巡检报告和服务记录。</DialogDescription></DialogHeader><div className="rounded-lg border border-border-subtle px-3 py-2 text-body text-fg-subtle">输入关键词开始搜索…</div></DialogContent></Dialog></SidebarProvider>;
}

function EnvironmentHero({ environment, onAskAI, onRefresh, onRunInspection }: { environment: ClusterEnvironmentSummary; onAskAI?: () => void; onRefresh?: () => void; onRunInspection?: () => void }) {
  const Library = useIcon("square-library");
  const Clock = useIcon("clock");
  return <Card className="overflow-hidden rounded-xl border-[0.5px] border-border bg-[linear-gradient(160deg,var(--info-surface)_-80%,var(--surface-floating)_52%)] p-3">
    <CardContent className="flex min-w-0 flex-col gap-2 p-0">
      <div className="flex min-w-0 items-center gap-2.5 px-2.5 py-2">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-hover text-fg-brand"><Library size={20} strokeWidth={1.5} /></span>
        <div className="min-w-0"><h1 className="truncate text-title font-semibold text-fg-default">{environment.name}</h1><p className="flex items-center gap-1 text-label text-fg-subtle"><Clock className="size-3.5 text-fg-brand" />最近心跳 {environment.lastHeartbeat}{environment.heartbeatDelay && <span>（{environment.heartbeatDelay}）</span>}</p></div>
      </div>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 px-2 text-body"><div><dt className="inline text-fg-muted">环境ID: </dt><dd className="inline text-fg-default">{environment.id}</dd></div><div><dt className="inline text-fg-muted">区域: </dt><dd className="inline text-fg-default">{environment.region}</dd></div><div><dt className="inline text-fg-muted">Client 来源地址: </dt><dd className="inline text-fg-default">{environment.clientAddress}</dd></div><div><dt className="inline text-fg-muted">平台版本: </dt><dd className="inline text-fg-default">{environment.platformVersion}</dd></div><div><dt className="inline text-fg-muted">服务方: </dt><dd className="inline font-medium text-fg-brand">{environment.provider}</dd></div></dl>
      <div className="h-px bg-border-subtle" />
      <div className="flex flex-wrap gap-3"><Button type="button" size="md" onClick={onRunInspection}>触发巡检</Button><Button type="button" size="md" variant="tertiary" onClick={onRefresh}>刷新状态</Button><Button type="button" size="md" variant="tertiary" onClick={onAskAI}>询问AI</Button></div>
    </CardContent>
  </Card>;
}

function ScoreStrip({ items }: { items: readonly HealthScoreItem[] }) {
  return <div className="grid overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-floating sm:grid-cols-2 xl:grid-cols-5">{items.map((item) => <MetricCard key={item.label} label={item.label} value={item.score} footer={<span className={cn(item.tone === "attention" && "inline-flex rounded bg-warning-surface px-1 text-fg-warning")}>{item.status}</span>} className="min-h-[108px] self-stretch rounded-none border-0 border-b-[0.5px] border-border bg-transparent p-3 [&_[data-slot=metric-card-value-row]>span]:text-fg-brand last:border-b-0 sm:even:border-l-[0.5px] xl:border-b-0 xl:border-l-[0.5px] xl:first:border-l-0" />)}</div>;
}

function ResolutionRecords({ records }: { records: readonly IncidentResolutionRecord[] }) {
  return <div className="space-y-2"><p className="text-label font-medium text-fg-default">处置记录</p><div className="space-y-2">{records.map((record) => <div key={record.id} className="space-y-0.5 border-l-2 border-brand/30 pl-2"><p className="text-label text-fg-muted">{record.operator} 在 {record.occurredAt} 做了如下处置</p><p className="text-label text-fg-default">{record.detail}</p></div>)}</div></div>;
}

function IncidentResolutionAction({ incident, onResolve }: { incident: InspectionIncident; onResolve?: (incident: InspectionIncident) => void }) {
  const records = incident.resolutionRecords ?? [];
  const label = records.length ? `处置${records.length}次` : "处置";
  if (!records.length) return <Button type="button" size="sm" variant="tertiary" onClick={() => onResolve?.(incident)}>{label}</Button>;
  return <Popover trigger="hover" hoverDelay={120} closeDelay={160}><PopoverTrigger render={<Button type="button" size="sm" variant="tertiary" onClick={() => onResolve?.(incident)}>{label}</Button>} /><PopoverContent align="end" side="bottom" sideOffset={6} className="w-80 p-3"><ResolutionRecords records={records} /></PopoverContent></Popover>;
}

function IncidentActionSplitButton({ incident, onAskAI, onMute, onResolve }: { incident: InspectionIncident; onAskAI?: (incident: InspectionIncident) => void; onMute?: (incident: InspectionIncident) => void; onResolve?: (incident: InspectionIncident) => void }) {
  const ChevronDown = useIcon("chevron-down");
  return <ButtonGroup aria-label={`${incident.resourceName} 操作`}><Button type="button" size="sm" variant="tertiary" onClick={() => onAskAI?.(incident)}>询问 AI</Button><ButtonGroupSeparator /><DropdownMenu><DropdownTrigger render={<Button type="button" size="sm" variant="tertiary" iconOnly aria-label={`${incident.resourceName} 更多操作`}><ChevronDown /></Button>} /><DropdownContent align="end"><MenuItem index={0} label="处置" onSelect={() => onResolve?.(incident)} /><MenuItem index={1} label="不再提醒" onSelect={() => onMute?.(incident)} /></DropdownContent></DropdownMenu></ButtonGroup>;
}

function Incidents({ incidents, total, onAskAI, onMute, onResolve, onSelect }: { incidents: readonly InspectionIncident[]; total: number; onAskAI?: (incident: InspectionIncident) => void; onMute?: (incident: InspectionIncident) => void; onResolve?: (incident: InspectionIncident) => void; onSelect?: (incident: InspectionIncident) => void }) {
  const data = useMemo(() => [...incidents], [incidents]);
  const priorityOptions = useMemo(
    () => Array.from(new Set(incidents.map((incident) => incident.priority))).sort().map((value) => ({ label: value, value })),
    [incidents],
  );
  const resourceTypeOptions = useMemo(
    () => Array.from(new Set(incidents.map((incident) => incident.resourceType))).sort().map((value) => ({ label: value, value })),
    [incidents],
  );
  const columns = useMemo<ColumnDef<InspectionIncident, unknown>[]>(
    () => [
      {
        accessorKey: "priority",
        cell: ({ row }) => <Badge color={row.original.priority === "P1" ? "red" : "orange"} size="sm" variant="strong">{row.original.priority}</Badge>,
        filterFn: (row, id, value: string[]) => Array.isArray(value) && value.includes(row.getValue(id)),
        header: ({ column }) => <DataTableColumnHeader column={column} label="优先级" />,
        meta: { label: "优先级", options: priorityOptions, variant: "multiSelect" },
      },
      {
        accessorKey: "resourceName",
        cell: ({ row }) => onSelect ? <Button className="-mx-2 h-auto min-h-0 justify-start px-2 py-1 text-left font-medium" onClick={() => onSelect(row.original)} size="sm" variant="ghost"><span className="block">{row.original.resourceName}</span><span className="block text-label font-normal text-fg-subtle">{row.original.resourceType}</span></Button> : <div><p className="font-medium text-fg-default">{row.original.resourceName}</p><p className="text-label text-fg-subtle">{row.original.resourceType}</p></div>,
        filterFn: (row, _id, value: string) => {
          const query = String(value ?? "").trim().toLocaleLowerCase();
          return !query || [row.original.resourceName, row.original.resourceType, row.original.title, row.original.description].some((text) => text.toLocaleLowerCase().includes(query));
        },
        header: ({ column }) => <DataTableColumnHeader column={column} label="资源" />,
        meta: { label: "搜索", placeholder: "搜索资源或问题…", variant: "text" },
      },
      {
        accessorKey: "title",
        cell: ({ row }) => <div className="min-w-52"><p className="font-medium text-fg-default">{row.original.title}</p><p className="text-label text-fg-subtle">{row.original.description}</p></div>,
        header: ({ column }) => <DataTableColumnHeader column={column} label="问题" />,
      },
      {
        accessorKey: "resourceType",
        filterFn: (row, id, value: string[]) => Array.isArray(value) && value.includes(row.getValue(id)),
        header: ({ column }) => <DataTableColumnHeader column={column} label="资源类型" />,
        meta: { label: "资源类型", options: resourceTypeOptions, variant: "multiSelect" },
      },
      {
        accessorKey: "duration",
        cell: ({ row }) => <div><p>{row.original.duration}</p><p className="text-label text-fg-subtle">{row.original.trend}</p></div>,
        header: ({ column }) => <DataTableColumnHeader column={column} label="持续时间" />,
      },
      {
        accessorKey: "related",
        header: ({ column }) => <DataTableColumnHeader column={column} label="影响范围" />,
      },
      {
        id: "resolution",
        cell: ({ row }) => <IncidentResolutionAction incident={row.original} onResolve={onResolve} />,
        header: () => <span className="text-label font-medium text-fg-muted">处置</span>,
      },
      {
        id: "actions",
        cell: ({ row }) => <div className="flex justify-end"><IncidentActionSplitButton incident={row.original} onAskAI={onAskAI} onMute={onMute} onResolve={onResolve} /></div>,
        header: () => <div className="text-right text-label font-medium text-fg-muted">操作</div>,
      },
    ],
    [onAskAI, onMute, onResolve, onSelect, priorityOptions, resourceTypeOptions],
  );
  const { table } = useDataTable({
    columns,
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  return <section className="flex min-w-0 flex-col gap-2"><div className="flex items-center gap-2 px-2"><h2 className="text-body font-semibold text-fg-muted">异常事件</h2><Badge size="sm" status="info">{total}</Badge></div><DataTable className="[&_table]:min-w-[74rem]" emptyMessage="未找到符合条件的异常事件。" table={table}><DataTableToolbar showViewOptions={false} table={table} /></DataTable></section>;
}
function EmptyPanel({ label }: { label: string }) { return <InlineNotice className="m-1">{label}内容由接入方提供。</InlineNotice>; }

/** A responsive cluster environment detail workspace composed from existing Zeron primitives and resource blocks. */
export function ClusterEnvironmentDetail({ environment = defaultClusterEnvironmentSummary, reports = defaultInspectionReports, selectedReportId, defaultSelectedReportId, onSelectedReportChange, activeSection, defaultActiveSection = "report", onActiveSectionChange, onRunInspection, onRefresh, onAskAI, onIncidentAskAI, onIncidentSelect, onIncidentMute, onIncidentResolve, inspectionPlanContent, authorizationAuditContent, resourceTopologyContent, networkTopologyContent, issueHandlingContent, className, ...props }: ClusterEnvironmentDetailProps) {
  const [internalSection, setInternalSection] = useState<ClusterEnvironmentDetailSection>(defaultActiveSection);
  const [internalReportId, setInternalReportId] = useState(defaultSelectedReportId ?? reports[0]?.id ?? "");
  const [reportView, setReportView] = useState<ClusterEnvironmentReportView>("overview");
  const section = activeSection ?? internalSection;
  const reportId = selectedReportId ?? internalReportId;
  const selectedIndex = Math.max(0, reports.findIndex((report) => report.id === reportId));
  const report = reports[selectedIndex] ?? reports[0];
  const reportTotal = reports.length;
  const setSection = (value: string) => { const next = value as ClusterEnvironmentDetailSection; if (activeSection === undefined) setInternalSection(next); onActiveSectionChange?.(next); };
  const setReport = (id: string) => { if (selectedReportId === undefined) setInternalReportId(id); onSelectedReportChange?.(id); };
  const previous = () => reports[selectedIndex - 1] && setReport(reports[selectedIndex - 1].id);
  const next = () => reports[selectedIndex + 1] && setReport(reports[selectedIndex + 1].id);
  const reportMenuLabel = report?.generatedAt ?? "暂无巡检报告";
  const ChevronLeft = useIcon("chevron-left"); const ChevronRight = useIcon("chevron-right"); const Calendar = useIcon("calendar");
  if (!report) return null;
  return <PageLayout className={cn("min-h-[44rem] bg-surface-base", className)} {...props}><PageHeader className="px-2 py-1"><Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>集群环境</BreadcrumbPage></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{environment.name}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb></PageHeader><PageContent className="m-0"><PageBody className="max-w-[101.25rem] p-3"><div className="flex flex-col gap-3"><EnvironmentHero environment={environment} onAskAI={onAskAI} onRefresh={onRefresh} onRunInspection={onRunInspection} /><Tabs value={section} onValueChange={setSection} variant="underline"><TabsList className="overflow-x-auto"><TabItem value="report" label="巡检报告" /><TabItem value="plan" label="巡检方案" /><TabItem value="audit" label="授权与审计" /></TabsList><TabPanel value="report" className="mt-3"><div className="rounded-xl bg-hover p-1"><div className="flex flex-wrap items-center gap-3 p-2"><p className="text-body font-medium text-fg-muted">共 {reportTotal} 份巡检报告</p><div className="flex items-center gap-2"><Button type="button" size="md" variant="tertiary" iconOnly disabled={selectedIndex === 0} onClick={previous} aria-label="上一份巡检报告"><ChevronLeft /></Button><DropdownMenu><DropdownTrigger render={<Button type="button" size="md" variant="tertiary" leadingIcon={Calendar}><span>{reportMenuLabel}</span>{report && <Badge size="sm" variant="strong" color="blue">{report.score}分</Badge>}</Button>} /><DropdownContent>{reports.map((item, index) => <MenuItem key={item.id} index={index} label={`${item.generatedAt} · ${item.score}分`} checked={item.id === report.id} onSelect={() => setReport(item.id)} />)}</DropdownContent></DropdownMenu><Button type="button" size="md" variant="tertiary" iconOnly disabled={selectedIndex >= reports.length - 1} onClick={next} aria-label="下一份巡检报告"><ChevronRight /></Button></div></div><div className="rounded-xl bg-surface-floating p-2"><Tabs value={reportView} onValueChange={(value) => setReportView(value as ClusterEnvironmentReportView)} variant="segment" color="neutral"><TabsList className="my-0 overflow-x-auto"><TabItem value="overview" label="总览" /><TabItem value="resource" label="资源拓扑" /><TabItem value="network" label="网络拓扑" /><TabItem value="issues" label="问题与处置" badge={report.incidentTotal ?? report.incidents.length} /></TabsList><Separator className="my-1" /><TabPanel value="overview" className="p-1"><div className="flex flex-col gap-2"><ScoreStrip items={report.healthScores} /><InlineNotice variant="emphasized" tone="info" className="rounded-lg px-3">{report.summary}</InlineNotice><div className="grid gap-2 xl:grid-cols-2"><ResourceStatusAll className="max-w-none" statuses={report.resourceStatuses} /><ResourceMetricList className="max-w-none" items={report.resourceMetrics.map((item, index) => item.iconSrc ? item : { ...item, iconSrc: defaultResourceMetrics[index]?.iconSrc ?? "" })} /></div><Incidents incidents={report.incidents} total={report.incidentTotal ?? report.incidents.length} onAskAI={onIncidentAskAI} onMute={onIncidentMute} onResolve={onIncidentResolve} onSelect={onIncidentSelect} /></div></TabPanel><TabPanel value="resource" className="p-1">{resourceTopologyContent ?? <EmptyPanel label="资源拓扑" />}</TabPanel><TabPanel value="network" className="p-1">{networkTopologyContent ?? <EmptyPanel label="网络拓扑" />}</TabPanel><TabPanel value="issues" className="p-1">{issueHandlingContent ?? <Incidents incidents={report.incidents} total={report.incidentTotal ?? report.incidents.length} onAskAI={onIncidentAskAI} onMute={onIncidentMute} onResolve={onIncidentResolve} onSelect={onIncidentSelect} />}</TabPanel></Tabs></div></div></TabPanel><TabPanel value="plan" className="mt-3">{inspectionPlanContent ?? <EmptyPanel label="巡检方案" />}</TabPanel><TabPanel value="audit" className="mt-3">{authorizationAuditContent ?? <EmptyPanel label="授权与审计" />}</TabPanel></Tabs></div></PageBody></PageContent></PageLayout>;
}
