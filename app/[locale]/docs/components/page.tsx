import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { ComponentsGalleryLoading } from "@docs/components/shell/site/components-gallery-loading";
import { ComponentsGallery } from "@docs/components/components/ComponentsGallery";
import { assertLocale } from "@/app/_i18n/locale";

export default async function ComponentsCollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);

  return (
    <div className="h-full min-h-0 w-full">
      <Suspense fallback={<ComponentsGalleryLoading />}>
        <ComponentsGallery localePrefix={locale === "en" ? "/en" : ""} />
      </Suspense>
    </div>
  );
}
