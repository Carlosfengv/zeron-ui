"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { MenuItem } from "@/components/ui/menu-item";
import {
  NavItem,
  NavItemContent,
  NavItemLabel,
  NavItemLeading,
  NavItemTrigger,
} from "@/components/ui/nav-item";
import { NavMenu } from "@/components/ui/nav-menu";
import {
  SidebarIdentityAvatar,
  SidebarIdentityRow,
} from "@/components/ui/sidebar-identity-row";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarFloatingTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  PageBody,
  PageContent,
  PageHeader,
  PageHeaderContent,
  PageLayout,
  PageTitle,
} from "@/components/ui/page-layout";
import { Skeleton } from "@/components/ui/data-grid/data-grid-primitives";
import { useIcon, type IconComponent } from "@/lib/icon-context";

type Organization = {
  id: string;
  name: string;
  monogram: string;
};

type NavigationItem = {
  value: string;
  label: string;
  icon: IconComponent;
};

type Session = {
  id: string;
  title: string;
  updatedAt: string;
};

type SessionState = "loading" | "ready" | "empty" | "error";

type AccountAction = {
  id: string;
  label: string;
  onSelect: () => void;
};

const organizations: Organization[] = [
  { id: "zaiops", name: "ZAIops 生产组织", monogram: "Z" },
  { id: "platform", name: "平台工程实验室", monogram: "P" },
];

function PlatformShortcutHint() {
  const [label, setLabel] = useState("Ctrl/⌘ K");

  useEffect(() => {
    setLabel(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K");
  }, []);

  const parts = label.split(" ");
  return (
    <KbdGroup className="ms-auto min-w-13 justify-end" aria-label={label}>
      {parts.map((part) => <Kbd key={part}>{part}</Kbd>)}
    </KbdGroup>
  );
}

function ResponsiveSidebarTrigger() {
  const { isMobile } = useSidebar();
  return <SidebarTrigger label={isMobile ? "关闭导航" : "收起侧边栏"} />;
}

function WorkspaceSwitcher({
  value,
  onChange,
  showSidebarTrigger = true,
}: {
  value: string;
  onChange: (id: string) => void;
  showSidebarTrigger?: boolean;
}) {
  const ChevronDown = useIcon("chevron-down");
  const current = organizations.find((organization) => organization.id === value) ?? organizations[0];

  return (
    <div className="flex min-w-0 items-center gap-1">
      <DropdownMenu>
        <DropdownTrigger
          render={
            <SidebarIdentityRow
              as="button"
              primary={current.name}
              leading={<SidebarIdentityAvatar tone="brand">{current.monogram}</SidebarIdentityAvatar>}
              trailing={<ChevronDown className="size-4" />}
            />
          }
        />
        <DropdownContent
          align="center"
          alignOffset={20}
          checkedIndex={organizations.findIndex((organization) => organization.id === value)}
          className="!w-60 !min-w-60 !max-w-60"
        >
          {organizations.map((organization, index) => (
            <MenuItem
              key={organization.id}
              index={index}
              label={organization.name}
              checked={organization.id === value}
              onSelect={() => onChange(organization.id)}
            />
          ))}
        </DropdownContent>
      </DropdownMenu>
      {showSidebarTrigger && <ResponsiveSidebarTrigger />}
    </div>
  );
}

function SidebarSearchTrigger({ onOpen }: { onOpen: () => void }) {
  const Search = useIcon("search");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k" ||
        target?.closest("input, textarea, select, [contenteditable], [role=textbox]")
      ) return;
      event.preventDefault();
      onOpen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      className="h-control-md w-full justify-start px-1.5 max-xl:min-h-11"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={onOpen}
    >
      <span className="flex w-full min-w-0 items-center gap-1">
        <Search className="size-5 shrink-0" />
        <span>搜索</span>
        <PlatformShortcutHint />
      </span>
    </Button>
  );
}

function NavigationItemView({
  item,
  onSelect,
  onNavigate,
}: {
  item: NavigationItem;
  onSelect: (value: string) => void;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavItem value={item.value}>
      <NavItemTrigger
        render={<a href={item.value} />}
        className="h-control-md gap-1 px-1.5 text-body data-[active=true]:text-fg-brand max-xl:min-h-11"
        onClick={() => {
          onSelect(item.value);
          onNavigate?.();
        }}
      >
        <NavItemLeading className="group-data-[active=true]/nav-item:text-fg-brand">
          <Icon size={16} strokeWidth={1.5} />
        </NavItemLeading>
        <NavItemContent>
          <NavItemLabel>{item.label}</NavItemLabel>
        </NavItemContent>
      </NavItemTrigger>
    </NavItem>
  );
}

function RecentSessionItem({ session }: { session: Session }) {
  const Message = useIcon("message-circle");
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  const minutes = now === null ? null : Math.max(1, Math.round((now - new Date(session.updatedAt).getTime()) / 60_000));
  return (
    <li
      data-slot="recent-session-item"
      className="flex min-w-0 items-center gap-1 px-1.5 text-body text-fg-muted h-control-md max-xl:min-h-11"
    >
      <span className="flex size-4 shrink-0 items-center justify-center text-fg-muted">
        <Message size={16} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1 truncate">{session.title}</span>
      <time
        className="shrink-0 text-label text-fg-subtle"
        dateTime={session.updatedAt}
        title={new Date(session.updatedAt).toLocaleString("zh-CN")}
      >
        {minutes === null ? "刚刚" : `${minutes} 分钟`}
      </time>
    </li>
  );
}

function AccountMenuTrigger({ actions }: { actions: AccountAction[] }) {
  const More = useIcon("ellipsis");
  const Settings = useIcon("settings");
  const User = useIcon("user");

  return (
    <DropdownMenu>
      <DropdownTrigger
          render={
            <SidebarIdentityRow
              as="button"
              primary="Carlos Feng"
              description="wei.feng@zstack.io"
              layout="two-line"
              trailingPlacement="edge"
              leading={<SidebarIdentityAvatar>CF</SidebarIdentityAvatar>}
              trailing={<More className="size-4" />}
            />
        }
      />
      <DropdownContent
        align="center"
        className="!w-60 !min-w-60 !max-w-60"
      >
        {actions.map((action, index) => (
          <MenuItem
            key={action.id}
            index={index}
            icon={index === 0 ? User : Settings}
            label={action.label}
            onSelect={action.onSelect}
          />
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}

function SidebarSkeleton() {
  return (
    <div aria-busy="true" className="space-y-1 px-1.5 py-1" role="status">
      <span className="sr-only">正在加载诊断会话</span>
      {[0, 1].map((index) => <Skeleton key={index} aria-hidden className="h-control-md w-full max-xl:min-h-11" />)}
    </div>
  );
}

function RecentSessionsContent({
  sessions,
  state,
  onRetry,
}: {
  sessions: Session[];
  state: SessionState;
  onRetry: () => void;
}) {
  if (state === "loading") return <SidebarSkeleton />;
  if (state === "empty") return null;
  if (state === "error") {
    return (
      <div className="flex min-h-control-md items-center justify-between gap-2 px-1.5 text-label text-fg-muted">
        <span>会话暂不可用</span>
        <Button variant="ghost" size="sm" onClick={onRetry}>重试</Button>
      </div>
    );
  }
  return (
    <ul aria-label="最近诊断会话" className="flex w-full flex-col gap-0.5">
      {sessions.map((session) => <RecentSessionItem key={session.id} session={session} />)}
    </ul>
  );
}

interface ZaiopsNavigationPanelProps {
  activeNavigationValue: string;
  accountActions: AccountAction[];
  onNavigate?: () => void;
  onOrganizationChange: (organizationId: string) => void;
  onRetrySessions: () => void;
  onSearchOpen: () => void;
  onSelectNavigation: (value: string) => void;
  organizationId: string;
  sessions: Session[];
  sessionsState: SessionState;
  showSidebarTrigger?: boolean;
}

function ZaiopsNavigationPanel({
  activeNavigationValue,
  accountActions,
  onNavigate,
  onOrganizationChange,
  onRetrySessions,
  onSearchOpen,
  onSelectNavigation,
  organizationId,
  sessions,
  sessionsState,
  showSidebarTrigger,
}: ZaiopsNavigationPanelProps) {
  const Home = useIcon("home");
  const List = useIcon("list");
  const Check = useIcon("check-square");
  const Brain = useIcon("brain");
  const Library = useIcon("square-library");
  const governanceLabelId = useId();
  const sessionsLabelId = useId();

  const primaryItems = useMemo<NavigationItem[]>(() => [
    { value: "#home", label: "首页", icon: Home },
    { value: "#clusters", label: "集群环境", icon: List },
    { value: "#reports", label: "巡检报告", icon: Check },
  ], [Check, Home, List]);
  const governanceItems = useMemo<NavigationItem[]>(() => [
    { value: "#plans", label: "巡检方案", icon: Check },
    { value: "#skills", label: "专家技能", icon: Brain },
    { value: "#knowledge", label: "知识库", icon: Library },
  ], [Brain, Check, Library]);
  return (
    <>
      <SidebarHeader className="space-y-1 px-2 py-1.5">
        <WorkspaceSwitcher
          value={organizationId}
          onChange={onOrganizationChange}
          showSidebarTrigger={showSidebarTrigger}
        />
        <SidebarSearchTrigger onOpen={onSearchOpen} />
      </SidebarHeader>

      <SidebarContent contentClassName="gap-4 px-2 py-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMenu
              activeValue={activeNavigationValue}
              aria-label="主导航"
              keyboardNavigation="roving"
            >
              {primaryItems.map((item) => (
                <NavigationItemView
                  key={item.value}
                  item={item}
                  onSelect={onSelectNavigation}
                  onNavigate={onNavigate}
                />
              ))}
            </NavMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup aria-labelledby={governanceLabelId}>
          <SidebarGroupLabel id={governanceLabelId}>巡检治理</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu
              activeValue={activeNavigationValue}
              aria-label="巡检治理"
              keyboardNavigation="roving"
            >
              {governanceItems.map((item) => (
                <NavigationItemView
                  key={item.value}
                  item={item}
                  onSelect={onSelectNavigation}
                  onNavigate={onNavigate}
                />
              ))}
            </NavMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup aria-labelledby={sessionsLabelId}>
          <SidebarGroupLabel id={sessionsLabelId}>诊断会话</SidebarGroupLabel>
          <SidebarGroupContent>
            <RecentSessionsContent
              sessions={sessions}
              state={sessionsState}
              onRetry={onRetrySessions}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5">
        <AccountMenuTrigger actions={accountActions} />
      </SidebarFooter>
    </>
  );
}

function ZaiopsSidebar(props: ZaiopsNavigationPanelProps) {
  return (
    <Sidebar
      width="260px"
      mobileWidth="min(260px, calc(100vw - 24px))"
      variant="sidebar"
      collapsible="offcanvas"
      ariaLabel="ZAIops 应用导航"
      className="static h-full"
    >
      <ZaiopsNavigationPanel {...props} showSidebarTrigger />
      <SidebarRail />
    </Sidebar>
  );
}

function CompactOpenTrigger() {
  const { isMobile } = useSidebar();
  if (!isMobile) return null;
  return <SidebarTrigger label="打开导航" className="max-xl:min-h-11 max-xl:min-w-11" />;
}

export function ZaiopsSidebarPreview() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState(organizations[0].id);
  const [activeNavigationValue, setActiveNavigationValue] = useState("#home");
  const [sessionsState, setSessionsState] = useState<SessionState>("loading");
  const [sessions, setSessions] = useState<Session[]>([]);
  const Home = useIcon("home");
  const accountActions = useMemo<AccountAction[]>(() => [
    { id: "profile", label: "账户设置", onSelect: () => undefined },
    { id: "preferences", label: "偏好设置", onSelect: () => undefined },
  ], []);

  useEffect(() => {
    const now = Date.now();
    setSessions([
      { id: "network", title: "使用 specialist-network - 新会话", updatedAt: new Date(now - 2 * 60_000).toISOString() },
      { id: "storage", title: "在使用率最高的那台设备上，列出 / 目录下 top 20 大文件", updatedAt: new Date(now - 8 * 60_000).toISOString() },
    ]);
    setSessionsState("ready");
  }, []);

  return (
    <SidebarProvider>
      <div className="w-full group-data-[fullscreen=true]/preview-content:h-full">
        <div className="relative flex h-[min(42rem,calc(100svh-8rem))] min-h-120 w-full overflow-hidden bg-surface-base group-data-[fullscreen=true]/preview-content:h-full group-data-[fullscreen=true]/preview-content:min-h-0">
          <ZaiopsSidebar
            activeNavigationValue={activeNavigationValue}
            accountActions={accountActions}
            onOrganizationChange={setOrganizationId}
            onRetrySessions={() => setSessionsState("ready")}
            onSearchOpen={() => setSearchOpen(true)}
            onSelectNavigation={setActiveNavigationValue}
            organizationId={organizationId}
            sessions={sessions}
            sessionsState={sessionsState}
          />
          <PageLayout className="h-full min-w-0 flex-1">
            <PageHeader>
              <div className="flex min-w-0 items-center gap-2">
                <SidebarFloatingTrigger
                  collapsedBehavior="offcanvas"
                  label="展开侧边栏"
                  contentClassName="h-[min(42rem,calc(100svh-6rem))] w-[260px] max-w-[calc(100vw-12px)] p-0"
                  renderContent={({ close }) => (
                    <ZaiopsNavigationPanel
                      activeNavigationValue={activeNavigationValue}
                      accountActions={accountActions}
                      onNavigate={close}
                      onOrganizationChange={setOrganizationId}
                      onRetrySessions={() => setSessionsState("ready")}
                      onSearchOpen={() => {
                        close();
                        setSearchOpen(true);
                      }}
                      onSelectNavigation={setActiveNavigationValue}
                      organizationId={organizationId}
                      sessions={sessions}
                      sessionsState={sessionsState}
                      showSidebarTrigger={false}
                    />
                  )}
                />
                <PageHeaderContent icon={Home}>
                  <nav aria-label="Breadcrumb" className="text-body text-fg-muted">ZAIops / 巡检</nav>
                </PageHeaderContent>
              </div>
              <div className="xl:hidden"><CompactOpenTrigger /></div>
            </PageHeader>
            <PageContent>
              <PageBody className="p-6">
                <PageTitle className="text-title">巡检总览</PageTitle>
                <p className="mt-2 max-w-md text-body text-fg-muted">260px Desktop Sidebar、可访问的 Compact Drawer 与业务组合示例。</p>
              </PageBody>
            </PageContent>
          </PageLayout>
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>搜索 ZAIops</DialogTitle>
            <DialogDescription>搜索会话、集群、巡检方案和知识库。</DialogDescription>
          </DialogHeader>
          <div className="rounded-control border border-border-subtle px-3 py-2 text-body text-fg-subtle">输入关键词开始搜索…</div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
