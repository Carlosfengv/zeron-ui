import "server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { DocPageLoader } from "@docs/generated/page-loader-types";
import { contentKeyOf, docEntries, getDocEntry, pageKeyOf, pathnameOf, type DocCollection } from "@docs/manifest";
import { PageMessages } from "@docs/i18n/page-provider";
import { localeAlternates } from "@docs/seo/locale";
import type { AppLocale } from "@/app/_i18n/routing";

export function generateDocStaticParamsForCollection(
  collection: DocCollection,
  pageLoaders: Record<string, DocPageLoader>,
) {
  return docEntries
    .filter((entry) => entry.collection === collection && pageLoaders[pageKeyOf(entry)])
    .map(({ slug }) => ({ slug }));
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
  pageLoaders,
}: {
  locale: AppLocale;
  collection: string;
  slug: string;
  pageLoaders: Record<string, DocPageLoader>;
}) {
  const entry = getDocEntry(collection, slug);
  const loader = entry && pageLoaders[pageKeyOf(entry)];
  if (!entry || !loader) notFound();

  const Page = (await loader()).default;
  return (
    <PageMessages locale={locale} namespace={contentKeyOf(entry)}>
      <Page />
    </PageMessages>
  );
}
