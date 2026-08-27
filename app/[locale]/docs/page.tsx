import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import IntroductionContent from "@docs/pages/introduction";
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
    title: messages.docMeta.introductionTitle,
    description: messages.docMeta.introductionDescription,
    alternates: localeAlternates("/docs", locale),
  };
}

export default async function DocsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  return (
    <div className="mx-auto mt-12 w-full max-w-[960px] py-20 sm:py-28 lg:mt-0">
      <PageMessages locale={locale} namespace="docs/introduction"><IntroductionContent /></PageMessages>
    </div>
  );
}
