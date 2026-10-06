"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from "react";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { MenuItem } from "@zeron/ui/menu-item";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageHeader, PageHeaderContent, PageLayout } from "@zeron/ui/page-layout";
import { Sidebar, SidebarContent, SidebarFooter, SidebarFloatingTrigger, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarProvider, SidebarTrigger, useSidebar } from "@zeron/ui/sidebar";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
import { useIcon, type IconComponent, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { UserAccount, type UserAccountProps } from "../user-account-01";

export interface OperationsNavigationItem {
  value: string;
  label: string;
  iconName: IconName;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
}
export interface OperationsOrganization { id: string; name: string; avatar?: ReactNode }
export interface OperationsSession { id: string; name: string; updatedAt?: string; href?: string }
export interface OperationsWorkspaceOptions {
  organizations?: readonly OperationsOrganization[];
  organizationId?: string;
  defaultOrganizationId?: string;
  onOrganizationChange?: (id: string) => void;
  navigation?: readonly OperationsNavigationItem[];
  serviceNavigation?: readonly OperationsNavigationItem[];
  onNavigationSelect?: (value: string) => void;
  renderLink?: (props: ComponentPropsWithoutRef<"a"> & { href: string }) => ReactElement;
  sessions?: readonly OperationsSession[];
  onSessionSelect?: (session: OperationsSession) => void;
  onCreateSession?: () => void;
  onSessionRename?: (session: OperationsSession) => void;
  onSessionDelete?: (session: OperationsSession) => void;
  account?: UserAccountProps | null;
  searchContent?: ReactNode;
  searchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
}
export interface OperationsWorkspaceShellProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  title: ReactNode;
  icon?: IconComponent;
  activeNavigation: string;
  workspace?: OperationsWorkspaceOptions;
}

export const defaultOperationsOrganizations: readonly OperationsOrganization[] = [
  { id: "华东金融", name: "华东金融", avatar: "C" }, { id: "华南制造", name: "华南制造", avatar: "C" },
];
// Preview destinations are examples; applications supply their own routes/callbacks.
export const defaultOperationsNavigation: readonly OperationsNavigationItem[] = [
  { value: "home", label: "首页", iconName: "home", href: "/block-demo/zaiops-operations-01" },
  { value: "clusters", label: "集群环境", iconName: "list", href: "/block-demo/cluster-environment-list-01" },
  { value: "reports", label: "巡检报告", iconName: "check-square", href: "/block-demo/inspection-report-list-01" },
  { value: "alerts", label: "监控告警", iconName: "bell", href: "/block-demo/monitoring-alert-list-01" },
];
export const defaultOperationsServiceNavigation: readonly OperationsNavigationItem[] = [
  { value: "service-progress", label: "服务进度", iconName: "clock" },
  { value: "service-authorizations", label: "服务授权", iconName: "user" },
  { value: "operation-history", label: "操作记录", iconName: "doc-surfaces" },
];
const defaultSessions: readonly OperationsSession[] = [
  { id: "network", name: "使用 specialist-network - 新会话", updatedAt: "2分钟" },
  { id: "usage", name: "在使用率最高的那台设备上…", updatedAt: "2分钟" },
];
const subscribeToPlatform = () => () => undefined;
const platformShortcut = () => /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
const serverShortcut = () => null;

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const Search = useIcon("search");
  const shortcut = useSyncExternalStore(subscribeToPlatform, platformShortcut, serverShortcut);
  return <Button aria-keyshortcuts="Meta+K Control+K" className="w-full justify-start" leadingIcon={Search} onClick={onOpen} size="lg" type="button" variant="ghost">
    <span className="flex w-full min-w-0 items-center gap-1"><span>搜索</span><KbdGroup aria-hidden={!shortcut || undefined} aria-label={shortcut ?? undefined} className={cn("ms-auto min-w-13 justify-end", !shortcut && "invisible")}>{(shortcut ?? "⌘ K").split(" ").map(part => <Kbd key={part}>{part}</Kbd>)}</KbdGroup></span>
  </Button>;
}

function NavigationLink({ item, options, onNavigate }: { item: OperationsNavigationItem; options: OperationsWorkspaceOptions; onNavigate?: () => void }) {
  const Icon = useIcon(item.iconName);
  const unavailable = item.disabled || (!item.href && !item.onSelect && !options.onNavigationSelect);
  return <NavItem value={item.value}><NavItemTrigger className="px-1.5 text-body data-[active=true]:text-fg-brand" aria-disabled={unavailable || undefined}
    onClick={event => {
      if (unavailable || !item.href || item.onSelect || options.onNavigationSelect) event.preventDefault();
      if (unavailable) return;
      item.onSelect?.(); options.onNavigationSelect?.(item.value); onNavigate?.();
    }} render={options.renderLink ? options.renderLink({ href: item.href ?? "#" }) : <a href={item.href ?? "#"} />}>
    <NavItemLeading className="group-data-[active=true]/nav-item:text-fg-brand"><Icon aria-hidden /></NavItemLeading><NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent>
  </NavItemTrigger></NavItem>;
}

function NavigationPanel({ options, organization, onOrganizationChange, activeNavigation, onSearchOpen, onNavigate, showSidebarTrigger = false }: {
  options: OperationsWorkspaceOptions; organization: OperationsOrganization | undefined; onOrganizationChange: (id: string) => void;
  activeNavigation: string; onSearchOpen: () => void; onNavigate?: () => void; showSidebarTrigger?: boolean;
}) {
  const ChevronDown = useIcon("chevron-down"); const Chat = useIcon("message-circle"); const More = useIcon("ellipsis");
  const organizations = options.organizations ?? defaultOperationsOrganizations;
  const selectedIndex = organizations.findIndex(item => item.id === organization?.id);
  const navigation = options.navigation ?? defaultOperationsNavigation;
  const services = options.serviceNavigation ?? defaultOperationsServiceNavigation;
  return <>
    <SidebarHeader className="space-y-1 px-2 py-1.5"><div className="flex min-w-0 items-center gap-1">
      <DropdownMenu><DropdownTrigger render={<SidebarIdentityRow as="button" leading={<SidebarIdentityAvatar className="rounded-lg" tone="brand">{organization?.avatar ?? "C"}</SidebarIdentityAvatar>} primary={organization?.name ?? "暂无组织"} trailing={<ChevronDown />} />} />
        <DropdownContent align="center" className="w-60" checkedIndex={selectedIndex >= 0 ? selectedIndex : undefined}>{organizations.map((item, index) => <MenuItem checked={organization?.id === item.id} index={index} key={item.id} label={item.name} onSelect={() => onOrganizationChange(item.id)} />)}</DropdownContent>
      </DropdownMenu>{showSidebarTrigger && <SidebarTrigger className="shrink-0" label="收起操作导航" size="xs" />}
    </div><SearchTrigger onOpen={onSearchOpen} /></SidebarHeader>
    <SidebarContent contentClassName="gap-3 px-2 py-1">
      <SidebarGroup><SidebarGroupContent><NavMenu activeValue={activeNavigation} aria-label="主要导航" keyboardNavigation="roving">{navigation.map(item => <NavigationLink key={item.value} item={item} options={options} onNavigate={onNavigate} />)}</NavMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup><SidebarGroupLabel>我的服务</SidebarGroupLabel><SidebarGroupContent><NavMenu activeValue={activeNavigation} aria-label="我的服务" keyboardNavigation="roving">{services.map(item => <NavigationLink key={item.value} item={item} options={options} onNavigate={onNavigate} />)}</NavMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup><div className="flex items-center justify-between px-1.5 pb-1"><SidebarGroupLabel className="p-0">诊断会话</SidebarGroupLabel><Button disabled={!options.onCreateSession} size="xs" type="button" variant="link" onClick={() => { onNavigate?.(); options.onCreateSession?.(); }}>新建会话</Button></div>
        <NavMenu activeValue={null} aria-label="诊断会话" keyboardNavigation="roving">{(options.sessions ?? defaultSessions).map(session => <NavItem key={session.id} value={session.id}>
          <NavItemTrigger className="px-1.5" aria-disabled={!session.href && !options.onSessionSelect || undefined} render={options.renderLink ? options.renderLink({ href: session.href ?? "#diagnostic-sessions" }) : <a href={session.href ?? "#diagnostic-sessions"} />} onClick={event => {
            if (!session.href || options.onSessionSelect) event.preventDefault();
            if (!session.href && !options.onSessionSelect) return;
            options.onSessionSelect?.(session); onNavigate?.();
          }}><NavItemLeading><Chat aria-hidden /></NavItemLeading><NavItemContent><NavItemLabel>{session.name}</NavItemLabel></NavItemContent></NavItemTrigger>
          <span className="relative me-1 flex h-control-md w-8 shrink-0 items-center justify-end"><span className="whitespace-nowrap text-label text-fg-subtle group-hover/nav-item:opacity-0 group-focus-within/nav-item:opacity-0">{session.updatedAt}</span>
            {(options.onSessionRename || options.onSessionDelete) && <DropdownMenu><DropdownTrigger render={<Button aria-label={`${session.name} 更多操作`} className="absolute right-0 opacity-0 group-hover/nav-item:opacity-100 focus-visible:opacity-100" iconOnly size="xs" type="button" variant="ghost"><More aria-hidden /></Button>} /><DropdownContent align="end" className="w-36">
              {options.onSessionRename && <MenuItem index={0} label="重命名会话" onSelect={() => options.onSessionRename?.(session)} />}{options.onSessionDelete && <MenuItem index={options.onSessionRename ? 1 : 0} label="删除会话" onSelect={() => options.onSessionDelete?.(session)} />}
            </DropdownContent></DropdownMenu>}
          </span>
        </NavItem>)}</NavMenu>
      </SidebarGroup>
    </SidebarContent>
    {options.account !== null && <SidebarFooter className="px-2 py-1.5">{options.account ? <UserAccount {...options.account} onOpenSettings={options.account.onOpenSettings && (() => { onNavigate?.(); options.account?.onOpenSettings?.(); })} notifications={options.account.notifications && { ...options.account.notifications, onOpen: () => { onNavigate?.(); options.account?.notifications?.onOpen(); } }} /> : <SidebarIdentityRow description="wei.feng@zstack.io" leading={<SidebarIdentityAvatar className="rounded-lg">CF</SidebarIdentityAvatar>} primary="carlos" />}</SidebarFooter>}
  </>;
}

function WorkspaceSidebar({ children, triggerRef }: { children: ReactNode; triggerRef: { current: HTMLButtonElement | null } }) {
  const { state } = useSidebar();
  const ref = useRef<HTMLDivElement>(null);
  const focusedInside = useRef(false);
  const previous = useRef(state);
  useEffect(() => {
    if (previous.current === "expanded" && state === "collapsed" && focusedInside.current) triggerRef.current?.focus();
    previous.current = state;
  }, [state, triggerRef]);
  return <Sidebar ref={ref} aria-hidden={state === "collapsed" || undefined} inert={state === "collapsed" || undefined}
    onFocusCapture={() => { focusedInside.current = true; }} onBlurCapture={event => { if (event.relatedTarget instanceof Node && !ref.current?.contains(event.relatedTarget)) focusedInside.current = false; }}
    ariaLabel="操作导航" className="relative h-full" collapsible="offcanvas" mobileWidth="min(260px, calc(100vw - 24px))" width="260px">{children}</Sidebar>;
}

/** Domain composition only; routing and search results belong to the application. */
export function OperationsWorkspaceShell({ children, title, icon, activeNavigation, workspace = {}, className, ...props }: OperationsWorkspaceShellProps) {
  const root = useRef<HTMLDivElement>(null);
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const [localOrganization, setLocalOrganization] = useState(workspace.defaultOrganizationId ?? defaultOperationsOrganizations[0].id);
  const [localSearchOpen, setLocalSearchOpen] = useState(false);
  const organizations = workspace.organizations ?? defaultOperationsOrganizations;
  const organizationId = workspace.organizationId ?? localOrganization;
  const organization = organizations.find(item => item.id === organizationId) ?? (workspace.organizationId === undefined ? organizations[0] : undefined);
  const searchOpen = workspace.searchOpen ?? localSearchOpen;
  const changeSearch = (open: boolean) => { if (workspace.searchOpen === undefined) setLocalSearchOpen(open); workspace.onSearchOpenChange?.(open); };
  const openSearchRef = useRef(changeSearch);
  useEffect(() => { openSearchRef.current = changeSearch; });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const owner = target?.closest('[data-slot="operations-workspace-shell"]');
      if (event.defaultPrevented || event.isComposing || event.repeat || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k" || target?.closest("input, textarea, select, [contenteditable], [role=textbox]") || (owner && owner !== root.current) || root.current?.checkVisibility?.() === false) return;
      event.preventDefault(); openSearchRef.current(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const panel = { options: workspace, organization, activeNavigation, onOrganizationChange: (id: string) => { if (workspace.organizationId === undefined) setLocalOrganization(id); workspace.onOrganizationChange?.(id); } };
  return <SidebarProvider breakpointBehavior="collapse"><div {...props} ref={root} data-slot="operations-workspace-shell" className={cn("flex h-full min-h-0 w-full min-w-0 flex-1 self-stretch overflow-hidden bg-surface-base", className)}>
    <WorkspaceSidebar triggerRef={navigationTrigger}><NavigationPanel {...panel} onSearchOpen={() => changeSearch(true)} showSidebarTrigger /></WorkspaceSidebar>
    <PageLayout className="h-full min-w-0 flex-1"><PageHeader className="h-control-sm py-0 max-sm:flex-row"><div className="flex h-full min-w-0 items-center gap-2">
      <SidebarFloatingTrigger ref={navigationTrigger} className="shrink-0" collapsedBehavior="offcanvas" contentClassName="h-[min(36rem,calc(100svh-4rem))] w-[260px] max-w-[calc(100vw-12px)] rounded-xl p-0" label="展开操作导航" menuLabel="打开操作导航菜单" renderContent={({ close }) => <NavigationPanel {...panel} onNavigate={close} onSearchOpen={() => { close(); changeSearch(true); }} />} size="xs" surfaceClassName="border-hairline border-border-subtle" surfaceShadow="floating-drop" />
      <PageHeaderContent className="h-full" icon={icon}><nav aria-label="当前位置" className="min-w-0 truncate text-body font-medium text-fg-default">{title}</nav></PageHeaderContent>
    </div></PageHeader>{children}</PageLayout>
  </div><Dialog open={searchOpen} onOpenChange={changeSearch}><DialogContent size="sm"><DialogHeader><DialogTitle>搜索 ZAIops</DialogTitle><DialogDescription>搜索会话、集群环境、巡检报告和服务记录。</DialogDescription></DialogHeader>{workspace.searchContent ?? <div className="rounded-lg border border-border-subtle px-3 py-2 text-body text-fg-subtle">输入关键词开始搜索…</div>}</DialogContent></Dialog></SidebarProvider>;
}
