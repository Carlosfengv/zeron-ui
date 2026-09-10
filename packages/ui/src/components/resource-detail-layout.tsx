"use client";

import { forwardRef, type ReactNode } from "react";
import {
  PageActions,
  PageAside,
  PageBody,
  PageColumns,
  PageContent,
  PageContentHeader,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageLayout,
  PagePrimary,
  PageTitle,
  type PageColumnsProps,
  type ResourcePageLayoutProps,
} from "#components/page-layout";
import { cn } from "#system/utils";

export interface ResourceDetailLayoutProps extends ResourcePageLayoutProps {
  /** Breadcrumbs or other page-level navigation rendered above the content surface. */
  navigation?: ReactNode;
  /** Controls for closing the detail or moving between adjacent records. */
  recordNavigation?: ReactNode;
  /** Resource logo or icon rendered before the title. */
  leading?: ReactNode;
  /** Status rendered beside the page title and outside the h1. */
  status?: ReactNode;
  /** Page-level resource actions. */
  actions?: ReactNode;
  /** Route navigation or a TabsList supplied by the caller. */
  tabs?: ReactNode;
  /** Auxiliary resource facts. */
  aside?: ReactNode;
  /** Accessible name required when aside is present. */
  asideLabel?: string;
  asideWidth?: PageColumnsProps["asideWidth"];
  asideSide?: PageColumnsProps["asideSide"];
  columnsAt?: PageColumnsProps["columnsAt"];
  /**
   * `columns` gives the primary and aside panes independent desktop scrolling.
   * Stacked responsive layouts continue to use the shared body scroller.
   */
  scrollMode?: "body" | "columns";
}

const independentColumnScrollClasses = {
  lg: {
    body: "lg:overflow-hidden",
    columns:
      "lg:h-full lg:min-h-0 lg:grid-rows-[minmax(0,1fr)] lg:items-stretch",
    pane: "lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain",
  },
  xl: {
    body: "xl:overflow-hidden",
    columns:
      "xl:h-full xl:min-h-0 xl:grid-rows-[minmax(0,1fr)] xl:items-stretch",
    pane: "xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain",
  },
} as const;

/**
 * A full-width detail-page preset with fixed context controls and caller-selected
 * body or desktop-column scrolling. Business state and mutations remain caller-owned.
 */
const ResourceDetailLayout = forwardRef<
  HTMLDivElement,
  ResourceDetailLayoutProps
>(
  (
    {
      actions,
      aside,
      asideLabel,
      asideSide = "right",
      asideWidth = "20rem",
      children,
      columnsAt = "xl",
      description,
      gutter = "default",
      leading,
      navigation,
      recordNavigation,
      scrollMode = "body",
      size = "full",
      status,
      tabs,
      title,
      ...props
    },
    ref
  ) => {
    const columnScroll =
      scrollMode === "columns"
        ? independentColumnScrollClasses[columnsAt]
        : undefined;

    return (
      <PageLayout ref={ref} gutter={gutter} size={size} {...props}>
        {navigation && (
          <PageHeader className="px-0">
            <PageHeaderContent>{navigation}</PageHeaderContent>
          </PageHeader>
        )}

        <PageContent className="rounded-2xl">
          {recordNavigation && (
            <PageContentHeader
              className="justify-start p-0"
              data-slot="resource-detail-navigation"
            >
              {recordNavigation}
            </PageContentHeader>
          )}

          <header
            data-slot="resource-detail-summary"
            className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border p-3 max-sm:items-start"
          >
            <div className="flex min-w-0 items-center gap-2">
              {leading && (
                <div
                  data-slot="resource-detail-leading"
                  className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border-[0.5px] border-border bg-muted p-1"
                >
                  {leading}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <PageTitle>{title}</PageTitle>
                  {status}
                </div>
                {description && (
                  <PageDescription className="mt-0 max-w-none truncate text-label">
                    {description}
                  </PageDescription>
                )}
              </div>
            </div>
            {actions && <PageActions>{actions}</PageActions>}
          </header>

          {tabs && (
            <div
              data-slot="resource-detail-tabs"
              className="min-w-0 shrink-0 overflow-x-auto px-3 py-1.5"
            >
              {tabs}
            </div>
          )}

          <PageBody className={cn("max-w-none p-3", columnScroll?.body)}>
            <PageColumns
              asideSide={asideSide}
              asideWidth={asideWidth}
              columnsAt={columnsAt}
              className={cn("gap-3", columnScroll?.columns)}
            >
              <PagePrimary className={columnScroll?.pane}>
                {children}
              </PagePrimary>
              {aside && (
                <PageAside
                  aria-label={asideLabel}
                  className={columnScroll?.pane}
                >
                  {aside}
                </PageAside>
              )}
            </PageColumns>
          </PageBody>
        </PageContent>
      </PageLayout>
    );
  }
);

ResourceDetailLayout.displayName = "ResourceDetailLayout";

export { ResourceDetailLayout };
