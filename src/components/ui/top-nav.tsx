"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import { useSurface } from "@/lib/surface-context";
import { resolveSurface, surfaceClasses } from "@/lib/surface-classes";

const topNavVariants = cva("flex min-h-control-md min-w-0 items-center gap-3 px-4 sm:px-6", {
  variants: {
    variant: {
      default: "border-b border-border",
      floating: "m-2 border border-border",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface TopNavProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof topNavVariants> {}
export type TopNavBrandProps = ComponentPropsWithoutRef<"div">;
export type TopNavNavigationProps = ComponentPropsWithoutRef<"div">;
export type TopNavActionsProps = ComponentPropsWithoutRef<"div">;

const TopNav = forwardRef<HTMLDivElement, TopNavProps>(({ variant, className, ...props }, ref) => {
  const shape = useShape();
  const surface = resolveSurface(useSurface(), variant === "floating" ? "raised" : "base");
  return (
    <div
      ref={ref}
      data-slot="top-nav"
      data-variant={variant ?? "default"}
      className={cn(
        topNavVariants({ variant }),
        variant === "floating" && shape.container,
        surfaceClasses(surface, variant === "floating" ? "raised" : "none"),
        className
      )}
      {...props}
    />
  );
});

TopNav.displayName = "TopNav";

const TopNavBrand = forwardRef<HTMLDivElement, TopNavBrandProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="top-nav-brand" className={cn("flex shrink-0 items-center gap-2", className)} {...props} />
));
TopNavBrand.displayName = "TopNavBrand";

const TopNavNavigation = forwardRef<HTMLDivElement, TopNavNavigationProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="top-nav-navigation" className={cn("min-w-0 flex-1", className)} {...props} />
));
TopNavNavigation.displayName = "TopNavNavigation";

const TopNavActions = forwardRef<HTMLDivElement, TopNavActionsProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="top-nav-actions" className={cn("ml-auto flex shrink-0 items-center gap-1", className)} {...props} />
));
TopNavActions.displayName = "TopNavActions";

export { TopNav, TopNavBrand, TopNavNavigation, TopNavActions, topNavVariants };
