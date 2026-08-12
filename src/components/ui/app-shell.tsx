"use client";

import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties, type Ref } from "react";
import { cn } from "@/lib/utils";

export type AppShellLayout = "sidebar" | "stacked";
export type AppShellSidebarSide = "left" | "right";

export interface AppShellProps extends ComponentPropsWithoutRef<"div"> {
  /** `sidebar` lays out a persistent side region beside the main column.
   * `stacked` places the header above the main region. */
  layout?: AppShellLayout;
}

export interface AppShellSidebarProps extends ComponentPropsWithoutRef<"div"> {
  /** The sidebar edge in the `sidebar` layout. */
  side?: AppShellSidebarSide;
  /** The persistent sidebar track width. */
  width?: CSSProperties["width"];
}
export type AppShellHeaderProps = ComponentPropsWithoutRef<"header">;
export interface AppShellMainProps extends ComponentPropsWithoutRef<"main"> {
  /**
   * Set false only when an AppShell is embedded in another document landmark,
   * such as a component preview. Application shells should keep the default.
   */
  landmark?: boolean;
}

const AppShell = forwardRef<HTMLDivElement, AppShellProps>(
  ({ layout = "sidebar", className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="app-shell"
      data-layout={layout}
      className={cn(
        "min-h-svh min-w-0 bg-surface-base",
        layout === "sidebar"
          ? [
              "grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)]",
              "[&:not(:has(>_[data-slot=app-shell-header]))>_[data-slot=app-shell-main]]:row-span-2",
              "[&:has(>_[data-slot=app-shell-sidebar][data-side=right])]:grid-cols-[minmax(0,1fr)_auto]",
              "[&:has(>_[data-slot=app-shell-sidebar][data-side=right])>_[data-slot=app-shell-header]]:col-start-1",
              "[&:has(>_[data-slot=app-shell-sidebar][data-side=right])>_[data-slot=app-shell-main]]:col-start-1",
            ]
          : "flex flex-col",
        className
      )}
      {...props}
    />
  )
);

AppShell.displayName = "AppShell";

const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
  ({ side = "left", width = "260px", className, style, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="app-shell-sidebar"
      data-side={side}
      className={cn(
        "col-start-1 row-span-2 min-h-0 w-[var(--app-shell-sidebar-width)] data-[side=right]:col-start-2",
        "max-xl:w-0 [&:has(>_[data-slot=sidebar][data-collapsible=offcanvas][data-state=collapsed])]:w-0",
        className
      )}
      style={{ "--app-shell-sidebar-width": width, ...style } as CSSProperties}
      {...props}
    />
  )
);

AppShellSidebar.displayName = "AppShellSidebar";

const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      data-slot="app-shell-header"
      className={cn("col-start-2 sticky top-0 z-raised min-w-0", className)}
      {...props}
    />
  )
);

AppShellHeader.displayName = "AppShellHeader";

const AppShellMain = forwardRef<HTMLElement, AppShellMainProps>(
  ({ landmark = true, className, ...props }, ref) => {
    const Main = landmark ? "main" : "div";
    return <Main ref={ref as Ref<HTMLDivElement>} data-slot="app-shell-main" className={cn("col-start-2 min-h-0 min-w-0 flex-1", className)} {...props} />;
  }
);

AppShellMain.displayName = "AppShellMain";

export { AppShell, AppShellSidebar, AppShellHeader, AppShellMain };
