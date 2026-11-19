"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@zeron/ui/button";
import { Badge } from "@zeron/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { Command, CommandInput, CommandItem, CommandList } from "@zeron/ui/command";
import { Kbd } from "@zeron/ui/kbd";
import { useIcon } from "@zeron/icons/context";
import { navigationDocEntries, pathnameOf } from "@docs/manifest";
import { galleryArtifacts } from "@docs/catalog/standalone-pages";
import { artifactCopy } from "@docs/lib/ai-design-assets";
import { componentCardDescription } from "@docs/components/components/component-card-copy";
import { artifactPathname } from "@docs/catalog/artifact-collections";
import { localizePathname } from "@docs/components/shell/site/locale-path";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  href: string;
  keywords: string;
}

export function SiteCommandPalette({ localePrefix }: { localePrefix: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState("");
  const router = useRouter();
  const SearchIcon = useIcon("search");
  const isEn = localePrefix === "/en";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const allItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [
      {
        id: "nav-docs",
        title: isEn ? "Design System & Quick Start" : "设计语言与快速开始",
        subtitle: isEn ? "Surfaces, tactile motion, tokens, and project setup" : "五层光影表面、物理弹簧手感、色彩令牌与项目初始化",
        category: isEn ? "Design System" : "设计语言",
        href: localizePathname("/docs", localePrefix),
        keywords: "docs introduction design system surfaces tokens motion 介绍 设计语言 快速开始 安装",
      },
      {
        id: "nav-ai",
        title: isEn ? "Build with AI (MCP & Skills)" : "✦ 用 AI 搭建页面与旧项目焕新",
        subtitle: isEn ? "Connect Cursor, Claude, or Codex to generate Zeron interfaces" : "连接 Cursor / Claude / Codex，用一句话生成符合设计规范的页面",
        category: isEn ? "AI Studio" : "用 AI 搭建",
        href: localizePathname("/docs/ai", localePrefix),
        keywords: "ai mcp skills cursor claude codex prompt swap migration 智能体 搭建 迁移",
      },
      {
        id: "nav-icons",
        title: isEn ? "Multi-Style Icon Library" : "多风格语义图标库",
        subtitle: isEn ? "Preview semantic icons and copy their useIcon calls" : "预览语义图标，复制对应的 useIcon 调用",
        category: isEn ? "Icons" : "图标库",
        href: localizePathname("/docs/icons", localePrefix),
        keywords: "icons svg hugeicons stroke duotone 图标",
      },
    ];

    for (const entry of navigationDocEntries) {
      if (entry.collection === "components" || entry.collection === "icons") {
        const isFoundation = entry.section === "foundations";
        items.push({
          id: `${entry.collection}-${entry.slug}`,
          title: entry.name,
          subtitle: componentCardDescription(entry.slug, isEn ? "en" : "zh", entry.description) ?? "",
          category: entry.collection === "icons" ? (isEn ? "Icons" : "图标库") : isFoundation
            ? isEn
              ? "Design System"
              : "设计语言"
            : entry.section === "ai-agent"
              ? isEn
                ? "AI Component"
                : "AI 组件"
              : isEn
                ? "Component"
                : "组件",
          href: localizePathname(pathnameOf(entry), localePrefix),
          keywords: `${entry.name} ${entry.slug} ${entry.section} ${entry.description ?? ""}`.toLowerCase(),
        });
      }
    }

    for (const artifact of galleryArtifacts) {
      const copy = "href" in artifact ? artifact : artifactCopy(artifact, isEn);
      items.push({
        id: `artifact-${artifact.slug}`,
        title: copy.title,
        subtitle: copy.description,
        category:
          artifact.collection === "pages"
            ? isEn
              ? "Page Template"
              : "完整页面"
            : isEn
              ? "Block"
              : "功能模块",
        href: "href" in artifact ? artifact.href : localizePathname(artifactPathname(artifact.slug), localePrefix),
        keywords: [
          artifact.slug,
          artifact.title,
          artifact.description,
          ...artifact.domains,
          ...artifact.patterns,
          ...artifact.searchTerms,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    }

    return items;
  }, [isEn, localePrefix]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allItems.slice(0, 14);
    const matches = allItems.filter(item => [item.title, item.subtitle, item.keywords, item.category]
      .some(text => text.toLowerCase().includes(term)));
    const exactTitle = (item: SearchItem) => Number(item.title.toLowerCase() === term);
    return matches.sort((a, b) => exactTitle(b) - exactTitle(a)).slice(0, 18);
  }, [allItems, query]);
  const activeValue = results.find(item => item.id === selection)?.id ?? results[0]?.id ?? "";

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const triggerLabel = isEn ? "Search components, templates…" : "搜组件、页面模板、灵感…";

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        leadingIcon={SearchIcon}
        aria-label={triggerLabel}
        onClick={() => setOpen(true)}
      >
        <span className="max-md:hidden">{isEn ? "Search…" : "搜索灵感…"}</span>
        <Kbd className="ml-1 max-sm:hidden">⌘K</Kbd>
      </Button>

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{triggerLabel}</DialogTitle>
          </DialogHeader>
          <Command label={triggerLabel} loop shouldFilter={false} value={activeValue} onValueChange={setSelection}>
            <CommandInput
              autoFocus
              value={query}
              onValueChange={(value) => { setSelection(""); setQuery(value); }}
              placeholder={isEn ? "Search components and templates…" : "搜索组件、页面或业务场景…"}
            />
            <CommandList className="p-2">
              {results.length === 0 && <p role="status" className="py-8 text-center text-body text-fg-muted">
                {isEn ? "No matching results." : "没有找到匹配结果。"}
              </p>}
              {results.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelect(item.href)}
                  className="justify-between gap-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body font-medium">{item.title}</div>
                    {item.subtitle && <div className="truncate text-label text-fg-muted">{item.subtitle}</div>}
                  </div>
                  <Badge size="sm" color="gray">{item.category}</Badge>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
