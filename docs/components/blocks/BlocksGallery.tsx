"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@zeron/ui/input";
import { Card, CardDescription, CardGroup, CardHeader } from "@zeron/ui/card";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageLayout, PageSidebar } from "@zeron/ui/page-layout";
import { useIcon, type IconName } from "@zeron/icons/context";
import { BlockPreview } from "@docs/components/blocks/BlockPreview";
import { artifactCatalog, artifactKinds, artifactProducts, type ArtifactKind, type ArtifactProduct } from "@docs/catalog/artifacts";

const copy = {
  en: {
    all: "All",
    empty: "No business templates match the current search and filters.",
    filters: "Filters",
    filterByProduct: "Filter by product",
    filterByType: "Filter by type",
    galleryDescription: "Find real product assets by task, product context and readiness. Types describe the asset boundary; they do not change its registry installation format.",
    galleryTitle: "Build with real product patterns",
    results: "{count} templates",
    search: "Search pages, scenarios or components…",
  },
  zh: {
    all: "全部",
    empty: "没有符合当前搜索和筛选条件的业务模板。",
    filters: "筛选",
    filterByProduct: "按产品筛选",
    filterByType: "按类型筛选",
    galleryDescription: "按任务、产品语境和接入成熟度查找真实业务资产。类型用于说明资产边界，不会改变 Registry 的安装格式。",
    galleryTitle: "用真实产品模式开始搭建",
    results: "{count} 个模板",
    search: "搜索页面、业务场景或组件…",
  },
} as const;

const kindLabels = {
  en: { block: "Block", page: "Page", flow: "Flow", prototype: "Prototype", layout: "Layout" },
  zh: { block: "区块", page: "页面", flow: "流程", prototype: "原型", layout: "布局" },
} as const;

const productLabels = {
  en: { zaiops: "ZAIops", zlr: "ZLR", zentrix: "Zentrix", shared: "Shared" },
  zh: { zaiops: "ZAIops", zlr: "ZLR", zentrix: "Zentrix", shared: "通用" },
} as const;

const kindIcons: Record<ArtifactKind | "all", IconName> = {
  all: "square-library",
  block: "doc-card",
  page: "doc-page-layout",
  flow: "doc-stepper",
  prototype: "doc-showcase",
  layout: "doc-app-shell",
};

function initialKind(value: string | null): ArtifactKind | null {
  return artifactKinds.includes(value as ArtifactKind) ? value as ArtifactKind : null;
}

function initialProduct(value: string | null): ArtifactProduct | null {
  return artifactProducts.includes(value as ArtifactProduct) ? value as ArtifactProduct : null;
}

function FilterNavItem({
  active,
  count,
  icon,
  label,
  onSelect,
  value,
}: {
  active: boolean;
  count: number;
  icon?: IconName;
  label: string;
  onSelect: () => void;
  value: string;
}) {
  const Icon = useIcon(icon ?? "square-library");

  return (
    <NavItem active={active} className="max-lg:w-auto" value={value}>
      <NavItemTrigger render={<button type="button" />} onClick={onSelect}>
        {icon && <NavItemLeading><Icon aria-hidden="true" size={16} strokeWidth={1.5} /></NavItemLeading>}
        <NavItemContent><NavItemLabel>{label}</NavItemLabel></NavItemContent>
        <span className="ml-auto px-3 text-label text-fg-muted">{count}</span>
      </NavItemTrigger>
    </NavItem>
  );
}

export function BlocksGallery({ localePrefix = "" }: { localePrefix?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [kind, setKind] = useState<ArtifactKind | null>(() => initialKind(searchParams.get("kind")));
  const [product, setProduct] = useState<ArtifactProduct | null>(() => initialProduct(searchParams.get("product")));
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const Search = useIcon("search");
  const language = localePrefix ? "zh" : "en";
  const text = copy[language];
  const normalizedQuery = query.trim().toLowerCase();
  const updateUrl = (nextKind: ArtifactKind | null, nextProduct: ArtifactProduct | null, nextQuery: string) => {
    const params = new URLSearchParams();
    if (nextKind) params.set("kind", nextKind);
    if (nextProduct) params.set("product", nextProduct);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    setKind(initialKind(searchParams.get("kind")));
    setProduct(initialProduct(searchParams.get("product")));
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);
  const templates = useMemo(() => artifactCatalog.filter((artifact) => {
    const searchable = [artifact.title, artifact.description, artifact.kind, artifact.product, ...artifact.domains, ...artifact.patterns, ...artifact.searchTerms].join(" ").toLowerCase();
    return (!kind || artifact.kind === kind)
      && (!product || artifact.product === product)
      && (!normalizedQuery || searchable.includes(normalizedQuery));
  }), [kind, normalizedQuery, product]);
  const kindCounts = useMemo(
    () => new Map(artifactKinds.map((item) => [item, artifactCatalog.filter((artifact) => artifact.kind === item).length])),
    []
  );
  const productCounts = useMemo(
    () => new Map(artifactProducts.map((item) => [item, artifactCatalog.filter((artifact) => artifact.product === item).length])),
    []
  );
  const activeFilterLabel = [
    normalizedQuery ? `“${query.trim()}”` : null,
    kind ? kindLabels[language][kind] : null,
    product ? productLabels[language][product] : null,
  ].filter(Boolean).join(" · ") || text.all;

  return (
    <section aria-labelledby="template-gallery-title" className="flex h-full min-h-0 w-full bg-surface-base">
      <PageLayout size="full" className="h-full min-h-0 w-full max-lg:!flex max-lg:overflow-y-auto" gutter="default">
        <PageSidebar aria-label={`${text.filterByType} · ${text.filterByProduct}`} width="220px" className="h-full p-3 max-lg:h-auto max-lg:overflow-visible">
          <div>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-content size-4 -translate-y-1/2 text-fg-muted" strokeWidth={1.5} />
              <Input aria-label={text.search} className="bg-surface-base pl-9" onChange={(event) => { const nextQuery = event.target.value; setQuery(nextQuery); updateUrl(kind, product, nextQuery); }} placeholder={text.search} value={query} />
            </div>
            <p className="mt-5 border-t border-border pt-5 text-label font-medium text-fg-default">{text.filters}</p>
            <section className="mt-4">
              <p className="px-1 pb-1.5 text-label text-fg-muted">{text.filterByType}</p>
              <NavMenu activeValue={kind ?? "all"} aria-label={text.filterByType} className="max-lg:[&_[data-slot=nav-list]]:flex-row max-lg:[&_[data-slot=nav-list]]:flex-wrap" keyboardNavigation="roving">
                <FilterNavItem active={kind === null} count={artifactCatalog.length} icon={kindIcons.all} label={text.all} onSelect={() => { setKind(null); updateUrl(null, product, query); }} value="all" />
                {artifactKinds.map((item) => <FilterNavItem key={item} active={kind === item} count={kindCounts.get(item) ?? 0} icon={kindIcons[item]} label={kindLabels[language][item]} onSelect={() => { setKind(item); updateUrl(item, product, query); }} value={item} />)}
              </NavMenu>
            </section>
            <section className="mt-5 border-t border-border pt-5">
              <p className="px-1 pb-1.5 text-label text-fg-muted">{text.filterByProduct}</p>
              <NavMenu activeValue={product ?? "all"} aria-label={text.filterByProduct} className="max-lg:[&_[data-slot=nav-list]]:flex-row max-lg:[&_[data-slot=nav-list]]:flex-wrap" keyboardNavigation="roving">
                <FilterNavItem active={product === null} count={artifactCatalog.length} label={text.all} onSelect={() => { setProduct(null); updateUrl(kind, null, query); }} value="all" />
                {artifactProducts.map((item) => <FilterNavItem key={item} active={product === item} count={productCounts.get(item) ?? 0} label={productLabels[language][item]} onSelect={() => { setProduct(item); updateUrl(kind, item, query); }} value={item} />)}
              </NavMenu>
            </section>
          </div>
        </PageSidebar>

        <PageContent className="max-lg:flex-none max-lg:overflow-visible">
          <PageBody className="h-full max-w-none p-4 sm:px-[18px] sm:py-5 max-lg:h-auto max-lg:overflow-visible">
            <header className="border-b border-border pb-5">
              <h1 id="template-gallery-title" className="text-heading font-semibold leading-tight text-fg-default">{text.galleryTitle}</h1>
              <p className="mt-2 max-w-3xl text-body text-fg-muted">{text.galleryDescription}</p>
            </header>

            <div aria-live="polite" aria-atomic="true" className="flex items-center justify-between gap-3 py-4">
              <p className="text-label text-fg-muted">{activeFilterLabel}</p>
              <p className="shrink-0 text-label text-fg-muted">{text.results.replace("{count}", String(templates.length))}</p>
            </div>

            {templates.length ? (
            <CardGroup border="outlined" columns={2} separated style={{ gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))" }}>
              {templates.map((artifact) => (
                <Card key={artifact.slug} className="flex min-w-0 flex-col overflow-hidden bg-surface-floating">
                  <div
                    aria-hidden={artifact.kind !== "block" && artifact.kind !== "layout"}
                    inert={artifact.kind !== "block" && artifact.kind !== "layout"}
                    className="border-b border-border bg-surface-base"
                  >
                    <BlockPreview name={artifact.slug} />
                  </div>
                  <CardHeader className="pb-0">
                    <h2 className="text-title font-semibold leading-tight text-fg-default"><Link className="rounded outline-none hover:text-fg-brand focus-visible:ring-1 focus-visible:ring-focus-ring" href={`${localePrefix}/docs/blocks/${artifact.slug}`}>{artifact.title}</Link></h2>
                    <CardDescription className="mt-2">{artifact.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </CardGroup>
            ) : <p className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised p-6 text-body text-fg-muted">{text.empty}</p>}
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );
}
