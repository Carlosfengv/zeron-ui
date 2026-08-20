"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type Ref,
  type ReactNode,
} from "react";
import { Button } from "#components/button";
import { cn } from "#system/utils";

export type SidebarIdentityLayout = "auto" | "single-line" | "two-line";
export type SidebarIdentityAvatarTone = "brand" | "neutral";
export type SidebarIdentityTrailingPlacement = "inline" | "edge";

export interface SidebarIdentityAvatarProps
  extends ComponentPropsWithoutRef<"span"> {
  tone?: SidebarIdentityAvatarTone;
}

export const SidebarIdentityAvatar = forwardRef<
  HTMLSpanElement,
  SidebarIdentityAvatarProps
>(({ className, tone = "neutral", ...props }, ref) => (
  <span
    ref={ref}
    data-slot="sidebar-identity-avatar"
    data-tone={tone}
    className={cn(
      "flex size-8 shrink-0 items-center justify-center rounded-full text-label font-semibold",
      tone === "brand"
        ? "bg-brand text-fg-on-brand"
        : "bg-muted text-fg-default",
      className
    )}
    {...props}
  />
));
SidebarIdentityAvatar.displayName = "SidebarIdentityAvatar";

export interface SidebarIdentityRowProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** A static row is appropriate when no action or menu is available. */
  as?: "button" | "div";
  type?: ComponentPropsWithoutRef<"button">["type"];
  leading?: ReactNode;
  primary: ReactNode;
  description?: ReactNode;
  /** Auto renders two lines when a description exists; single-line keeps it inline. */
  layout?: SidebarIdentityLayout;
  trailing?: ReactNode;
  /** Inline follows the identity content; edge pins the trailing slot to the row end. */
  trailingPlacement?: SidebarIdentityTrailingPlacement;
}

export const SidebarIdentityRow = forwardRef<HTMLElement, SidebarIdentityRowProps>(
  (
    {
      as = "div",
      leading,
      primary,
      description,
      layout = "auto",
      trailing,
      trailingPlacement = "inline",
      className,
      type,
      ...props
    },
    ref
  ) => {
    const resolvedLayout = layout === "auto"
      ? (description ? "two-line" : "single-line")
      : layout;
    const content = (
      <span
        data-slot="sidebar-identity-content-row"
        className="flex min-w-0 w-full items-center gap-1.5"
      >
        <span
          data-slot="sidebar-identity-leading"
          className={cn(
            "flex min-w-0 items-center gap-1.5",
            trailingPlacement === "edge" && "flex-1"
          )}
        >
          {leading}
          <span
            data-slot="sidebar-identity-content"
            className={cn(
              "min-w-0 text-start",
              trailingPlacement === "edge" && "flex-1"
            )}
          >
            {resolvedLayout === "two-line" ? (
              <>
                <span className="block truncate text-body font-medium text-fg-default">{primary}</span>
                {description && <span className="block truncate text-label text-fg-muted">{description}</span>}
              </>
            ) : (
              <span className="flex min-w-0 items-baseline gap-1">
                <span className="truncate text-body font-medium text-fg-default">{primary}</span>
                {description && (
                  <span className="truncate text-label text-fg-muted">
                    <span aria-hidden="true">· </span>{description}
                  </span>
                )}
              </span>
            )}
          </span>
        </span>
        {trailing && (
          <span
            data-slot="sidebar-identity-trailing"
            className={cn(
              "flex shrink-0 self-center items-center text-fg-muted",
              trailingPlacement === "edge" && "ms-auto"
            )}
          >
            {trailing}
          </span>
        )}
      </span>
    );

    const rowClassName = cn(
      "min-w-0 w-full min-h-control-lg h-auto justify-start gap-1.5 px-0.5 py-2 [&>span.relative]:w-full [&>span.relative]:justify-start [&>span.relative>span]:min-w-0 [&>span.relative>span]:w-full",
      as === "button" && "!flex-1 max-xl:min-h-11",
      className
    );

    if (as === "button") {
      return (
        <Button
          ref={ref as Ref<HTMLButtonElement>}
          data-slot="sidebar-identity-row"
          data-layout={resolvedLayout}
          data-trailing-placement={trailingPlacement}
          type={type ?? "button"}
          variant="ghost"
          size="lg"
          className={rowClassName}
          {...props}
        >
          {content}
        </Button>
      );
    }

    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        data-slot="sidebar-identity-row"
        data-layout={resolvedLayout}
        data-trailing-placement={trailingPlacement}
        className={cn("flex min-h-control-lg h-auto items-center", rowClassName)}
        {...props}
      >
        {content}
      </div>
    );
  }
);
SidebarIdentityRow.displayName = "SidebarIdentityRow";
