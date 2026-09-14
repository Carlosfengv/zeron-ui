import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { BlocksGallery } from "@docs/components/blocks/BlocksGallery";
import { localeAlternates } from "@docs/seo/locale";
import { assertLocale } from "@/app/_i18n/locale";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  return {
    title: locale === "en" ? "Blocks" : "区块",
    description: locale === "en"
      ? "Reusable tables, metrics, traces and editors to compose into your pages."
      : "将可复用的表格、指标、调用链和编辑器组合到你的业务页面中。",
    alternates: localeAlternates("/docs/blocks", locale),
  };
}

export default async function BlocksCollectionPage({ params, searchParams }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const filters = await searchParams;
  if (filters.kind === "page" || filters.kind === "prototype") {
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(filters)) {
      for (const item of Array.isArray(value) ? value : value ? [value] : []) query.append(name, item);
    }
    redirect(`${locale === "en" ? "/en" : ""}/docs/pages?${query}`);
  }

  return (
    <div className="h-full min-h-0 w-full">
      <Suspense fallback={<div aria-busy="true" className="h-full bg-surface-base" />}>
        <BlocksGallery localePrefix={locale === "en" ? "/en" : ""} />
      </Suspense>
    </div>
  );
}
