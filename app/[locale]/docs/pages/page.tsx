import { Suspense } from "react";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import { BlocksGallery } from "@docs/components/blocks/BlocksGallery";
import { localeAlternates } from "@docs/seo/locale";
import { assertLocale } from "@/app/_i18n/locale";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  return {
    title: locale === "en" ? "Pages" : "页面",
    description: locale === "en"
      ? "Explore complete dashboards, detail pages, settings and authentication screens."
      : "浏览完整的工作台、详情、设置和认证页面，选择适合业务的页面起点。",
    alternates: localeAlternates("/docs/pages", locale),
  };
}

export default async function PagesCollectionPage({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  // Render the search-parameter-driven gallery in the initial HTML too.
  await connection();

  return (
    <div className="h-full min-h-0 w-full">
      <Suspense fallback={<div aria-busy="true" className="h-full bg-surface-base" />}>
        <BlocksGallery collection="pages" localePrefix={locale === "en" ? "/en" : ""} />
      </Suspense>
    </div>
  );
}
