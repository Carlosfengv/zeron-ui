import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { Skeleton } from "@zeron/ui/skeleton";
import { ComponentsGallery } from "@docs/components/components/ComponentsGallery";
import { assertLocale } from "@/app/_i18n/locale";

function ComponentsGalleryLoading() {
  return (
    <div aria-busy="true" className="h-full min-h-0 w-full bg-surface-base p-4 sm:p-5">
      <div className="mx-auto grid h-full max-w-[1620px] gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <Skeleton className="hidden h-full rounded-xl lg:block" />
        <div className="rounded-xl border border-border bg-surface-floating p-5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton className="aspect-[8/5] rounded-3xl" key={index} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

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
