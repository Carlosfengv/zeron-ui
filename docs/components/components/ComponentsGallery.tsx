"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardDescription, CardGroup, CardTitle } from "@zeron/ui/card";
import { Container, ContainerBody, ContainerFooter } from "@zeron/ui/container";
import { Empty, EmptyHeader, EmptyIllustration, EmptyMedia, EmptyTitle } from "@zeron/ui/empty";
import { Input } from "@zeron/ui/input";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageLayout, PageSidebar } from "@zeron/ui/page-layout";
import { useIcon, type IconName } from "@zeron/icons/context";
import { docEntries, type DocEntry } from "@docs/manifest";
import { RightPanel } from "@docs/components/shell/site/right-panel";
import { componentCardDescription } from "@docs/components/components/component-card-copy";
import { componentCoverSrc, type ComponentCoverTheme } from "@docs/lib/component-covers";
import { useThemeContext } from "@zeron/ui/system/theme-context";

const componentSections = [
  "foundations",
  "layout",
  "navigation",
  "input",
  "action",
  "data-display",
  "feedback",
  "overlay",
  "ai-agent",
] as const;
type ComponentSection = (typeof componentSections)[number];

const copy = {
  en: {
    all: "All",
    empty: "No components match the current search.",
    jumpToCategory: "Jump to category",
    galleryDescription: "Browse components by the job they help you accomplish.",
    galleryTitle: "Find the right component",
    results: "{count} components",
    search: "Search components…",
  },
  zh: {
    all: "全部",
    empty: "没有符合当前搜索条件的组件。",
    jumpToCategory: "按类别定位",
    galleryDescription: "按要完成的任务浏览组件。",
    galleryTitle: "找到合适的组件",
    results: "{count} 个组件",
    search: "搜索组件…",
  },
} as const;

const sectionLabels = {
  en: {
    foundations: "Foundations",
    layout: "Layout & containers",
    navigation: "Navigation",
    input: "Input & selection",
    action: "Triggers & execution",
    "data-display": "Data display",
    feedback: "Feedback & status",
    overlay: "Overlays & guidance",
    "ai-agent": "AI interaction",
  },
  zh: {
    foundations: "基础",
    layout: "布局与容器",
    navigation: "导航",
    input: "输入与选择",
    action: "触发与执行",
    "data-display": "数据展示",
    feedback: "反馈与状态",
    overlay: "浮层与辅助",
    "ai-agent": "AI 交互",
  },
} as const;

const sectionIcons: Record<ComponentSection | "all", IconName> = {
  all: "square-library",
  foundations: "doc-semantic-tokens",
  layout: "doc-page-layout",
  navigation: "doc-breadcrumb",
  input: "doc-input",
  action: "doc-button",
  "data-display": "doc-card",
  feedback: "doc-toast",
  overlay: "doc-popover",
  "ai-agent": "doc-ask-user-questions",
};

function initialSection(value: string | null): ComponentSection | null {
  return componentSections.includes(value as ComponentSection) ? value as ComponentSection : null;
}

function useResolvedTheme(): ComponentCoverTheme {
  const { theme } = useThemeContext();
  const [systemTheme, setSystemTheme] = useState<ComponentCoverTheme>("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return theme === "system" ? systemTheme : theme;
}

function CategoryLink({ active, count, disabled = false, icon, label, onSelect, value }: {
  active: boolean;
  count: number;
  disabled?: boolean;
  icon: IconName;
  label: string;
  onSelect: () => void;
  value: string;
}) {
  const Icon = useIcon(icon);
  return (
    <NavItem active={active} className="max-lg:w-auto" disabled={disabled} value={value}>
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
  const normalizedQuery = query.trim().toLowerCase();
  const searchableComponents = useMemo(() => components.filter((entry) => {
    const description = componentCardDescription(entry.slug, language, entry.description);
    const searchable = [entry.name, entry.description, description, entry.section, entry.slug].filter(Boolean).join(" ").toLowerCase();
    return !normalizedQuery || searchable.includes(normalizedQuery);
  }), [components, language, normalizedQuery]);
  const sectionCounts = useMemo(
    () => new Map(componentSections.map((item) => [item, searchableComponents.filter((entry) => entry.section === item).length])),
    [searchableComponents],
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
    <PageSidebar aria-label={text.jumpToCategory} width="220px" className="h-full p-3 max-lg:h-auto max-lg:overflow-visible">
      <div>
        <div className="relative">
          <SearchIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 z-content size-4 -translate-y-1/2 text-fg-muted" strokeWidth={1.5} />
          <Input aria-label={text.search} className="pl-9" onChange={(event) => onQueryChange(event.target.value)} placeholder={text.search} value={query} variant="ghost" />
        </div>
        <section className="mt-4">
          <p className="px-1 pb-1.5 text-label text-fg-muted">{text.jumpToCategory}</p>
          <NavMenu activeValue={activeSection ?? "all"} aria-label={text.jumpToCategory} className="max-lg:[&_[data-slot=nav-list]]:flex-row max-lg:[&_[data-slot=nav-list]]:flex-wrap" keyboardNavigation="roving">
            <CategoryLink active={activeSection === null} count={searchableComponents.length} icon={sectionIcons.all} label={text.all} onSelect={() => onSectionSelect(null)} value="all" />
            {componentSections.map((item) => {
              const count = sectionCounts.get(item) ?? 0;
              return <CategoryLink key={item} active={activeSection === item} count={count} disabled={count === 0} icon={sectionIcons[item]} label={sectionLabels[language][item]} onSelect={() => onSectionSelect(item)} value={item} />;
            })}
          </NavMenu>
        </section>
        {navigationGroups.length > 0 && (
          <section className="mt-5 border-t border-border pt-5">
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
  const layoutRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const galleryTitleRef = useRef<HTMLHeadingElement>(null);
  const initialSectionRef = useRef<ComponentSection | null | undefined>(undefined);
  const [section, setSection] = useState<ComponentSection | null>(null);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const language = localePrefix === "/en" ? "en" : "zh";
  const coverTheme = useResolvedTheme();
  const text = copy[language];
  const normalizedQuery = query.trim().toLowerCase();
  const components = useMemo(() => docEntries.filter((entry) => entry.collection === "components"), []);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateUrl = (nextQuery: string) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  const visibleComponents = useMemo(() => components.filter((entry) => {
    const description = componentCardDescription(entry.slug, language, entry.description);
    const searchable = [entry.name, entry.description, description, entry.section, entry.slug].filter(Boolean).join(" ").toLowerCase();
    return !normalizedQuery || searchable.includes(normalizedQuery);
  }), [components, language, normalizedQuery]);
  const componentGroups = useMemo(
    () => componentSections
      .map((item) => ({ section: item, entries: visibleComponents.filter((entry) => entry.section === item) }))
      .filter((group) => group.entries.length > 0),
    [visibleComponents],
  );
  const activeFilterLabel = [
    normalizedQuery ? `“${query.trim()}”` : null,
  ].filter(Boolean).join(" · ") || text.all;

  const scrollToSection = useCallback((nextSection: ComponentSection | null, behavior: ScrollBehavior = "smooth") => {
    const target = nextSection
      ? document.getElementById(`component-group-${nextSection}`)
      : galleryTitleRef.current;
    if (!target) return;
    setSection(nextSection);
    target.scrollIntoView({ behavior, block: "start" });
  }, []);

  const selectSection = useCallback((nextSection: ComponentSection | null) => {
    const hash = nextSection ? `#component-group-${nextSection}` : "";
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${hash}`);
    scrollToSection(nextSection);
  }, [scrollToSection]);

  useEffect(() => {
    if (initialSectionRef.current !== undefined) return;
    const hashSection = initialSection(window.location.hash.replace(/^#component-group-/, ""));
    const requestedSection = hashSection ?? initialSection(searchParams.get("section"));
    initialSectionRef.current = requestedSection;
    if (!requestedSection) return;
    const frame = window.requestAnimationFrame(() => scrollToSection(requestedSection, "auto"));
    return () => window.cancelAnimationFrame(frame);
  }, [scrollToSection, searchParams]);

  useEffect(() => {
    const layout = layoutRef.current;
    const content = contentRef.current;
    if (!layout || !content) return;

    let frame = 0;
    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollRoot = [content, layout].find((node) => node.scrollHeight > node.clientHeight + 1);
        const activationLine = (scrollRoot?.getBoundingClientRect().top ?? 0) + 32;
        const visibleSections = componentSections
          .map((item) => ({ item, node: document.getElementById(`component-group-${item}`) }))
          .filter((entry): entry is { item: ComponentSection; node: HTMLElement } => entry.node !== null);
        let nextSection: ComponentSection | null = null;

        for (const entry of visibleSections) {
          if (entry.node.getBoundingClientRect().top <= activationLine) nextSection = entry.item;
          else break;
        }

        if (scrollRoot && visibleSections.length > 0 && scrollRoot.scrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 2) {
          nextSection = visibleSections.at(-1)?.item ?? nextSection;
        }
        setSection((current) => current === nextSection ? current : nextSection);
      });
    };

    content.addEventListener("scroll", updateActiveSection, { passive: true });
    layout.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateActiveSection);
    resizeObserver?.observe(content);
    updateActiveSection();

    return () => {
      window.cancelAnimationFrame(frame);
      content.removeEventListener("scroll", updateActiveSection);
      layout.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      resizeObserver?.disconnect();
    };
  }, [componentGroups]);

  return (
    <section aria-labelledby="component-gallery-title" className="flex h-full min-h-0 w-full bg-surface-base">
      <PageLayout ref={layoutRef} size="full" className="h-full min-h-0 w-full max-lg:!flex max-lg:overflow-y-auto" gutter="default">
        <ComponentDirectorySidebar
          activeSection={section}
          language={language}
          onQueryChange={(nextQuery) => { setQuery(nextQuery); updateUrl(nextQuery); }}
          onSectionSelect={selectSection}
          query={query}
        />

        <PageContent ref={contentRef} className="overflow-y-auto overscroll-contain max-lg:flex-none">
          <PageBody className="h-auto max-w-[1620px] overflow-visible p-4 sm:px-[18px] sm:py-5">
            <header className="border-b border-border pb-5">
              <h1 ref={galleryTitleRef} id="component-gallery-title" className="scroll-mt-4 text-heading font-semibold leading-tight text-fg-default">{text.galleryTitle}</h1>
              <p className="mt-2 max-w-3xl text-body text-fg-muted">{text.galleryDescription}</p>
            </header>

            <div aria-atomic="true" aria-live="polite" className="flex items-center justify-between gap-3 py-4">
              <p className="text-label text-fg-muted">{activeFilterLabel}</p>
              <p className="shrink-0 text-label text-fg-muted">{text.results.replace("{count}", String(visibleComponents.length))}</p>
            </div>

            {visibleComponents.length ? (
              <div className="flex flex-col gap-10 pb-4">
                {componentGroups.map((group) => (
                  <section id={`component-group-${group.section}`} key={group.section} aria-labelledby={`component-group-${group.section}-title`} className="scroll-mt-4">
                    <header className="mb-3 flex items-baseline justify-between gap-3">
                      <h2 id={`component-group-${group.section}-title`} className="text-title font-semibold text-fg-default">{sectionLabels[language][group.section]}</h2>
                      <span className="text-label text-fg-muted">{group.entries.length}</span>
                    </header>
                    <CardGroup className="gap-4" columns={3} separated style={{ gridTemplateColumns: "repeat(auto-fill, minmax(17rem, 1fr))" }}>
                      {group.entries.map((entry) => <ComponentCard key={entry.slug} coverTheme={coverTheme} entry={entry} href={`${localePrefix}/docs/components/${entry.slug}`} language={language} />)}
                    </CardGroup>
                  </section>
                ))}
              </div>
            ) : (
              <Empty announce density="compact" reason="no-results" scope="section">
                <EmptyMedia>
                  <EmptyIllustration variant="search" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>{text.empty}</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );
}

export function ComponentsDetailWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const language = pathname.startsWith("/en/") ? "en" : "zh";
  const components = useMemo(() => docEntries.filter((entry) => entry.collection === "components"), []);
  const slug = pathname.split("/").at(-1);
  const activeSection = components.find((entry) => entry.slug === slug)?.section as ComponentSection | undefined;
  const collectionPath = `${language === "en" ? "/en" : ""}/docs/components`;
  const navigateToCollection = (nextSection: ComponentSection | null, nextQuery = "") => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    const hash = nextSection ? `#component-group-${nextSection}` : "";
    router.push(`${collectionPath}${params.size ? `?${params}` : ""}${hash}`);
  };

  return (
    <section className="flex h-full min-h-0 w-full bg-surface-base">
      <PageLayout size="full" className="h-full min-h-0 w-full max-lg:!flex max-lg:overflow-y-auto" gutter="default">
        <ComponentDirectorySidebar
          activeSection={activeSection ?? null}
          currentSlug={slug}
          language={language}
          localePrefix={language === "en" ? "/en" : ""}
          onQueryChange={(query) => navigateToCollection(null, query)}
          onSectionSelect={(nextSection) => navigateToCollection(nextSection)}
          query=""
        />
        <PageContent className="overflow-y-auto overscroll-contain max-lg:flex-none max-lg:overflow-visible">
          <div className="grid min-h-full min-w-0">
            <RightPanel localePrefix={language === "en" ? "/en" : ""} placement="content" showSettings={false} />
            <PageBody className="col-start-1 row-start-1 h-auto max-w-[1100px] flex-none overflow-visible py-10 xl:pr-72">
              {children}
            </PageBody>
          </div>
        </PageContent>
      </PageLayout>
    </section>
  );
}

function ComponentCard({ coverTheme, entry, href, language }: { coverTheme: ComponentCoverTheme; entry: DocEntry; href: string; language: "en" | "zh" }) {
  const description = componentCardDescription(entry.slug, language, entry.description);
  return (
    <Card className="group min-w-0 rounded-3xl bg-transparent pb-0" href={href} label={entry.name}>
      <Container className="h-full">
        <ContainerBody className="overflow-hidden overscroll-auto bg-transparent p-0">
          <div className="relative aspect-[8/5] min-h-40 overflow-hidden bg-surface-base">
            <Image alt="" className="object-contain p-2 transition-transform duration-moderate group-hover/card:scale-[1.025]" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={componentCoverSrc(entry.slug, coverTheme)} />
          </div>
        </ContainerBody>
        <ContainerFooter className="min-h-20 flex-col items-start gap-1 py-3">
          <CardTitle className="transition-colors group-hover/card:text-fg-brand group-focus-within/card:text-fg-brand">{entry.name}</CardTitle>
          {description && <CardDescription className="line-clamp-2 text-label">{description}</CardDescription>}
        </ContainerFooter>
      </Container>
    </Card>
  );
}
