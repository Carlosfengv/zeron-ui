"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { MetricCard } from "@zeron/ui/metric-card";
import { MenuItem } from "@zeron/ui/menu-item";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageHeader, PageHeaderContent, PageLayout } from "@zeron/ui/page-layout";
import { Sidebar, SidebarContent, SidebarFooter, SidebarFloatingTrigger, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarProvider, SidebarTrigger } from "@zeron/ui/sidebar";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";

type NavigationItem = { value: string; label: string; icon: IconComponent };
type Environment = { name: string; description: string; plan: string };

const environments: readonly Environment[] = [
  { name: "金融核心环境", description: "生产 · 核心支付业务", plan: "金融生产巡检v3.2" },
  { name: "金融核心环境2", description: "生产 · 订单与供应链", plan: "生产标准巡检v3.2" },
  { name: "金融核心环境3", description: "生产 · 订单与供应链", plan: "灾备巡检v2.1" },
];
const operationsHomeHref = "/block-demo/zaiops-operations-01";
const subscribeToPlatform = () => () => undefined;
const getServerPlatformShortcut = () => null;
const getPlatformShortcut = () => /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

function PlatformShortcutHint() {
  const label = useSyncExternalStore(subscribeToPlatform, getPlatformShortcut, getServerPlatformShortcut);
  if (!label) return <KbdGroup aria-hidden="true" className="invisible ms-auto min-w-13 justify-end"><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>;
  return <KbdGroup aria-label={label} className="ms-auto min-w-13 justify-end">{label.split(" ").map((part) => <Kbd key={part}>{part}</Kbd>)}</KbdGroup>;
}

function OperationsSearchTrigger({ onOpen }: { onOpen: () => void }) {
  const Search = useIcon("search");
  return <Button aria-keyshortcuts="Meta+K Control+K" className="h-control-lg w-full justify-start px-1.5" onClick={onOpen} size="lg" type="button" variant="ghost"><span className="flex w-full min-w-0 items-center gap-1"><Search aria-hidden className="size-4 shrink-0" strokeWidth={1.5} /><span>搜索</span><PlatformShortcutHint /></span></Button>;
}

interface OperationsNavigationPanelProps {
  activeValue: string | null;
  organization: string;
  onOrganizationChange: (organization: string) => void;
  onSearchOpen: () => void;
  onNavigate?: () => void;
  showSidebarTrigger?: boolean;
}

function OperationsNavigationPanel({ activeValue, organization, onOrganizationChange, onSearchOpen, onNavigate, showSidebarTrigger = false }: OperationsNavigationPanelProps) {
  const ChevronDown = useIcon("chevron-down");
  const Home = useIcon("home");
  const List = useIcon("list");
  const Check = useIcon("check-square");
  const Clock = useIcon("clock");
  const User = useIcon("user");
  const Layers = useIcon("doc-surfaces");
  const Chat = useIcon("message-circle");
  const More = useIcon("ellipsis");
  const primary: NavigationItem[] = [{ value: operationsHomeHref, label: "首页", icon: Home }, { value: "/clusters", label: "集群环境", icon: List }, { value: "/reports", label: "巡检报告", icon: Check }];
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
      <OperationsSearchTrigger onOpen={onSearchOpen} />
    </SidebarHeader>
    <SidebarContent contentClassName="gap-3 px-2 py-1">
      <SidebarGroup><SidebarGroupContent><NavMenu activeValue={activeValue} aria-label="主要导航" keyboardNavigation="roving">{primary.map(renderItem)}</NavMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup><SidebarGroupLabel>我的服务</SidebarGroupLabel><SidebarGroupContent><NavMenu activeValue={activeValue} aria-label="我的服务" keyboardNavigation="roving">{services.map(renderItem)}</NavMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup>
        <div className="flex items-center justify-between px-1.5 pb-1"><SidebarGroupLabel className="p-0">诊断会话</SidebarGroupLabel><Button className="h-auto px-0 text-label text-fg-brand underline underline-offset-2" size="xs" type="button" variant="ghost">新建会话</Button></div>
        <NavMenu activeValue={null} aria-label="诊断会话" keyboardNavigation="roving">{["使用 specialist-network - 新会话", "在使用率最高的那台设备上…"].map((session) => <NavItem key={session} value={session}><NavItemTrigger className="px-1.5" onClick={(event) => event.preventDefault()} render={<a href="#diagnostic-sessions" />}><NavItemLeading><Chat aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{session}</NavItemLabel></NavItemContent></NavItemTrigger><span className="relative me-1 flex h-control-md w-8 shrink-0 items-center justify-end"><span className="whitespace-nowrap text-label text-fg-subtle transition-opacity group-hover/nav-item:opacity-0 group-focus-within/nav-item:opacity-0">2分钟</span><DropdownMenu><DropdownTrigger render={<Button aria-label={`${session} 更多操作`} className="absolute right-0 opacity-0 pointer-events-none group-hover/nav-item:pointer-events-auto group-hover/nav-item:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100" iconOnly size="xs" type="button" variant="ghost"><More aria-hidden size={16} strokeWidth={1.5} /></Button>} /><DropdownContent align="end" className="w-36"><MenuItem index={0} label="重命名会话" onSelect={() => undefined} /><MenuItem index={1} label="删除会话" onSelect={() => undefined} /></DropdownContent></DropdownMenu></span></NavItem>)}</NavMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter className="px-2 py-1.5"><SidebarIdentityRow description="wei.feng@zstack.io" leading={<SidebarIdentityAvatar className="rounded-lg">CF</SidebarIdentityAvatar>} primary="carlos" trailing={<More className="size-4" />} trailingPlacement="edge" /></SidebarFooter>
  </>;
}

function HealthSummary() {
  return <MetricCard className="border-info-border bg-info-surface [&_[data-slot=metric-card-value-row]>span:first-child]:text-fg-brand" footer="整体健康度 82 分" label="健康状态" value="一切正常" />;
}

function EnvironmentIcon() {
  const Layers = useIcon("doc-surfaces");
  return <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-info-surface text-fg-brand"><Layers size={18} strokeWidth={1.5} /></span>;
}

function OperationsDashboard({ title, description, children }: Pick<ZaiopsOperationsProps, "title" | "description" | "children">) {
  const Check = useIcon("check");
  const Mail = useIcon("mail");
  const Clock = useIcon("clock");
  const User = useIcon("user");
  return <PageBody className="p-3"><div className="space-y-3">
    <header className="px-0.5 py-3"><h1 className="text-heading font-semibold text-fg-default">{title}</h1><p className="mt-1 text-body text-fg-muted">{description}</p></header>
    <section aria-label="环境概览" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><HealthSummary /><MetricCard footer="1 项正在处理" label="开放风险" value="0" /><MetricCard footer="全部环境已更新" label="数据新鲜度" value="12:32" /><MetricCard footer="方案 P-77 v1" label="待客户决定" value="0" /><MetricCard footer="Zstack 原厂 ｜ 华东渠道" label="服务方" value="2" /></section>
    <section aria-labelledby="manager-title" className="rounded-xl border-[0.5px] border-border bg-surface-raised px-3 py-3"><h2 className="text-body text-fg-muted" id="manager-title">您的专属客户经理:</h2><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2"><div className="flex items-center gap-2"><SidebarIdentityAvatar className="rounded-lg" tone="brand">王</SidebarIdentityAvatar><span className="text-body font-medium text-fg-default">王敏</span><span className="text-body text-fg-muted">Zstack 售后工程师</span></div><span className="flex items-center gap-1.5 text-body text-fg-default"><User aria-hidden size={18} strokeWidth={1.5} />131 1111 1111 <span className="text-fg-muted">(09:00~16:00)</span></span><span className="flex items-center gap-1.5 text-body text-fg-default"><Mail aria-hidden size={18} strokeWidth={1.5} />username@example.com</span></div></section>
    <section aria-labelledby="environments-title" className="rounded-xl border-[0.5px] border-border bg-surface-raised p-1"><div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5"><div className="flex flex-wrap items-center gap-3"><h2 className="text-body font-medium text-fg-default" id="environments-title">所有环境健康，未发现风险</h2><span aria-label="当前供 3 个环境" className="flex items-center gap-1"><span className="size-4 rounded bg-brand" /><span className="size-4 rounded bg-brand" /><span className="size-4 rounded bg-brand" /><span className="ml-1 text-label text-fg-muted">当前供 3 个环境</span></span></div><span className="flex items-center gap-1 text-label text-fg-subtle"><Clock aria-hidden size={14} strokeWidth={1.5} />数据更新于 3 分钟前</span></div>
      <div className="overflow-x-auto rounded-lg border-[0.5px] border-border bg-surface-floating"><Table className="min-w-[900px]"><TableHeader><TableRow><TableHead scope="col">环境名称</TableHead><TableHead scope="col">状态</TableHead><TableHead scope="col">巡检方案</TableHead><TableHead scope="col">健康结论</TableHead><TableHead scope="col">P0 风险</TableHead><TableHead scope="col">P1 风险</TableHead><TableHead scope="col">数据状态</TableHead></TableRow></TableHeader><TableBody>{environments.map((environment, index) => <TableRow index={index} key={environment.name}><TableCell className="min-w-64"><div className="flex items-center gap-2"><EnvironmentIcon /><div className="min-w-0"><p className="truncate font-medium text-fg-default">{environment.name}</p><p className="truncate text-label text-fg-subtle">{environment.description}</p></div></div></TableCell><TableCell><Badge color="blue" size="sm" variant="dot">已连接</Badge></TableCell><TableCell className="whitespace-nowrap">{environment.plan}</TableCell><TableCell><span className="flex items-center gap-1.5 whitespace-nowrap"><Badge color="blue" size="sm" variant="strong">86</Badge><span className="text-fg-default">健康</span></span></TableCell><TableCell className="tabular-nums text-fg-danger">0</TableCell><TableCell className="tabular-nums text-fg-danger">0</TableCell><TableCell className="whitespace-nowrap">3 分钟前</TableCell></TableRow>)}</TableBody></Table></div>
    </section>
    <section aria-labelledby="impact-title" className="rounded-xl border-[0.5px] border-border bg-surface-raised p-1"><div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5"><h2 className="text-body font-medium text-fg-default" id="impact-title">业务影响范围</h2><span className="text-label text-fg-subtle">数据更新于 3 分钟前</span></div><div className="flex items-center gap-1.5 rounded-lg border-[0.5px] border-border bg-surface-floating px-3 py-3 text-label text-fg-muted"><span className="flex size-4 items-center justify-center rounded-full bg-brand/15 text-fg-brand"><Check aria-hidden size={12} strokeWidth={2} /></span>没有影响到业务</div></section>
    {children && <div>{children}</div>}
  </div></PageBody>;
}

export interface ZaiopsOperationsProps { title?: string; description?: string; children?: ReactNode; className?: string; }

/** A responsive ZAIops operations homepage composed entirely from Zeron UI primitives. */
export function ZaiopsOperations({ title = "👋 中午好，您的环境一切正常,请继续保持", description = "XX 分钟前对刚完成对 XXX 环境的巡检,一切正常", children, className }: ZaiopsOperationsProps) {
  const [organization, setOrganization] = useState("华东金融");
  const [searchOpen, setSearchOpen] = useState(false);
  const Home = useIcon("home");
  const activeValue = operationsHomeHref;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { const target = event.target as HTMLElement | null; if (event.defaultPrevented || event.isComposing || event.repeat || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k" || target?.closest("input, textarea, select, [contenteditable], [role=textbox]")) return; event.preventDefault(); setSearchOpen(true); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const navigationPanelProps = { activeValue, organization, onOrganizationChange: setOrganization };
  return <SidebarProvider breakpointBehavior="collapse"><div className={cn("flex h-full min-h-0 w-full min-w-0 flex-1 self-stretch overflow-hidden bg-surface-base", className)}>
    <Sidebar ariaLabel="操作导航" className="relative h-full" collapsible="offcanvas" mobileWidth="min(260px, calc(100vw - 24px))" width="260px"><OperationsNavigationPanel {...navigationPanelProps} onSearchOpen={() => setSearchOpen(true)} showSidebarTrigger /></Sidebar>
    <PageLayout className="h-full min-w-0 flex-1"><PageHeader className="h-control-sm py-0 max-sm:flex-row"><div className="flex h-full min-w-0 items-center gap-2"><SidebarFloatingTrigger className="shrink-0" collapsedBehavior="offcanvas" contentClassName="h-[min(36rem,calc(100svh-4rem))] w-[260px] max-w-[calc(100vw-12px)] rounded-xl p-0" label="展开操作导航" menuLabel="打开操作导航菜单" renderContent={({ close }) => <OperationsNavigationPanel {...navigationPanelProps} onNavigate={close} onSearchOpen={() => { close(); setSearchOpen(true); }} />} size="xs" surfaceClassName="border-[0.5px] border-border-subtle" surfaceShadow="floating-drop" /><PageHeaderContent className="h-full" icon={Home}><nav aria-label="当前位置" className="text-body font-medium text-fg-default">首页</nav></PageHeaderContent></div></PageHeader><PageContent><OperationsDashboard children={children} description={description} title={title} /></PageContent></PageLayout>
  </div><Dialog onOpenChange={setSearchOpen} open={searchOpen}><DialogContent size="sm"><DialogHeader><DialogTitle>搜索 ZAIops</DialogTitle><DialogDescription>搜索会话、集群环境、巡检报告和服务记录。</DialogDescription></DialogHeader><div className="rounded-lg border border-border-subtle px-3 py-2 text-body text-fg-subtle">输入关键词开始搜索…</div></DialogContent></Dialog></SidebarProvider>;
}
