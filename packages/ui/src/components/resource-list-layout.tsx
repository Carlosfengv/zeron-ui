"use client";

import { forwardRef, type ReactNode } from "react";
import {
  PageActions,
  PageBody,
  PageContent,
  PageContentHeader,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageLayout,
  PageTitle,
  type ResourcePageLayoutProps,
} from "#components/page-layout";

export interface ResourceListLayoutProps extends ResourcePageLayoutProps {
  /** Page-level actions, such as the primary create action. */
  actions?: ReactNode;
  /** Search, filters, and other list-level controls. */
  toolbar?: ReactNode;
  /** Statistics or context that should scroll with the list. */
  summary?: ReactNode;
  /** Caller-owned pagination controls kept outside the scrolling body. */
  pagination?: ReactNode;
}

/**
 * A full-height page preset for browsing, filtering, and acting on a collection
 * of resources. The host remains responsible for providing a bounded height.
 */
const ResourceListLayout = forwardRef<HTMLDivElement, ResourceListLayoutProps>(
  (
    {
      actions,
      children,
      description,
      gutter = "default",
      pagination,
      size = "full",
      summary,
      title,
      toolbar,
      ...props
    },
    ref
  ) => (
    <PageLayout ref={ref} gutter={gutter} size={size} {...props}>
      <PageHeader>
        <PageHeaderContent>
          <div className="min-w-0">
            <PageTitle>{title}</PageTitle>
            {description && <PageDescription>{description}</PageDescription>}
          </div>
        </PageHeaderContent>
        {actions && <PageActions>{actions}</PageActions>}
      </PageHeader>

      <PageContent>
        {toolbar && <PageContentHeader>{toolbar}</PageContentHeader>}
        <PageBody className="max-w-[1620px] flex flex-col gap-3 p-3">
          {summary && (
            <div data-slot="resource-list-summary" className="min-w-0 shrink-0">
              {summary}
            </div>
          )}
          {children}
        </PageBody>
        {pagination && (
          <div
            data-slot="resource-list-pagination"
            className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border p-3"
          >
            {pagination}
          </div>
        )}
      </PageContent>
    </PageLayout>
  )
);

ResourceListLayout.displayName = "ResourceListLayout";

export { ResourceListLayout };
