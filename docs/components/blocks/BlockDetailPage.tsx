"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode } from "react";
import { Badge } from "@zeron/ui/badge";
import { cn } from "@zeron/ui/system/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@zeron/ui/breadcrumb";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { InstallCommand } from "@docs/components/content/InstallCommand";
import { DocPager } from "@docs/components/navigation/DocPager";
import { docEntries } from "@docs/manifest";
import { getArtifact } from "@docs/catalog/artifacts";
import {
  localePrefixFromPathname,
  localizePathname,
} from "@docs/components/shell/site/locale-path";

const previewFrameClass = "aspect-video max-h-[1008px] min-h-0 min-w-0 w-full overflow-hidden rounded-xl";

interface BlockDetailPageProps {
  children: ReactNode;
  code: string;
  description: ReactNode;
  preview: ReactNode;
  registryName?: string;
  slug: string;
  title: string;
}

export function BlockDetailPage({
  children,
  code,
  description,
  preview,
  slug,
  registryName = slug,
  title,
}: BlockDetailPageProps) {
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const common = useTranslations("common");
  const previewText = useTranslations("preview");
  const artifact = getArtifact(slug);
  const isChinese = Boolean(localePrefix);
  const collectionLabel = isChinese ? "业务模板" : "Business templates";
  const entries = docEntries.filter((entry) => entry.collection === "blocks");
  const currentIndex = entries.findIndex((entry) => entry.slug === slug);
  const prev = currentIndex > 0
    ? entries[currentIndex - 1]
    : { slug: "", name: collectionLabel, collection: "blocks" as const, pathname: "/docs/blocks" };
  const next = currentIndex >= 0 && currentIndex < entries.length - 1
    ? entries[currentIndex + 1]
    : null;

  const kindLabel = artifact ? (isChinese ? ({ block: "区块", page: "页面", flow: "流程", prototype: "原型", layout: "布局" } as const)[artifact.kind] : artifact.kind) : "Block";
  const readinessLabel = artifact ? (isChinese ? ({ "copy-ready": "可直接使用", "adapter-required": "需要接入数据", "demo-only": "仅用于演示" } as const)[artifact.readiness] : artifact.readiness.replace(/-/g, " ")) : "registry:block";
  const dataModeLabel = artifact ? (isChinese ? ({ static: "静态", mock: "模拟数据", controlled: "受控数据", "api-ready": "可接 API" } as const)[artifact.dataMode] : artifact.dataMode.replace(/-/g, " ")) : "registry:block";

  return (
    <article aria-labelledby="artifact-title" className="min-w-0 bg-surface-base p-3">
      <div className="flex w-full flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between gap-3 px-2 sm:px-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={localizePathname("/docs/blocks", localePrefix)} />}>
                  {collectionLabel}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DocPager prev={prev} next={next} />
        </header>

        <div className="flex flex-col gap-3 rounded-xl bg-surface-raised p-3">
          <section
            aria-label={previewText("preview")}
            className={cn(
              previewFrameClass,
              "relative"
            )}
          >
            <div className="h-full">
              <ComponentPreview
                className="rounded-xl"
                code={code}
                browserFrame
                fill
                fullScreenable
                inspectable={false}
                align="top"
                allowScrollChaining
                padding="none"
                title={`${slug}.tsx`}
              >
                {preview}
              </ComponentPreview>
            </div>
          </section>

          <section className="rounded-xl bg-surface-floating px-5 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="blue">{kindLabel}</Badge>
              {artifact && <Badge variant="dot">{artifact.product}</Badge>}
              <Badge variant="dot">{readinessLabel}</Badge>
              <Badge variant="dot">{dataModeLabel}</Badge>
            </div>
            <h1 id="artifact-title" className="mt-5 text-heading font-bold leading-tight text-fg-default">{title}</h1>
            <p className="mt-2 max-w-3xl text-body text-fg-muted">{description}</p>
          </section>

          <section className="rounded-xl bg-surface-floating px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <section className="border-b border-border py-6">
              <h2 className="mb-3 text-title font-semibold leading-none text-fg-default">
                {common("installation")}
              </h2>
              <InstallCommand value={`npx zeron-ui add ${registryName}`} />
            </section>

            <div className="flex flex-col gap-7 py-6">{children}</div>
          </section>
        </div>
      </div>
    </article>
  );
}

export function BlockDetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-title font-semibold leading-none text-fg-default">{title}</h2>
      {children}
    </section>
  );
}
