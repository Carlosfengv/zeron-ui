import "server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { DocPageLoader } from "@docs/generated/page-loader-types";
import { contentKeyOf, getDocEntry, pathnameOf, type DocCollection } from "@docs/manifest";
import { PageMessages } from "@docs/i18n/page-provider";
import { localeAlternates } from "@docs/seo/locale";
import type { AppLocale } from "@/app/_i18n/routing";

export function generateDocStaticParamsForCollection(
  collection: DocCollection,
  pageLoaders: Record<string, DocPageLoader>,
) {
  return Object.keys(pageLoaders)
    .filter((key) => key.startsWith(`${collection}/`))
    .map((key) => ({ slug: key.slice(collection.length + 1) }));
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
  const loader = pageLoaders[`${collection}/${slug}`];
  if (!entry || !loader) notFound();

  const Page = (await loader()).default;
  return (
    <PageMessages locale={locale} namespace={contentKeyOf(entry)}>
      <Page />
    </PageMessages>
  );
}
