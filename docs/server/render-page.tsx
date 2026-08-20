import "server-only";

import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { pageLoaders } from "@docs/generated/page-loaders.generated";
import { collectionDefinitions, contentKeyOf, docEntries, getDocEntry, pathnameOf } from "@docs/manifest";
import { PageMessages } from "@docs/i18n/page-provider";
import { BlocksGallery } from "@docs/components/blocks/BlocksGallery";
import { ComponentsGallery } from "@docs/components/components/ComponentsGallery";
import { localeAlternates, localizedPathname } from "@docs/seo/locale";
import type { AppLocale } from "@/app/_i18n/routing";

export function generateDocStaticParams() {
  return Object.keys(pageLoaders).map((key) => {
    const [collection, slug] = key.split("/");
    return { collection, slug };
  });
}

export function generateCollectionStaticParams() {
  return collectionDefinitions.map(({ id }) => ({ collection: id }));
}

export async function generateDocMetadata({
  locale,
  collection,
  slug,
}: {
  locale: AppLocale;
  collection: string;
  slug: string;
}): Promise<Metadata> {
  const entry = getDocEntry(collection, slug);
  if (!entry) notFound();
  const messages = (await (locale === "en"
    ? import("@docs/content/en/common.json")
    : import("@docs/content/zh-CN/common.json"))).default as {
    docMeta: { descriptions: Record<string, string> };
  };
  const pathname = pathnameOf(entry);

  return {
    title: entry.name,
    description: messages.docMeta.descriptions[slug],
    alternates: localeAlternates(pathname, locale),
  };
}

export async function renderDocPage({
  locale,
  collection,
  slug,
}: {
  locale: AppLocale;
  collection: string;
  slug: string;
}) {
  const entry = getDocEntry(collection, slug);
  const loader = pageLoaders[`${collection}/${slug}`];
  if (!entry || !loader) notFound();

  const Page = (await loader()).default;
  return (
    <PageMessages locale={locale} namespace={contentKeyOf(entry)}>
      <Page />
    </PageMessages>
  );
}

export function renderCollectionPage({ collection, locale }: { collection: string; locale: AppLocale }) {
  const definition = collectionDefinitions.find(({ id }) => id === collection);
  if (!definition) notFound();

  if (collection === "blocks") {
    return (
      <Suspense fallback={<div aria-busy="true" className="min-h-svh bg-surface-base" />}>
        <BlocksGallery localePrefix={locale === "en" ? "/en" : ""} />
      </Suspense>
    );
  }

  if (collection === "components") {
    return (
      <Suspense fallback={<div aria-busy="true" className="min-h-svh bg-surface-base" />}>
        <ComponentsGallery localePrefix={locale === "en" ? "/en" : ""} />
      </Suspense>
    );
  }

  const entries = docEntries.filter((entry) => entry.collection === collection);
  return (
    <section aria-labelledby="collection-title" className="mx-auto w-full max-w-5xl px-6 py-20">
      <p className="text-label text-fg-muted">Documentation</p>
      <h1 id="collection-title" className="mt-2 text-display font-semibold text-fg-default">{definition.id}</h1>
      {entries.length ? (
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.slug}>
              <a
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-hover"
                href={localizedPathname(pathnameOf(entry), locale)}
              >
                <span className="font-medium text-fg-default">{entry.name}</span>
                {entry.description && <span className="mt-1 block text-body text-fg-muted">{entry.description}</span>}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-body text-fg-muted">This collection is being prepared.</p>
      )}
    </section>
  );
}
