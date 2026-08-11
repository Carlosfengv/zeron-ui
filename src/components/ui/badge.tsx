"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";

const badgeColors = {
  gray: "#a3a3a3",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
} as const;

type BadgeColor = keyof typeof badgeColors;

const badgeBackgroundColors: Record<BadgeColor, { light: string; dark: string }> = {
  gray: { light: "#E5E5E5", dark: "#525252" },
  red: { light: "#F8DFDF", dark: "#371E1E" },
  orange: { light: "#FAE6D8", dark: "#392517" },
  amber: { light: "#F9ECD6", dark: "#382B15" },
  yellow: { light: "#F8EFD6", dark: "#372E15" },
  lime: { light: "#E8F3D8", dark: "#273217" },
  green: { light: "#DAF2E3", dark: "#193122" },
  emerald: { light: "#D7F0E8", dark: "#162F27" },
  teal: { light: "#D8F0ED", dark: "#172F2C" },
  cyan: { light: "#D5F0F4", dark: "#142F33" },
  blue: { light: "#DDE8F9", dark: "#1C2738" },
  indigo: { light: "#E3E4F9", dark: "#222338" },
  violet: { light: "#E9E2F9", dark: "#282138" },
  purple: { light: "#EEE1FA", dark: "#2D2039" },
  fuchsia: { light: "#F5DFF8", dark: "#341E37" },
  pink: { light: "#F8DFEB", dark: "#371E2B" },
  rose: { light: "#F9DEE3", dark: "#381D22" },
};

const badgeVariants = cva(
  "inline-flex w-fit max-w-full items-center font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        solid: "",
        dot: "border border-border text-foreground",
      },
      size: {
        sm: "h-5 px-2 text-caption gap-1",
        md: "h-6 px-2.5 text-label gap-1.5",
        lg: "h-control-xs px-3 text-body-sm gap-1.5",
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
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "solid",
      size = "md",
      color = "gray",
      children,
      style,
      ...props
    },
    ref
  ) => {
    const shape = useShape();
    const colorValue = badgeColors[color];
    const isSolid = variant === "solid";
    const dotSize = size === "sm" ? 6 : size === "lg" ? 8 : 7;

    const background = badgeBackgroundColors[color];
    const colorStyle = isSolid
      ? {
          color: "var(--foreground)",
          backgroundColor: `light-dark(${background.light}, ${background.dark})`,
        }
      : {};

    const dotColor = color === "gray" ? "var(--muted-foreground)" : colorValue;

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), shape.item, className)}
        style={{ ...colorStyle, ...style }}
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
export type { BadgeProps, BadgeColor };
