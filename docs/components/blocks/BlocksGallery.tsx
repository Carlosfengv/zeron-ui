"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@zeron/ui/badge";
import { Input } from "@zeron/ui/input";
import { Container, ContainerBody, ContainerFooter } from "@zeron/ui/container";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageLayout, PageSidebar } from "@zeron/ui/page-layout";
import { useIcon, type IconName } from "@zeron/icons/context";
import { BlockPreview } from "@docs/components/blocks/BlockPreview";
import { artifactCatalog, artifactKinds, artifactProductLabels, artifactProducts, type ArtifactKind, type ArtifactProduct } from "@docs/catalog/artifacts";
import { artifactPathname, type ArtifactCollection } from "@docs/catalog/artifact-collections";

const copy = {
  en: {
    all: "All",
    empty: "No results match the current search and filters.",
    filterByProduct: "Filter by product",
    filterByType: "Filter by pattern",
  },
  zh: {
    all: "全部",
    empty: "没有符合当前搜索和筛选条件的内容。",
    filterByProduct: "按产品筛选",
    filterByType: "按形态筛选",
  },
} as const;

const collectionCopy = {
  en: {
    blocks: { galleryTitle: "Blocks", galleryDescription: "Embed tables, metrics, traces and editors into your own pages.", results: "{count} blocks", search: "Search blocks or scenarios…" },
    pages: { galleryTitle: "Pages", galleryDescription: "Start with complete dashboards, detail pages, settings and authentication screens.", results: "{count} pages", search: "Search pages or scenarios…" },
  },
  zh: {
    blocks: { galleryTitle: "区块", galleryDescription: "将表格、指标、调用链和编辑器等业务区块组合到你的页面中。", results: "{count} 个区块", search: "搜索区块或业务场景…" },
    pages: { galleryTitle: "页面", galleryDescription: "从完整的工作台、详情、设置和认证页面开始，接入你的业务。", results: "{count} 个页面", search: "搜索页面或业务场景…" },
  },
} as const;

const kindLabels = {
  en: { block: "Block", page: "Page", flow: "Flow", prototype: "Prototype", layout: "Layout" },
  zh: { block: "区块", page: "页面", flow: "流程", prototype: "原型", layout: "布局" },
} as const;

const readinessLabels = {
  en: { "copy-ready": "Ready to compose", "adapter-required": "Data integration needed", "demo-only": "Demo" },
  zh: { "copy-ready": "可组合使用", "adapter-required": "需要接入数据", "demo-only": "演示原型" },
} as const;

const frameworkLabels = {
  en: { next: "Next.js", react: "React" },
  zh: { next: "Next.js", react: "React" },
} as const;

const kindIcons: Record<ArtifactKind | "all", IconName> = {
  all: "square-library",
  block: "doc-card",
  page: "doc-page-layout",
  flow: "doc-stepper",
  prototype: "doc-showcase",
  layout: "doc-app-shell",
};

function initialKind(value: string | null, collection: ArtifactCollection): ArtifactKind | null {
  return artifactCatalog.some((artifact) => artifact.collection === collection && artifact.kind === value)
    ? value as ArtifactKind : null;
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

export function BlocksGallery({ localePrefix = "", collection = "blocks" }: { localePrefix?: string; collection?: ArtifactCollection }) {
  const searchParams = useSearchParams();
  const [kind, setKind] = useState<ArtifactKind | null>(() => initialKind(searchParams.get("kind"), collection));
  const [product, setProduct] = useState<ArtifactProduct | null>(() => initialProduct(searchParams.get("product")));
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const Search = useIcon("search");
  const language = localePrefix === "/en" ? "en" : "zh";
  const text = { ...copy[language], ...collectionCopy[language][collection] };
  const collectionArtifacts = useMemo(() => artifactCatalog.filter((artifact) => artifact.collection === collection), [collection]);
  const availableKinds = useMemo(() => artifactKinds.filter((item) => collectionArtifacts.some((artifact) => artifact.kind === item)), [collectionArtifacts]);
  const normalizedQuery = query.trim().toLowerCase();
  const updateUrl = (nextKind: ArtifactKind | null, nextProduct: ArtifactProduct | null, nextQuery: string) => {
    const url = new URL(window.location.href);
    for (const [key, value] of [["kind", nextKind], ["product", nextProduct], ["q", nextQuery]] as const) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    // Filters are local. Next synchronizes useSearchParams with native history
    // without fetching the route again for each keystroke.
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  useEffect(() => {
    setKind(initialKind(searchParams.get("kind"), collection));
    setProduct(initialProduct(searchParams.get("product")));
    setQuery(searchParams.get("q") ?? "");
  }, [collection, searchParams]);
  const artifacts = useMemo(() => collectionArtifacts.filter((artifact) => {
    const searchable = [artifact.title, artifact.description, artifact.kind, artifact.product, artifact.installation.framework, artifact.installation.kind, ...artifact.domains, ...artifact.patterns, ...artifact.searchTerms].join(" ").toLowerCase();
    return (!kind || artifact.kind === kind)
      && (!product || artifact.product === product)
      && (!normalizedQuery || searchable.includes(normalizedQuery));
  }), [collectionArtifacts, kind, normalizedQuery, product]);
  const kindCounts = useMemo(
    () => new Map(availableKinds.map((item) => [item, collectionArtifacts.filter((artifact) => artifact.kind === item).length])),
    [availableKinds, collectionArtifacts]
  );
  const productCounts = useMemo(
    () => new Map(artifactProducts.map((item) => [item, collectionArtifacts.filter((artifact) => artifact.product === item).length])),
    [collectionArtifacts]
  );
  const activeFilterLabel = [
    normalizedQuery ? `“${query.trim()}”` : null,
    kind ? kindLabels[language][kind] : null,
    product ? artifactProductLabels[language][product] : null,
  ].filter(Boolean).join(" · ") || text.all;

  return (
    <section aria-labelledby="artifact-gallery-title" className="flex h-full min-h-0 w-full bg-surface-base">
      <PageLayout size="full" className="h-full min-h-0 w-full max-lg:!flex max-lg:overflow-y-auto" gutter="default">
        <PageSidebar aria-label={`${text.filterByType} · ${text.filterByProduct}`} width="220px" className="h-full p-3 max-lg:h-auto max-lg:overflow-visible">
          <div>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-content size-4 -translate-y-1/2 text-fg-muted" strokeWidth={1.5} />
              <Input aria-label={text.search} className="pl-9" onChange={(event) => { const nextQuery = event.target.value; setQuery(nextQuery); updateUrl(kind, product, nextQuery); }} placeholder={text.search} value={query} variant="ghost" />
            </div>
            <section className="mt-4">
              <p className="px-1 pb-1.5 text-label text-fg-muted">{text.filterByType}</p>
              <NavMenu activeValue={kind ?? "all"} aria-label={text.filterByType} className="max-lg:[&_[data-slot=nav-list]]:flex-row max-lg:[&_[data-slot=nav-list]]:flex-wrap" keyboardNavigation="roving">
                <FilterNavItem active={kind === null} count={collectionArtifacts.length} icon={kindIcons.all} label={text.all} onSelect={() => { setKind(null); updateUrl(null, product, query); }} value="all" />
                {availableKinds.map((item) => <FilterNavItem key={item} active={kind === item} count={kindCounts.get(item) ?? 0} icon={kindIcons[item]} label={kindLabels[language][item]} onSelect={() => { setKind(item); updateUrl(item, product, query); }} value={item} />)}
              </NavMenu>
            </section>
            <section className="mt-5 border-t border-border pt-5">
              <p className="px-1 pb-1.5 text-label text-fg-muted">{text.filterByProduct}</p>
              <NavMenu activeValue={product ?? "all"} aria-label={text.filterByProduct} className="max-lg:[&_[data-slot=nav-list]]:flex-row max-lg:[&_[data-slot=nav-list]]:flex-wrap" keyboardNavigation="roving">
                <FilterNavItem active={product === null} count={collectionArtifacts.length} label={text.all} onSelect={() => { setProduct(null); updateUrl(kind, null, query); }} value="all" />
                {artifactProducts.map((item) => <FilterNavItem key={item} active={product === item} count={productCounts.get(item) ?? 0} label={artifactProductLabels[language][item]} onSelect={() => { setProduct(item); updateUrl(kind, item, query); }} value={item} />)}
              </NavMenu>
            </section>
          </div>
        </PageSidebar>

        <PageContent className="overflow-y-auto overscroll-contain max-lg:flex-none">
          <PageBody className="h-auto max-w-[1620px] overflow-visible p-4 sm:px-[18px] sm:py-5">
            <header className="border-b border-border pb-5">
              <h1 id="artifact-gallery-title" className="text-heading font-semibold leading-tight text-fg-default">{text.galleryTitle}</h1>
              <p className="mt-2 max-w-3xl text-body text-fg-muted">{text.galleryDescription}</p>
            </header>

            <div aria-live="polite" aria-atomic="true" className="flex items-center justify-between gap-3 py-4">
              <p className="text-label text-fg-muted">{activeFilterLabel}</p>
              <p className="shrink-0 text-label text-fg-muted">{text.results.replace("{count}", String(artifacts.length))}</p>
            </div>

            {artifacts.length ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {artifacts.map((artifact) => (
                <Container key={artifact.slug} className="group relative min-w-0 cursor-pointer overflow-hidden transition-colors duration-fast hover:bg-hover">
                  <Link
                    aria-label={artifact.title}
                    className="absolute inset-0 z-raised rounded-[inherit] outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
                    href={`${localePrefix}${artifactPathname(artifact.slug)}`}
                  />
                  <ContainerBody
                    aria-hidden="true"
                    className="overflow-hidden overscroll-auto p-1"
                    inert
                  >
                    <div className="pointer-events-none">
                      <BlockPreview name={artifact.slug} />
                    </div>
                  </ContainerBody>
                  <ContainerFooter className="flex-wrap justify-between gap-2 px-3 py-3">
                    <span className="text-body font-medium text-fg-muted transition-colors group-hover:text-fg-brand group-focus-within:text-fg-brand">{artifact.title}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge size="sm" variant="dot">{artifactProductLabels[language][artifact.product]}</Badge>
                      <Badge color="blue" size="sm">{kindLabels[language][artifact.kind]}</Badge>
                      <Badge color={artifact.readiness === "demo-only" ? "orange" : "gray"} size="sm">{readinessLabels[language][artifact.readiness]}</Badge>
                      {artifact.installation.framework === "next" && <Badge color="purple" size="sm">{frameworkLabels[language].next}</Badge>}
                    </div>
                  </ContainerFooter>
                </Container>
              ))}
            </div>
            ) : <p className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised p-6 text-body text-fg-muted">{text.empty}</p>}
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );
}
