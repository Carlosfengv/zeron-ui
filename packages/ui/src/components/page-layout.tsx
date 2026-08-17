"use client";

import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#system/utils";
import { NavItem, NavItemTrigger } from "#components/nav-item";
import { NavMenu, type NavMenuProps, useNavMenuOptional } from "#components/nav-menu";
import { useRender } from "@base-ui/react/use-render";
import type { IconComponent } from "#system/icon-context";

export type PageLayoutSize = "sm" | "md" | "lg" | "full";
export type PageLayoutGutter = "default" | "none";
export type PageSubnavLabelVisibility = "all" | "active";
export type PageColumnsBreakpoint = "lg" | "xl";

const pageLayoutVariants = cva(
  [
    "mx-auto flex h-full w-full min-h-0 min-w-0 flex-col",
    "[&:has(>_[data-slot=page-sidebar])]:grid",
    "[&:has(>_[data-slot=page-sidebar])]:grid-cols-[auto_minmax(0,1fr)]",
    "[&:has(>_[data-slot=page-sidebar])]:grid-rows-[minmax(0,1fr)]",
    "[&:has(>_[data-slot=page-sidebar])]:gap-0",
    "[&:has(>_[data-slot=page-sidebar])>_[data-slot=page-content]]:rounded-l-none",
    "[&:has(>_[data-slot=page-sidebar])>_[data-slot=page-content]]:border-l-0",
    "max-lg:[&:has(>_[data-slot=page-sidebar])]:grid-cols-1",
    "max-lg:[&:has(>_[data-slot=page-sidebar])>_[data-slot=page-content]]:rounded-t-none",
    "max-lg:[&:has(>_[data-slot=page-sidebar])>_[data-slot=page-content]]:border-t-0",
  ],
  {
  variants: {
    size: {
      sm: "max-w-[40rem]",
      md: "max-w-[56rem]",
      lg: "max-w-[75rem]",
      full: "max-w-none",
    },
    gutter: {
      default: "gap-2 p-3",
      none: "gap-2 p-0",
    },
  },
  defaultVariants: { size: "full", gutter: "default" },
  }
);

export interface PageLayoutProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof pageLayoutVariants> {}
export type PageHeaderProps = ComponentPropsWithoutRef<"header">;
export interface PageHeaderContentProps extends ComponentPropsWithoutRef<"div"> {
  /** Optional decorative icon rendered before the header content. */
  icon?: IconComponent;
}
export type PageTitleProps = ComponentPropsWithoutRef<"h1">;
export type PageDescriptionProps = ComponentPropsWithoutRef<"p">;
export type PageActionsProps = ComponentPropsWithoutRef<"div">;
export interface PageSidebarProps extends ComponentPropsWithoutRef<"aside"> {
  /** Fixed desktop track width. The layout becomes a stacked flow below `lg`. */
  width?: CSSProperties["width"];
}
export type PageContentProps = ComponentPropsWithoutRef<"div">;
export type PageBodyProps = ComponentPropsWithoutRef<"div">;
export interface PageColumnsProps extends ComponentPropsWithoutRef<"div"> {
  /** Fixed desktop track width for the auxiliary column. Numeric values are interpreted as px. */
  asideWidth?: CSSProperties["width"];
  /** Breakpoint at which the primary and auxiliary columns become a grid. */
  columnsAt?: PageColumnsBreakpoint;
}
export type PagePrimaryProps = ComponentPropsWithoutRef<"div">;
export type PageAsideProps = ComponentPropsWithoutRef<"aside">;
export type PageSubnavProps = ComponentPropsWithoutRef<"nav">;
export interface PageSubnavListProps extends Omit<NavMenuProps, "as" | "orientation" | "variant"> {
  /** Shows every icon label, or only the active item's label. Requires item icons for the collapsed state. */
  labelVisibility?: PageSubnavLabelVisibility;
  children: ReactNode;
}
export interface PageSubnavItemProps extends useRender.ComponentProps<"a"> {
  /** Stable identifier used by PageSubnavList to determine the active link. */
  value: string;
  active?: boolean;
  /** Optional icon displayed before the item label. */
  icon?: IconComponent;
  /** Accessible label used when labelVisibility="active" hides this item's visible label. */
  label?: string;
}

const PageSubnavListContext = createContext<{ labelVisibility: PageSubnavLabelVisibility }>({
  labelVisibility: "all",
});

const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(({ size, gutter, className, ...props }, ref) => (
  <div ref={ref} data-slot="page-layout" className={cn(pageLayoutVariants({ size, gutter }), className)} {...props} />
));

PageLayout.displayName = "PageLayout";

const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(({ className, ...props }, ref) => (
  <header ref={ref} data-slot="page-header" className={cn("flex shrink-0 min-w-0 flex-wrap items-start justify-between gap-2 py-1 px-3 max-sm:flex-col", className)} {...props} />
));

PageHeader.displayName = "PageHeader";

const PageHeaderContent = forwardRef<HTMLDivElement, PageHeaderContentProps>(
  ({ icon: Icon, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="page-header-content"
      className={cn("flex min-w-0 items-center gap-2", className)}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" size={20} strokeWidth={1.5} className="size-5 shrink-0 text-fg-muted" />}
      {children}
    </div>
  )
);

PageHeaderContent.displayName = "PageHeaderContent";

const PageTitle = forwardRef<HTMLHeadingElement, PageTitleProps>(({ className, ...props }, ref) => (
  <h1 ref={ref} data-slot="page-title" className={cn("text-heading text-fg-default", className)} {...props} />
));

PageTitle.displayName = "PageTitle";

const PageDescription = forwardRef<HTMLParagraphElement, PageDescriptionProps>(({ className, ...props }, ref) => (
  <p ref={ref} data-slot="page-description" className={cn("mt-2 max-w-prose text-body text-fg-muted", className)} {...props} />
));

PageDescription.displayName = "PageDescription";

const PageActions = forwardRef<HTMLDivElement, PageActionsProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="page-actions" className={cn("flex shrink-0 flex-wrap items-center gap-2 max-sm:w-full", className)} {...props} />
));

PageActions.displayName = "PageActions";

const PageSidebar = forwardRef<HTMLElement, PageSidebarProps>(
  ({ width = "200px", className, style, ...props }, ref) => (
    <aside
      ref={ref}
      data-slot="page-sidebar"
      className={cn(
        "min-h-0 w-[var(--page-sidebar-width)] shrink-0 overflow-y-auto overscroll-contain",
        "border-[0.5px] border-border border-r-0 bg-surface-floating rounded-l-xl",
        "max-lg:w-full max-lg:rounded-t-xl max-lg:rounded-b-none max-lg:border-r-[0.5px] max-lg:border-b-0",
        className
      )}
      style={{ "--page-sidebar-width": width, ...style } as CSSProperties}
      {...props}
    />
  )
);

PageSidebar.displayName = "PageSidebar";

const PageContent = forwardRef<HTMLDivElement, PageContentProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="page-content"
    className={cn(
      "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-[0.5px] border-border bg-surface-floating rounded-xl",
      className
    )}
    {...props}
  />
));

PageContent.displayName = "PageContent";

const PageBody = forwardRef<HTMLDivElement, PageBodyProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="page-body"
    className={cn("mx-auto min-h-0 w-full max-w-[1280px] min-w-0 flex-1 overflow-y-auto overscroll-contain", className)}
    {...props}
  />
));

PageBody.displayName = "PageBody";

const pageColumnsBreakpointClasses: Record<PageColumnsBreakpoint, readonly string[]> = {
  lg: [
    "lg:[&:has(>_[data-slot=page-aside])]:grid-cols-[minmax(0,1fr)_var(--page-aside-width)]",
    "lg:[&:has(>_[data-slot=page-aside])>_[data-slot=page-primary]]:col-start-1",
    "lg:[&:has(>_[data-slot=page-aside])>_[data-slot=page-primary]]:row-start-1",
    "lg:[&:has(>_[data-slot=page-aside])>_[data-slot=page-aside]]:col-start-2",
    "lg:[&:has(>_[data-slot=page-aside])>_[data-slot=page-aside]]:row-start-1",
  ],
  xl: [
    "xl:[&:has(>_[data-slot=page-aside])]:grid-cols-[minmax(0,1fr)_var(--page-aside-width)]",
    "xl:[&:has(>_[data-slot=page-aside])>_[data-slot=page-primary]]:col-start-1",
    "xl:[&:has(>_[data-slot=page-aside])>_[data-slot=page-primary]]:row-start-1",
    "xl:[&:has(>_[data-slot=page-aside])>_[data-slot=page-aside]]:col-start-2",
    "xl:[&:has(>_[data-slot=page-aside])>_[data-slot=page-aside]]:row-start-1",
  ],
};

function toCssDimension(value: CSSProperties["width"]) {
  return typeof value === "number" ? `${value}px` : value;
}

const PageColumns = forwardRef<HTMLDivElement, PageColumnsProps>(
  ({ asideWidth = "25rem", columnsAt = "lg", className, style, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="page-columns"
      className={cn(
        "grid min-w-0 grid-cols-1 items-start gap-5",
        pageColumnsBreakpointClasses[columnsAt],
        className
      )}
      style={{ "--page-aside-width": toCssDimension(asideWidth), ...style } as CSSProperties}
      {...props}
    />
  )
);

PageColumns.displayName = "PageColumns";

const PagePrimary = forwardRef<HTMLDivElement, PagePrimaryProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="page-primary" className={cn("min-w-0", className)} {...props} />
));

PagePrimary.displayName = "PagePrimary";

const PageAside = forwardRef<HTMLElement, PageAsideProps>(({ className, ...props }, ref) => (
  <aside ref={ref} data-slot="page-aside" className={cn("min-w-0", className)} {...props} />
));

PageAside.displayName = "PageAside";

const PageSubnav = forwardRef<HTMLElement, PageSubnavProps>(({ className, ...props }, ref) => (
  <nav ref={ref} data-slot="page-subnav" className={cn("min-w-0 shrink-0 border-b border-border p-3", className)} {...props} />
));

PageSubnav.displayName = "PageSubnav";

const PageSubnavList = forwardRef<HTMLElement, PageSubnavListProps>(
  ({ className, labelVisibility = "all", ...props }, ref) => (
    <PageSubnavListContext.Provider value={{ labelVisibility }}>
      <NavMenu
        ref={ref}
        as="div"
        data-slot="page-subnav-list"
        orientation="horizontal"
        variant="segment"
        className={cn("w-full", className)}
        {...props}
      />
    </PageSubnavListContext.Provider>
  )
);

PageSubnavList.displayName = "PageSubnavList";

const PageSubnavItem = forwardRef<HTMLElement, PageSubnavItemProps>(
  ({ value, active, icon: Icon, label, className, children, ...props }, ref) => {
    const { labelVisibility } = useContext(PageSubnavListContext);
    const navMenu = useNavMenuOptional();
    const isActive = active ?? navMenu?.activeValue === value;
    const collapseLabel = labelVisibility === "active" && !!Icon;
    const showLabel = !collapseLabel || isActive;
    const accessibleLabel = label ?? (typeof children === "string" ? children : undefined);
    const labelContent = (
      <span className="inline-grid min-w-0 whitespace-nowrap">
        <span aria-hidden="true" className="col-start-1 row-start-1 invisible font-semibold">
          {children}
        </span>
        <span className="col-start-1 row-start-1 font-normal text-inherit group-data-[active=true]/nav-item:font-semibold">
          {children}
        </span>
      </span>
    );

    return (
      <NavItem value={value} active={active} className="py-0">
        <NavItemTrigger
          ref={ref}
          className={cn(collapseLabel && "gap-0", className)}
          aria-label={collapseLabel && !showLabel ? accessibleLabel : undefined}
          {...props}
        >
          {Icon && (
            <Icon
              aria-hidden="true"
              size={16}
              strokeWidth={isActive ? 2 : 1.5}
              className={cn(
                "shrink-0 transition-[color,stroke-width] duration-fast",
                isActive ? "text-fg-on-brand" : "text-fg-muted"
              )}
            />
          )}
          {showLabel && (
            <span className={cn(collapseLabel && "ml-2")}>{labelContent}</span>
          )}
        </NavItemTrigger>
      </NavItem>
    );
  }
);

PageSubnavItem.displayName = "PageSubnavItem";

export {
  PageLayout,
  PageHeader,
  PageHeaderContent,
  PageTitle,
  PageDescription,
  PageActions,
  PageSidebar,
  PageContent,
  PageBody,
  PageColumns,
  PagePrimary,
  PageAside,
  PageSubnav,
  PageSubnavList,
  PageSubnavItem,
  pageLayoutVariants,
};
