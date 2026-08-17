"use client";

import { useMemo, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Card, CardDescription, CardGroup, CardHeader, CardTitle } from "@zeron/ui/card";
import { Input } from "@zeron/ui/input";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageLayout, PageSidebar } from "@zeron/ui/page-layout";
import { useIcon, type IconName } from "@zeron/icons/context";
import { usePathname } from "next/navigation";
import { localePrefixFromPathname } from "@docs/components/shell/site/locale-path";

const guideCategories = ["start", "compose", "connect"] as const;
type GuideCategory = (typeof guideCategories)[number];

const copy = {
  en: {
    all: "All",
    categories: { start: "Get started", compose: "Compose", connect: "Connect" },
    empty: "No guides match the current search and filters.",
    filterByCategory: "Filter by topic",
    filters: "Filters",
    galleryDescription: "Practical paths for choosing assets, composing a page, and connecting a working product experience.",
    galleryTitle: "Build with a clear next step",
    guides: "guides",
    search: "Search guides…",
  },
  zh: {
    all: "全部",
    categories: { start: "开始使用", compose: "组合搭建", connect: "接入产品" },
    empty: "没有符合当前搜索和筛选条件的指南。",
    filterByCategory: "按主题筛选",
    filters: "筛选",
    galleryDescription: "围绕选择资产、组合页面与接入真实产品体验，提供可执行的搭建路径。",
    galleryTitle: "从清晰的下一步开始搭建",
    guides: "篇指南",
    search: "搜索指南…",
  },
} as const;

const guideIcons: Record<GuideCategory | "all", IconName> = {
  all: "square-library",
  start: "doc-showcase",
  compose: "doc-page-layout",
  connect: "doc-data-grid",
};

function GuideFilter({ active, count, icon, label, onSelect, value }: {
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

export default function GuidesPage() {
  const pathname = usePathname();
  const language = localePrefixFromPathname(pathname) ? "zh" : "en";
  const t = copy[language];
  const [category, setCategory] = useState<GuideCategory | null>(null);
  const [query, setQuery] = useState("");
  const SearchIcon = useIcon("search");
  const guides = [
    {
      category: "start",
      title: language === "zh" ? "从业务模板开始" : "Start from a business template",
      description: language === "zh" ? "选择最接近业务目标的 Block、Page、Flow 或 Layout，先建立可用的产品起点。" : "Choose the Block, Page, Flow, or Layout closest to the job and establish a useful product starting point.",
    },
    {
      category: "start",
      title: language === "zh" ? "选择正确的资产边界" : "Choose the right asset boundary",
      description: language === "zh" ? "理解局部能力、完整路由、任务流程和应用框架的边界，避免用错搭建层级。" : "Distinguish local capabilities, complete routes, task flows, and application frames before building.",
    },
    {
      category: "compose",
      title: language === "zh" ? "用组件组合页面" : "Compose a page from components",
      description: language === "zh" ? "从 Foundations 与 Layout 建立结构，再用业务组件完成可用的页面信息与操作。" : "Establish structure with Foundations and Layout, then add business components for real information and actions.",
    },
    {
      category: "connect",
      title: language === "zh" ? "接入真实数据与状态" : "Connect real data and states",
      description: language === "zh" ? "为加载、空数据、错误与可操作状态定义最小数据契约，让原型走向真实产品。" : "Define the minimum data contract for loading, empty, error, and actionable states to take a prototype into production.",
    },
  ] as const;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleGuides = useMemo(
    () => guides.filter((guide) => {
      const searchable = `${guide.title} ${guide.description} ${guide.category}`.toLowerCase();
      return (!category || guide.category === category) && (!normalizedQuery || searchable.includes(normalizedQuery));
    }),
    [category, guides, normalizedQuery],
  );
  const categoryCounts = useMemo(
    () => new Map(guideCategories.map((item) => [item, guides.filter((guide) => guide.category === item).length])),
    [guides],
  );

  return (
    <section aria-labelledby="guides-gallery-title" className="flex h-[calc(100svh-3rem)] min-h-0 w-full bg-surface-base">
      <PageLayout size="full" className="h-full min-h-0 w-full max-lg:!flex max-lg:overflow-y-auto" gutter="default">
        <PageSidebar aria-label={t.filterByCategory} width="220px" className="h-full p-3 max-lg:h-auto max-lg:overflow-visible">
          <div>
            <div className="relative">
              <SearchIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 z-content size-4 -translate-y-1/2 text-fg-muted" strokeWidth={1.5} />
              <Input aria-label={t.search} className="bg-surface-base pl-9" onChange={(event) => setQuery(event.target.value)} placeholder={t.search} value={query} />
            </div>
            <p className="mt-5 border-t border-border pt-5 text-label font-medium text-fg-default">{t.filters}</p>
            <section className="mt-4">
              <p className="px-1 pb-1.5 text-label text-fg-muted">{t.filterByCategory}</p>
              <NavMenu activeValue={category ?? "all"} aria-label={t.filterByCategory} className="max-lg:[&_[data-slot=nav-list]]:flex-row max-lg:[&_[data-slot=nav-list]]:flex-wrap" keyboardNavigation="roving">
                <GuideFilter active={category === null} count={guides.length} icon={guideIcons.all} label={t.all} onSelect={() => setCategory(null)} value="all" />
                {guideCategories.map((item) => <GuideFilter key={item} active={category === item} count={categoryCounts.get(item) ?? 0} icon={guideIcons[item]} label={t.categories[item]} onSelect={() => setCategory(item)} value={item} />)}
              </NavMenu>
            </section>
          </div>
        </PageSidebar>

        <PageContent className="max-lg:flex-none max-lg:overflow-visible">
          <PageBody className="h-full max-w-none p-4 sm:px-[18px] sm:py-5 max-lg:h-auto max-lg:overflow-visible">
            <header className="border-b border-border pb-5">
              <h1 id="guides-gallery-title" className="text-heading font-semibold leading-tight text-fg-default">{t.galleryTitle}</h1>
              <p className="mt-2 max-w-3xl text-body text-fg-muted">{t.galleryDescription}</p>
            </header>

            <div aria-atomic="true" aria-live="polite" className="flex items-center justify-between gap-3 py-4">
              <p className="text-label text-fg-muted">{category ? t.categories[category] : t.all}</p>
              <p className="shrink-0 text-label text-fg-muted">{visibleGuides.length} {t.guides}</p>
            </div>

            {visibleGuides.length ? (
              <CardGroup border="outlined" columns={2} separated style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                {visibleGuides.map((guide) => <Card key={guide.title} className="min-w-0 bg-surface-floating"><CardHeader><Badge variant="dot" size="sm">{t.categories[guide.category]}</Badge><CardTitle className="mt-4">{guide.title}</CardTitle><CardDescription className="mt-2">{guide.description}</CardDescription></CardHeader></Card>)}
              </CardGroup>
            ) : <p className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised p-6 text-body text-fg-muted">{t.empty}</p>}
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );
}
