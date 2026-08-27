import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { BlocksGallery } from "@docs/components/blocks/BlocksGallery";
import { assertLocale } from "@/app/_i18n/locale";

export default async function BlocksCollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);

  return (
    <div className="h-[calc(100svh-3rem)] min-h-0 w-full">
      <Suspense fallback={<div aria-busy="true" className="min-h-svh bg-surface-base" />}>
        <BlocksGallery localePrefix={locale === "en" ? "/en" : ""} />
      </Suspense>
    </div>
  );
}
