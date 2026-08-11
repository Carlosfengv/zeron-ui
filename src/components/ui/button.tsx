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
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";

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
      size: {
        sm: "h-control-xs px-3 text-label gap-1",
        md: "h-control-sm px-4 text-body gap-1.5",
        lg: "h-control-md px-5 text-body gap-1.5",
        "icon-sm": "h-control-sm w-8 p-0 [&_svg]:h-3.5 [&_svg]:w-3.5",
        icon: "h-control-md w-9 p-0 [&_svg]:h-4 [&_svg]:w-4",
        "icon-lg": "h-control-lg w-10 p-0 [&_svg]:h-5 [&_svg]:w-5",
      },
      iconLeft: { true: "" },
      iconRight: { true: "" },
    },
    compoundVariants: [
      { size: "sm", iconLeft: true, className: "pl-1.5" },
      { size: "md", iconLeft: true, className: "pl-2.5" },
      { size: "lg", iconLeft: true, className: "pl-3.5" },
      { size: "sm", iconRight: true, className: "pr-1.5" },
      { size: "md", iconRight: true, className: "pr-2.5" },
      { size: "lg", iconRight: true, className: "pr-3.5" },
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
  loading?: boolean;
  leadingIcon?: IconComponent;
  trailingIcon?: IconComponent;
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
      loading = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
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
    const isIconOnly = size === "icon" || size === "icon-sm" || size === "icon-lg";
    const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;
    // Spinner box tracks the button height (sm is h-control-xs, lg/icon are h-control-md, …) so
    // the loading glyph stays proportionate across sizes.
    const spinnerSizeClass =
      size === "sm"
        ? "h-control-xs w-7"
        : size === "lg" || size === "icon"
          ? "h-control-md w-9"
          : size === "icon-lg"
            ? "h-control-lg w-10"
            : "h-control-sm w-8";
    const shape = useShape();
    const bgClass = active
      ? activeBgVariants[variant ?? "primary"]
      : bgVariants[variant ?? "primary"];

    const internals = (
      <>
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-[inherit] transition-[background-color,transform] duration-fast group-active:scale-[0.98]",
            bgClass
          )}
        />
        <span className="relative inline-flex items-center justify-center gap-[inherit]">
          {loading ? (
            <>
              <span className="flex items-center justify-center gap-[inherit] opacity-0">
                {LeadingIcon && !isIconOnly && (
                  <LeadingIcon size={iconSize} strokeWidth={2} />
                )}
                {label}
                {TrailingIcon && !isIconOnly && (
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
          ) : isIconOnly ? (
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
              {/* text-box only applies to block containers, so the trim lives
                  on the label span (a blockified flex item), not the flex root.
                  The button's height is fixed (h-*), so this doesn't change
                  layout — it just centers the cap-to-baseline box optically. */}
              <span className="[text-box:trim-both_cap_alphabetic]">{label}</span>
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
        size,
        iconLeft: !isIconOnly && !!LeadingIcon,
        iconRight: !isIconOnly && !!TrailingIcon,
      }),
      shape.button,
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
