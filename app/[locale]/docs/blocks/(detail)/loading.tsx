export default function BlockDocumentationLoading() {
  return (
    <article aria-busy="true" className="min-w-0 bg-surface-base p-3" data-docs-workspace="blocks">
      <div className="flex w-full flex-col gap-3">
        <div className="h-11 w-full rounded-lg bg-surface-base" />
        <div className="flex flex-col gap-3 rounded-xl bg-surface-raised p-3">
          <div className="aspect-video w-full animate-pulse rounded-xl bg-surface-floating" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-surface-floating" />
        </div>
      </div>
    </article>
  );
}
