"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#system/utils";
import { useIcon } from "#system/icon-context";
import { useSurface } from "#system/surface-context";
import { resolveSurface, surfaceClasses } from "#system/surface-classes";
import {
  NavItemTrailing,
  NavItemTrigger,
  type NavItemTriggerProps,
} from "#components/nav-item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps,
  type PopoverProps,
} from "#components/popover";

const topNavVariants = cva("grid min-h-control-md min-w-0 items-center gap-3 px-3", {
  variants: {
    variant: {
      default: "",
      floating: "m-2 border border-border",
    },
    navigationAlign: {
      left: "grid-cols-[auto_minmax(0,1fr)_auto] [&>[data-slot=top-nav-navigation]]:justify-start",
      center: "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] [&>[data-slot=top-nav-navigation]]:justify-center",
      right: "grid-cols-[auto_minmax(0,1fr)_auto] [&>[data-slot=top-nav-navigation]]:justify-end",
    },
  },
  defaultVariants: { variant: "default", navigationAlign: "center" },
});

export interface TopNavProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof topNavVariants> {}
export type TopNavBrandProps = ComponentPropsWithoutRef<"div">;
export type TopNavNavigationAlign = "left" | "center" | "right";
export type TopNavNavigationProps = ComponentPropsWithoutRef<"div">;
export type TopNavActionsProps = ComponentPropsWithoutRef<"div">;
export type TopNavItemMenuProps = PopoverProps;
export type TopNavItemMenuContentProps = PopoverContentProps;
export interface TopNavItemMenuTriggerProps
  extends Omit<NavItemTriggerProps, "href" | "render" | "type"> {
  /** Replaces the default chevron. Pass null to hide the suffix. */
  suffix?: ReactNode;
  type?: ComponentPropsWithoutRef<"button">["type"];
}

const TopNav = forwardRef<HTMLDivElement, TopNavProps>(({ variant, navigationAlign, className, ...props }, ref) => {
  const floatingSurface = resolveSurface(useSurface(), "raised");
  return (
    <div
      ref={ref}
      data-slot="top-nav"
      data-variant={variant ?? "default"}
      data-navigation-align={navigationAlign ?? "center"}
      className={cn(
        topNavVariants({ variant, navigationAlign }),
        variant === "floating" && [
          "rounded-xl",
          surfaceClasses(floatingSurface, "raised"),
        ],
        className
      )}
      {...props}
    />
  );
});

TopNav.displayName = "TopNav";

const TopNavBrand = forwardRef<HTMLDivElement, TopNavBrandProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="top-nav-brand" className={cn("flex shrink-0 items-center gap-2 px-3", className)} {...props} />
));
TopNavBrand.displayName = "TopNavBrand";

const TopNavNavigation = forwardRef<HTMLDivElement, TopNavNavigationProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="top-nav-navigation" className={cn("flex min-w-0 self-stretch items-center", className)} {...props} />
));
TopNavNavigation.displayName = "TopNavNavigation";

const TopNavActions = forwardRef<HTMLDivElement, TopNavActionsProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="top-nav-actions" className={cn("ml-auto flex shrink-0 items-center gap-1 px-3", className)} {...props} />
));
TopNavActions.displayName = "TopNavActions";

function TopNavItemMenu(props: TopNavItemMenuProps) {
  return <Popover {...props} />;
}

TopNavItemMenu.displayName = "TopNavItemMenu";

const TopNavItemMenuTrigger = forwardRef<
  HTMLButtonElement,
  TopNavItemMenuTriggerProps
>(
  (
    { children, className, suffix, type = "button", ...props },
    forwardedRef
  ) => {
    const ChevronDown = useIcon("chevron-down");

    return (
      <PopoverTrigger
        ref={forwardedRef}
        render={
          <NavItemTrigger
            render={<button type={type} />}
            aria-current={undefined}
            className={cn(
              "group/top-nav-menu-trigger flex-none gap-1 data-[popup-open]:text-fg-default [&>[data-slot=nav-item-content]]:flex-none",
              className
            )}
            {...props}
          >
            {children}
            {suffix !== null && (
              <NavItemTrailing className="ml-0">
                {suffix ?? (
                  <ChevronDown
                    aria-hidden="true"
                    size={14}
                    strokeWidth={1.5}
                    className="transition-transform duration-fast group-data-[popup-open]/top-nav-menu-trigger:rotate-180 motion-reduce:transition-none"
                  />
                )}
              </NavItemTrailing>
            )}
          </NavItemTrigger>
        }
      />
    );
  }
);

TopNavItemMenuTrigger.displayName = "TopNavItemMenuTrigger";

const TopNavItemMenuContent = forwardRef<
  HTMLDivElement,
  TopNavItemMenuContentProps
>(
  (
    {
      align = "start",
      className,
      side = "bottom",
      sideOffset = 4,
      ...props
    },
    ref
  ) => (
    <PopoverContent
      ref={ref}
      align={align}
      side={side}
      sideOffset={sideOffset}
      className={cn("min-w-48 p-1", className)}
      {...props}
    />
  )
);

TopNavItemMenuContent.displayName = "TopNavItemMenuContent";

export {
  TopNav,
  TopNavBrand,
  TopNavNavigation,
  TopNavActions,
  TopNavItemMenu,
  TopNavItemMenuTrigger,
  TopNavItemMenuContent,
  topNavVariants,
};
