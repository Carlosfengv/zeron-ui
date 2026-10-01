import type { AppLocale } from "@/app/_i18n/routing";
import type { DocCollection } from "@docs/manifest";

export function DocDetailLoading({
  collection,
  locale,
  name,
}: {
  collection: DocCollection;
  locale: AppLocale;
  name: string;
}) {
  const loadingLabel = locale === "en" ? "Loading documentation…" : "正在加载文档…";
  const collectionLabel = collection === "pages"
    ? (locale === "en" ? "Pages" : "页面")
    : (locale === "en" ? "Blocks" : "区块");

  if (collection === "components") {
    return (
      <>
        <span className="sr-only" role="status">{loadingLabel}</span>
        <div aria-busy="true" className="flex flex-col gap-8 px-6">
          <div>
            <h1 className="text-heading font-bold leading-none text-fg-default">{name}</h1>
            <div aria-hidden="true" className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-surface-raised" />
          </div>
          <div aria-hidden="true" className="space-y-3">
            <div className="h-6 w-32 animate-pulse rounded bg-surface-raised" />
            <div className="h-10 w-full max-w-md animate-pulse rounded bg-surface-raised" />
          </div>
          <div aria-hidden="true" className="h-72 w-full animate-pulse rounded-xl bg-surface-raised" />
        </div>
      </>
    );
  }

  return (
    <>
      <span className="sr-only" role="status">{loadingLabel}</span>
      <article aria-busy="true" className="min-w-0 bg-surface-base p-3" data-docs-workspace="blocks">
        <div className="flex h-11 items-center px-3 text-label text-fg-muted">
          {collectionLabel}
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-surface-raised p-3">
          <div aria-hidden="true" className="aspect-video w-full animate-pulse rounded-xl bg-surface-floating" />
          <div className="rounded-xl bg-surface-floating px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[960px]">
              <h1 className="text-heading font-bold text-fg-default">{name}</h1>
              <div aria-hidden="true" className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-surface-raised" />
              <div aria-hidden="true" className="mt-8 h-48 w-full animate-pulse rounded bg-surface-raised" />
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
