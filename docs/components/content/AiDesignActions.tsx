"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@zeron/ui/button";
import { Badge } from "@zeron/ui/badge";
import { Textarea } from "@zeron/ui/textarea";
import { useIcon } from "@zeron/icons/context";
import { buildAiDesignPrompt } from "@docs/lib/ai-prompt-builder";
import { artifactCopy, blocksForComponent, componentsForBlock, designContractPath } from "@docs/lib/ai-design-assets";
import { artifactPathname } from "@docs/catalog/artifact-collections";
import { localizePathname, localePrefixFromPathname } from "@docs/components/shell/site/locale-path";

export function AiDesignActions({
  kind,
  registryName,
  installItems = registryName,
  title,
  description,
}: {
  kind: "component" | "block" | "page";
  registryName: string;
  installItems?: string;
  title: string;
  description?: string;
}) {
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const isEn = localePrefix === "/en";
  const [copyResult, setCopyResult] = useState<{ status: "copied" } | { status: "manual"; prompt: string } | null>(null);
  const copiedPrompt = copyResult?.status === "copied";
  const SparklesIcon = useIcon("brain");
  const CheckIcon = useIcon("check");
  const FileIcon = useIcon("file");

  useEffect(() => {
    if (copyResult?.status !== "copied") return;
    const timer = window.setTimeout(() => setCopyResult(null), 2400);
    return () => window.clearTimeout(timer);
  }, [copyResult]);

  const contractPath = designContractPath(registryName);
  if (!contractPath) return null;

  async function handleCopyAiPrompt(path: string) {
    const relatedComps = kind === "component" ? [] : componentsForBlock(registryName);
    const prompt = buildAiDesignPrompt({
      kind,
      installItems,
      registryName,
      title,
      description,
      locale: isEn ? "en" : "zh-CN",
      contractUrl: new URL(path, window.location.origin).href,
      relatedComponents: relatedComps.map((c) => c.name),
    });
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyResult({ status: "copied" });
    } catch {
      setCopyResult({ status: "manual", prompt });
    }
  }

  const promptButtonLabel = copiedPrompt
    ? isEn
      ? "Copied AI Design Prompt"
      : "已复制 AI 设计提示词"
    : kind === "component"
      ? isEn
        ? "Use with AI in my page"
        : "让 AI 把它加进我的页面"
      : isEn
        ? "Adapt template with AI"
        : "让 AI 基于此模板改写";

  const contractLabel = isEn ? "Design Contract (.md)" : "设计契约 (.md)";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        leadingIcon={copiedPrompt ? CheckIcon : SparklesIcon}
        onClick={() => handleCopyAiPrompt(contractPath)}
      >
        {promptButtonLabel}
      </Button>
      <Button asChild size="sm" variant="ghost" leadingIcon={FileIcon}>
        <a href={contractPath} target="_blank" rel="noreferrer" type="text/markdown">
          {contractLabel}
        </a>
      </Button>
      {copyResult?.status === "manual" && (
        <label className="flex w-full flex-col gap-2 text-label text-fg-muted">
          <span role="status">{isEn ? "Copy the AI prompt manually" : "请手动复制 AI 提示词"}</span>
          <Textarea readOnly rows={4} value={copyResult.prompt} onFocus={event => event.currentTarget.select()} />
        </label>
      )}
    </div>
  );
}

export function RelatedBlocksSection({ componentSlug }: { componentSlug: string }) {
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const isEn = localePrefix === "/en";
  const related = blocksForComponent(componentSlug);

  if (related.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <div>
        <h2 className="text-title font-semibold leading-none text-fg-default">
          {isEn ? "Used in Pages & Blocks" : "真实成品页面与模块参考"}
        </h2>
        <p className="mt-1.5 text-body text-fg-muted">
          {isEn
            ? "See how this component is composed with surrounding surfaces and controls in production templates."
            : "查看该组件在真实产品页面与业务模块中的空间配比和搭配效果。"}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {related.map((artifact) => {
          const copy = artifactCopy(artifact, isEn);
          return (
            <Link
              key={artifact.slug}
              href={localizePathname(artifactPathname(artifact.slug), localePrefix)}
              className="group flex flex-col justify-between gap-2 rounded-xl border border-border bg-surface-raised p-4 transition-colors duration-fast hover:bg-hover"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-body font-medium text-fg-default transition-colors group-hover:text-fg-brand">
                  {copy.title}
                </span>
                <Badge size="sm" color="blue">
                  {artifact.collection === "pages" ? (isEn ? "Full Page" : "完整页面") : isEn ? "Block" : "业务模块"}
                </Badge>
              </div>
              {copy.description && (
                <p className="line-clamp-2 text-label text-fg-muted">{copy.description}</p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function BlockUsedComponentsBar({ registryName }: { registryName: string }) {
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const isEn = localePrefix === "/en";
  const components = componentsForBlock(registryName);

  if (components.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3">
      <span className="text-label text-fg-muted">
        {isEn ? "Built with components:" : "构成此页面的核心组件："}
      </span>
      {components.map((comp) => (
        <Link
          key={comp.slug}
          href={localizePathname(`/docs/components/${comp.slug}`, localePrefix)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-base px-2.5 py-1 font-mono text-label text-fg-default transition-colors hover:bg-hover"
        >
          <span>{comp.name}</span>
          <span aria-hidden="true" className="text-fg-subtle">↗</span>
        </Link>
      ))}
    </div>
  );
}
