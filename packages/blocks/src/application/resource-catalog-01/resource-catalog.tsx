"use client";

import AnthropicMono from "@lobehub/icons/es/Anthropic/components/Mono";
import BAAIMono from "@lobehub/icons/es/BAAI/components/Mono";
import ChatGLMColor from "@lobehub/icons/es/ChatGLM/components/Color";
import DeepSeekColor from "@lobehub/icons/es/DeepSeek/components/Color";
import FluxMono from "@lobehub/icons/es/Flux/components/Mono";
import GeminiColor from "@lobehub/icons/es/Gemini/components/Color";
import MoonshotMono from "@lobehub/icons/es/Moonshot/components/Mono";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import QwenColor from "@lobehub/icons/es/Qwen/components/Color";
import alibabaCloud from "@thesvg/icons/alibabacloud";
import arxiv from "@thesvg/icons/arxiv";
import bing from "@thesvg/icons/bing";
import chrome from "@thesvg/icons/chrome";
import cloudflare from "@thesvg/icons/cloudflare";
import docker from "@thesvg/icons/docker";
import figma from "@thesvg/icons/figma";
import github from "@thesvg/icons/github";
import googleDrive from "@thesvg/icons/google-drive";
import grafana from "@thesvg/icons/grafana";
import linear from "@thesvg/icons/linear";
import notion from "@thesvg/icons/notion";
import playwright from "@thesvg/icons/playwright";
import postgresql from "@thesvg/icons/postgresql";
import redis from "@thesvg/icons/redis";
import sentry from "@thesvg/icons/sentry";
import slack from "@thesvg/icons/slack";
import supabase from "@thesvg/icons/supabase";
import tavily from "@thesvg/icons/tavily";
import vercel from "@thesvg/icons/vercel";
import wechat from "@thesvg/icons/wechat";
import { useEffect, useMemo, useState, useSyncExternalStore, type ComponentPropsWithoutRef } from "react";
import { AppShell, AppShellHeader, AppShellMain } from "@zeron/ui/app-shell";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardGroup, CardHeader, CardTitle } from "@zeron/ui/card";
import { Input } from "@zeron/ui/input";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageLayout, PageSidebar } from "@zeron/ui/page-layout";
import { TopNav, TopNavActions, TopNavBrand, TopNavNavigation } from "@zeron/ui/top-nav";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { catalogLabels, categoryLabels, mcpCatalogItems, modelCatalogItems, type McpBrandIcon, type ResourceCatalogItem, type ResourceCatalogKind } from "./catalog-data";

export interface ResourceCatalogProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** Switches between the model and MCP marketplace data presentations. */
  kind?: ResourceCatalogKind;
  /** Replaces the built-in demonstration data for the selected kind. */
  items?: readonly ResourceCatalogItem[];
  /** Enables in-place switching for previews; omit it when navigation is route-owned. */
  onKindChange?: (kind: ResourceCatalogKind) => void;
}

type SortOrder = "newest" | "most-used";

const mcpBrandIcons = {
  alibabacloud: alibabaCloud,
  arxiv,
  bing,
  chrome,
  cloudflare,
  docker,
  figma,
  github,
  "google-drive": googleDrive,
  grafana,
  linear,
  notion,
  playwright,
  postgresql,
  redis,
  sentry,
  slack,
  supabase,
  tavily,
  vercel,
  wechat,
} satisfies Record<McpBrandIcon, { svg: string }>;

const modelProviderIcons = {
  "Z.ai": ChatGLMColor,
  "Moonshot AI": MoonshotMono,
  DeepSeek: DeepSeekColor,
  "Alibaba Cloud": QwenColor,
  OpenAI: OpenAIMono,
  Anthropic: AnthropicMono,
  Google: GeminiColor,
  "Black Forest Labs": FluxMono,
  BAAI: BAAIMono,
} as const;

function subscribeToViewport(onStoreChange: () => void) {
  const mediaQueries = [
    window.matchMedia("(min-width: 768px)"),
    window.matchMedia("(min-width: 1280px)"),
    window.matchMedia("(min-width: 1536px)"),
  ];
  mediaQueries.forEach((query) => query.addEventListener("change", onStoreChange));
  return () => mediaQueries.forEach((query) => query.removeEventListener("change", onStoreChange));
}

function readCatalogColumns() {
  if (window.matchMedia("(min-width: 1536px)").matches) return 4;
  if (window.matchMedia("(min-width: 1280px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
}

function useCatalogColumns() {
  return useSyncExternalStore(subscribeToViewport, readCatalogColumns, () => 1);
}

function CatalogIcon({ icon, size = 20 }: { icon: IconName; size?: number }) {
  const SearchIcon = useIcon("search");
  const SpreadsheetIcon = useIcon("file-spreadsheet");
  const GlobeIcon = useIcon("globe");
  const PinIcon = useIcon("pin");
  const LibraryIcon = useIcon("square-library");
  const RocketIcon = useIcon("rocket");
  const MonitorIcon = useIcon("monitor");
  const BrowserIcon = useIcon("doc-app-shell");
  const MessageIcon = useIcon("message-circle");
  const SettingsIcon = useIcon("settings");
  const PaletteIcon = useIcon("palette");
  const icons: Partial<Record<IconName, ReturnType<typeof useIcon>>> = {
    search: SearchIcon,
    "file-spreadsheet": SpreadsheetIcon,
    globe: GlobeIcon,
    pin: PinIcon,
    "square-library": LibraryIcon,
    rocket: RocketIcon,
    monitor: MonitorIcon,
    "doc-app-shell": BrowserIcon,
    "message-circle": MessageIcon,
    settings: SettingsIcon,
    palette: PaletteIcon,
  };
  const Icon = icons[icon] ?? GlobeIcon;
  return <Icon aria-hidden size={size} strokeWidth={1.5} className="text-fg-muted" />;
}

function McpBrandMark({ icon }: { icon: McpBrandIcon }) {
  return <span aria-hidden className="[&>svg]:block [&>svg]:size-5" dangerouslySetInnerHTML={{ __html: mcpBrandIcons[icon].svg }} />;
}

function ModelProviderMark({ provider, size = 24 }: { provider: string; size?: number }) {
  const ProviderIcon = modelProviderIcons[provider as keyof typeof modelProviderIcons];
  return ProviderIcon ? <ProviderIcon size={size} /> : <CatalogIcon icon="globe" size={size} />;
}

function ResourceMark({ item }: { item: ResourceCatalogItem }) {
  return (
    <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-hover">
      {item.kind === "model" && item.modelId ? (
        <ModelProviderMark provider={item.provider} />
      ) : item.brandIcon ? (
        <McpBrandMark icon={item.brandIcon} />
      ) : (
        <CatalogIcon icon={item.icon ?? "globe"} />
      )}
    </span>
  );
}

function ResourceCard({ item, selected, onSelect }: { item: ResourceCatalogItem; selected: boolean; onSelect: () => void }) {
  return (
    <Card
      label={`Open ${item.name}`}
      onClick={onSelect}
      selected={selected}
      className="bg-surface-floating pb-0 transition-colors duration-fast hover:bg-hover"
    >
      <CardContent className="flex items-start gap-2 px-4 pt-4">
        <ResourceMark item={item} />
        <CardHeader className="flex min-w-0 flex-1 flex-col gap-0 p-0">
          <div className="flex min-w-0 items-center gap-2">
            <CardTitle className="truncate">{item.name}</CardTitle>
          </div>
          <CardDescription title={item.description} className="mt-1 line-clamp-3 text-label leading-5 text-fg-subtle">
            {item.description}
          </CardDescription>
        </CardHeader>
      </CardContent>
      <div aria-hidden className="mx-4 mt-3 border-t border-border-subtle" />
      <CardFooter className="mt-auto justify-between gap-2 px-4 py-3 text-label text-fg-muted tabular-nums">
        {item.kind === "model" ? (
          <>
            <span>Context: {item.context}</span>
            <span>Max output: {item.maxOutput}</span>
          </>
        ) : (
          <>
            <Badge color="blue" size="sm">Zentrix</Badge>
            <span className="truncate">{item.handle}</span>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

/** A filterable resource directory that renders model and MCP marketplace views. */
export function ResourceCatalog({ kind = "model", items, onKindChange, className, ...props }: ResourceCatalogProps) {
  const defaultItems = kind === "model" ? modelCatalogItems : mcpCatalogItems;
  const sourceItems = items ?? defaultItems;
  const labels = catalogLabels[kind];
  const columns = useCatalogColumns();
  const SearchIcon = useIcon("search");
  const ResetIcon = useIcon("rotate-ccw");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [provider, setProvider] = useState("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setCategory("all");
    setProvider("all");
    setSelectedId(null);
  }, [kind]);

  const categories = useMemo(
    () => [...new Set(sourceItems.map((item) => item.category))],
    [sourceItems]
  );
  const counts = useMemo(
    () => new Map(categories.map((value) => [value, sourceItems.filter((item) => item.category === value).length])),
    [categories, sourceItems]
  );
  const modelProviders = useMemo(
    () => kind === "model"
      ? [...new Set(sourceItems.filter((item) => item.kind === "model").map((item) => item.provider))].toSorted((left, right) => left.localeCompare(right))
      : [],
    [kind, sourceItems]
  );
  const providerCounts = useMemo(
    () => new Map(modelProviders.map((value) => [value, sourceItems.filter((item) => item.provider === value).length])),
    [modelProviders, sourceItems]
  );
  const activeFilterLabel = useMemo(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery) return `搜索：${normalizedQuery}`;

    const sortLabel = sort === "newest" ? labels.newest : labels.mostUsed;
    const filters = [
      category === "all" ? null : categoryLabels[category] ?? category,
      provider === "all" ? null : provider,
      sortLabel,
    ].filter(Boolean);
    return filters.join(" · ");
  }, [category, labels.mostUsed, labels.newest, provider, query, sort]);
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return sourceItems
      .filter((item) => category === "all" || item.category === category)
      .filter((item) => provider === "all" || item.provider === provider)
      .filter((item) => !normalizedQuery || `${item.name} ${item.description} ${item.provider}`.toLocaleLowerCase().includes(normalizedQuery))
      .toSorted((left, right) => sort === "newest"
        ? right.createdAt.localeCompare(left.createdAt)
        : right.usageCount - left.usageCount);
  }, [category, provider, query, sort, sourceItems]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setProvider("all");
    setSort("newest");
  };

  return (
    <AppShell layout="stacked" className={cn("@container h-full min-h-[36rem] overflow-hidden bg-surface-base", className)} {...props}>
      <AppShellHeader className="static bg-surface-base">
        <TopNav navigationAlign="center" className="px-3">
          <TopNavBrand className="gap-3 text-fg-default">
            <strong className="text-heading font-bold leading-none">Zentrix</strong>
            <span className="hidden text-body font-medium @[38rem]:inline">能力中心</span>
          </TopNavBrand>
          <TopNavNavigation className="overflow-hidden">
            <NavMenu as="div" orientation="horizontal" variant="underline" activeValue={`#${kind}`} keyboardNavigation="roving" aria-label="Capability navigation" className="w-full">
              {[{ value: "#home", label: "首页" }, { value: "#model", label: "模型广场" }, { value: "#mcp", label: "MCP 广场" }].map((item) => (
                <NavItem key={item.value} value={item.value} className="shrink-0">
                  <NavItemTrigger
                    href={item.value}
                    className="px-2"
                    onClick={(event) => {
                      const nextKind = item.value === "#model" ? "model" : item.value === "#mcp" ? "mcp" : null;
                      if (!nextKind || !onKindChange) return;
                      event.preventDefault();
                      onKindChange(nextKind);
                    }}
                  >
                    <NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent>
                  </NavItemTrigger>
                </NavItem>
              ))}
            </NavMenu>
          </TopNavNavigation>
          <TopNavActions>
            <Button size="sm" type="button" variant="neutral">登录</Button>
          </TopNavActions>
        </TopNav>
      </AppShellHeader>

      <AppShellMain landmark={false} className="min-h-0 overflow-hidden">
        <PageLayout size="full" className="h-full pt-0">
          <PageSidebar aria-label={`${labels.title}筛选`} className="p-3">
            <label className="relative block">
              <span className="sr-only">{labels.search}</span>
              <SearchIcon aria-hidden size={15} strokeWidth={1.5} className="pointer-events-none absolute left-2.5 top-1/2 z-content -translate-y-1/2 text-fg-subtle" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} className="pr-12 pl-8" />
              <KbdGroup aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                <Kbd>⌘</Kbd><Kbd>K</Kbd>
              </KbdGroup>
            </label>

            <section className="mt-5">
              <p className="px-2 text-label text-fg-subtle">排序</p>
              <NavMenu as="div" activeValue={sort} keyboardNavigation="roving" aria-label="排序方式" className="mt-1">
                <NavItem value="newest"><NavItemTrigger href="#newest" onClick={(event) => { event.preventDefault(); setSort("newest"); }}>{labels.newest}</NavItemTrigger></NavItem>
                <NavItem value="most-used"><NavItemTrigger href="#most-used" onClick={(event) => { event.preventDefault(); setSort("most-used"); }}>{labels.mostUsed}</NavItemTrigger></NavItem>
              </NavMenu>
            </section>

            <section className="mt-5">
              <p className="px-2 text-label text-fg-subtle">分类</p>
              <NavMenu as="div" activeValue={category} keyboardNavigation="roving" aria-label={`${labels.title}分类`} className="mt-1">
                <NavItem value="all"><NavItemTrigger href="#all" onClick={(event) => { event.preventDefault(); setCategory("all"); }}><NavItemContent><NavItemLabel>{labels.all}</NavItemLabel></NavItemContent><span className="ml-auto px-3 text-label text-fg-muted">{sourceItems.length}</span></NavItemTrigger></NavItem>
                {categories.map((value) => (
                  <NavItem key={value} value={value}>
                    <NavItemTrigger href={`#${value}`} onClick={(event) => { event.preventDefault(); setCategory(value); }}>
                      <NavItemContent><NavItemLabel>{categoryLabels[value] ?? value}</NavItemLabel></NavItemContent>
                      <span className="ml-auto px-3 text-label text-fg-muted">{counts.get(value)}</span>
                    </NavItemTrigger>
                  </NavItem>
                ))}
              </NavMenu>
            </section>

            {kind === "model" && (
              <section className="mt-5">
                <p className="px-2 text-label text-fg-subtle">模型厂商</p>
                <NavMenu as="div" activeValue={provider} keyboardNavigation="roving" aria-label="模型厂商筛选" className="mt-1">
                  <NavItem value="all"><NavItemTrigger href="#all-providers" onClick={(event) => { event.preventDefault(); setProvider("all"); }}><NavItemContent><NavItemLabel>{labels.all}</NavItemLabel></NavItemContent><span className="ml-auto px-3 text-label text-fg-muted">{sourceItems.length}</span></NavItemTrigger></NavItem>
                  {modelProviders.map((value) => (
                    <NavItem key={value} value={value}>
                      <NavItemTrigger href={`#provider-${value}`} onClick={(event) => { event.preventDefault(); setProvider(value); }}>
                        <NavItemContent><NavItemLeading><ModelProviderMark provider={value} size={16} /></NavItemLeading><NavItemLabel>{value}</NavItemLabel></NavItemContent>
                        <span className="ml-auto px-3 text-label text-fg-muted">{providerCounts.get(value)}</span>
                      </NavItemTrigger>
                    </NavItem>
                  ))}
                </NavMenu>
              </section>
            )}
          </PageSidebar>

          <PageContent>
            <PageBody className="max-w-[1620px] p-4 sm:px-[18px] sm:py-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-label text-fg-muted">{activeFilterLabel}</p>
                </div>
                <span aria-live="polite" className="text-label text-fg-muted">{visibleItems.length} 个结果</span>
              </div>

              {visibleItems.length ? (
                <CardGroup
                  columns={columns}
                  border="outlined"
                  separated
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}
                >
                  {visibleItems.map((item) => (
                    <ResourceCard key={item.id} item={item} selected={selectedId === item.id} onSelect={() => setSelectedId(item.id)} />
                  ))}
                </CardGroup>
              ) : (
                <div className="flex min-h-64 flex-col items-start justify-center rounded-xl border border-dashed border-border bg-surface-raised p-6">
                  <p className="text-title text-fg-default">{labels.empty}</p>
                  <p className="mt-1 max-w-md text-body text-fg-muted">尝试更换关键词或清除当前筛选，查看全部可用资源。</p>
                  <Button type="button" variant="tertiary" size="sm" leadingIcon={ResetIcon} className="mt-4" onClick={clearFilters}>清除筛选</Button>
                </div>
              )}
            </PageBody>
          </PageContent>
        </PageLayout>
      </AppShellMain>
    </AppShell>
  );
}
