"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type * as React from "react";
import { cn } from "#system/utils";
import { useIcon } from "#system/icon-context";

type BreadcrumbProps = React.ComponentProps<"nav">;

function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn(className)}
      data-slot="breadcrumb"
      {...props}
    />
  );
}

type BreadcrumbListProps = React.ComponentProps<"ol">;

function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-body text-fg-muted sm:gap-2.5",
        className
      )}
      data-slot="breadcrumb-list"
      {...props}
    />
  );
}

type BreadcrumbItemProps = React.ComponentProps<"li">;

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return (
    <li
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
      data-slot="breadcrumb-item"
      {...props}
    />
  );
}

type BreadcrumbLinkProps = useRender.ComponentProps<"a">;

function BreadcrumbLink({
  className,
  render,
  ...props
}: BreadcrumbLinkProps) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "rounded-control outline-none transition-colors duration-fast hover:text-fg-default focus-visible:text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring",
          className
        ),
      },
      props
    ),
    render,
    state: { slot: "breadcrumb-link" },
  });
}

type BreadcrumbPageProps = React.ComponentProps<"span">;

function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return (
    <span
      aria-current="page"
      className={cn("min-w-0 text-fg-default", className)}
      data-slot="breadcrumb-page"
      {...props}
    />
  );
}

type BreadcrumbSeparatorProps = React.ComponentProps<"li">;

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) {
  const ChevronRight = useIcon("chevron-right");

  return (
    <li
      aria-hidden="true"
      className={cn("shrink-0 [&>svg]:size-3.5", className)}
      data-slot="breadcrumb-separator"
      role="presentation"
      {...props}
    >
      {children ?? <ChevronRight strokeWidth={1.5} />}
    </li>
  );
}

type BreadcrumbEllipsisProps = React.ComponentProps<"span">;

function BreadcrumbEllipsis({
  className,
  ...props
}: BreadcrumbEllipsisProps) {
  const Ellipsis = useIcon("ellipsis");

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center",
        className
      )}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <Ellipsis size={16} strokeWidth={1.5} />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
export type {
  BreadcrumbEllipsisProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbListProps,
  BreadcrumbPageProps,
  BreadcrumbProps,
  BreadcrumbSeparatorProps,
};
