import { Skeleton } from "@zeron/ui/skeleton";

export function GalleryLoading() {
  return (
    <div aria-busy="true" className="h-full min-h-0 w-full overflow-hidden bg-surface-base p-4 sm:p-5">
      <div aria-hidden="true" className="mx-auto grid h-full max-w-[1620px] gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Skeleton className="hidden h-full rounded-xl lg:block" />
        <div className="min-w-0 p-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
          <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => <Skeleton className="aspect-video rounded-xl" key={index} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
