"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconComponent } from "#system/icon-context";
import { cn } from "#system/utils";
import {
  controlButtonPaddingClasses,
  controlSizeClasses,
  controlSizeRecipe,
  type ControlSize,
} from "../tokens/control-size";

const buttonSizeVariants = {
  xs: cn(controlSizeClasses.xs, controlButtonPaddingClasses.xs, "text-label gap-1"),
  sm: cn(controlSizeClasses.sm, controlButtonPaddingClasses.sm, "text-label gap-1"),
  md: cn(controlSizeClasses.md, controlButtonPaddingClasses.md, "text-body gap-1.5"),
  lg: cn(controlSizeClasses.lg, controlButtonPaddingClasses.lg, "text-body gap-1.5"),
  xl: cn(controlSizeClasses.xl, controlButtonPaddingClasses.xl, "text-body gap-2"),
} satisfies Record<ControlSize, string>;

const spinnerSizeClasses: Record<ControlSize, string> = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-4",
  xl: "size-[18px]",
};

const buttonVariants = cva(
  [
    "group relative isolate inline-flex items-center justify-center outline-none cursor-pointer",
    "transition-colors duration-fast",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:ring-1 focus-visible:ring-focus-ring",
  ],
  {
    variants: {
      variant: {
        primary: "text-fg-on-brand",
        neutral: "text-fg-on-inverse",
        destructive: "text-fg-on-danger",
        secondary: "text-fg-default",
        tertiary: "text-fg-default",
        ghost: "text-fg-muted hover:text-fg-default",
      },
      size: buttonSizeVariants,
      iconOnly: { true: "aspect-square p-0" },
      iconLeft: { true: "" },
      iconRight: { true: "" },
    },
    compoundVariants: [
      { size: "xs", iconLeft: true, className: "pl-1" },
      { size: "sm", iconLeft: true, className: "pl-1.5" },
      { size: "md", iconLeft: true, className: "pl-2" },
      { size: "lg", iconLeft: true, className: "pl-2.5" },
      { size: "xl", iconLeft: true, className: "pl-3" },
      { size: "xs", iconRight: true, className: "pr-1" },
      { size: "sm", iconRight: true, className: "pr-1.5" },
      { size: "md", iconRight: true, className: "pr-2" },
      { size: "lg", iconRight: true, className: "pr-2.5" },
      { size: "xl", iconRight: true, className: "pr-3" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, the given single React-element child becomes the rendered element (slot-style). */
  asChild?: boolean;
  /** Renders a square, icon-only button at the selected control size. */
  iconOnly?: boolean;
  loading?: boolean;
  leadingIcon?: IconComponent;
  trailingIcon?: IconComponent;
  /** Draw the button's border as a dashed outline. This is most useful for
   *  additive controls, such as an inactive filter. */
  dashed?: boolean;
  /** Force the visual pressed/held state. Useful when the button drives an
   *  external open piece of UI (a popover, dropdown, etc.) so it reads as
   *  engaged while the menu is showing. */
  active?: boolean;
}

const bgVariants: Record<string, string> = {
  primary: "bg-brand group-hover:bg-brand-hover group-active:bg-brand-active",
  neutral: "bg-inverse-background group-hover:bg-inverse-background-hover group-active:bg-inverse-background-active",
  destructive: "bg-destructive group-hover:bg-destructive-hover group-active:bg-destructive-active",
  secondary: "bg-secondary-action group-hover:bg-secondary-action-hover group-active:bg-secondary-action-active",
  tertiary: "border border-border bg-transparent group-hover:bg-hover group-active:bg-active",
  ghost: "bg-transparent group-hover:bg-hover group-active:bg-active",
};

const activeBgVariants: Record<string, string> = {
  primary: "bg-brand-active",
  neutral: "bg-inverse-background-active",
  destructive: "bg-destructive-active",
  secondary: "bg-secondary-action-active",
  tertiary: "border border-border bg-active",
  ghost: "bg-active",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      iconOnly = false,
      loading = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      dashed = false,
      active = false,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    // asChild: the user's element becomes the root while the button's internal
    // structure (bg layer, content wrapper, spinner, icons) survives as its
    // children — the element's own children become the label. We clone the
    // element directly instead of routing through ButtonPrimitive's `render`:
    // Base UI would bolt button semantics (role="button", Space activation)
    // onto e.g. a link, where plain-link output is wanted.
    const asChildElement =
      asChild && isValidElement(children)
        ? (children as ReactElement<{
            children?: ReactNode;
            className?: string;
            style?: React.CSSProperties;
            ref?: React.Ref<HTMLButtonElement>;
          }>)
        : null;
    const label = asChildElement ? asChildElement.props.children : children;
    const resolvedSize = (size ?? "md") as ControlSize;
    const iconSize = controlSizeRecipe[resolvedSize].icon;
    const spinnerSizeClass = spinnerSizeClasses[resolvedSize];
    const bgClass = active
      ? activeBgVariants[variant ?? "primary"]
      : bgVariants[variant ?? "primary"];

    const internals = (
      <>
        <span
          aria-hidden
          data-slot="button-background"
          className={cn(
            "absolute inset-0 rounded-[inherit] transition-[background-color,transform] duration-fast group-active:scale-[0.98]",
            bgClass,
            dashed && "border-dashed"
          )}
        />
        <span className="relative inline-flex items-center justify-center gap-[inherit]">
          {loading ? (
            <>
              <span className="flex items-center justify-center gap-[inherit] opacity-0">
                {LeadingIcon && !iconOnly && (
                  <LeadingIcon size={iconSize} strokeWidth={2} />
                )}
                {label}
                {TrailingIcon && !iconOnly && (
                  <TrailingIcon size={iconSize} strokeWidth={2} />
                )}
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <svg
                  className={spinnerSizeClass}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
                    stroke="currentColor"
                    strokeWidth="1.125"
                    strokeLinecap="round"
                    pathLength="100"
                    style={{
                      strokeDasharray: "15 85",
                      animation: "spinner-move 2s linear infinite, spinner-dash 4s ease-in-out infinite",
                    }}
                  />
                </svg>
              </span>
            </>
          ) : iconOnly ? (
            <span className="[&_svg]:stroke-[1.5] [&_svg]:transition-[stroke-width] [&_svg]:duration-fast group-hover:[&_svg]:stroke-[2]">
              {label}
            </span>
          ) : (
            <>
              {LeadingIcon && (
                <LeadingIcon
                  size={iconSize}
                  strokeWidth={1.5}
                  className="transition-[stroke-width] duration-fast group-hover:stroke-[2]"
                />
              )}
              <span>{label}</span>
              {TrailingIcon && (
                <TrailingIcon
                  size={iconSize}
                  strokeWidth={1.5}
                  className="transition-[stroke-width] duration-fast group-hover:stroke-[2]"
                />
              )}
            </>
          )}
        </span>
      </>
    );

    const rootClassName = cn(
      buttonVariants({
        variant,
        size: resolvedSize,
        iconOnly,
        iconLeft: !iconOnly && !!LeadingIcon,
        iconRight: !iconOnly && !!TrailingIcon,
      }),
      "rounded-lg",
      className
    );

    if (asChildElement) {
      const childProps = asChildElement.props;
      return cloneElement(
        asChildElement,
        {
          ...props,
          ref,
          className: cn(rootClassName, childProps.className),
          style: { ...style, ...childProps.style },
        },
        internals
      );
    }

    return (
      <ButtonPrimitive
        // Base UI's `ButtonPrimitive` forwards to an HTMLButtonElement;
        // keep the public ref type narrow so consumers see the right type.
        ref={ref as React.Ref<HTMLButtonElement>}
        className={rootClassName}
        disabled={disabled || loading}
        style={style}
        {...props}
      >
        {internals}
      </ButtonPrimitive>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
