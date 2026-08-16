"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ChatGLMColor from "@lobehub/icons/es/ChatGLM/components/Color";
import DeepSeekColor from "@lobehub/icons/es/DeepSeek/components/Color";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import github from "@thesvg/icons/github";
import postgresql from "@thesvg/icons/postgresql";
import slack from "@thesvg/icons/slack";
import { AppShell, AppShellHeader, AppShellMain } from "@zeron/ui/app-shell";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { DataTable, DataTableColumnHeader, DataTableToolbar, useDataTable } from "@zeron/ui/data-table";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemGroup, InfoItemTitle, InfoItemTrailing } from "@zeron/ui/info-item";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@zeron/ui/input-group";
import { MenuItem } from "@zeron/ui/menu-item";
import { MetricCard } from "@zeron/ui/metric-card";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageLayout, PageSidebar } from "@zeron/ui/page-layout";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { SidebarIdentityAvatar } from "@zeron/ui/sidebar-identity-row";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { TopNav, TopNavActions, TopNavBrand } from "@zeron/ui/top-nav";
import { Switch } from "@zeron/ui/switch";
import { type IconComponent, useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";

type SettingsView = "models" | "keys" | "credentials" | "profile" | "preferences" | "usage";
type ServiceStatus = "正常" | "已用尽" | "需要重新获取";

interface ModelService {
  id: string;
  name: string;
  endpoint: string;
  provider: "glm" | "openai" | "deepseek";
  models: readonly string[];
  status: ServiceStatus;
  usage: string;
}

const modelServices: readonly ModelService[] = [
  { id: "default", name: "默认模型服务", endpoint: "https://api.zentrix.dev/v1", provider: "glm", models: ["gpt-4.1", "DeepSeek-v4-pro", "DeepSeek-v4-flash", "GLM-5-Turbo"], status: "正常", usage: "400 M" },
  { id: "glm", name: "GLM 模型组", endpoint: "https://open.bigmodel.cn/api/paas/v4", provider: "glm", models: ["GLM-5-Turbo", "GLM-4.6"], status: "已用尽", usage: "800.2 M" },
  { id: "deepseek", name: "DeepSeek Production", endpoint: "https://api.deepseek.com", provider: "deepseek", models: ["DeepSeek-v4-pro", "DeepSeek-v4-flash"], status: "需要重新获取", usage: "—" },
];

const apiKeys = [
  { id: "key-live", name: "Production automation", value: "zx_live_••••••••C4hA", createdAt: "2026-08-10", lastUsed: "2 分钟前", status: "正常" as const },
  { id: "key-dev", name: "Local development", value: "zx_dev_••••••••M2pQ", createdAt: "2026-07-26", lastUsed: "昨天", status: "正常" as const },
  { id: "key-old", name: "Legacy integration", value: "zx_live_••••••••K9rD", createdAt: "2026-06-12", lastUsed: "30 天前", status: "需要重新获取" as const },
  { id: "key-staging", name: "Staging gateway", value: "zx_test_••••••••R7vE", createdAt: "2026-08-05", lastUsed: "3 小时前", status: "正常" as const },
  { id: "key-analytics", name: "Usage analytics", value: "zx_live_••••••••A9kL", createdAt: "2026-07-18", lastUsed: "4 天前", status: "正常" as const },
  { id: "key-webhook", name: "Webhook delivery", value: "zx_live_••••••••W8sN", createdAt: "2026-07-11", lastUsed: "1 小时前", status: "正常" as const },
  { id: "key-playground", name: "Team playground", value: "zx_dev_••••••••P6xQ", createdAt: "2026-07-02", lastUsed: "6 天前", status: "正常" as const },
  { id: "key-embed", name: "Embed service", value: "zx_live_••••••••E2mB", createdAt: "2026-06-28", lastUsed: "昨天", status: "正常" as const },
  { id: "key-agent", name: "Agent runtime", value: "zx_live_••••••••G5dT", createdAt: "2026-06-21", lastUsed: "刚刚", status: "正常" as const },
  { id: "key-notebook", name: "Research notebook", value: "zx_dev_••••••••N1rC", createdAt: "2026-06-14", lastUsed: "12 天前", status: "正常" as const },
  { id: "key-migration", name: "Migration worker", value: "zx_live_••••••••M3uF", createdAt: "2026-06-06", lastUsed: "45 天前", status: "需要重新获取" as const },
  { id: "key-support", name: "Support console", value: "zx_live_••••••••S8pJ", createdAt: "2026-05-29", lastUsed: "2 天前", status: "正常" as const },
  { id: "key-evaluation", name: "Evaluation suite", value: "zx_dev_••••••••V4hD", createdAt: "2026-05-17", lastUsed: "20 天前", status: "正常" as const },
  { id: "key-archive", name: "Archive importer", value: "zx_live_••••••••H7qR", createdAt: "2026-04-30", lastUsed: "90 天前", status: "需要重新获取" as const },
] as const;

const credentials = [
  { id: "postgres", name: "Postgres Readonly", value: "DSN URL", brand: "postgresql" as const, status: "正常" as const },
  { id: "github", name: "GitHub App", value: "App token", brand: "github" as const, status: "正常" as const },
  { id: "slack", name: "Slack workspace", value: "Bot token", brand: "slack" as const, status: "需要重新获取" as const },
  { id: "postgres-primary", name: "Postgres Primary", value: "DSN URL", brand: "postgresql" as const, status: "正常" as const },
  { id: "github-deploy", name: "GitHub Deploy Bot", value: "Fine-grained token", brand: "github" as const, status: "正常" as const },
  { id: "slack-alerts", name: "Slack Alerts", value: "Webhook URL", brand: "slack" as const, status: "正常" as const },
  { id: "postgres-analytics", name: "Analytics Warehouse", value: "Connection string", brand: "postgresql" as const, status: "正常" as const },
  { id: "github-issues", name: "GitHub Issues Sync", value: "App token", brand: "github" as const, status: "正常" as const },
  { id: "slack-research", name: "Research Workspace", value: "Bot token", brand: "slack" as const, status: "正常" as const },
  { id: "postgres-staging", name: "Postgres Staging", value: "DSN URL", brand: "postgresql" as const, status: "正常" as const },
  { id: "github-actions", name: "GitHub Actions", value: "Installation token", brand: "github" as const, status: "需要重新获取" as const },
  { id: "slack-ops", name: "Operations Slack", value: "Webhook URL", brand: "slack" as const, status: "正常" as const },
  { id: "postgres-backup", name: "Backup Database", value: "Connection string", brand: "postgresql" as const, status: "正常" as const },
  { id: "github-docs", name: "GitHub Docs Sync", value: "Fine-grained token", brand: "github" as const, status: "正常" as const },
  { id: "slack-legacy", name: "Legacy Slack Bot", value: "Bot token", brand: "slack" as const, status: "需要重新获取" as const },
] as const;

const credentialBrandIcons = { github, postgresql, slack } as const;

const viewCopy: Record<SettingsView, { title: string; description: string; search?: string }> = {
  models: { title: "模型服务", description: "模型服务为您提供统一、可靠的 AI 模型调用入口。使用一个访问地址和 API 令牌，即可按权限调用可用的对话、文本生成、Embedding、图像生成等模型能力。", search: "搜索模型服务" },
  keys: { title: "API keys", description: "创建、轮换和撤销用于调用 Zentrix API 的访问密钥。" },
  credentials: { title: "凭证管理", description: "管理被模型服务和自动化流程引用的第三方凭证。" },
  profile: { title: "账户", description: "管理你的个人资料、登录信息与已登录设备。" },
  preferences: { title: "偏好设置", description: "配置外观、输入方式、语言与时间格式。" },
  usage: { title: "使用情况", description: "查看当前计费周期内的模型调用、令牌与额度使用情况。" },
};

const usageMetrics = [
  { label: "模型调用次数", value: "11,212", change: "+12%", detail: "周环比", positive: true },
  { label: "MCP 调用", value: "4,112", change: "-2.1%", detail: "上周", positive: false },
  { label: "消息数", value: "33", change: "-10%", detail: "上周", positive: false },
  { label: "累计 Token 数", value: "302.8 K", change: "302.8K", detail: "上周", positive: undefined },
] as const;

const usageMonths = ["六月", "七月", "八月", "九月", "十月", "十一月", "十二月", "一月", "二月", "三月", "四月", "五月"] as const;
const heatmapActivity: Record<string, 1 | 2 | 3> = {
  "0-1-4": 1, "0-3-1": 2, "1-0-2": 1, "1-3-5": 1, "2-2-3": 3, "3-0-5": 1, "5-1-2": 2, "5-3-3": 1, "6-2-5": 1, "8-1-4": 1, "9-2-2": 2, "10-0-5": 1, "10-3-4": 2, "11-1-1": 1, "11-3-5": 3,
};

const usageSummaries = [
  { value: "2,121", label: "LLM 调用次数" },
  { value: "17.4K", label: "今日 Token 消耗" },
  { value: "171.4 M", label: "当月 Token 消耗" },
  { value: "311.1 M", label: "总计" },
] as const;

export interface PersonalSettingsProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The first settings page rendered by the block. */
  defaultView?: SettingsView;
}

function ProviderMark({ provider }: { provider: ModelService["provider"] }) {
  const Icon = provider === "deepseek" ? DeepSeekColor : provider === "openai" ? OpenAIMono : ChatGLMColor;
  return <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-border bg-hover"><Icon size={24} /></span>;
}

function ModelLogo({ model, size = 14 }: { model: string; size?: number }) {
  const Icon = model.toLowerCase().startsWith("gpt") ? OpenAIMono : model.toLowerCase().startsWith("deepseek") ? DeepSeekColor : ChatGLMColor;
  return <Icon aria-hidden size={size} />;
}

function ModelBadge({ model }: { model: string }) {
  return <Badge color="gray" size="sm"><span className="flex items-center gap-1"><ModelLogo model={model} /><span>{model}</span></span></Badge>;
}

function CredentialName({ credential }: { credential: (typeof credentials)[number] }) {
  return <div className="flex min-w-0 items-center gap-2"><span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-border bg-hover [&>svg]:block [&>svg]:size-5" dangerouslySetInnerHTML={{ __html: credentialBrandIcons[credential.brand].svg }} /><span className="truncate font-medium text-fg-default">{credential.name}</span></div>;
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const color = status === "正常" ? "blue" : status === "已用尽" ? "orange" : "red";
  return <Badge color={color} size="sm">{status}</Badge>;
}

function EmptyRows({ children }: { children: string }) {
  return <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border bg-surface-raised px-4 text-body text-fg-muted">{children}</div>;
}

function RowActions({ items, label }: { items: readonly string[]; label: string }) {
  const MoreIcon = useIcon("ellipsis");
  return <DropdownMenu><DropdownTrigger render={<Button aria-label={`${label} 的操作`} type="button" variant="ghost" iconOnly><MoreIcon aria-hidden size={16} strokeWidth={1.5} /></Button>} /><DropdownContent align="end" className="w-32">{items.map((item, index) => <MenuItem index={index} key={item} label={item} onSelect={() => undefined} />)}</DropdownContent></DropdownMenu>;
}

/** Personal account settings with model services, API keys, credentials, profile, and usage pages. */
export function PersonalSettings({ className, defaultView = "models", ...props }: PersonalSettingsProps) {
  const SearchIcon = useIcon("search");
  const ChevronDown = useIcon("chevron-down");
  const PlusIcon = useIcon("plus");
  const CopyIcon = useIcon("copy");
  const BrainIcon = useIcon("brain");
  const LockIcon = useIcon("lock");
  const ShieldIcon = useIcon("shield");
  const UserIcon = useIcon("user");
  const SettingsIcon = useIcon("settings");
  const ClockIcon = useIcon("clock");
  const [view, setView] = useState<SettingsView>(defaultView);
  const [query, setQuery] = useState("");
  const copy = viewCopy[view];
  const normalizedQuery = query.trim().toLowerCase();
  const services = useMemo(() => modelServices.filter((service) => !normalizedQuery || `${service.name} ${service.endpoint} ${service.models.join(" ")}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery]);
  const setSettingsView = (nextView: SettingsView) => {
    setView(nextView);
    setQuery("");
  };

  return (
    <AppShell layout="stacked" className={cn("@container h-full min-h-[46rem] overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-base", className)} {...props}>
      <AppShellHeader className="static bg-surface-base">
        <TopNav navigationAlign="left">
          <TopNavBrand className="gap-3 text-fg-default"><strong className="text-heading font-bold leading-none">Zentrix</strong><span className="text-body font-medium">个人设置</span></TopNavBrand>
          <TopNavActions><Button type="button" variant="ghost" trailingIcon={ChevronDown}><span className="flex items-center gap-2"><SidebarIdentityAvatar>C</SidebarIdentityAvatar><span>Carlos</span></span></Button></TopNavActions>
        </TopNav>
      </AppShellHeader>

      <AppShellMain landmark={false} className="min-h-0 overflow-hidden">
        <PageLayout size="full" className="h-full pt-0">
          <PageSidebar aria-label="个人设置导航" className="p-3">
            <SettingsNavGroup activeView={view} label="资源" items={[{ value: "models", label: "模型服务", icon: BrainIcon }, { value: "keys", label: "API keys", icon: LockIcon }, { value: "credentials", label: "凭证管理", icon: ShieldIcon }]} onChange={setSettingsView} />
            <SettingsNavGroup activeView={view} className="mt-5" label="个人设置" items={[{ value: "profile", label: "个人资料", icon: UserIcon }, { value: "preferences", label: "偏好设置", icon: SettingsIcon }, { value: "usage", label: "使用情况", icon: ClockIcon }]} onChange={setSettingsView} />
          </PageSidebar>
          <PageContent>
            <PageBody className="p-4 sm:p-6">
              <section className="mx-auto w-full max-w-[960px]">
                {view === "usage" ? <UsageSettings /> : <><header className="max-w-3xl"><h1 className="text-title font-semibold text-fg-default">{copy.title}</h1><p className="mt-1 text-label leading-5 text-fg-muted">{copy.description}</p></header>
                <div className="mt-4">{view === "models" ? <div className="flex flex-col gap-2.5"><InputGroup className="w-full max-w-[450px] border-border hover:border-border" size="md"><InputGroupAddon className="pr-2"><SearchIcon aria-hidden size={16} strokeWidth={1.5} /></InputGroupAddon><InputGroupInput aria-label={copy.search} className="h-full min-h-0" onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} value={query} /></InputGroup><ModelServicesTable services={services} /></div> : view === "keys" ? <ApiKeysTable copyIcon={CopyIcon} plusIcon={PlusIcon} /> : view === "credentials" ? <CredentialsTable plusIcon={PlusIcon} /> : view === "preferences" ? <PreferencesSettings /> : <ProfileSettings />}</div></>}
              </section>
            </PageBody>
          </PageContent>
        </PageLayout>
      </AppShellMain>
    </AppShell>
  );
}

function SettingsNavGroup({ activeView, className, items, label, onChange }: { activeView: SettingsView; className?: string; items: readonly { value: SettingsView; label: string; icon: IconComponent }[]; label: string; onChange: (view: SettingsView) => void }) {
  return <section className={className}><p className="px-2 text-label text-fg-subtle">{label}</p><NavMenu as="div" activeValue={activeView} aria-label={label} className="mt-1" keyboardNavigation="roving">{items.map((item) => <NavItem key={item.value} value={item.value}><NavItemTrigger href={`#${item.value}`} onClick={(event) => { event.preventDefault(); onChange(item.value); }}><NavItemLeading className="group-data-[active=true]/nav-item:text-fg-brand"><item.icon aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>)}</NavMenu></section>;
}

function ModelServicesTable({ services }: { services: readonly ModelService[] }) {
  if (!services.length) return <EmptyRows>没有找到匹配的模型服务。</EmptyRows>;
  return <div className="overflow-x-auto rounded-lg border-[0.5px] border-border"><Table className="min-w-[840px]"><TableHeader><TableRow><TableHead className="w-[32%]">名称</TableHead><TableHead>可用模型</TableHead><TableHead className="w-28">状态</TableHead><TableHead className="w-28">用量&配额</TableHead><TableHead className="w-16 text-right"><span className="sr-only">操作</span></TableHead></TableRow></TableHeader><TableBody>{services.map((service, index) => { const visibleModels = service.models.slice(0, 2); const hiddenModels = service.models.slice(2); return <TableRow index={index} key={service.id}><TableCell><div className="flex items-center gap-2.5"><ProviderMark provider={service.provider} /><div className="min-w-0"><p className="truncate font-medium text-fg-default">{service.name}</p><p className="truncate text-label text-fg-muted">{service.endpoint}</p></div></div></TableCell><TableCell><div className="flex flex-wrap items-center gap-1">{visibleModels.map((model) => <ModelBadge key={model} model={model} />)}{hiddenModels.length > 0 && <DropdownMenu><DropdownTrigger render={<Button type="button" size="sm" variant="ghost" className="h-6 px-1.5 text-label">+{hiddenModels.length}</Button>} /><DropdownContent align="start" className="w-56 p-1">{hiddenModels.map((model) => <div className="flex h-control-md items-center gap-2 rounded-lg px-2 text-body text-fg-default" key={model}><ModelLogo model={model} size={16} /><span>{model}</span></div>)}</DropdownContent></DropdownMenu>}</div></TableCell><TableCell><StatusBadge status={service.status} /></TableCell><TableCell className="tabular-nums text-fg-muted">{service.usage}</TableCell><TableCell><div className="flex justify-end"><RowActions label={service.name} items={["编辑", "移除"]} /></div></TableCell></TableRow>; })}</TableBody></Table></div>;
}

function ApiKeysTable({ copyIcon: CopyIcon, plusIcon: PlusIcon }: { copyIcon: ReturnType<typeof useIcon>; plusIcon: ReturnType<typeof useIcon> }) {
  // TanStack Table uses the data reference to detect source updates. Keeping
  // this mock list stable prevents pagination from resetting on every render.
  const data = useMemo(() => [...apiKeys], []);
  const columns = useMemo<ColumnDef<(typeof apiKeys)[number], unknown>[]>(() => [
    { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} label="名称" />, meta: { label: "名称", placeholder: "搜索 API key", variant: "text" }, cell: ({ row }) => <span className="font-medium text-fg-default">{row.original.name}</span> },
    { accessorKey: "value", header: ({ column }) => <DataTableColumnHeader column={column} label="Key" />, cell: ({ row }) => <div className="flex items-center gap-1.5 font-mono text-label text-fg-muted"><span>{row.original.value}</span><Button aria-label={`复制 ${row.original.name}`} type="button" size="sm" variant="ghost" iconOnly><CopyIcon size={14} /></Button></div> },
    { accessorKey: "lastUsed", header: ({ column }) => <DataTableColumnHeader column={column} label="最后使用" />, cell: ({ row }) => <span className="text-fg-muted">{row.original.lastUsed}</span> },
    { accessorKey: "status", header: ({ column }) => <DataTableColumnHeader column={column} label="状态" />, cell: ({ row }) => <StatusBadge status={row.original.status} />, filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)), meta: { label: "状态", options: [{ label: "正常", value: "正常" }, { label: "需要重新获取", value: "需要重新获取" }], variant: "multiSelect" } },
    { id: "actions", header: () => <span className="sr-only">操作</span>, cell: ({ row }) => <div className="flex justify-end"><RowActions label={row.original.name} items={["轮换", "撤销"]} /></div>, enableHiding: false, enableSorting: false, size: 56 },
  ], [CopyIcon]);
  const { table } = useDataTable({ columns, data, getRowId: (key) => key.id, initialState: { columnPinning: { left: ["name"], right: ["actions"] }, pagination: { pageIndex: 0, pageSize: 10 } } });

  return <DataTable className="gap-2.5 [&_[data-slot=data-table-pagination]]:px-2" emptyMessage="没有找到匹配的 API key。" table={table}><DataTableToolbar showViewOptions={false} table={table}><Button type="button" variant="tertiary" leadingIcon={PlusIcon}>创建 key</Button></DataTableToolbar></DataTable>;
}

function CredentialsTable({ plusIcon: PlusIcon }: { plusIcon: ReturnType<typeof useIcon> }) {
  // Match API keys: a stable source avoids an automatic pagination reset loop.
  const data = useMemo(() => [...credentials], []);
  const columns = useMemo<ColumnDef<(typeof credentials)[number], unknown>[]>(() => [
    { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} label="名称" />, meta: { label: "名称", placeholder: "搜索凭证", variant: "text" }, cell: ({ row }) => <CredentialName credential={row.original} /> },
    { accessorKey: "value", header: ({ column }) => <DataTableColumnHeader column={column} label="类型" />, cell: ({ row }) => <span className="text-fg-muted">{row.original.value}</span> },
    { accessorKey: "status", header: ({ column }) => <DataTableColumnHeader column={column} label="状态" />, cell: ({ row }) => <StatusBadge status={row.original.status} />, filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)), meta: { label: "状态", options: [{ label: "正常", value: "正常" }, { label: "需要重新获取", value: "需要重新获取" }], variant: "multiSelect" } },
    { id: "actions", header: () => <span className="sr-only">操作</span>, cell: ({ row }) => <div className="flex justify-end"><RowActions label={row.original.name} items={["编辑", "移除"]} /></div>, enableHiding: false, enableSorting: false, size: 56 },
  ], []);
  const { table } = useDataTable({ columns, data, getRowId: (credential) => credential.id, initialState: { columnPinning: { left: ["name"], right: ["actions"] }, pagination: { pageIndex: 0, pageSize: 10 } } });

  return <DataTable className="gap-2.5 [&_[data-slot=data-table-pagination]]:px-2" emptyMessage="没有找到匹配的凭证。" table={table}><DataTableToolbar showViewOptions={false} table={table}><Button type="button" variant="tertiary" leadingIcon={PlusIcon}>添加凭证</Button></DataTableToolbar></DataTable>;
}

type AccountAction = "email" | "password" | "verification" | "passkey" | "delete" | "logout-all" | "logout-device";

function PreferencesSettings() {
  const [theme, setTheme] = useState("light");
  const [highContrast, setHighContrast] = useState("system");
  const [enterAddsLine, setEnterAddsLine] = useState(false);
  const [language, setLanguage] = useState("zh-CN");
  const [numberFormat, setNumberFormat] = useState("default");
  const [textDirectionControls, setTextDirectionControls] = useState(false);
  const [startWeekOnMonday, setStartWeekOnMonday] = useState(true);
  const [dateFormat, setDateFormat] = useState("relative");
  const [automaticTimeZone, setAutomaticTimeZone] = useState(true);
  const [timeZone, setTimeZone] = useState("asia-shanghai");

  return <div className="w-full space-y-9">
    <SettingsSection title="外观">
      <InfoItemGroup>
        <PreferenceInfoItem description="选择此设备上的 Zentrix 外观主题。" title="主题"><PreferenceSelect ariaLabel="主题" onChange={setTheme} options={[{ value: "light", label: "浅色" }, { value: "dark", label: "深色" }, { value: "system", label: "跟随系统" }]} value={theme} /></PreferenceInfoItem>
        <PreferenceInfoItem badge="Beta" description="提高界面对比度，增强信息可见性。" title="高对比度"><PreferenceSelect ariaLabel="高对比度" onChange={setHighContrast} options={[{ value: "system", label: "跟随系统" }, { value: "on", label: "开启" }, { value: "off", label: "关闭" }]} value={highContrast} /></PreferenceInfoItem>
      </InfoItemGroup>
    </SettingsSection>

    <SettingsSection title="输入选项">
      <InfoItemGroup><PreferenceInfoItem description="适用于聊天、评论和其他输入框。按 Cmd/Ctrl + Enter 发送内容。" title="使用 Enter 换行"><Switch checked={enterAddsLine} label={<span className="sr-only">使用 Enter 换行</span>} onCheckedChange={setEnterAddsLine} /></PreferenceInfoItem></InfoItemGroup>
    </SettingsSection>

    <SettingsSection title="语言与时间">
      <InfoItemGroup>
        <PreferenceInfoItem description="选择 Zentrix 的显示语言。" title="语言"><PreferenceSelect ariaLabel="语言" onChange={setLanguage} options={[{ value: "zh-CN", label: "简体中文" }, { value: "en-US", label: "English (US)" }, { value: "ja-JP", label: "日本語" }]} value={language} /></PreferenceInfoItem>
        <PreferenceInfoItem description="选择数字和货币的显示方式；默认会使用语言设置。" title="数字格式"><PreferenceSelect ariaLabel="数字格式" onChange={setNumberFormat} options={[{ value: "default", label: "默认" }, { value: "zh-CN", label: "1,234.56" }, { value: "de-DE", label: "1.234,56" }]} value={numberFormat} /></PreferenceInfoItem>
        <PreferenceInfoItem description="始终在编辑器中显示从左到右或从右到左的文字方向切换。" title="始终显示文字方向控制"><Switch checked={textDirectionControls} label={<span className="sr-only">始终显示文字方向控制</span>} onCheckedChange={setTextDirectionControls} /></PreferenceInfoItem>
        <PreferenceInfoItem description="这会影响日历中一周的第一天。" title="每周从星期一开始"><Switch checked={startWeekOnMonday} label={<span className="sr-only">每周从星期一开始</span>} onCheckedChange={setStartWeekOnMonday} /></PreferenceInfoItem>
        <PreferenceInfoItem description="设置新建 @日期 提及的默认显示格式。" title="日期格式"><PreferenceSelect ariaLabel="日期格式" onChange={setDateFormat} options={[{ value: "relative", label: "相对日期" }, { value: "standard", label: "2026-08-16" }, { value: "long", label: "2026 年 8 月 16 日" }]} value={dateFormat} /></PreferenceInfoItem>
        <PreferenceInfoItem description="提醒、通知和邮件会根据你的当前时区送达。" title="根据位置自动设置时区"><Switch checked={automaticTimeZone} label={<span className="sr-only">根据位置自动设置时区</span>} onCheckedChange={setAutomaticTimeZone} /></PreferenceInfoItem>
        <PreferenceInfoItem description="选择你所在的时区。" title="时区"><PreferenceSelect ariaLabel="时区" disabled={automaticTimeZone} onChange={setTimeZone} options={[{ value: "asia-shanghai", label: "GMT+8 · 上海" }, { value: "asia-tokyo", label: "GMT+9 · 东京" }, { value: "america-los-angeles", label: "GMT-7 · 洛杉矶" }]} value={timeZone} /></PreferenceInfoItem>
      </InfoItemGroup>
    </SettingsSection>
  </div>;
}

const accountActionCopy: Record<AccountAction, { title: string; description: string; confirm: string }> = {
  email: { title: "管理邮箱", description: "更新用于登录和接收账户通知的邮箱地址。", confirm: "保存邮箱" },
  password: { title: "设置密码", description: "设置密码后，你可以使用邮箱和密码登录账户。", confirm: "设置密码" },
  verification: { title: "开启两步验证", description: "使用验证器应用为账户增加一层安全保护。", confirm: "开启验证" },
  passkey: { title: "添加通行密钥", description: "使用本设备的生物识别或屏幕锁定方式安全登录。", confirm: "添加通行密钥" },
  delete: { title: "删除账户", description: "此操作将永久删除你的账户和个人数据，且无法撤销。", confirm: "删除账户" },
  "logout-all": { title: "退出其他设备", description: "这会退出除当前设备外的全部登录会话。", confirm: "退出其他设备" },
  "logout-device": { title: "退出此设备", description: "该设备将需要重新验证身份后才能继续访问。", confirm: "退出设备" },
};

function ProfileSettings() {
  const [preferredName, setPreferredName] = useState("Carlos");
  const [email, setEmail] = useState("carlos@zentrix.dev");
  const [emailDraft, setEmailDraft] = useState(email);
  const [profileSaved, setProfileSaved] = useState(false);
  const [supportAccess, setSupportAccess] = useState(false);
  const [passwordAdded, setPasswordAdded] = useState(false);
  const [verificationEnabled, setVerificationEnabled] = useState(false);
  const [passkeyAdded, setPasskeyAdded] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [accountAction, setAccountAction] = useState<AccountAction | null>(null);
  const [deviceToLogout, setDeviceToLogout] = useState<string | null>(null);
  const [devices, setDevices] = useState([
    { id: "current", name: "macOS", lastActive: "现在", location: "中国上海", current: true },
    { id: "office", name: "macOS", lastActive: "今天 17:51", location: "中国上海", current: false },
    { id: "travel", name: "macOS", lastActive: "7 月 16 日 12:57", location: "日本东京", current: false },
  ]);
  const actionCopy = accountAction ? accountActionCopy[accountAction] : accountActionCopy.email;

  const openAccountAction = (action: AccountAction, deviceId?: string) => {
    if (action === "email") setEmailDraft(email);
    setDeviceToLogout(deviceId ?? null);
    setAccountAction(action);
  };

  const confirmAccountAction = () => {
    if (accountAction === "email") setEmail(emailDraft);
    if (accountAction === "password") setPasswordAdded(true);
    if (accountAction === "verification") setVerificationEnabled(true);
    if (accountAction === "passkey") setPasskeyAdded(true);
    if (accountAction === "delete") setAccountDeleted(true);
    if (accountAction === "logout-all") setDevices((current) => current.filter((device) => device.current));
    if (accountAction === "logout-device" && deviceToLogout) setDevices((current) => current.filter((device) => device.id !== deviceToLogout));
    setDeviceToLogout(null);
    setAccountAction(null);
  };

  if (accountDeleted) return <div className="w-full rounded-lg border border-border bg-surface-raised px-5 py-10 text-center"><h2 className="text-title font-semibold text-fg-default">账户已删除</h2><p className="mt-2 text-body text-fg-muted">你的本地演示账户已被移除。</p></div>;

  return <div className="w-full space-y-9">
    <SettingsSection title="个人资料">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <SidebarIdentityAvatar className="size-[60px] text-title" tone="brand">C</SidebarIdentityAvatar>
        <div className="w-full max-w-md"><label className="text-body font-medium text-fg-default" htmlFor="preferred-name">显示名称</label><InputGroup className="mt-2"><InputGroupInput id="preferred-name" onChange={(event) => { setPreferredName(event.target.value); setProfileSaved(false); }} value={preferredName} /></InputGroup></div>
        <Button onClick={() => setProfileSaved(true)} type="button" variant="tertiary">保存</Button>
      </div>
      <p className="mt-3 text-label text-fg-muted">{profileSaved ? "个人资料已保存。" : "此名称会显示在你的协作记录与公开资料中。"}</p>
    </SettingsSection>

    <SettingsSection title="账户安全">
      <InfoItemGroup>
        <AccountInfoItem action="管理邮箱" description={email} grouped onAction={() => openAccountAction("email")} title="邮箱" />
        <AccountInfoItem action={passwordAdded ? "已设置" : "添加密码"} description={passwordAdded ? "已设置密码，可使用邮箱和密码登录。" : "为账户设置密码。"} disabled={passwordAdded} grouped onAction={() => openAccountAction("password")} title="密码" />
        <AccountInfoItem action={verificationEnabled ? "已开启" : "添加验证方式"} description="为账户增加一层安全保护。" disabled={verificationEnabled} grouped onAction={() => openAccountAction("verification")} title="两步验证" />
        <AccountInfoItem action={passkeyAdded ? "已添加" : "添加通行密钥"} description="使用设备生物识别或屏幕锁定方式登录。" disabled={passkeyAdded} grouped onAction={() => openAccountAction("passkey")} title="通行密钥" />
      </InfoItemGroup>
    </SettingsSection>

    <SettingsSection title="支持">
      <InfoItemGroup><InfoItem className="min-h-[86px] px-4 py-3.5"><InfoItemContent><InfoItemTitle>支持访问</InfoItemTitle><InfoItemDescription>授权 Zentrix 支持团队临时访问你的账户，以协助排查问题或恢复内容；你可随时撤销。</InfoItemDescription></InfoItemContent><InfoItemTrailing><Switch checked={supportAccess} label={<span className="sr-only">支持访问</span>} onCheckedChange={setSupportAccess} /></InfoItemTrailing></InfoItem></InfoItemGroup>
      <div className="mt-3"><AccountInfoItem action="删除账户" destructive description="永久删除账户后，你将无法再访问所属工作区与个人数据。" onAction={() => openAccountAction("delete")} title="删除我的账户" /></div>
    </SettingsSection>

    <SettingsSection title="设备">
      <div className="mb-3"><AccountInfoItem action="退出其他设备" destructive description="退出除当前设备以外的全部活跃会话。" onAction={() => openAccountAction("logout-all")} title="退出其他设备" /></div>
      <div className="overflow-x-auto"><Table className="min-w-[620px]"><TableHeader><TableRow><TableHead>设备名称</TableHead><TableHead>最近活跃</TableHead><TableHead>位置</TableHead><TableHead className="w-24 text-right"><span className="sr-only">操作</span></TableHead></TableRow></TableHeader><TableBody>{devices.map((device, index) => <TableRow index={index} key={device.id}><TableCell className="font-medium text-fg-default">{device.name}{device.current && <span className="ml-2 text-label font-normal text-fg-brand">当前设备</span>}</TableCell><TableCell className="text-fg-muted">{device.lastActive}</TableCell><TableCell className="text-fg-muted">{device.location}</TableCell><TableCell><div className="flex justify-end">{!device.current && <Button onClick={() => openAccountAction("logout-device", device.id)} size="md" type="button" variant="tertiary">退出</Button>}</div></TableCell></TableRow>)}</TableBody></Table></div>
    </SettingsSection>

    <Dialog onOpenChange={(open) => { if (!open) { setAccountAction(null); setDeviceToLogout(null); } }} open={accountAction !== null}><DialogContent size="sm"><DialogHeader><DialogTitle>{actionCopy.title}</DialogTitle><DialogDescription>{actionCopy.description}</DialogDescription></DialogHeader>{accountAction === "email" && <div><label className="text-body font-medium text-fg-default" htmlFor="account-email">邮箱地址</label><InputGroup className="mt-2"><InputGroupInput id="account-email" onChange={(event) => setEmailDraft(event.target.value)} type="email" value={emailDraft} /></InputGroup></div>}{accountAction === "password" && <div><label className="text-body font-medium text-fg-default" htmlFor="account-password">新密码</label><InputGroup className="mt-2"><InputGroupInput id="account-password" placeholder="至少 8 位字符" type="password" /></InputGroup></div>}<DialogFooter><DialogClose render={<Button type="button" variant="ghost">取消</Button>} /><Button onClick={confirmAccountAction} type="button" variant={accountAction === "delete" || accountAction === "logout-all" || accountAction === "logout-device" ? "destructive" : "primary"}>{actionCopy.confirm}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
  return <section aria-labelledby={`${title}-title`}><h2 className="border-b border-border pb-3 text-title font-semibold text-fg-default" id={`${title}-title`}>{title}</h2><div className="pt-4">{children}</div></section>;
}

function PreferenceInfoItem({ badge, children, description, title }: { badge?: string; children: ReactNode; description: string; title: string }) {
  return <InfoItem className="min-h-[76px] px-4 py-3.5"><InfoItemContent><InfoItemTitle className="flex items-center gap-1.5">{title}{badge && <Badge color="gray" size="sm">{badge}</Badge>}</InfoItemTitle><InfoItemDescription>{description}</InfoItemDescription></InfoItemContent><InfoItemTrailing>{children}</InfoItemTrailing></InfoItem>;
}

function PreferenceSelect({ ariaLabel, disabled = false, onChange, options, value }: { ariaLabel: string; disabled?: boolean; onChange: (value: string) => void; options: readonly { label: string; value: string }[]; value: string }) {
  return <Select disabled={disabled} onValueChange={onChange} size="md" value={value}><SelectTrigger aria-label={ariaLabel} className="min-w-32 max-w-56" /> <SelectContent>{options.map((option, index) => <SelectItem index={index} key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}

function AccountInfoItem({ action, description, destructive = false, disabled = false, grouped = false, onAction, title }: { action: string; description: string; destructive?: boolean; disabled?: boolean; grouped?: boolean; onAction: () => void; title: string }) {
  return <InfoItem className={cn("min-h-[76px] px-4 py-3.5", !grouped && "rounded-lg border-[0.5px] border-border")}><InfoItemContent><InfoItemTitle>{title}</InfoItemTitle><InfoItemDescription>{description}</InfoItemDescription></InfoItemContent><InfoItemTrailing><Button disabled={disabled} onClick={onAction} size="md" type="button" variant={destructive ? "destructive" : "tertiary"}>{action}</Button></InfoItemTrailing></InfoItem>;
}

function UsageSettings() {
  const MessageIcon = useIcon("message-circle");
  const heatmapColor = ["bg-hover", "bg-brand/30", "bg-brand/60", "bg-brand"] as const;

  return <div className="space-y-5 py-1">
    <header><h1 className="text-heading font-semibold text-fg-default">👋 你好 Carlos，这是你与 Zentrix 一起记录协作的第 466 天</h1></header>

    <section aria-labelledby="usage-week-title"><h2 className="text-body font-medium text-fg-default" id="usage-week-title">最近一周使用行为</h2><div className="mt-3 grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">{usageMetrics.map((metric) => <MetricCard className="h-full self-stretch rounded-lg bg-surface-base [&_[data-slot=metric-card-label]]:text-label [&_[data-slot=metric-card-value-row]]:mt-1 [&_[data-slot=metric-card-value-row]>span:first-child]:text-title" footer={<span className={cn(metric.positive === true ? "text-fg-brand" : metric.positive === false ? "text-fg-muted" : "text-fg-subtle")}><span className="font-medium">{metric.change}</span> {metric.detail}</span>} key={metric.label} label={metric.label} value={metric.value} />)}</div></section>

    <section aria-label="过去一年的使用热力图" className="overflow-hidden rounded-lg border-[0.5px] border-border bg-surface-base p-3 sm:p-4"><div className="overflow-x-auto pb-1"><div className="min-w-[720px]"><div className="grid grid-cols-12 gap-2">{usageMonths.map((month, monthIndex) => <div key={month}><p className="text-label text-fg-subtle">{month}</p><div className="mt-2 grid grid-flow-col grid-rows-7 gap-1">{Array.from({ length: 28 }, (_, index) => { const week = Math.floor(index / 7); const day = index % 7; const level = heatmapActivity[`${monthIndex}-${week}-${day}`] ?? 0; return <span aria-hidden className={cn("aspect-square rounded-[2px]", heatmapColor[level])} key={index} />; })}</div></div>)}</div></div></div><div className="mt-3 flex items-center justify-end gap-1.5 text-label text-fg-subtle"><span>较少</span>{heatmapColor.map((color, index) => <span aria-hidden className={cn("size-3 rounded-[2px]", color)} key={index} />)}<span>较多</span></div></section>

    <div className="grid gap-2 sm:grid-cols-4">{usageSummaries.map((summary) => <div className="rounded-lg bg-surface-base px-3 py-2.5" key={summary.label}><p className="text-body font-semibold tabular-nums text-fg-default">{summary.value}</p><p className="mt-0.5 text-label text-fg-muted">{summary.label}</p></div>)}</div>

    <div className="grid gap-5 lg:grid-cols-3"><UsageRank title="模型使用率" subtitle="模型 / 消息数" rows={[{ label: "DeepSeek", value: "11", fill: "100%", icon: <DeepSeekColor size={16} /> }, { label: "gpt-4o-mini", value: "2", fill: "18%", icon: <OpenAIMono size={15} /> }]} /><UsageRank title="MCP 使用率" subtitle="助手 / 话题数" rows={[{ label: "Jira", value: "2", fill: "100%", icon: <span className="flex size-4 items-center justify-center rounded-sm bg-brand text-[9px] font-bold text-fg-on-brand">J</span> }]} /><UsageRank title="话题内容量" subtitle="话题 / 消息数" rows={[{ label: "Onboarding", value: "24", fill: "100%", icon: <MessageIcon size={16} strokeWidth={1.5} /> }, { label: "自我介绍", value: "4", fill: "18%", icon: <MessageIcon size={16} strokeWidth={1.5} /> }]} /></div>
  </div>;
}

function UsageRank({ rows, subtitle, title }: { rows: readonly { label: string; value: string; fill: string; icon: ReactNode }[]; subtitle: string; title: string }) {
  return <section aria-label={title}><div className="flex items-baseline justify-between"><h2 className="text-body font-medium text-fg-default">{title}</h2><span className="text-label text-fg-subtle">{subtitle}</span></div><div className="mt-3 space-y-2.5">{rows.map((row) => <div className="relative overflow-hidden rounded-lg bg-hover px-2.5 py-2" key={row.label}><span aria-hidden className="absolute inset-y-0 left-0 rounded-lg bg-brand/15" style={{ width: row.fill }} /><div className="relative flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2 text-label text-fg-default"><span className="flex size-5 shrink-0 items-center justify-center text-fg-muted">{row.icon}</span><span className="truncate">{row.label}</span></div><span className="shrink-0 text-label font-medium tabular-nums text-fg-default">{row.value}</span></div></div>)}</div></section>;
}
