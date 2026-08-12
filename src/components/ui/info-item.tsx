import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type InfoItemLayout = "stacked" | "inline";

export type InfoItemGroupProps = ComponentPropsWithoutRef<"div">;

const InfoItemGroup = forwardRef<HTMLDivElement, InfoItemGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="info-item-group"
      className={cn(
        "divide-y divide-border-subtle overflow-hidden rounded-container border border-border-subtle bg-surface-floating",
        className
      )}
      {...props}
    />
  )
);

InfoItemGroup.displayName = "InfoItemGroup";

export interface InfoItemProps extends ComponentPropsWithoutRef<"div"> {
  /** Controls whether the title and description stack or share one line. */
  layout?: InfoItemLayout;
}

const InfoItem = forwardRef<HTMLDivElement, InfoItemProps>(
  ({ layout = "stacked", className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="info-item"
      data-layout={layout}
      className={cn(
        "group/info-item flex min-w-0 items-center gap-3 px-3 py-3",
        className
      )}
      {...props}
    />
  )
);

InfoItem.displayName = "InfoItem";

export type InfoItemLeadingProps = ComponentPropsWithoutRef<"div">;

const InfoItemLeading = forwardRef<HTMLDivElement, InfoItemLeadingProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="info-item-leading"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-control bg-muted text-fg-muted",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
);

InfoItemLeading.displayName = "InfoItemLeading";

export type InfoItemContentProps = ComponentPropsWithoutRef<"div">;

const InfoItemContent = forwardRef<HTMLDivElement, InfoItemContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="info-item-content"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0.5",
        "group-data-[layout=inline]/info-item:flex-row group-data-[layout=inline]/info-item:items-baseline group-data-[layout=inline]/info-item:gap-2",
        className
      )}
      {...props}
    />
  )
);

InfoItemContent.displayName = "InfoItemContent";

export type InfoItemTitleProps = ComponentPropsWithoutRef<"div">;

const InfoItemTitle = forwardRef<HTMLDivElement, InfoItemTitleProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="info-item-title"
      className={cn(
        "min-w-0 text-body font-medium leading-5 text-fg-default",
        "group-data-[layout=inline]/info-item:shrink-0",
        className
      )}
      {...props}
    />
  )
);

InfoItemTitle.displayName = "InfoItemTitle";

export type InfoItemDescriptionProps = ComponentPropsWithoutRef<"div">;

const InfoItemDescription = forwardRef<HTMLDivElement, InfoItemDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="info-item-description"
      className={cn(
        "min-w-0 text-label leading-5 text-fg-muted",
        "group-data-[layout=inline]/info-item:flex-1 group-data-[layout=inline]/info-item:truncate",
        className
      )}
      {...props}
    />
  )
);

InfoItemDescription.displayName = "InfoItemDescription";

export type InfoItemTrailingProps = ComponentPropsWithoutRef<"div">;

const InfoItemTrailing = forwardRef<HTMLDivElement, InfoItemTrailingProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="info-item-trailing"
      className={cn(
        "ml-auto flex shrink-0 items-center justify-end gap-2 text-right text-fg-default",
        className
      )}
      {...props}
    />
  )
);

InfoItemTrailing.displayName = "InfoItemTrailing";

export type InfoItemValueProps = ComponentPropsWithoutRef<"span">;

const InfoItemValue = forwardRef<HTMLSpanElement, InfoItemValueProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="info-item-value"
      className={cn(
        "whitespace-nowrap text-body font-semibold tabular-nums text-fg-default",
        className
      )}
      {...props}
    />
  )
);

InfoItemValue.displayName = "InfoItemValue";

export {
  InfoItem,
  InfoItemContent,
  InfoItemDescription,
  InfoItemGroup,
  InfoItemLeading,
  InfoItemTitle,
  InfoItemTrailing,
  InfoItemValue,
};
