"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type Ref,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#system/utils";

/** Width presets for common authentication flows. */
export type AuthLayoutSize = "sm" | "md" | "lg";

const authLayoutContentVariants = cva(
  "m-auto flex w-full min-w-0 flex-col items-center gap-6",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-xl",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

export interface AuthLayoutProps extends ComponentPropsWithoutRef<"main"> {
  /**
   * Keep the primary `main` landmark for a standalone authentication page.
   * Embedded previews or nested shells should set this to `false`.
   * @default true
   */
  landmark?: boolean;
}

export interface AuthLayoutContentProps
  extends ComponentPropsWithoutRef<"div">,
    VariantProps<typeof authLayoutContentVariants> {}

export type AuthLayoutHeaderProps = ComponentPropsWithoutRef<"header">;
export type AuthLayoutBodyProps = ComponentPropsWithoutRef<"div">;
export type AuthLayoutFooterProps = ComponentPropsWithoutRef<"footer">;

/** Full-height, theme-aware frame shared by unauthenticated product flows. */
const AuthLayout = forwardRef<HTMLElement, AuthLayoutProps>(
  ({ landmark = true, className, ...props }, ref) => {
    const Root = landmark ? "main" : "div";

    return (
      <Root
        ref={ref as Ref<HTMLDivElement>}
        data-slot="auth-layout"
        className={cn(
          "flex min-h-svh min-w-0 overflow-y-auto bg-surface-base p-4 sm:p-10",
          className
        )}
        {...props}
      />
    );
  }
);

AuthLayout.displayName = "AuthLayout";

/** Centered vertical stack that owns the authentication flow's maximum width. */
const AuthLayoutContent = forwardRef<HTMLDivElement, AuthLayoutContentProps>(
  ({ size, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="auth-layout-content"
      data-size={size ?? "sm"}
      className={cn(authLayoutContentVariants({ size }), className)}
      {...props}
    />
  )
);

AuthLayoutContent.displayName = "AuthLayoutContent";

/** Optional brand, product identity, or tenant context above the active flow. */
const AuthLayoutHeader = forwardRef<HTMLElement, AuthLayoutHeaderProps>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      data-slot="auth-layout-header"
      className={cn(
        "flex w-full min-w-0 items-center justify-center",
        className
      )}
      {...props}
    />
  )
);

AuthLayoutHeader.displayName = "AuthLayoutHeader";

/** Surface-neutral region for a Card, form, or another authentication flow. */
const AuthLayoutBody = forwardRef<HTMLDivElement, AuthLayoutBodyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="auth-layout-body"
      className={cn("w-full min-w-0", className)}
      {...props}
    />
  )
);

AuthLayoutBody.displayName = "AuthLayoutBody";

/** Optional legal, help, locale, or secondary-navigation region. */
const AuthLayoutFooter = forwardRef<HTMLElement, AuthLayoutFooterProps>(
  ({ className, ...props }, ref) => (
    <footer
      ref={ref}
      data-slot="auth-layout-footer"
      className={cn(
        "w-full min-w-0 px-4 text-center text-body text-fg-subtle",
        className
      )}
      {...props}
    />
  )
);

AuthLayoutFooter.displayName = "AuthLayoutFooter";

export {
  AuthLayout,
  AuthLayoutBody,
  AuthLayoutContent,
  AuthLayoutFooter,
  AuthLayoutHeader,
  authLayoutContentVariants,
};
