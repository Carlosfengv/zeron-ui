import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { assertLocale } from "@/i18n/locale";
import { localeAlternates } from "@/i18n/seo";
import { PageMessages } from "@/i18n/page-messages";
import { getDocEntry } from "@/docs/manifest";
import { routing } from "@/i18n/routing";

type LocaleParams = Promise<{ locale: string }>;

export function generateDocumentationStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateDocumentationMetadata(
  slug: string,
  params: LocaleParams,
): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const entry = getDocEntry(slug);
  if (!entry || entry.kind !== "page") notFound();
  const messages = (await (
    locale === "en"
      ? import("../../../messages/en/common.json")
      : import("../../../messages/zh-CN/common.json")
  )).default as { docMeta: { descriptions: Record<string, string> } };

  return {
    title: entry.name,
    description: messages.docMeta.descriptions[slug],
    alternates: localeAlternates(entry.pathname, locale),
  };
}

export async function LocalizedDocumentationPage({
  slug,
  Page,
  params,
}: {
  slug: string;
  Page: ComponentType;
  params: LocaleParams;
}) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);

  return (
    <PageMessages locale={locale} namespace={`docs/${slug}`}>
      <Page />
    </PageMessages>
  );
}
