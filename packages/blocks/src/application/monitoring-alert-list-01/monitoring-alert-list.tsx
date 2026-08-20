"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@zeron/ui/button-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Input } from "@zeron/ui/input";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { MenuItem } from "@zeron/ui/menu-item";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageHeader, PageHeaderContent, PageLayout } from "@zeron/ui/page-layout";
import { Popover, PopoverContent, PopoverTrigger } from "@zeron/ui/popover";
import { Sidebar, SidebarContent, SidebarFooter, SidebarFloatingTrigger, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarProvider, SidebarTrigger } from "@zeron/ui/sidebar";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";

function ListPagination({ onPageChange, onPageSizeChange, page, pageSize, total }: { onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void; page: number; pageSize: number; total: number }) {
  const ChevronsLeft = useIcon("chevrons-left");
  const ChevronLeft = useIcon("chevron-left");
  const ChevronRight = useIcon("chevron-right");
  const ChevronsRight = useIcon("chevrons-right");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrevious = page > 0;
  const canGoNext = page < pageCount - 1;
  return <footer className="flex min-h-10 flex-wrap items-center justify-end gap-3 border-t-[0.5px] border-border px-3 py-1.5 text-label text-fg-muted"><span>共 {total} 条</span><span>每页显示</span><Select itemDensity="compact" onValueChange={(value) => onPageSizeChange(Number(value))} size="sm" value={`${pageSize}`}><SelectTrigger aria-label="每页显示条数" className="h-7 w-[70px] min-w-[70px] rounded-lg px-2 text-body" /><SelectContent>{[5, 10, 20, 50].map((size) => <SelectItem key={size} value={`${size}`}>{size}</SelectItem>)}</SelectContent></Select><span>第 {page + 1} 页，共 {pageCount} 页</span><div className="flex items-center gap-2"><Button aria-label="首页" disabled={!canGoPrevious} iconOnly onClick={() => onPageChange(0)} size="sm" type="button" variant="tertiary"><ChevronsLeft aria-hidden size={16} strokeWidth={1.5} /></Button><Button aria-label="上一页" disabled={!canGoPrevious} iconOnly onClick={() => onPageChange(page - 1)} size="sm" type="button" variant="tertiary"><ChevronLeft aria-hidden size={16} strokeWidth={1.5} /></Button><Button aria-label="下一页" disabled={!canGoNext} iconOnly onClick={() => onPageChange(page + 1)} size="sm" type="button" variant="tertiary"><ChevronRight aria-hidden size={16} strokeWidth={1.5} /></Button><Button aria-label="末页" disabled={!canGoNext} iconOnly onClick={() => onPageChange(pageCount - 1)} size="sm" type="button" variant="tertiary"><ChevronsRight aria-hidden size={16} strokeWidth={1.5} /></Button></div></footer>;
}

type NavigationItem = { value: string; label: string; icon: IconComponent };
export type MonitoringAlertSeverity = "critical" | "warning" | "general";

export interface MonitoringAlertItem {
  id: string;
  resource: string;
  resourceType: string;
  environment: string;
  location: string;
  severity: MonitoringAlertSeverity;
  level: "P0" | "P1" | "P2";
  title: string;
  description: string;
  duration: string;
  state: string;
  related: string;
  resolutionRecords?: readonly MonitoringAlertResolutionRecord[];
}

export interface MonitoringAlertResolutionRecord {
  id: string;
  operator: string;
  occurredAt: string;
  detail: string;
}

export interface MonitoringAlertListProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  alerts?: readonly MonitoringAlertItem[];
  onRefresh?: () => void;
  onAnalyze?: (alert: MonitoringAlertItem) => void;
  onResolve?: (alert: MonitoringAlertItem) => void;
  onMute?: (alert: MonitoringAlertItem) => void;
}

const operationsHomeHref = "/block-demo/zaiops-operations-01";
const clusterEnvironmentHref = "/block-demo/cluster-environment-list-01";
const inspectionReportHref = "/block-demo/inspection-report-list-01";
const monitoringAlertHref = "/block-demo/monitoring-alert-list-01";
const subscribeToPlatform = () => () => undefined;
const getServerPlatformShortcut = () => null;
const getPlatformShortcut = () => /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

export const defaultMonitoringAlertItems = [
  { id: "storage-capacity", resource: "PS–生产存储–01", resourceType: "Ceph主存储", environment: "生产环境 B", location: "生产 · 成都机房", severity: "critical", level: "P0", title: "容量使用率达到78%", description: "预计18天后超过85%阈值", duration: "已持续了2小时18分", state: "", related: "关联了 186 VM", resolutionRecords: [{ id: "storage-capacity-1", operator: "陈浩", occurredAt: "2026/7/30 19:03", detail: "清理过期快照并将低优先级卷迁移至备用存储池。" }] },
  { id: "host-bond-1", resource: "PROD–HOST–07", resourceType: "HostVO", environment: "生产环境 B", location: "生产 · 成都机房", severity: "critical", level: "P0", title: "bond链路降为单链路", description: "业务网络仍可用，冗余已降低", duration: "持续42分钟", state: "状态稳定", related: "关联了 22 VM", resolutionRecords: [{ id: "host-bond-1-1", operator: "王敏", occurredAt: "2026/7/30 18:47", detail: "已切换至冗余链路，并安排现场检查物理端口。" }, { id: "host-bond-1-2", operator: "李宁", occurredAt: "2026/7/30 19:10", detail: "复核网络连通性，持续观察链路状态。" }] },
  { id: "host-bond-2", resource: "PROD–HOST–08", resourceType: "HostVO", environment: "生产环境 B", location: "生产 · 成都机房", severity: "general", level: "P2", title: "CPU 使用率超过基线", description: "近 15 分钟持续高于日常范围", duration: "持续16分钟", state: "待观察", related: "关联了 18 VM" },
  { id: "database-replica-delay", resource: "DB–CORE–03", resourceType: "DatabaseVO", environment: "生产环境 A", location: "生产 · 上海一号机房", severity: "critical", level: "P0", title: "数据库副本延迟超过阈值", description: "主从延迟已超过 90 秒", duration: "持续28分钟", state: "影响评估中", related: "关联了 34 VM" },
  { id: "gateway-error-rate", resource: "GW–API–02", resourceType: "GatewayVO", environment: "生产环境 A", location: "生产 · 上海一号机房", severity: "warning", level: "P1", title: "API 网关错误率升高", description: "5xx 错误率在 10 分钟内达到 2.4%", duration: "持续11分钟", state: "状态波动", related: "关联了 16 VM" },
  { id: "backup-latency", resource: "BK–DR–01", resourceType: "BackupVO", environment: "容灾环境", location: "容灾 · 深圳机房", severity: "warning", level: "P1", title: "备份任务延迟", description: "最近一次备份较计划延后 35 分钟", duration: "持续35分钟", state: "待处理", related: "关联了 48 VM" },
  { id: "staging-memory", resource: "STG–HOST–04", resourceType: "HostVO", environment: "预发布环境", location: "测试 · 杭州机房", severity: "general", level: "P2", title: "内存使用率接近阈值", description: "当前使用率 72%，建议关注容量变化", duration: "持续8分钟", state: "待观察", related: "关联了 9 VM" },
  { id: "network-packet-loss", resource: "NET–EDGE–01", resourceType: "SwitchVO", environment: "生产环境 C", location: "生产 · 北京机房", severity: "warning", level: "P1", title: "边界网络丢包率升高", description: "近 5 分钟检测到间歇性丢包", duration: "持续6分钟", state: "状态波动", related: "关联了 27 VM" },
] as const satisfies readonly MonitoringAlertItem[];

function ShortcutHint() {
  const label = useSyncExternalStore(subscribeToPlatform, getPlatformShortcut, getServerPlatformShortcut);
  if (!label) return <KbdGroup aria-hidden="true" className="invisible ms-auto min-w-13 justify-end"><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>;
  return <KbdGroup aria-label={label} className="ms-auto min-w-13 justify-end">{label.split(" ").map((part) => <Kbd key={part}>{part}</Kbd>)}</KbdGroup>;
}

function OperationsSearchTrigger({ onOpen }: { onOpen: () => void }) {
  const Search = useIcon("search");
  return <Button aria-keyshortcuts="Meta+K Control+K" className="h-control-lg w-full justify-start px-1.5" onClick={onOpen} size="lg" type="button" variant="ghost"><span className="flex w-full min-w-0 items-center gap-1"><Search aria-hidden className="size-4 shrink-0" strokeWidth={1.5} /><span>搜索</span><ShortcutHint /></span></Button>;
}

function OperationsNavigation({ organization, onOrganizationChange, onSearchOpen, onNavigate, showSidebarTrigger = false }: { organization: string; onOrganizationChange: (value: string) => void; onSearchOpen: () => void; onNavigate?: () => void; showSidebarTrigger?: boolean }) {
  const ChevronDown = useIcon("chevron-down");
  const Home = useIcon("home");
  const List = useIcon("list");
  const Check = useIcon("check-square");
  const Bell = useIcon("bell");
  const Clock = useIcon("clock");
  const User = useIcon("user");
  const Layers = useIcon("doc-surfaces");
  const Chat = useIcon("message-circle");
  const More = useIcon("ellipsis");
  const primary: NavigationItem[] = [
    { value: operationsHomeHref, label: "首页", icon: Home },
    { value: clusterEnvironmentHref, label: "集群环境", icon: List },
    { value: inspectionReportHref, label: "巡检报告", icon: Check },
    { value: monitoringAlertHref, label: "监控告警", icon: Bell },
  ];
  const services: NavigationItem[] = [{ value: "/service-progress", label: "服务进度", icon: Clock }, { value: "/service-authorizations", label: "服务授权", icon: User }, { value: "/operation-history", label: "操作记录", icon: Layers }];
  const navItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isHome = item.value === operationsHomeHref;
    return <NavItem key={item.value} value={item.value}><NavItemTrigger className="px-1.5 text-body data-[active=true]:text-fg-brand" onClick={(event) => { if (isHome) onNavigate?.(); else event.preventDefault(); }} render={<Link href={item.value} />}><NavItemLeading className="group-data-[active=true]/nav-item:text-fg-brand"><Icon aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>;
  };
  return <><SidebarHeader className="space-y-1 px-2 py-1.5"><div className="flex min-w-0 items-center gap-1"><DropdownMenu><DropdownTrigger render={<SidebarIdentityRow as="button" leading={<SidebarIdentityAvatar className="rounded-lg" tone="brand">C</SidebarIdentityAvatar>} primary={organization} trailing={<ChevronDown className="size-4" />} />} /><DropdownContent align="center" alignOffset={20} className="!w-60">{["华东金融", "华南制造"].map((name) => <button className="flex h-control-lg w-full items-center rounded-lg px-2 text-left text-body hover:bg-hover" key={name} onClick={() => onOrganizationChange(name)} type="button">{name}</button>)}</DropdownContent></DropdownMenu>{showSidebarTrigger && <SidebarTrigger className="shrink-0" label="收起操作导航" size="xs" />}</div><OperationsSearchTrigger onOpen={onSearchOpen} /></SidebarHeader><SidebarContent contentClassName="gap-3 px-2 py-1"><SidebarGroup><SidebarGroupContent><NavMenu activeValue={monitoringAlertHref} aria-label="主要导航" keyboardNavigation="roving">{primary.map(navItem)}</NavMenu></SidebarGroupContent></SidebarGroup><SidebarGroup><SidebarGroupLabel>我的服务</SidebarGroupLabel><SidebarGroupContent><NavMenu activeValue={null} aria-label="我的服务" keyboardNavigation="roving">{services.map(navItem)}</NavMenu></SidebarGroupContent></SidebarGroup><SidebarGroup><div className="flex items-center justify-between px-1.5 pb-1"><SidebarGroupLabel className="p-0">诊断会话</SidebarGroupLabel><Button className="h-auto px-0 text-label text-fg-brand underline underline-offset-2" size="xs" type="button" variant="ghost">新建会话</Button></div><NavMenu activeValue={null} aria-label="诊断会话" keyboardNavigation="roving">{["使用 specialist-network - 新会话", "在使用率最高的那台设备上…"].map((session) => <NavItem key={session} value={session}><NavItemTrigger className="px-1.5" onClick={(event) => event.preventDefault()} render={<a href="#diagnostic-sessions" />}><NavItemLeading><Chat aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{session}</NavItemLabel></NavItemContent></NavItemTrigger><span className="me-1 w-8 shrink-0 whitespace-nowrap text-right text-label text-fg-subtle">2分钟</span></NavItem>)}</NavMenu></SidebarGroup></SidebarContent><SidebarFooter className="px-2 py-1.5"><SidebarIdentityRow description="wei.feng@zstack.io" leading={<SidebarIdentityAvatar className="rounded-lg">CF</SidebarIdentityAvatar>} primary="carlos" trailing={<More className="size-4" />} trailingPlacement="edge" /></SidebarFooter></>;
}

function SeverityFilter({ active, count, label, level, onClick }: { active: boolean; count: number; label: string; level?: "P0" | "P1" | "P2"; onClick: () => void }) {
  const stateDotClass = level === "P0" ? "bg-fg-danger" : level === "P1" ? "bg-fg-warning" : "bg-fg-info";
  return <Button aria-pressed={active} className="shrink-0" onClick={onClick} size="md" type="button" variant={active ? "neutral" : "tertiary"}><span className="inline-flex items-center gap-1.5">{level && <span aria-label={`优先级 ${level}`} className="grid size-5 shrink-0 place-items-center"><span className={cn("size-2 rounded-full", stateDotClass)} /></span>}<span>{label}</span>{label !== "全部" && <span className="rounded bg-surface-base px-1 text-label text-fg-muted">{count}</span>}</span></Button>;
}

function ResolutionRecords({ records }: { records: readonly MonitoringAlertResolutionRecord[] }) {
  return <div className="space-y-2"><p className="text-label font-medium text-fg-default">处置记录</p><div className="space-y-2">{records.map((record) => <div key={record.id} className="space-y-0.5 border-l-2 border-brand/30 pl-2"><p className="text-label text-fg-muted">{record.operator} 在 {record.occurredAt} 做了如下处置</p><p className="text-label text-fg-default">{record.detail}</p></div>)}</div></div>;
}

function MonitoringAlertResolutionAction({ alert, onResolve }: { alert: MonitoringAlertItem; onResolve?: (alert: MonitoringAlertItem) => void }) {
  const records = alert.resolutionRecords ?? [];
  const label = records.length ? `处置${records.length}次` : "处置";
  if (!records.length) return <Button type="button" size="sm" variant="tertiary" onClick={() => onResolve?.(alert)}>{label}</Button>;
  return <Popover trigger="hover" hoverDelay={120} closeDelay={160}><PopoverTrigger render={<Button type="button" size="sm" variant="tertiary" onClick={() => onResolve?.(alert)}>{label}</Button>} /><PopoverContent align="end" side="bottom" sideOffset={6} className="w-80 p-3"><ResolutionRecords records={records} /></PopoverContent></Popover>;
}

function MonitoringAlertActionSplitButton({ alert, onAnalyze, onMute, onResolve }: { alert: MonitoringAlertItem; onAnalyze?: (alert: MonitoringAlertItem) => void; onMute?: (alert: MonitoringAlertItem) => void; onResolve?: (alert: MonitoringAlertItem) => void }) {
  const ChevronDown = useIcon("chevron-down");
  return <ButtonGroup aria-label={`${alert.resource} 操作`}><Button type="button" size="sm" variant="tertiary" onClick={() => onAnalyze?.(alert)}>询问 AI</Button><ButtonGroupSeparator /><DropdownMenu><DropdownTrigger render={<Button type="button" size="sm" variant="tertiary" iconOnly aria-label={`${alert.resource} 更多操作`}><ChevronDown /></Button>} /><DropdownContent align="end"><MenuItem index={0} label="处置" onSelect={() => onResolve?.(alert)} /><MenuItem index={1} label="不再提醒" onSelect={() => onMute?.(alert)} /></DropdownContent></DropdownMenu></ButtonGroup>;
}

function MonitoringAlertRow({ alert, onAnalyze, onMute, onResolve }: { alert: MonitoringAlertItem; onAnalyze?: (alert: MonitoringAlertItem) => void; onMute?: (alert: MonitoringAlertItem) => void; onResolve?: (alert: MonitoringAlertItem) => void }) {
  const Monitor = useIcon("monitor");
  const severityColor = alert.severity === "critical" ? "red" : alert.severity === "warning" ? "orange" : "blue";
  return <div className="grid min-h-16 min-w-[1180px] grid-cols-[minmax(240px,1fr)_minmax(260px,1.2fr)_minmax(150px,.65fr)_minmax(200px,.85fr)_minmax(130px,.6fr)_max-content_max-content] items-center gap-x-3 border-b-[0.5px] border-border px-3 py-2 last:border-b-0"><div className="flex min-w-0 items-center gap-3"><Badge color={severityColor} size="sm" variant="strong">{alert.level}</Badge><span className="grid size-8 shrink-0 place-items-center rounded-md bg-info-surface/60 text-fg-default"><Monitor aria-hidden size={20} strokeWidth={1.5} /></span><div className="min-w-0"><p className="truncate text-body font-medium text-fg-default">{alert.resource}</p><p className="truncate text-label text-fg-muted">{alert.resourceType}</p></div></div><div className="min-w-0"><p className="truncate text-body font-medium text-fg-default">{alert.title}</p><p className="truncate text-label text-fg-muted">{alert.description}</p></div><p className="truncate text-body text-fg-default">{alert.location}</p><p className="truncate text-body text-fg-default">{alert.duration}{alert.state && <span className="ms-1 text-fg-muted">{alert.state}</span>}</p><p className="whitespace-nowrap text-body text-fg-default">{alert.related}</p><div className="justify-self-start"><MonitoringAlertResolutionAction alert={alert} onResolve={onResolve} /></div><div className="justify-self-start"><MonitoringAlertActionSplitButton alert={alert} onAnalyze={onAnalyze} onMute={onMute} onResolve={onResolve} /></div></div>;
}

/** A ZAIops monitoring alert workspace with shared operations navigation and severity filters. */
export function MonitoringAlertList({ alerts = defaultMonitoringAlertItems, className, onRefresh, onAnalyze, onMute, onResolve, ...props }: MonitoringAlertListProps) {
  const [organization, setOrganization] = useState("华东金融");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<MonitoringAlertSeverity | "all">("all");
  const [environment, setEnvironment] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const Search = useIcon("search");
  const Bell = useIcon("bell");
  const Monitor = useIcon("monitor");
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
  useEffect(() => setPage(0), [environment, pageSize, query, severity]);
  const visibleAlerts = useMemo(() => alerts.filter((alert) => (severity === "all" || alert.severity === severity) && (environment === "all" || alert.environment === environment) && `${alert.resource} ${alert.title} ${alert.description} ${alert.location}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [alerts, environment, query, severity]);
  const pagedAlerts = visibleAlerts.slice(page * pageSize, (page + 1) * pageSize);
  const environments = [...new Set(alerts.map((alert) => alert.environment))];
  const counts = { critical: alerts.filter((alert) => alert.severity === "critical").length, warning: alerts.filter((alert) => alert.severity === "warning").length, general: alerts.filter((alert) => alert.severity === "general").length };
  const navigationProps = { organization, onOrganizationChange: setOrganization };
  return <SidebarProvider breakpointBehavior="collapse"><div className={cn("flex h-full min-h-[42rem] min-w-0 w-full overflow-hidden bg-surface-base", className)} {...props}><Sidebar ariaLabel="操作导航" className="relative h-full" collapsible="offcanvas" mobileWidth="min(260px, calc(100vw - 24px))" width="260px"><OperationsNavigation {...navigationProps} onSearchOpen={() => setSearchOpen(true)} showSidebarTrigger /></Sidebar><PageLayout className="h-full min-w-0 flex-1"><PageHeader className="h-control-sm py-0 max-sm:flex-row"><div className="flex h-full min-w-0 items-center gap-2"><SidebarFloatingTrigger className="shrink-0" collapsedBehavior="offcanvas" contentClassName="h-[min(36rem,calc(100svh-4rem))] w-[260px] max-w-[calc(100vw-12px)] rounded-xl p-0" label="展开操作导航" menuLabel="打开操作导航菜单" renderContent={({ close }) => <OperationsNavigation {...navigationProps} onNavigate={close} onSearchOpen={() => { close(); setSearchOpen(true); }} />} size="xs" surfaceClassName="border-[0.5px] border-border-subtle" surfaceShadow="floating-drop" /><PageHeaderContent className="h-full" icon={Bell}><nav aria-label="当前位置" className="text-body font-medium text-fg-default">监控告警</nav></PageHeaderContent></div></PageHeader><PageContent><PageBody className="max-w-[101.25rem] p-3"><section className="overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-floating"><div className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-border px-3 py-2"><div className="flex items-center gap-1"><SeverityFilter active={severity === "all"} count={alerts.length} label="全部" onClick={() => setSeverity("all")} /><SeverityFilter active={severity === "critical"} count={counts.critical} label="严重" level="P0" onClick={() => setSeverity("critical")} /><SeverityFilter active={severity === "warning"} count={counts.warning} label="告警" level="P1" onClick={() => setSeverity("warning")} /><SeverityFilter active={severity === "general"} count={counts.general} label="一般" level="P2" onClick={() => setSeverity("general")} /></div><label className="relative min-w-52 flex-1 lg:max-w-[28rem]"><span className="sr-only">搜索监控告警</span><Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" /><Input className="pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="搜索" value={query} /></label><DropdownMenu><DropdownTrigger render={<Button className="shrink-0 whitespace-nowrap" leadingIcon={Monitor} size="md" type="button" variant="tertiary">{environment === "all" ? "全部环境" : environment}</Button>} /><DropdownContent><MenuItem checked={environment === "all"} index={0} label="全部环境" onSelect={() => setEnvironment("all")} />{environments.map((value, index) => <MenuItem checked={environment === value} index={index + 1} key={value} label={value} onSelect={() => setEnvironment(value)} />)}</DropdownContent></DropdownMenu><Button className="ms-auto" onClick={onRefresh} size="md" type="button" variant="tertiary">刷新</Button></div><div aria-label="监控告警列表" className="overflow-x-auto">{pagedAlerts.map((alert) => <MonitoringAlertRow alert={alert} key={alert.id} onAnalyze={onAnalyze} onMute={onMute} onResolve={onResolve} />)}{!visibleAlerts.length && <p className="px-3 py-8 text-center text-body text-fg-muted">未找到符合条件的监控告警。</p>}</div><ListPagination onPageChange={setPage} onPageSizeChange={(nextPageSize) => { setPage(0); setPageSize(nextPageSize); }} page={page} pageSize={pageSize} total={visibleAlerts.length} /></section></PageBody></PageContent></PageLayout></div><Dialog onOpenChange={setSearchOpen} open={searchOpen}><DialogContent size="sm"><DialogHeader><DialogTitle>搜索 ZAIops</DialogTitle><DialogDescription>搜索会话、集群环境、巡检报告和监控告警。</DialogDescription></DialogHeader><div className="rounded-lg border border-border-subtle px-3 py-2 text-body text-fg-subtle">输入关键词开始搜索…</div></DialogContent></Dialog></SidebarProvider>;
}
