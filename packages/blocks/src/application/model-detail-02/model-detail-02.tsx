"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
} from "react";
import type { ColumnDef } from "@tanstack/react-table";
import AzureColor from "@lobehub/icons/es/Azure/components/Color";
import CodexMono from "@lobehub/icons/es/Codex/components/Mono";
import CursorMono from "@lobehub/icons/es/Cursor/components/Mono";
import HermesAgentMono from "@lobehub/icons/es/HermesAgent/components/Mono";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import PiMono from "@lobehub/icons/es/Pi/components/Mono";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  AccordionContent,
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
} from "@zeron/ui/accordion";
import { AppShell, AppShellHeader, AppShellMain } from "@zeron/ui/app-shell";
import { Badge } from "@zeron/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@zeron/ui/breadcrumb";
import { Button } from "@zeron/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardGroup,
  CardHeader,
  CardTitle,
} from "@zeron/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@zeron/ui/chart";
import { Checkbox } from "@zeron/ui/checkbox";
import { Container, ContainerBody, ContainerHeader } from "@zeron/ui/container";
import { DataTable, useDataTable } from "@zeron/ui/data-table";
import {
  InfoItem,
  InfoItemContent,
  InfoItemDescription,
  InfoItemGroup,
  InfoItemLeading,
  InfoItemTitle,
  InfoItemTrailing,
  InfoItemValue,
} from "@zeron/ui/info-item";
import { MetricCard } from "@zeron/ui/metric-card";
import {
  NavItem,
  NavItemContent,
  NavItemLabel,
  NavItemTrigger,
} from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import {
  PageActions,
  PageAside,
  PageBody,
  PageColumns,
  PageContent,
  PageLayout,
  PagePrimary,
  PageSubnav,
  PageSubnavItem,
  PageSubnavList,
} from "@zeron/ui/page-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@zeron/ui/select";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
import {
  TopNav,
  TopNavActions,
  TopNavBrand,
  TopNavNavigation,
} from "@zeron/ui/top-nav";
import { Tooltip, TooltipProvider } from "@zeron/ui/tooltip";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { AvailabilityMonitor } from "../availability-monitor-01";
import {
  defaultModelAnalyticsDetail,
  type ChartPoint,
  type ModelAnalyticsDetailData,
  type PerformanceChart,
  type PriceProviderRecord,
  type ProviderRecord,
} from "./model-detail-02-data";

function ModalityIcon({
  icon: Icon,
  label,
  className,
}: {
  icon: IconComponent;
  label: string;
  className: string;
}) {
  return (
    <Tooltip content={label} side="top">
      <span
        aria-label={label}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-focus-ring",
          className,
        )}
        role="img"
        tabIndex={0}
      >
        <Icon size={18} strokeWidth={1.5} />
      </span>
    </Tooltip>
  );
}

function ModalitiesValue() {
  const FileIcon = useIcon("file");
  const ImageIcon = useIcon("image");
  const TextIcon = useIcon("type");
  const ArrowRightIcon = useIcon("arrow-right");

  return (
    <TooltipProvider>
      <span aria-label="Files, images, and text input to text output" className="inline-flex items-center gap-2">
        <ModalityIcon className="bg-warning-surface text-fg-warning" icon={FileIcon} label="Files input" />
        <ModalityIcon className="bg-success-surface text-fg-success" icon={ImageIcon} label="Images input" />
        <ModalityIcon className="bg-info-surface text-fg-info" icon={TextIcon} label="Text input" />
        <span aria-hidden className="inline-flex text-fg-muted">
          <ArrowRightIcon size={16} strokeWidth={1.5} />
        </span>
        <ModalityIcon className="bg-info-surface text-fg-info" icon={TextIcon} label="Text output" />
      </span>
    </TooltipProvider>
  );
}

const sectionItems = [
  ["providers", "Providers"],
  ["pricing", "Pricing"],
  ["performance", "Performance"],
  ["uptime", "Uptime"],
  ["benchmarks", "Benchmarks"],
  ["apps", "Apps"],
  ["activity", "Activity"],
  ["faq", "FAQ"],
] as const;

type SectionId = (typeof sectionItems)[number][0];
type PricingSource = "effective" | "listed";
type PricingMetric = "input" | "output";
type PricingRange = "3d" | "1w" | "1m" | "3m" | "1y" | "all";

const providerChartConfig = {
  openai: { label: "OpenAI", color: "var(--brand)" },
  azure: { label: "Azure", color: "var(--success-border)" },
  "openai-flex": { label: "OpenAI Flex", color: "var(--warning-border)" },
  "azure-us": { label: "Azure (US)", color: "var(--info-border)" },
  "openai-fast": { label: "OpenAI Fast", color: "var(--danger-border)" },
} satisfies ChartConfig;

const activityChartConfig = {
  prompt: { label: "Prompt", color: "var(--brand)" },
  completion: { label: "Completion", color: "var(--success-border)" },
  reasoning: { label: "Reasoning", color: "var(--warning-border)" },
} satisfies ChartConfig;

const appChartConfig = {
  hermes: { label: "Hermes Agent", color: "var(--brand)" },
  codex: { label: "Codex", color: "var(--success-border)" },
  other: { label: "Other apps", color: "var(--warning-border)" },
} satisfies ChartConfig;

export interface ModelDetail02Props
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  data?: ModelAnalyticsDetailData;
  defaultSection?: SectionId;
  onOpenPlayground?: () => void;
  onRequestApiKey?: () => void;
  onProviderSelect?: (providerId: string) => void;
  onNavigate?: (href: string) => void;
}

function money(value: number, maximumFractionDigits = 3) {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits })}`;
}

function percent(value: number) {
  return `${value.toFixed(2).replace(/\.00$/, "")}%`;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    notation: "compact",
  }).format(value);
}

function followLink(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate?: (href: string) => void,
) {
  if (!onNavigate) return;
  event.preventDefault();
  onNavigate(href);
}

const applicationNavigation = [
  { href: "#home", label: "首页" },
  { href: "#models", label: "模型服务" },
  { href: "#mcp", label: "MCP 广场" },
] as const;

function ModelDetailTopNav({ onNavigate }: { onNavigate?: (href: string) => void }) {
  return (
    <AppShellHeader className="static bg-surface-base">
      <TopNav className="px-3" navigationAlign="center">
        <TopNavBrand className="gap-3 text-fg-default">
          <strong className="text-heading font-bold leading-none">Zentrix</strong>
          <span className="hidden text-body font-medium @[38rem]:inline">能力中心</span>
        </TopNavBrand>
        <TopNavNavigation className="overflow-hidden max-sm:hidden">
          <NavMenu
            activeValue="#models"
            aria-label="能力中心导航"
            as="div"
            className="w-full"
            keyboardNavigation="roving"
            orientation="horizontal"
            variant="underline"
          >
            {applicationNavigation.map((item) => (
              <NavItem className="shrink-0" key={item.href} value={item.href}>
                <NavItemTrigger
                  href={item.href}
                  onClick={(event) => followLink(event, item.href, onNavigate)}
                >
                  <NavItemContent>
                    <NavItemLabel>{item.label}</NavItemLabel>
                  </NavItemContent>
                </NavItemTrigger>
              </NavItem>
            ))}
          </NavMenu>
        </TopNavNavigation>
        <TopNavActions>
          <Button size="sm" type="button" variant="neutral">
            登录
          </Button>
        </TopNavActions>
      </TopNav>
    </AppShellHeader>
  );
}

function SectionHeader({
  description,
  title,
}: {
  description?: string;
  title: string;
}) {
  return (
    <header>
      <h2 className="text-heading font-semibold text-fg-default">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-prose text-body leading-6 text-fg-muted">
          {description}
        </p>
      ) : null}
    </header>
  );
}

function SectionNavigation({
  activeSection,
  onSectionChange,
  orientation,
}: {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  orientation: "desktop" | "mobile";
}) {
  if (orientation === "mobile") {
    return (
      <PageSubnav aria-label="Model page sections" className="overflow-x-auto">
        <PageSubnavList
          activeValue={activeSection}
          className="min-w-max w-max [&>_[data-slot=nav-item]]:shrink-0"
        >
          {sectionItems.map(([id, label]) => (
            <PageSubnavItem
              href={`#${id}`}
              key={id}
              onClick={(event) => {
                event.preventDefault();
                onSectionChange(id);
              }}
              value={id}
            >
              {label}
            </PageSubnavItem>
          ))}
        </PageSubnavList>
      </PageSubnav>
    );
  }

  return (
    <nav aria-label="Model page sections" className="grid gap-1 p-3">
      {sectionItems.map(([id, label]) => (
        <Button
          active={activeSection === id}
          asChild
          className="w-full justify-start text-left"
          key={id}
          variant="ghost"
        >
          <a
            href={`#${id}`}
            onClick={(event) => {
              event.preventDefault();
              onSectionChange(id);
            }}
          >
            {label}
          </a>
        </Button>
      ))}
    </nav>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className="py-8 text-center text-body text-fg-muted">{children}</p>;
}

function ProviderLogo({ name }: { name: string }) {
  const Logo = name.startsWith("Azure") ? AzureColor : OpenAIMono;
  return <Logo aria-hidden className="shrink-0" size={16} />;
}

function OmpLogo() {
  return (
    <svg aria-hidden className="size-4 shrink-0" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="omp-logo-gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ed4abf" />
          <stop offset=".5" stopColor="#9b4dff" />
          <stop offset="1" stopColor="#5ad8e6" />
        </linearGradient>
      </defs>
      <rect fill="#0f0a14" height="64" rx="12" width="64" />
      <path d="M14 16h36v8H40v32h-8V24h-6v22h-8V24h-4z" fill="url(#omp-logo-gradient)" />
    </svg>
  );
}

function AppLogo({ id }: { id: string }) {
  const FallbackIcon = useIcon("rocket");

  if (id === "hermes-agent") return <HermesAgentMono aria-hidden className="shrink-0" size={16} />;
  if (id === "codex") return <CodexMono aria-hidden className="shrink-0" size={16} />;
  if (id === "cursor") return <CursorMono aria-hidden className="shrink-0" size={16} />;
  if (id === "omp") return <OmpLogo />;
  if (id === "pi") return <PiMono aria-hidden className="shrink-0" size={16} />;

  return <FallbackIcon aria-hidden className="shrink-0" size={16} strokeWidth={1.5} />;
}

function ProvidersSection({
  data,
  onProviderSelect,
}: {
  data: ModelAnalyticsDetailData;
  onProviderSelect?: (providerId: string) => void;
}) {
  const [routingMode, setRoutingMode] = useState("standard");
  const [sortBy, setSortBy] = useState("default");
  const rows = useMemo(() => {
    const result = [...data.providers];
    if (routingMode === "nitro") result.sort((a, b) => b.throughput - a.throughput);
    if (routingMode === "exacto") result.sort((a, b) => a.latencySeconds - b.latencySeconds);
    if (sortBy === "price") result.sort((a, b) => a.inputPrice - b.inputPrice);
    if (sortBy === "uptime") result.sort((a, b) => b.uptime - a.uptime);
    return result;
  }, [data.providers, routingMode, sortBy]);
  const columns = useMemo<ColumnDef<ProviderRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onProviderSelect?.(row.original.id)}
              size="sm"
              variant="ghost"
            >
              <span className="inline-flex items-center gap-2">
                <ProviderLogo name={row.original.name} />
                {row.original.name}
              </span>
            </Button>
            <Badge size="sm" variant="dot">{row.original.privacy}</Badge>
          </div>
        ),
        header: "Provider",
      },
      {
        accessorKey: "inputPrice",
        cell: ({ row }) => <span className="tabular-nums">{money(row.original.inputPrice)}</span>,
        header: "Input /M",
      },
      {
        accessorKey: "outputPrice",
        cell: ({ row }) => <span className="tabular-nums">{money(row.original.outputPrice)}</span>,
        header: "Output /M",
      },
      {
        accessorKey: "cacheReadPrice",
        cell: ({ row }) => <span className="tabular-nums">{money(row.original.cacheReadPrice)}</span>,
        header: "Cache read /M",
      },
      {
        accessorKey: "latencySeconds",
        cell: ({ row }) => <span className="tabular-nums">{row.original.latencySeconds.toFixed(2)} s</span>,
        header: "Latency",
      },
      {
        accessorKey: "throughput",
        cell: ({ row }) => <span className="tabular-nums">{row.original.throughput} tok/s</span>,
        header: "Throughput",
      },
      {
        accessorKey: "uptime",
        cell: ({ row }) => <span className="tabular-nums">{percent(row.original.uptime)}</span>,
        header: "Uptime",
      },
    ],
    [onProviderSelect],
  );
  const { table } = useDataTable({
    columns,
    data: rows,
    getRowId: (provider) => provider.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <section className="scroll-mt-4 space-y-4" data-model-section id="providers">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader
          description="OpenRouter routes requests across providers based on your preferences and provider health."
          title="Providers"
        />
        <div className="flex flex-wrap gap-2">
          <Select onValueChange={setRoutingMode} value={routingMode}>
            <SelectTrigger aria-label="Routing mode" />
            <SelectContent>
              <SelectItem value="standard">Standard routing</SelectItem>
              <SelectItem value="nitro">Nitro: fastest first</SelectItem>
              <SelectItem value="exacto">Exacto: lowest latency first</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setSortBy} value={sortBy}>
            <SelectTrigger aria-label="Sort providers" />
            <SelectContent>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="price">Lowest input price</SelectItem>
              <SelectItem value="uptime">Highest uptime</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        className="[&_table]:min-w-[880px]"
        emptyMessage="No providers are available."
        onRowActivate={onProviderSelect ? (row) => onProviderSelect(row.original.id) : undefined}
        table={table}
      />
    </section>
  );
}

function pricingSeries(
  data: ModelAnalyticsDetailData,
  source: PricingSource,
  metric: PricingMetric,
) {
  const key = `${source}${metric[0]?.toUpperCase()}${metric.slice(1)}` as
    | "effectiveInput"
    | "effectiveOutput"
    | "listedInput"
    | "listedOutput";
  return data.pricing[key];
}

function trimRange(data: readonly ChartPoint[], range: PricingRange) {
  if (range === "3d") return data.slice(-3);
  return data;
}

function PricingSection({ data }: { data: ModelAnalyticsDetailData }) {
  const [source, setSource] = useState<PricingSource>("effective");
  const [metric, setMetric] = useState<PricingMetric>("input");
  const [range, setRange] = useState<PricingRange>("1w");
  const [visibleProviders, setVisibleProviders] = useState<Record<string, boolean>>(
    () => Object.fromEntries(data.pricing.providers.map((provider) => [provider.id, true])),
  );
  const chartData = trimRange(pricingSeries(data, source, metric), range);

  return (
    <section className="scroll-mt-4 space-y-4" data-model-section id="pricing">
      <SectionHeader
        description="Historical prices paid through OpenRouter, including cache effects and each provider's token share."
        title="Pricing"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label="Weighted input price"
          meta="Per 1M tokens"
          value={money(data.pricing.weightedInput)}
        />
        <MetricCard
          label="Weighted output price"
          meta="Per 1M tokens"
          value={money(data.pricing.weightedOutput)}
        />
      </div>

      <CardGroup border="outlined" separated>
        <Card>
          <CardHeader>
            <CardTitle>Price history</CardTitle>
            <CardDescription>Compare effective or listed prices by token direction.</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Tabs onValueChange={(value) => setSource(value as PricingSource)} value={source} variant="segment">
                <TabsList>
                  <TabItem label="Effective" value="effective" />
                  <TabItem label="Listed" value="listed" />
                </TabsList>
              </Tabs>
              <Tabs onValueChange={(value) => setMetric(value as PricingMetric)} value={metric} variant="segment">
                <TabsList>
                  <TabItem label="Input" value="input" />
                  <TabItem label="Output" value="output" />
                </TabsList>
              </Tabs>
            </div>
            <Tabs color="default" onValueChange={(value) => setRange(value as PricingRange)} value={range} variant="pill">
              <TabsList>
                {(["3d", "1w", "1m", "3m", "1y", "all"] as const).map((value) => (
                  <TabItem key={value} label={value.toUpperCase()} value={value} />
                ))}
              </TabsList>
            </Tabs>
          </div>

          {chartData.length ? (
            <ChartContainer
              aria-label={`${source} ${metric} price history`}
              className="mt-4 h-[320px] min-h-0"
              config={providerChartConfig}
            >
              <LineChart accessibilityLayer data={[...chartData]} margin={{ left: 4, right: 12, top: 8 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                <XAxis axisLine={false} dataKey="date" tickLine={false} tickMargin={8} />
                <YAxis axisLine={false} tickFormatter={(value: number) => `$${value}`} tickLine={false} width={52} />
                <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => money(Number(value), 4)} />} />
                {data.pricing.providers.map((provider) => (
                  <Line
                    dataKey={provider.id}
                    dot={false}
                    hide={!visibleProviders[provider.id]}
                    isAnimationActive={false}
                    key={provider.id}
                    stroke={`var(--color-${provider.id})`}
                    strokeWidth={2}
                    type="monotone"
                  />
                ))}
              </LineChart>
            </ChartContainer>
          ) : (
            <EmptyState>No pricing history is available.</EmptyState>
          )}

          <div aria-label="Price series" className="mt-3 flex flex-wrap gap-3">
            {data.pricing.providers.map((provider) => (
              <label className="flex items-center gap-2 text-label text-fg-muted" key={provider.id}>
                <Checkbox
                  checked={visibleProviders[provider.id] !== false}
                  onCheckedChange={(checked) =>
                    setVisibleProviders((current) => ({ ...current, [provider.id]: checked === true }))
                  }
                />
                {provider.name}
              </label>
            ))}
          </div>
          </CardContent>
        </Card>
      </CardGroup>

      <PricingProviderTable providers={data.pricing.providers} />
    </section>
  );
}

function PricingProviderTable({ providers }: { providers: readonly PriceProviderRecord[] }) {
  const columns = useMemo<ColumnDef<PriceProviderRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        cell: ({ row }) => (
          <span className="flex items-center gap-2 font-medium text-fg-default">
            <ProviderLogo name={row.original.name} />
            {row.original.name}
          </span>
        ),
        header: "Provider",
      },
      {
        accessorKey: "effectiveInput",
        cell: ({ row }) => <span className="tabular-nums">{money(row.original.effectiveInput)}</span>,
        header: "Effective input",
      },
      {
        accessorKey: "effectiveOutput",
        cell: ({ row }) => <span className="tabular-nums">{money(row.original.effectiveOutput)}</span>,
        header: "Effective output",
      },
      {
        accessorKey: "listedInput",
        cell: ({ row }) => <span className="tabular-nums">{money(row.original.listedInput)}</span>,
        header: "Listed input",
      },
      {
        accessorKey: "listedOutput",
        cell: ({ row }) => <span className="tabular-nums">{money(row.original.listedOutput)}</span>,
        header: "Listed output",
      },
      {
        accessorKey: "cacheHitRate",
        cell: ({ row }) => <span className="tabular-nums">{percent(row.original.cacheHitRate)}</span>,
        header: "Cache hit",
      },
      {
        accessorKey: "tokenShare",
        cell: ({ row }) => <span className="tabular-nums">{percent(row.original.tokenShare)}</span>,
        header: "1d token share",
      },
    ],
    [],
  );
  const data = useMemo(() => [...providers], [providers]);
  const { table } = useDataTable({
    columns,
    data,
    getRowId: (provider) => provider.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <section className="space-y-3" aria-labelledby="provider-pricing-title">
      <h3 className="text-title font-semibold text-fg-default" id="provider-pricing-title">Provider pricing</h3>
      <DataTable
        className="[&_table]:min-w-[900px]"
        emptyMessage="No provider pricing is available."
        table={table}
      />
    </section>
  );
}

function PerformanceCardView({
  chart,
  period,
}: {
  chart: PerformanceChart;
  period: string;
}) {
  const chartData = period === "3d" ? chart.data.slice(-3) : chart.data;
  return (
    <CardGroup border="outlined" separated>
      <Card>
        <CardHeader>
          <CardTitle>{chart.title}</CardTitle>
          <CardDescription>
            {chart.series.map((series) => `${series.label} ${series.average}`).join(" · ")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chart.kind === "benchmark" ? (
            <InfoItemGroup>
              {chart.series.map((series) => (
                <InfoItem key={series.key} layout="inline">
                  <InfoItemContent>
                    <InfoItemTitle>{series.label}</InfoItemTitle>
                    <InfoItemDescription>GPQA Diamond</InfoItemDescription>
                  </InfoItemContent>
                  <InfoItemTrailing>
                    <InfoItemValue>{series.average}</InfoItemValue>
                  </InfoItemTrailing>
                </InfoItem>
              ))}
            </InfoItemGroup>
          ) : chartData.length ? (
            <ChartContainer aria-label={chart.title} className="h-[220px] min-h-0" config={providerChartConfig}>
              <LineChart accessibilityLayer data={[...chartData]} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                <XAxis axisLine={false} dataKey="date" tickLine={false} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} width={42} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {chart.series.map((series) => (
                  <Line
                    dataKey={series.key}
                    dot={false}
                    isAnimationActive={false}
                    key={series.key}
                    stroke={`var(--color-${series.key})`}
                    strokeWidth={2}
                    type="monotone"
                  />
                ))}
              </LineChart>
            </ChartContainer>
          ) : (
            <EmptyState>No performance history is available.</EmptyState>
          )}
        </CardContent>
      </Card>
    </CardGroup>
  );
}

function PerformanceSection({ data }: { data: ModelAnalyticsDetailData }) {
  const [location, setLocation] = useState("all");
  const [percentileValue, setPercentileValue] = useState("p50");
  const [period, setPeriod] = useState("1w");
  return (
    <section className="scroll-mt-4 space-y-4" data-model-section id="performance">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader
          description="Provider performance measured from real traffic on OpenRouter."
          title="Performance"
        />
        <div className="flex flex-wrap gap-2">
          <Select onValueChange={setLocation} value={location}>
            <SelectTrigger aria-label="Performance location" />
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              <SelectItem value="us">United States</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setPercentileValue} value={percentileValue}>
            <SelectTrigger aria-label="Performance percentile" />
            <SelectContent>
              <SelectItem value="p50">P50</SelectItem>
              <SelectItem value="p75">P75</SelectItem>
              <SelectItem value="p90">P90</SelectItem>
              <SelectItem value="p99">P99</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setPeriod} value={period}>
            <SelectTrigger aria-label="Performance period" />
            <SelectContent>
              <SelectItem value="3d">3 days</SelectItem>
              <SelectItem value="1w">1 week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Throughput" meta="P50 best across providers" unit="tok/s" value={data.performance.throughput} />
        <MetricCard label="Latency" meta="P50 best provider" unit="s" value={data.performance.latencySeconds.toFixed(2)} />
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {data.performance.charts.map((chart) => (
          <PerformanceCardView chart={chart} key={chart.id} period={period} />
        ))}
      </div>
    </section>
  );
}

function BenchmarksSection({ data }: { data: ModelAnalyticsDetailData }) {
  return (
    <section className="scroll-mt-4 space-y-4" data-model-section id="benchmarks">
      <SectionHeader
        description="Independent model evaluations from Artificial Analysis."
        title="Benchmarks"
      />
      <div className="grid gap-3 md:grid-cols-3">
        {data.benchmarkIndexes.map((benchmark) => (
          <MetricCard
            key={benchmark.id}
            label={benchmark.label}
            meta={`Better than ${benchmark.percentile}% of models`}
            value={benchmark.value}
          />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {data.benchmarkGroups.map((group) => (
          <Container key={group.id}>
            <ContainerHeader>
              <h3 className="text-body font-medium text-fg-default">{group.label}</h3>
            </ContainerHeader>
            <ContainerBody>
              <InfoItemGroup>
                {group.metrics.map((metric) => (
                  <InfoItem key={metric.id}>
                    <InfoItemContent>
                      <InfoItemTitle>{metric.label}</InfoItemTitle>
                      <InfoItemDescription>{metric.description}</InfoItemDescription>
                    </InfoItemContent>
                    <InfoItemTrailing>
                      <InfoItemValue>{percent(metric.value)}</InfoItemValue>
                    </InfoItemTrailing>
                  </InfoItem>
                ))}
              </InfoItemGroup>
            </ContainerBody>
          </Container>
        ))}
      </div>
    </section>
  );
}

function AppsSection({ data }: { data: ModelAnalyticsDetailData }) {
  return (
    <section className="scroll-mt-4 space-y-4" data-model-section id="apps">
      <SectionHeader
        description="Apps using GPT-6 Astra through OpenRouter, ranked by captured token volume."
        title="Apps"
      />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
        <InfoItemGroup>
          {data.apps.map((app) => (
            <InfoItem key={app.id}>
              <InfoItemLeading>{app.rank}</InfoItemLeading>
              <InfoItemContent>
                <InfoItemTitle>
                  <span className="inline-flex items-center gap-2">
                    <AppLogo id={app.id} />
                    {app.name}
                  </span>
                </InfoItemTitle>
                <InfoItemDescription>{app.description}</InfoItemDescription>
              </InfoItemContent>
              <InfoItemTrailing>
                <InfoItemValue>{compactNumber(app.tokens)}</InfoItemValue>
              </InfoItemTrailing>
            </InfoItem>
          ))}
        </InfoItemGroup>
        <Card>
          <CardHeader>
            <CardTitle>App activity</CardTitle>
            <CardDescription>Daily token volume, billions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer aria-label="App token activity" className="h-[300px] min-h-0" config={appChartConfig}>
              <BarChart accessibilityLayer data={[...data.appActivity]} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                <XAxis axisLine={false} dataKey="date" tickLine={false} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} width={34} />
                <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${Number(value).toFixed(1)}B`} />} />
                <Bar dataKey="hermes" fill="var(--color-hermes)" isAnimationActive={false} stackId="apps" />
                <Bar dataKey="codex" fill="var(--color-codex)" isAnimationActive={false} stackId="apps" />
                <Bar dataKey="other" fill="var(--color-other)" isAnimationActive={false} stackId="apps" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ActivitySection({ data }: { data: ModelAnalyticsDetailData }) {
  const [metric, setMetric] = useState("tokens");
  const latest = data.activity[data.activity.length - 1];
  return (
    <section className="scroll-mt-4 space-y-4" data-model-section id="activity">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader
          description="Daily prompt, completion, and reasoning tokens processed through OpenRouter."
          title="Activity"
        />
        <Select onValueChange={setMetric} value={metric}>
          <SelectTrigger aria-label="Activity metric" />
          <SelectContent>
            <SelectItem value="tokens">Tokens</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Prompt" meta="Latest captured day" value={compactNumber(latest?.prompt ?? 0)} />
        <MetricCard label="Completion" meta="Latest captured day" value={compactNumber(latest?.completion ?? 0)} />
        <MetricCard label="Reasoning" meta="Latest captured day" value={compactNumber(latest?.reasoning ?? 0)} />
      </div>
      <CardGroup border="outlined" separated>
        <Card>
          <CardHeader>
            <CardTitle>Token activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.activity.length ? (
              <ChartContainer aria-label="Daily token activity" className="h-[340px] min-h-0" config={activityChartConfig}>
                <AreaChart accessibilityLayer data={[...data.activity]} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis axisLine={false} dataKey="date" tickLine={false} tickMargin={8} />
                  <YAxis axisLine={false} tickFormatter={(value: number) => compactNumber(value)} tickLine={false} width={52} />
                  <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => compactNumber(Number(value))} />} />
                  <Area dataKey="prompt" fill="var(--color-prompt)" fillOpacity={0.2} isAnimationActive={false} stackId="tokens" stroke="var(--color-prompt)" />
                  <Area dataKey="completion" fill="var(--color-completion)" fillOpacity={0.2} isAnimationActive={false} stackId="tokens" stroke="var(--color-completion)" />
                  <Area dataKey="reasoning" fill="var(--color-reasoning)" fillOpacity={0.2} isAnimationActive={false} stackId="tokens" stroke="var(--color-reasoning)" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyState>No activity data is available.</EmptyState>
            )}
          </CardContent>
        </Card>
      </CardGroup>
    </section>
  );
}

function FaqSection({ data }: { data: ModelAnalyticsDetailData }) {
  return (
    <section className="scroll-mt-4 space-y-4" data-model-section id="faq">
      <SectionHeader title="Frequently asked questions" />
      {data.faqs.length ? (
        <AccordionGroup className="w-full" collapsible type="single">
          {data.faqs.map((faq, index) => (
            <AccordionItem index={index} key={faq.id} value={faq.id}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p>{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </AccordionGroup>
      ) : (
        <EmptyState>No frequently asked questions are available.</EmptyState>
      )}
    </section>
  );
}

/** A complete model analytics page composed from Zeron components and a captured OpenRouter data snapshot. */
export function ModelDetail02({
  className,
  data = defaultModelAnalyticsDetail,
  defaultSection = "providers",
  onNavigate,
  onOpenPlayground,
  onProviderSelect,
  onRequestApiKey,
  ...props
}: ModelDetail02Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<SectionId>(defaultSection);

  useEffect(() => {
    const root = contentRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id as SectionId);
      },
      { root, rootMargin: "-12% 0px -68% 0px", threshold: [0, 0.1, 0.35] },
    );
    const selectLastSectionAtBottom = () => {
      const remainingScroll = root.scrollHeight - root.scrollTop - root.clientHeight;
      if (remainingScroll <= 1) {
        setActiveSection(sectionItems[sectionItems.length - 1][0]);
      }
    };

    root.querySelectorAll<HTMLElement>("[data-model-section]").forEach((section) => observer.observe(section));
    root.addEventListener("scroll", selectLastSectionAtBottom, { passive: true });
    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", selectLastSectionAtBottom);
    };
  }, [data]);

  const selectSection = (section: SectionId) => {
    setActiveSection(section);
    const root = contentRef.current;
    const target = root?.querySelector<HTMLElement>(`#${section}`);
    if (!root || !target) return;

    const scrollMarginTop = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const top =
      root.scrollTop +
      target.getBoundingClientRect().top -
      root.getBoundingClientRect().top -
      scrollMarginTop;

    root.scrollTo({ behavior: "smooth", top });
    window.history.replaceState(null, "", `#${section}`);
  };

  return (
    <AppShell
      className={cn("h-full min-h-0 overflow-hidden bg-surface-base", className)}
      layout="stacked"
      {...props}
    >
      <ModelDetailTopNav onNavigate={onNavigate} />
      <AppShellMain className="min-h-0 overflow-hidden" landmark={false}>
        <PageLayout className="h-full bg-surface-base pt-0" size="full">
          <PageContent className="overflow-y-auto overscroll-contain" ref={contentRef}>
            <PageBody className="max-w-[1320px] flex-none overflow-visible px-3 py-3 sm:px-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>OpenRouter</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{data.model.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <section aria-labelledby="model-detail-title" className="mt-3 rounded-2xl bg-muted p-3">
            <div className="flex min-w-0 items-start gap-3 max-sm:flex-col">
              <div
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-floating text-fg-default"
              >
                <OpenAIMono size={24} />
              </div>
              <div className="min-w-0">
                <h1 className="text-title text-fg-default" id="model-detail-title">
                  {data.model.name}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge size="sm">{data.model.provider}</Badge>
                  <Badge className="font-mono" size="sm">
                    {data.model.slug}
                  </Badge>
                </div>
                <p className="mt-3 text-label leading-5 text-fg-muted">{data.model.description}</p>
              </div>
            </div>
            <PageActions className="mt-3">
              <Button onClick={onOpenPlayground} type="button" variant="tertiary">
                Open in Playground
              </Button>
              <Button onClick={onRequestApiKey} type="button">
                Get API key
              </Button>
            </PageActions>
          </section>

          <PageColumns asideSide="left" asideWidth="200px" className="mt-5 gap-5" columnsAt="lg">
            <PageAside aria-label="Model page sections" className="lg:self-stretch">
              <div className="lg:sticky lg:top-3">
                <div className="lg:hidden">
                  <SectionNavigation activeSection={activeSection} onSectionChange={selectSection} orientation="mobile" />
                </div>
                <Card className="hidden lg:block">
                  <SectionNavigation activeSection={activeSection} onSectionChange={selectSection} orientation="desktop" />
                </Card>
              </div>
            </PageAside>

            <PagePrimary className="space-y-10">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {data.model.facts.map((fact) => (
                  <MetricCard
                    key={fact.label}
                    label={fact.label}
                    meta={fact.detail}
                    unit={fact.unit}
                    value={fact.presentation === "modalities" ? <ModalitiesValue /> : fact.value}
                  />
                ))}
              </div>

              <ProvidersSection data={data} onProviderSelect={onProviderSelect} />
              <PricingSection data={data} />
              <PerformanceSection data={data} />
              <AvailabilityMonitor
                availability={data.uptime.availability}
                className="scroll-mt-4 max-w-none"
                contained={false}
                data-model-section
                directAvailability={data.uptime.directAvailability}
                endpointsHref={null}
                id="uptime"
                learnMoreHref={null}
                rangeLabel={data.uptime.rangeLabel}
                routedAvailability={data.uptime.routedAvailability}
                uptime={data.uptime.uptime}
              />
              <BenchmarksSection data={data} />
              <AppsSection data={data} />
              <ActivitySection data={data} />
              <FaqSection data={data} />

              <div className="flex justify-end">
                <Button
                  onClick={() => contentRef.current?.scrollTo({ behavior: "smooth", top: 0 })}
                  variant="tertiary"
                >
                  Back to top
                </Button>
              </div>
            </PagePrimary>
          </PageColumns>
            </PageBody>
          </PageContent>
        </PageLayout>
      </AppShellMain>
    </AppShell>
  );
}
