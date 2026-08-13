import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import HomeContent from "@docs/pages/home";
import { assertLocale } from "@/app/_i18n/locale";
import { PageMessages } from "@docs/i18n/page-provider";
import { localeAlternates } from "@docs/seo/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const messages = (await (
    locale === "en"
      ? import("@docs/content/en/common.json")
      : import("@docs/content/zh-CN/common.json")
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
  return <PageMessages locale={locale} namespace="home"><HomeContent /></PageMessages>;
}
