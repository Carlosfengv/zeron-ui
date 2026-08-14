"use client";

import {
  forwardRef,
  type HTMLAttributes,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#system/utils";

const buttonGroupVariants = cva(
  [
    "flex w-fit max-w-full items-stretch",
    "[&>*]:relative [&>*:focus-visible]:z-control",
  ],
  {
    variants: {
      orientation: {
        horizontal: [
          "flex-row",
          "[&>*:not(:first-child)]:rounded-l-none",
          "[&>*:not(:first-child)]:border-l-0",
          "[&>*:not(:first-child)>[data-slot=button-background]]:border-l-0",
          "[&>*:not(:last-child)]:rounded-r-none",
        ],
        vertical: [
          "flex-col",
          "[&>*:not(:first-child)]:rounded-t-none",
          "[&>*:not(:first-child)]:border-t-0",
          "[&>*:not(:first-child)>[data-slot=button-background]]:border-t-0",
          "[&>*:not(:last-child)]:rounded-b-none",
        ],
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
);

interface ButtonGroupProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupVariants> {}

const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", role = "group", ...props }, ref) => (
    <div
      ref={ref}
      role={role}
      data-orientation={orientation}
      data-slot="button-group"
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
);

ButtonGroup.displayName = "ButtonGroup";

type ButtonGroupTextProps = HTMLAttributes<HTMLDivElement>;

const ButtonGroupText = forwardRef<HTMLDivElement, ButtonGroupTextProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="button-group-text"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted px-3 text-body text-fg-muted shadow-control",
        className
      )}
      {...props}
    />
  )
);

ButtonGroupText.displayName = "ButtonGroupText";

interface ButtonGroupSeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

const ButtonGroupSeparator = forwardRef<
  HTMLDivElement,
  ButtonGroupSeparatorProps
>(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation={orientation}
    data-orientation={orientation}
    data-slot="button-group-separator"
    className={cn(
      "pointer-events-none self-stretch bg-border",
      orientation === "vertical" ? "w-px" : "h-px",
      className
    )}
    {...props}
  />
));

ButtonGroupSeparator.displayName = "ButtonGroupSeparator";

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
};
export type {
  ButtonGroupProps,
  ButtonGroupSeparatorProps,
  ButtonGroupTextProps,
};
