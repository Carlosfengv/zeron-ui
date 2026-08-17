"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardDescription, CardGroup, CardHeader, CardTitle } from "@zeron/ui/card";
import { Input } from "@zeron/ui/input";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageLayout, PageSidebar } from "@zeron/ui/page-layout";
import { useIcon, type IconName } from "@zeron/icons/context";
import { docEntries, type DocEntry } from "@docs/manifest";
import { RightPanel } from "@docs/components/shell/site/right-panel";
import { componentCardDescription } from "@docs/components/components/component-card-copy";

const componentSections = ["foundations", "layout", "components", "ai-agent"] as const;
type ComponentSection = (typeof componentSections)[number];

const copy = {
  en: {
    all: "All",
    empty: "No components match the current search and filters.",
    filters: "Filters",
    filterByCategory: "Filter by category",
    componentNavigation: "Component navigation",
    galleryDescription: "Browse foundations, layouts and interaction primitives by the job they solve.",
    galleryTitle: "Find the right component",
    results: "{count} components",
    search: "Search components…",
  },
  zh: {
    all: "全部",
    empty: "没有符合当前搜索和筛选条件的组件。",
    filters: "筛选",
    filterByCategory: "按类别筛选",
    componentNavigation: "组件导航",
    galleryDescription: "按要解决的问题浏览基础、布局与交互组件。",
    galleryTitle: "找到合适的组件",
    results: "{count} 个组件",
    search: "搜索组件…",
  },
} as const;

const sectionLabels = {
  en: { foundations: "Foundations", layout: "Layout", components: "Components", "ai-agent": "AI agent" },
  zh: { foundations: "基础", layout: "布局", components: "组件", "ai-agent": "AI Agent" },
} as const;

const sectionIcons: Record<ComponentSection | "all", IconName> = {
  all: "square-library",
  foundations: "doc-semantic-tokens",
  layout: "doc-page-layout",
  components: "doc-card",
  "ai-agent": "doc-ask-user-questions",
};

function initialSection(value: string | null): ComponentSection | null {
  return componentSections.includes(value as ComponentSection) ? value as ComponentSection : null;
}

function CategoryFilter({ active, count, icon, label, onSelect, value }: {
  active: boolean;
  count: number;
  icon: IconName;
  label: string;
  onSelect: () => void;
  value: string;
}) {
  const Icon = useIcon(icon);
  return (
    <NavItem active={active} className="max-lg:w-auto" value={value}>
      <NavItemTrigger render={<button type="button" />} onClick={onSelect}>
        <NavItemLeading><Icon aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading>
        <NavItemContent><NavItemLabel>{label}</NavItemLabel></NavItemContent>
        <span className="ml-auto px-3 text-label text-fg-muted">{count}</span>
      </NavItemTrigger>
    </NavItem>
  );
}

function ComponentDirectorySidebar({
  activeSection,
  currentSlug,
  language,
  localePrefix = "",
  onQueryChange,
  onSectionSelect,
  query,
}: {
  activeSection: ComponentSection | null;
  currentSlug?: string;
  language: keyof typeof copy;
  localePrefix?: string;
  onQueryChange: (query: string) => void;
  onSectionSelect: (section: ComponentSection | null) => void;
  query: string;
}) {
  const SearchIcon = useIcon("search");
  const text = copy[language];
  const components = useMemo(() => docEntries.filter((entry) => entry.collection === "components"), []);
  const sectionCounts = useMemo(
    () => new Map(componentSections.map((item) => [item, components.filter((entry) => entry.section === item).length])),
    [components],
  );
  const navigationGroups = useMemo(
    () => {
      const currentComponent = components.find((entry) => entry.slug === currentSlug);
      if (!currentComponent || !componentSections.includes(currentComponent.section as ComponentSection)) return [];

      return [{
        section: currentComponent.section as ComponentSection,
        entries: components.filter((entry) => entry.section === currentComponent.section),
      }];
    },
    [components, currentSlug],
  );

  return (
    <PageSidebar aria-label={text.filterByCategory} width="220px" className="h-full p-3 max-lg:h-auto max-lg:overflow-visible">
      <div>
        <div className="relative">
          <SearchIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 z-content size-4 -translate-y-1/2 text-fg-muted" strokeWidth={1.5} />
          <Input aria-label={text.search} className="bg-surface-base pl-9" onChange={(event) => onQueryChange(event.target.value)} placeholder={text.search} value={query} />
        </div>
        <p className="mt-5 border-t border-border pt-5 text-label font-medium text-fg-default">{text.filters}</p>
        <section className="mt-4">
          <p className="px-1 pb-1.5 text-label text-fg-muted">{text.filterByCategory}</p>
          <NavMenu activeValue={activeSection ?? "all"} aria-label={text.filterByCategory} className="max-lg:[&_[data-slot=nav-list]]:flex-row max-lg:[&_[data-slot=nav-list]]:flex-wrap" keyboardNavigation="roving">
            <CategoryFilter active={activeSection === null} count={components.length} icon={sectionIcons.all} label={text.all} onSelect={() => onSectionSelect(null)} value="all" />
            {componentSections.map((item) => <CategoryFilter key={item} active={activeSection === item} count={sectionCounts.get(item) ?? 0} icon={sectionIcons[item]} label={sectionLabels[language][item]} onSelect={() => onSectionSelect(item)} value={item} />)}
          </NavMenu>
        </section>
        {navigationGroups.length > 0 && (
          <section className="mt-5 border-t border-border pt-5">
            <p className="px-1 pb-1.5 text-label text-fg-muted">{text.componentNavigation}</p>
            <div className="flex flex-col gap-4">
              {navigationGroups.map((group) => (
                <section key={group.section} aria-label={sectionLabels[language][group.section]}>
                  <p className="px-1 pb-1.5 text-label text-fg-muted">{sectionLabels[language][group.section]}</p>
                  <NavMenu activeValue={currentSlug} aria-label={sectionLabels[language][group.section]} keyboardNavigation="roving">
                    {group.entries.map((entry) => <ComponentNavigationItem key={entry.slug} active={entry.slug === currentSlug} entry={entry} href={`${localePrefix}/docs/components/${entry.slug}`} />)}
                  </NavMenu>
                </section>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageSidebar>
  );
}

function ComponentNavigationItem({ active, entry, href }: { active: boolean; entry: DocEntry; href: string }) {
  const Icon = useIcon(entry.icon);
  return (
    <NavItem active={active} value={entry.slug}>
      <NavItemTrigger render={<Link href={href} />}>
        <NavItemLeading><Icon aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading>
        <NavItemContent><NavItemLabel>{entry.name}</NavItemLabel></NavItemContent>
      </NavItemTrigger>
    </NavItem>
  );
}

export function ComponentsGallery({ localePrefix = "" }: { localePrefix?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<ComponentSection | null>(() => initialSection(searchParams.get("section")));
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const language = localePrefix ? "zh" : "en";
  const text = copy[language];
  const normalizedQuery = query.trim().toLowerCase();
  const components = useMemo(() => docEntries.filter((entry) => entry.collection === "components"), []);

  useEffect(() => {
    setSection(initialSection(searchParams.get("section")));
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateUrl = (nextSection: ComponentSection | null, nextQuery: string) => {
    const params = new URLSearchParams();
    if (nextSection) params.set("section", nextSection);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  const visibleComponents = useMemo(() => components.filter((entry) => {
    const description = componentCardDescription(entry.slug, language, entry.description);
    const searchable = [entry.name, entry.description, description, entry.section, entry.slug].filter(Boolean).join(" ").toLowerCase();
    return (!section || entry.section === section) && (!normalizedQuery || searchable.includes(normalizedQuery));
  }), [components, language, normalizedQuery, section]);
  const componentGroups = useMemo(
    () => componentSections
      .map((item) => ({ section: item, entries: visibleComponents.filter((entry) => entry.section === item) }))
      .filter((group) => group.entries.length > 0),
    [visibleComponents],
  );
  const activeFilterLabel = [
    normalizedQuery ? `“${query.trim()}”` : null,
    section ? sectionLabels[language][section] : null,
  ].filter(Boolean).join(" · ") || text.all;

  return (
    <section aria-labelledby="component-gallery-title" className="flex h-full min-h-0 w-full bg-surface-base">
      <PageLayout size="full" className="h-full min-h-0 w-full max-lg:!flex max-lg:overflow-y-auto" gutter="default">
        <ComponentDirectorySidebar
          activeSection={section}
          language={language}
          onQueryChange={(nextQuery) => { setQuery(nextQuery); updateUrl(section, nextQuery); }}
          onSectionSelect={(nextSection) => { setSection(nextSection); updateUrl(nextSection, query); }}
          query={query}
        />

        <PageContent className="max-lg:flex-none max-lg:overflow-visible">
          <PageBody className="h-full max-w-none p-4 sm:px-[18px] sm:py-5 max-lg:h-auto max-lg:overflow-visible">
            <header className="border-b border-border pb-5">
              <h1 id="component-gallery-title" className="text-heading font-semibold leading-tight text-fg-default">{text.galleryTitle}</h1>
              <p className="mt-2 max-w-3xl text-body text-fg-muted">{text.galleryDescription}</p>
            </header>

            <div aria-atomic="true" aria-live="polite" className="flex items-center justify-between gap-3 py-4">
              <p className="text-label text-fg-muted">{activeFilterLabel}</p>
              <p className="shrink-0 text-label text-fg-muted">{text.results.replace("{count}", String(visibleComponents.length))}</p>
            </div>

            {visibleComponents.length ? (
              <div className="flex flex-col gap-10 pb-4">
                {componentGroups.map((group) => (
                  <section key={group.section} aria-labelledby={`component-group-${group.section}`}>
                    <header className="mb-3 flex items-baseline justify-between gap-3">
                      <h2 id={`component-group-${group.section}`} className="text-title font-semibold text-fg-default">{sectionLabels[language][group.section]}</h2>
                      <span className="text-label text-fg-muted">{group.entries.length}</span>
                    </header>
                    <CardGroup border="outlined" columns={3} separated style={{ gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))" }}>
                      {group.entries.map((entry) => <ComponentCard key={entry.slug} entry={entry} href={`${localePrefix}/docs/components/${entry.slug}`} language={language} />)}
                    </CardGroup>
                  </section>
                ))}
              </div>
            ) : <p className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised p-6 text-body text-fg-muted">{text.empty}</p>}
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );
}

export function ComponentsDetailWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const language = pathname.startsWith("/zh-") ? "zh" : "en";
  const components = useMemo(() => docEntries.filter((entry) => entry.collection === "components"), []);
  const slug = pathname.split("/").at(-1);
  const activeSection = components.find((entry) => entry.slug === slug)?.section as ComponentSection | undefined;
  const collectionPath = `${language === "zh" ? "/zh-cn" : ""}/docs/components`;
  const navigateToCollection = (nextSection: ComponentSection | null, nextQuery = "") => {
    const params = new URLSearchParams();
    if (nextSection) params.set("section", nextSection);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    router.push(`${collectionPath}${params.size ? `?${params}` : ""}`);
  };

  return (
    <section className="flex h-[calc(100svh-3rem)] min-h-0 w-full bg-surface-base">
      <PageLayout size="full" className="h-full min-h-0 w-full max-lg:!flex max-lg:overflow-y-auto" gutter="default">
        <ComponentDirectorySidebar
          activeSection={activeSection ?? null}
          currentSlug={slug}
          language={language}
          localePrefix={language === "zh" ? "/zh-cn" : ""}
          onQueryChange={(query) => navigateToCollection(null, query)}
          onSectionSelect={(nextSection) => navigateToCollection(nextSection)}
          query=""
        />
        <PageContent className="overflow-y-auto overscroll-contain max-lg:flex-none max-lg:overflow-visible">
          <div className="grid min-h-full min-w-0">
            <RightPanel localePrefix={language === "zh" ? "/zh-cn" : ""} placement="content" showSettings={false} />
            <PageBody className="col-start-1 row-start-1 h-auto max-w-[1100px] flex-none overflow-visible py-10 xl:pr-72">
              {children}
            </PageBody>
          </div>
        </PageContent>
      </PageLayout>
    </section>
  );
}

function ComponentCard({ entry, href, language }: { entry: DocEntry; href: string; language: "en" | "zh" }) {
  const Icon = useIcon(entry.icon);
  const description = componentCardDescription(entry.slug, language, entry.description);
  return (
    <Card className="group flex min-w-0 flex-col bg-surface-floating transition-colors duration-fast hover:bg-hover">
      <CardHeader className="flex min-w-0 flex-1 flex-col">
        <div className="flex size-10 items-center justify-center rounded-lg bg-surface-raised text-fg-default transition-colors duration-fast group-hover:bg-surface-floating">
          <Icon aria-hidden size={20} strokeWidth={1.5} />
        </div>
        <CardTitle className="mt-5"><Link className="rounded outline-none hover:text-fg-brand focus-visible:ring-1 focus-visible:ring-focus-ring" href={href}>{entry.name}</Link></CardTitle>
        {description && <CardDescription className="mt-2 line-clamp-3">{description}</CardDescription>}
      </CardHeader>
    </Card>
  );
}
