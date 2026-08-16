"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "#system/utils";

export type DetailListProps = ComponentPropsWithoutRef<"div">;

/** A framed, composable surface for compact label-value details. */
const DetailList = forwardRef<HTMLDivElement, DetailListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="list"
      data-slot="detail-list"
      className={cn(
        "flex min-w-0 flex-col gap-1 overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-floating p-3",
        className
      )}
      {...props}
    />
  )
);

DetailList.displayName = "DetailList";

export type DetailListItemProps = ComponentPropsWithoutRef<"div">;

const DetailListItem = forwardRef<HTMLDivElement, DetailListItemProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="listitem"
      data-slot="detail-list-item"
      className={cn(
        "flex min-h-control-md min-w-0 items-center justify-between gap-4 py-1.5",
        className
      )}
      {...props}
    />
  )
);

DetailListItem.displayName = "DetailListItem";

export type DetailListLabelProps = ComponentPropsWithoutRef<"div">;

const DetailListLabel = forwardRef<HTMLDivElement, DetailListLabelProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="detail-list-label"
      className={cn(
        "min-w-0 shrink-0 text-body leading-5 font-medium text-fg-default",
        className
      )}
      {...props}
    />
  )
);

DetailListLabel.displayName = "DetailListLabel";

export type DetailListValueProps = ComponentPropsWithoutRef<"div">;

const DetailListValue = forwardRef<HTMLDivElement, DetailListValueProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="detail-list-value"
      className={cn(
        "ml-auto min-w-0 max-w-[70%] text-right text-body leading-5 text-fg-muted break-words",
        className
      )}
      {...props}
    />
  )
);

DetailListValue.displayName = "DetailListValue";

export type DetailListSectionProps = ComponentPropsWithoutRef<"section">;

const DetailListSection = forwardRef<HTMLElement, DetailListSectionProps>(
  ({ className, ...props }, ref) => (
    <section
      ref={ref}
      role="group"
      data-slot="detail-list-section"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
);

DetailListSection.displayName = "DetailListSection";

export type DetailListSectionLabelProps = ComponentPropsWithoutRef<"h3">;

const DetailListSectionLabel = forwardRef<HTMLHeadingElement, DetailListSectionLabelProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      data-slot="detail-list-section-label"
      className={cn(
        "py-1.5 text-label leading-5 font-normal text-fg-subtle",
        className
      )}
      {...props}
    />
  )
);

DetailListSectionLabel.displayName = "DetailListSectionLabel";

export type DetailListSeparatorProps = ComponentPropsWithoutRef<"div">;

const DetailListSeparator = forwardRef<HTMLDivElement, DetailListSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      data-slot="detail-list-separator"
      className={cn(
        "flex h-2 shrink-0 items-center after:h-px after:w-full after:bg-border-subtle after:content-['']",
        className
      )}
      {...props}
    />
  )
);

DetailListSeparator.displayName = "DetailListSeparator";

export {
  DetailList,
  DetailListItem,
  DetailListLabel,
  DetailListSection,
  DetailListSectionLabel,
  DetailListSeparator,
  DetailListValue,
};
