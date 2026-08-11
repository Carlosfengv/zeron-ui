"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type PageLayoutSize = "sm" | "md" | "lg" | "full";

const pageLayoutVariants = cva("mx-auto grid w-full min-w-0 gap-y-8 px-4 py-8 sm:px-6 lg:gap-x-10 lg:px-8 lg:[&:has(>[data-slot=page-aside])]:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)]", {
  variants: {
    size: {
      sm: "max-w-[40rem]",
      md: "max-w-[56rem]",
      lg: "max-w-[75rem]",
      full: "max-w-none",
    },
  },
  defaultVariants: { size: "md" },
});

export interface PageLayoutProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof pageLayoutVariants> {}
export type PageHeaderProps = ComponentPropsWithoutRef<"header">;
export type PageHeaderContentProps = ComponentPropsWithoutRef<"div">;
export type PageTitleProps = ComponentPropsWithoutRef<"h1">;
export type PageDescriptionProps = ComponentPropsWithoutRef<"p">;
export type PageActionsProps = ComponentPropsWithoutRef<"div">;
export type PageBodyProps = ComponentPropsWithoutRef<"div">;
export type PageAsideProps = ComponentPropsWithoutRef<"aside">;

const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(({ size, className, ...props }, ref) => (
  <div ref={ref} data-slot="page-layout" className={cn(pageLayoutVariants({ size }), className)} {...props} />
));

PageLayout.displayName = "PageLayout";

const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(({ className, ...props }, ref) => (
  <header ref={ref} data-slot="page-header" className={cn("col-span-full flex min-w-0 flex-wrap items-start justify-between gap-4 max-sm:flex-col", className)} {...props} />
));

PageHeader.displayName = "PageHeader";

const PageHeaderContent = forwardRef<HTMLDivElement, PageHeaderContentProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="page-header-content" className={cn("min-w-0", className)} {...props} />
));

PageHeaderContent.displayName = "PageHeaderContent";

const PageTitle = forwardRef<HTMLHeadingElement, PageTitleProps>(({ className, ...props }, ref) => (
  <h1 ref={ref} data-slot="page-title" className={cn("text-heading text-fg-default [text-box:trim-both_cap_alphabetic]", className)} {...props} />
));

PageTitle.displayName = "PageTitle";

const PageDescription = forwardRef<HTMLParagraphElement, PageDescriptionProps>(({ className, ...props }, ref) => (
  <p ref={ref} data-slot="page-description" className={cn("mt-2 max-w-prose text-body text-fg-muted", className)} {...props} />
));

PageDescription.displayName = "PageDescription";

const PageActions = forwardRef<HTMLDivElement, PageActionsProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="page-actions" className={cn("flex shrink-0 flex-wrap items-center gap-2 max-sm:w-full", className)} {...props} />
));

PageActions.displayName = "PageActions";

const PageBody = forwardRef<HTMLDivElement, PageBodyProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="page-body" className={cn("min-w-0 lg:col-start-1", className)} {...props} />
));

PageBody.displayName = "PageBody";

const PageAside = forwardRef<HTMLElement, PageAsideProps>(({ className, ...props }, ref) => (
  <aside ref={ref} data-slot="page-aside" className={cn("min-w-0 lg:col-start-2 lg:row-start-2", className)} {...props} />
));

PageAside.displayName = "PageAside";

export {
  PageLayout,
  PageHeader,
  PageHeaderContent,
  PageTitle,
  PageDescription,
  PageActions,
  PageBody,
  PageAside,
  pageLayoutVariants,
};
