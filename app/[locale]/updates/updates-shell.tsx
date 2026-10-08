import type { ReactNode } from "react";
import { PageBody, PageContent, PageLayout } from "@zeron/ui/page-layout";
import { Skeleton } from "@zeron/ui/skeleton";

export function UpdatesLayout({
  title,
  description,
  children,
  pending,
}: {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  pending?: boolean;
}) {
  return (
    <section aria-busy={pending || undefined} aria-labelledby="updates-title" className="flex h-full min-h-0 w-full bg-surface-base">
      <PageLayout className="h-full min-h-0 w-full" gutter="default" size="full">
        <PageContent className="overflow-y-auto overscroll-contain">
          <PageBody className="h-auto max-w-[960px] flex-none overflow-visible overscroll-auto px-5 py-10 sm:px-8 sm:py-14">
            <header>
              <h1 className="text-heading font-semibold text-fg-default" id="updates-title">{title}</h1>
              <p className="mt-2 max-w-prose text-body text-fg-muted">{description}</p>
            </header>
            {children}
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );
}

export function UpdatesHistorySkeleton({ label }: { label?: string }) {
  return (
    <div aria-busy="true" role={label ? "status" : undefined}>
      {label && <span className="sr-only">{label}</span>}
      <div aria-hidden="true" className="mt-6"><Skeleton className="h-56 w-full rounded-3xl" /></div>
      <div className="mt-5 border-b border-border pb-8"><Skeleton className="h-4 w-32" /></div>
      <div aria-hidden="true" className="pb-10 pt-9">
        <Skeleton className="mb-2 h-6 w-40" />
        <div className="divide-y divide-border-subtle border-t border-border-subtle">
          {[0, 1, 2].map((row) => (
            <div className="grid min-w-0 gap-2 py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-5" key={row}>
              <Skeleton className="h-4 w-12" />
              <div className="min-w-0">
                <Skeleton className="h-5 w-full max-w-sm" />
                <Skeleton className="mt-2 h-4 w-40 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
