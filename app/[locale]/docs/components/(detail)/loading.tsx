import { Skeleton } from "@zeron/ui/skeleton";

export default function ComponentDocumentationLoading() {
  return (
    <div aria-busy="true" className="space-y-8 px-6 py-10">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
