"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#system/utils";
import {
  badgeCategoricalTokens,
  badgeColors,
  badgeStatusTokens,
  type BadgeColor,
  type BadgeColorInput,
  type BadgeCustomColor,
  type BadgeStatus,
} from "./badge-colors";

const badgeVariants = cva(
  "inline-flex w-fit max-w-full items-center font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        solid: "",
        strong: "",
        dot: "border border-border text-fg-default",
        plain: "rounded-none font-normal",
      },
      size: {
        sm: "h-badge-sm px-2 text-label gap-1",
        md: "h-badge-md px-2.5 text-label gap-1.5",
        lg: "h-badge-lg px-3 text-body gap-1.5",
      },
    },
    compoundVariants: [{ variant: "plain", className: "h-auto px-0 py-0" }],
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  }
);

type BadgeBaseProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> &
  Omit<VariantProps<typeof badgeVariants>, "variant">;

type BadgeProps = BadgeBaseProps & {
  variant?: "solid" | "dot" | "strong" | "plain";
  color?: BadgeColorInput;
  /** Product status, intentionally distinct from categorical `color`. */
  status?: BadgeStatus;
  /** Replaces the indicator dot. Icons are decorative; provide an accessible label for icon-only badges. */
  leadingIcon?: ReactNode;
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "solid",
      size = "md",
      color = "gray",
      status,
      children,
      leadingIcon,
      style,
      ...props
    },
    ref
  ) => {
    const plain = variant === "plain";
    const showsDot = (variant === "dot" || plain) && leadingIcon == null;
    const statusColors = status ? badgeStatusTokens[status] : null;
    const statusBorderColor = statusColors
      ? `color-mix(in oklab, ${statusColors.border} 28%, transparent)`
      : undefined;
    const categoricalTokens = badgeCategoricalTokens(color);
    const dotSize = size === "sm" ? 6 : size === "lg" ? 8 : 7;

    const categoricalStyle = variant === "strong"
      ? categoricalTokens.strong
      : categoricalTokens.soft;
    const colorStyle = plain
      ? { color: statusColors?.foreground ?? "var(--fg-default)" }
      : variant === "dot"
      ? (statusColors ? { borderColor: statusBorderColor } : {})
      : statusColors
        ? {
            color: variant === "strong" ? `var(--fg-on-${status === "neutral" ? "neutral-status" : status}-strong)` : statusColors.foreground,
            backgroundColor: variant === "strong" ? `var(--${status === "neutral" ? "neutral-status" : status}-strong)` : statusColors.background,
            borderColor: variant === "strong" ? "transparent" : statusBorderColor,
          }
        : {
            color: categoricalStyle.foreground,
            backgroundColor: categoricalStyle.background,
            borderColor: categoricalStyle.border,
          };

    const dotColor = statusColors
      ? statusColors.icon
      : categoricalTokens.dot;

    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({ variant, size }),
          statusColors && variant === "solid" && "border",
          !plain && "rounded-lg",
          className
        )}
        style={{ ...colorStyle, ...style }}
        data-status={status}
        data-slot="badge"
        data-variant={variant}
        {...props}
      >
        {showsDot && (
          <span
            aria-hidden="true"
            data-slot="badge-marker"
            className="shrink-0 rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: dotColor,
            }}
          />
        )}
        {leadingIcon != null && <span aria-hidden="true" data-slot="badge-icon" className="inline-flex shrink-0 items-center justify-center [&_svg]:size-4" style={variant === "dot" ? { color: dotColor } : undefined}>{leadingIcon}</span>}
        {children != null && <span data-slot="badge-label">{children}</span>}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants, badgeColors };
export type {
  BadgeProps,
  BadgeColor,
  BadgeColorInput,
  BadgeCustomColor,
  BadgeStatus,
};
