"use client";

import { forwardRef, type HTMLAttributes } from "react";
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
      },
      size: {
        sm: "h-badge-sm px-2 text-label gap-1",
        md: "h-badge-md px-2.5 text-label gap-1.5",
        lg: "h-badge-lg px-3 text-body gap-1.5",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  }
);

type BadgeBaseProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> &
  Omit<VariantProps<typeof badgeVariants>, "variant">;

type BadgeProps = BadgeBaseProps &
  (
    | {
        variant?: "solid" | "dot";
        color?: BadgeColorInput;
        /** Product status, intentionally distinct from categorical `color`. */
        status?: BadgeStatus;
      }
    | {
        variant: "strong";
        color?: BadgeColorInput;
        /** Strong status badges need dedicated on-fill semantic tokens first. */
        status?: never;
      }
  );

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "solid",
      size = "md",
      color = "gray",
      status,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const showsDot = variant === "dot";
    const statusColors = status ? badgeStatusTokens[status] : null;
    const categoricalTokens = badgeCategoricalTokens(color);
    const dotSize = size === "sm" ? 6 : size === "lg" ? 8 : 7;

    const categoricalStyle = variant === "strong"
      ? categoricalTokens.strong
      : categoricalTokens.soft;
    const colorStyle = showsDot
      ? {}
      : statusColors
        ? {
            color: statusColors.foreground,
            backgroundColor: statusColors.background,
            borderColor: statusColors.border,
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
          statusColors && !showsDot && "border",
          "rounded-lg",
          className
        )}
        style={{ ...colorStyle, ...style }}
        data-status={status}
        {...props}
      >
        {showsDot && (
          <span
            className="shrink-0 rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: dotColor,
            }}
          />
        )}
        <span>{children}</span>
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
