"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import {
  badgeCategoricalTokens,
  badgeColors,
  badgeStatusTokens,
  type BadgeColor,
  type BadgeStatus,
} from "./badge-colors";


const badgeVariants = cva(
  "inline-flex w-fit max-w-full items-center font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        solid: "",
        dot: "border border-border text-fg-default",
      },
      size: {
        sm: "h-5 px-2 text-label gap-1",
        md: "h-6 px-2.5 text-label gap-1.5",
        lg: "h-control-xs px-3 text-body gap-1.5",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  }
);

interface BadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof badgeVariants> {
  color?: BadgeColor;
  /** Product status, intentionally distinct from categorical `color`. */
  status?: BadgeStatus;
}

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
    const shape = useShape();
    const isSolid = variant === "solid";
    const statusColors = status ? badgeStatusTokens[status] : null;
    const categoricalTokens = badgeCategoricalTokens(color);
    const dotSize = size === "sm" ? 6 : size === "lg" ? 8 : 7;

    const colorStyle = isSolid
      ? statusColors
        ? {
            color: statusColors.foreground,
            backgroundColor: statusColors.background,
            borderColor: statusColors.border,
          }
        : {
            color: categoricalTokens.foreground,
            backgroundColor: categoricalTokens.background,
            borderColor: categoricalTokens.border,
          }
      : {};

    const dotColor = statusColors
      ? statusColors.icon
      : categoricalTokens.dot;

    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({ variant, size }),
          statusColors && isSolid && "border",
          shape.item,
          className
        )}
        style={{ ...colorStyle, ...style }}
        data-status={status}
        role={status ? "status" : undefined}
        {...props}
      >
        {!isSolid && (
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
export type { BadgeProps, BadgeColor, BadgeStatus };
