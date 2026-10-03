import { Skeleton } from "@zeron/ui/skeleton";

// Keep this boundary server-only. Client PageLayout references inherit the page's
// chunk dependencies in Flight and would wait for the same gallery code this
// fallback must cover. Mirror its joined-panel geometry with decorative markup.
export function ComponentsGalleryLoading() {
  return (
    <div data-route-loading="components" aria-busy="true" className="flex h-full min-h-0 w-full bg-surface-base">
      <div aria-hidden="true" className="mx-auto grid h-full min-h-0 w-full min-w-0 grid-cols-[220px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-0 p-3 max-lg:flex max-lg:flex-col max-lg:overflow-y-auto">
        <div className="h-full min-h-0 w-[220px] shrink-0 overflow-hidden rounded-l-xl border-hairline border-r-0 border-border bg-surface-floating p-3 max-lg:h-auto max-lg:w-full max-lg:rounded-t-xl max-lg:rounded-b-none max-lg:border-r-hairline max-lg:border-b-0">
          <Skeleton className="h-9 w-full" />
          <div className="mt-4">
            <Skeleton className="mb-1.5 h-4 w-28" />
            <div className="flex flex-wrap gap-1 lg:flex-col">
              {Array.from({ length: 10 }, (_, index) => <Skeleton className="h-9 w-36 max-w-full lg:w-full" key={index} />)}
            </div>
          </div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-r-xl border-hairline border-l-0 border-border bg-surface-floating max-lg:flex-none max-lg:rounded-b-xl max-lg:rounded-t-none max-lg:border-t-0">
          <div className="mx-auto h-auto min-h-0 w-full min-w-0 max-w-[1620px] flex-1 overflow-visible p-4 sm:px-[18px] sm:py-5">
            <div className="border-b border-border pb-5">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="mt-3 h-4 w-full max-w-xl" />
            </div>
            <Skeleton className="my-4 h-4 w-32" />
            <Skeleton className="mb-3 h-6 w-40" />
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, max(22rem, calc((100% - 2rem) / 3))), 1fr))" }}>
              {Array.from({ length: 6 }, (_, index) => <Skeleton className="aspect-[8/5] rounded-3xl" key={index} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
