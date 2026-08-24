"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { InputCopy } from "@zeron/ui/input-copy";
import { cn } from "@zeron/ui/system/utils";

interface AgentGuideProps {
  collection: "blocks" | "components";
  slug: string;
  className?: string;
}

export function AgentGuide({ collection, slug, className }: AgentGuideProps) {
  const pathname = usePathname();
  const isChinese = !pathname.toLowerCase().startsWith("/en/");
  const rawHref = `/agent-guides/${collection}/${slug}.md`;
  const [guideUrl, setGuideUrl] = useState(rawHref);

  useEffect(() => {
    setGuideUrl(new URL(rawHref, window.location.origin).href);
  }, [rawHref]);

  const copy = isChinese
    ? {
        title: "AI Agent 使用指南",
        description:
          "复制下面的 Markdown 链接并提供给 coding agent。Agent 可以直接读取其中的选型、组合、状态和集成约束。",
        linkLabel: "Agent guide URL",
        open: "打开原始 Markdown",
      }
    : {
        title: "AI agent guide",
        description:
          "Copy this Markdown URL into your coding agent. It contains the selection, composition, state, and integration contract for this item, and is currently maintained in Chinese.",
        linkLabel: "Agent guide URL",
        open: "Open raw Markdown",
      };

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div>
        <h2 className="text-title font-semibold leading-none text-fg-default">
          {copy.title}
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-5 text-fg-muted">
          {copy.description}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <InputCopy
            align="left"
            className="w-full"
            label={copy.linkLabel}
            value={guideUrl}
          />
        </div>
        <a
          className="inline-flex h-control-md shrink-0 items-center justify-center rounded-lg border border-border bg-transparent px-3 text-body font-medium text-fg-default outline-none transition-colors hover:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring"
          href={rawHref}
          target="_blank"
          rel="noreferrer"
          type="text/markdown"
        >
          {copy.open}
        </a>
      </div>
    </section>
  );
}
