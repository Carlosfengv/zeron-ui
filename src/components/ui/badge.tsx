"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import {
  categoricalBackgroundColors,
  categoricalColors,
  type CategoricalColor,
} from "@/lib/tokens/categorical-colors";

const badgeColors = categoricalColors;
type BadgeColor = CategoricalColor;
type BadgeStatus = "danger" | "warning";

const badgeStatusColors: Record<BadgeStatus, { foreground: string; background: string; border: string; icon: string }> = {
  danger: {
    foreground: "var(--fg-danger)",
    background: "var(--danger-surface)",
    border: "var(--danger-border)",
    icon: "var(--fg-danger)",
  },
  warning: {
    foreground: "var(--fg-warning)",
    background: "var(--warning-surface)",
    border: "var(--warning-border)",
    icon: "var(--fg-warning)",
  },
};

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
    const colorValue = badgeColors[color];
    const isSolid = variant === "solid";
    const statusColors = status ? badgeStatusColors[status] : null;
    const dotSize = size === "sm" ? 6 : size === "lg" ? 8 : 7;

    const background = categoricalBackgroundColors[color];
    const colorStyle = isSolid
      ? statusColors
        ? {
            color: statusColors.foreground,
            backgroundColor: statusColors.background,
            borderColor: statusColors.border,
          }
        : {
            color: "var(--fg-default)",
            backgroundColor: `light-dark(${background.light}, ${background.dark})`,
          }
      : {};

    const dotColor = statusColors
      ? statusColors.icon
      : color === "gray"
        ? "var(--fg-muted)"
        : colorValue;

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
        {/* text-box needs a block container — the badge root is a flex
            container, so the label gets its own span. Height is fixed (h-*),
            so trimming only recenters the letterforms. */}
        <span className="[text-box:trim-both_cap_alphabetic]">{children}</span>
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants, badgeColors };
export type { BadgeProps, BadgeColor, BadgeStatus };
