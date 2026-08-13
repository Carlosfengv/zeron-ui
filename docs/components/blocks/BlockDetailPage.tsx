"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
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
import { blockCatalog } from "@zeron/blocks/catalog";
import { docEntries } from "@docs/manifest";
import {
  localePrefixFromPathname,
  localizePathname,
} from "@docs/components/shell/site/locale-path";

interface BlockDetailPageProps {
  children: ReactNode;
  code: string;
  description: ReactNode;
  preview: ReactNode;
  previewMinHeightClass?: string;
  slug: string;
  title: string;
}

export function BlockDetailPage({
  children,
  code,
  description,
  preview,
  previewMinHeightClass = "min-h-[32rem]",
  slug,
  title,
}: BlockDetailPageProps) {
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const common = useTranslations("common");
  const previewText = useTranslations("preview");
  const entries = docEntries.filter((entry) => entry.collection === "blocks");
  const currentIndex = entries.findIndex((entry) => entry.slug === slug);
  const prev = currentIndex > 0
    ? entries[currentIndex - 1]
    : { slug: "", name: "Blocks", collection: "blocks" as const, pathname: "/docs/blocks" };
  const next = currentIndex >= 0 && currentIndex < entries.length - 1
    ? entries[currentIndex + 1]
    : null;

  return (
    <main className="min-h-svh min-w-0 bg-surface-base p-3 pt-14 xl:pt-3">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between gap-3 px-2 sm:px-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={localizePathname("/docs/blocks", localePrefix)} />}>
                  Blocks
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

        <div className="flex flex-col gap-3 rounded-container bg-surface-raised p-3">
          <section
            aria-label={previewText("preview")}
            className={cn(
              "h-[clamp(32rem,70svh,52rem)] min-w-0 overflow-hidden rounded-container",
              previewMinHeightClass
            )}
          >
            <ComponentPreview
              className="rounded-container"
              code={code}
              browserFrame
              fill
              fullScreenable
              inspectable={false}
              padding="none"
              title={`${slug}.tsx`}
            >
              {preview}
            </ComponentPreview>
          </section>

          <aside className="rounded-container bg-surface-floating px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <header className="border-b border-border pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge color="blue">{blockCatalog.length} blocks</Badge>
                <Badge variant="dot">registry:block</Badge>
              </div>
              <h1 className="mt-5 text-heading font-bold leading-tight text-fg-default">{title}</h1>
              <p className="mt-2 text-body text-fg-muted">{description}</p>
            </header>

            <section className="border-b border-border py-6">
              <h2 className="mb-3 text-title font-semibold leading-none text-fg-default">
                {common("installation")}
              </h2>
              <InstallCommand value={`npx zeron-ui add ${slug}`} />
            </section>

            <div className="flex flex-col gap-7 py-6">{children}</div>
          </aside>
        </div>
      </div>
    </main>
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
