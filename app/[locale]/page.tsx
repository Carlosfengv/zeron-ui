import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import SourceHomePage from "@/app/(source)/page";
import { assertLocale } from "@/i18n/locale";
import { PageMessages } from "@/i18n/page-messages";
import { localeAlternates } from "@/i18n/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const messages = (await (
    locale === "en"
      ? import("../../messages/en/common.json")
      : import("../../messages/zh-CN/common.json")
  )).default;

  return {
    title: messages.docMeta.homeTitle,
    description: messages.docMeta.homeDescription,
    alternates: localeAlternates("/", locale),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  return <PageMessages locale={locale} namespace="home"><SourceHomePage /></PageMessages>;
}
