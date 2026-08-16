"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { blockCatalog } from "@zeron/blocks/catalog";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Input } from "@zeron/ui/input";
import { useIcon } from "@zeron/icons/context";
import { InstallCommand } from "@docs/components/content/InstallCommand";
import { BlockPreview } from "@docs/components/blocks/BlockPreview";

const categories = [...new Set(blockCatalog.flatMap((block) => block.categories))];

const copy = {
  en: {
    all: "All",
    available: "Available blocks",
    description: "Full application sections and layouts assembled from Zeron UI primitives.",
    eyebrow: "Blocks",
    open: "Open block",
    noResults: "No blocks match this search and category.",
    search: "Search blocks…",
    title: "Application building blocks",
  },
  zh: {
    all: "全部",
    available: "可用 Blocks",
    description: "由 Zeron UI 原语组合而成的完整应用区块与页面布局。",
    eyebrow: "Blocks",
    open: "查看 Block",
    noResults: "没有符合当前搜索和分类的 Block。",
    search: "搜索 Blocks…",
    title: "应用构建区块",
  },
} as const;

export function BlocksGallery({ localePrefix = "" }: { localePrefix?: string }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const Search = useIcon("search");
  const ArrowRight = useIcon("arrow-right");
  const text = localePrefix ? copy.zh : copy.en;
  const normalizedQuery = query.trim().toLowerCase();
  const blocks = useMemo(
    () => blockCatalog.filter((block) => {
      const matchesCategory = !category || block.categories.includes(category as never);
      const matchesQuery = !normalizedQuery || `${block.title} ${block.name} ${block.description} ${block.dependencies.join(" ")}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    }),
    [category, normalizedQuery],
  );

  return (
    <main className="min-h-svh min-w-0 bg-surface-base p-3 pt-14 xl:pt-3">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col">
        <header className="flex h-11 shrink-0 items-center px-2 text-body text-fg-muted sm:px-3">
          {text.eyebrow}
        </header>

        <section className="rounded-xl bg-surface-raised p-3">
          <div className="rounded-xl bg-surface-floating px-5 py-7 sm:px-8 sm:py-9">
            <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-end">
              <div>
                <Badge color="blue">{blockCatalog.length} blocks</Badge>
                <h1 className="mt-5 text-display font-semibold leading-tight text-fg-default">{text.title}</h1>
                <p className="mt-2 max-w-2xl text-body text-fg-muted">{text.description}</p>
              </div>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-content size-4 -translate-y-1/2 text-fg-muted" strokeWidth={1.5} />
                <Input
                  aria-label={text.search}
                  className="bg-surface-base pl-9"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={text.search}
                  value={query}
                />
              </div>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4">
              <h2 className="text-title font-semibold text-fg-default">{text.available}</h2>
              <div className="flex flex-wrap gap-1" aria-label="Filter Blocks by category">
                <Button size="sm" variant={category === null ? "secondary" : "ghost"} onClick={() => setCategory(null)}>{text.all}</Button>
                {categories.map((item) => (
                  <Button key={item} size="sm" variant={category === item ? "secondary" : "ghost"} onClick={() => setCategory(item)}>{item}</Button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-border">
              {blocks.map((block) => {
                const pageSlug = "slug" in block ? block.slug : block.name;
                return (
                  <article className="grid gap-5 py-5 lg:grid-cols-[minmax(18rem,0.95fr)_minmax(0,1.05fr)] lg:items-center" key={block.name}>
                    <div className="overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-raised p-2">
                      <div className="overflow-hidden rounded-lg border-[0.5px] border-border bg-surface-base">
                        <BlockPreview name={pageSlug} />
                      </div>
                    </div>

                    <div className="min-w-0 lg:px-3">
                      <div className="flex flex-wrap gap-2">
                        {block.categories.map((item) => <Badge key={item} variant="dot" size="sm">{item}</Badge>)}
                      </div>
                      <h3 className="mt-4 text-heading font-semibold leading-tight text-fg-default">
                        <Link className="rounded-lg outline-none hover:text-fg-brand focus-visible:ring-1 focus-visible:ring-focus-ring" href={`${localePrefix}/docs/blocks/${pageSlug}`}>
                          {block.title}
                        </Link>
                      </h3>
                      <p className="mt-2 max-w-xl text-body text-fg-muted">{block.description}</p>
                      <p className="mt-3 text-label text-fg-subtle">Uses: {block.dependencies.join(", ")}</p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Button asChild className="whitespace-nowrap" size="sm" trailingIcon={ArrowRight} variant="neutral">
                          <Link href={`${localePrefix}/docs/blocks/${pageSlug}`}>{text.open}</Link>
                        </Button>
                        <InstallCommand compact value={`npx zeron-ui add ${block.name}`} />
                      </div>
                    </div>
                  </article>
                );
              })}
              {blocks.length === 0 && (
                <div className="flex min-h-48 items-center justify-center text-body text-fg-muted">
                  {text.noResults}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
