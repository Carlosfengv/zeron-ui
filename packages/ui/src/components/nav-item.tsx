"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "#system/utils";
import { useIcon } from "#system/icon-context";
import { Button } from "#components/button";
import { Tooltip } from "#components/tooltip";
import { useNavMenuOptional } from "#components/nav-menu";

export interface NavItemProps extends HTMLAttributes<HTMLElement> {
  value: string;
  disabled?: boolean;
  /** Explicit active state, primarily for standalone use outside NavMenu. */
  active?: boolean;
}

interface NavItemContextValue {
  id: string;
  value: string;
  disabled: boolean;
  active: boolean;
  rovingTabIndex: number | undefined;
}

const NavItemContext = createContext<NavItemContextValue | null>(null);

function useNavItem() {
  const context = useContext(NavItemContext);
  if (!context) throw new Error("NavItem parts must be used within a NavItem");
  return context;
}

const NavItem = forwardRef<HTMLElement, NavItemProps>(
  ({ value, disabled = false, active: activeProp, className, children, ...props }, forwardedRef) => {
    const id = useId();
    const itemRef = useRef<HTMLElement | null>(null);
    const navMenu = useNavMenuOptional();
    const registerItem = navMenu?.registerItem;
    const active = activeProp ?? (navMenu?.activeValue === value);
    const rovingTabIndex =
      navMenu?.keyboardNavigation === "roving"
        ? (navMenu.rovingTabStopId === id ? 0 : -1)
        : undefined;

    useEffect(() => {
      const element = itemRef.current;
      if (!element || !registerItem) return;
      return registerItem({ id, value, element, disabled });
    }, [disabled, id, registerItem, value]);

    const context = useMemo<NavItemContextValue>(
      () => ({ id, value, disabled, active, rovingTabIndex }),
      [active, disabled, id, rovingTabIndex, value]
    );

    const itemClassName = cn(
      "group/nav-item relative z-content flex min-w-0 items-center",
      "group-data-[state=collapsed]/sidebar:size-control-lg group-data-[state=collapsed]/sidebar:self-center",
      "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
      navMenu && "py-0.5",
      !navMenu && [
        "transition-colors duration-fast hover:bg-hover",
        active && "bg-active",
        "rounded-lg",
      ],
      className
    );
    const setItemRef = (node: HTMLElement | null) => {
      itemRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };
    const sharedProps = {
      "data-slot": "nav-item",
      "data-standalone": navMenu ? undefined : "true",
      "data-nav-item-id": id,
      "data-value": value,
      "data-active": active ? "true" : "false",
      "data-disabled": disabled ? "true" : "false",
      className: itemClassName,
    };
    const element = navMenu ? (
      <li ref={setItemRef} {...sharedProps} {...props}>{children}</li>
    ) : (
      <div
        ref={setItemRef}
        {...sharedProps}
        {...props}
      >
        {children}
      </div>
    );

    return (
      <NavItemContext.Provider value={context}>
        {element}
      </NavItemContext.Provider>
    );
  }
);

NavItem.displayName = "NavItem";

export type NavItemTriggerProps = useRender.ComponentProps<"a"> & {
  tooltip?: ReactNode;
};

const NavItemTrigger = forwardRef<HTMLElement, NavItemTriggerProps>(
  ({ className, render, tooltip, onClick, onKeyDown, ...props }, forwardedRef) => {
    const { active, disabled, rovingTabIndex } = useNavItem();
    const navMenu = useNavMenuOptional();
    const variant = navMenu?.variant ?? "default";
    const trigger = useRender({
      defaultTagName: "a",
      props: {
          ref: forwardedRef as React.Ref<HTMLAnchorElement>,
          "data-slot": "nav-item-trigger",
          "data-active": active || undefined,
          tabIndex: disabled ? -1 : rovingTabIndex,
          "aria-current": active ? "page" : undefined,
          "aria-disabled": disabled || undefined,
          onClick: (event) => {
            if (disabled) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            onClick?.(event);
          },
          onKeyDown: (event) => {
            if (disabled && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            onKeyDown?.(event);
          },
          className: cn(
            "relative z-content flex min-w-0 flex-1 items-center gap-2 px-3 text-body font-normal whitespace-nowrap outline-none",
            variant === "underline"
              ? "h-control-lg border-b-2 border-transparent data-[active=true]:border-fg-default"
              : "h-control-md",
            "group-data-[state=collapsed]/sidebar:h-full group-data-[state=collapsed]/sidebar:w-full group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:gap-0 group-data-[state=collapsed]/sidebar:px-0",
            "cursor-pointer text-fg-muted transition-[color,border-color] duration-fast",
            "hover:text-fg-default focus-visible:text-fg-default",
            variant === "segment"
              ? "data-[active=true]:font-semibold data-[active=true]:text-fg-on-brand"
              : "data-[active=true]:text-fg-default",
            !navMenu && "focus-visible:ring-1 focus-visible:ring-focus-ring",
            variant !== "underline" && "rounded-lg",
            className
          ),
          ...props,
        } as React.ComponentPropsWithoutRef<"a">,
      render,
      state: { active, disabled, slot: "nav-item-trigger" },
    });

    return tooltip ? <Tooltip content={tooltip}>{trigger}</Tooltip> : trigger;
  }
);

NavItemTrigger.displayName = "NavItemTrigger";

export type NavItemLeadingProps = ComponentPropsWithoutRef<"span">;

const NavItemLeading = forwardRef<HTMLSpanElement, NavItemLeadingProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="nav-item-leading"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center text-fg-muted transition-colors duration-fast",
        "group-data-[active=true]/nav-item:text-fg-default",
        className
      )}
      {...props}
    />
  )
);

NavItemLeading.displayName = "NavItemLeading";

export type NavItemContentProps = ComponentPropsWithoutRef<"span">;

const NavItemContent = forwardRef<HTMLSpanElement, NavItemContentProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="nav-item-content"
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap group-data-[state=collapsed]/sidebar:hidden",
        className
      )}
      {...props}
    />
  )
);

NavItemContent.displayName = "NavItemContent";

export type NavItemLabelProps = ComponentPropsWithoutRef<"span">;

const NavItemLabel = forwardRef<HTMLSpanElement, NavItemLabelProps>(
  ({ className, children, ...props }, ref) => {
    const reservedLabel =
      typeof children === "string" || typeof children === "number"
        ? String(children)
        : undefined;

    return (
      <span
        ref={ref}
        data-slot="nav-item-label"
        className={cn(
          "inline-grid min-w-0 max-w-full",
          reservedLabel !== undefined &&
            "after:pointer-events-none after:col-start-1 after:row-start-1 after:invisible after:truncate after:font-semibold after:content-[attr(data-label)]",
          className
        )}
        {...props}
        data-label={reservedLabel}
      >
        <span className="col-start-1 row-start-1 truncate font-normal text-inherit transition-[font-weight] duration-fast motion-reduce:transition-none group-data-[active=true]/nav-item:font-semibold">
          {children}
        </span>
      </span>
    );
  }
);

NavItemLabel.displayName = "NavItemLabel";

export type NavItemDescriptionProps = ComponentPropsWithoutRef<"span">;

const NavItemDescription = forwardRef<HTMLSpanElement, NavItemDescriptionProps>(
  ({ className, ...props }, ref) => (
    <span ref={ref} data-slot="nav-item-description" className={cn("min-w-0 truncate text-label text-fg-muted", className)} {...props} />
  )
);

NavItemDescription.displayName = "NavItemDescription";

export type NavItemTrailingProps = ComponentPropsWithoutRef<"span">;

const NavItemTrailing = forwardRef<HTMLSpanElement, NavItemTrailingProps>(
  ({ className, ...props }, ref) => (
    <span ref={ref} data-slot="nav-item-trailing" className={cn("ml-auto flex shrink-0 items-center text-fg-muted", className)} {...props} />
  )
);

NavItemTrailing.displayName = "NavItemTrailing";

export type NavItemBadgeProps = ComponentPropsWithoutRef<"span">;

const NavItemBadge = forwardRef<HTMLSpanElement, NavItemBadgeProps>(
  ({ className, ...props }, ref) => (
    <span ref={ref} data-slot="nav-item-badge" className={cn("ml-1 shrink-0 px-2 text-label tabular-nums text-fg-muted group-data-[state=collapsed]/sidebar:hidden", className)} {...props} />
  )
);

NavItemBadge.displayName = "NavItemBadge";

export type NavItemActionProps = Omit<ComponentPropsWithoutRef<typeof Button>, "size" | "variant">;

const NavItemAction = forwardRef<HTMLButtonElement, NavItemActionProps>(
  ({ className, type = "button", children, ...props }, ref) => {
    const More = useIcon("ellipsis");

    return (
      <Button
        ref={ref}
        type={type}
        variant="ghost"
        iconOnly
        size="sm"
        data-slot="nav-item-action"
        className={cn("relative z-content mr-1 shrink-0 text-fg-muted", className)}
        {...props}
      >
        {children ?? <More aria-hidden="true" size={16} strokeWidth={1.5} />}
      </Button>
    );
  }
);

NavItemAction.displayName = "NavItemAction";

export type NavItemSubProps = ComponentPropsWithoutRef<"ul">;

const NavItemSub = forwardRef<HTMLUListElement, NavItemSubProps>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} data-slot="nav-item-sub" className={cn("ml-5 flex w-full flex-col gap-0.5 border-l border-border py-1 pl-2 group-data-[state=collapsed]/sidebar:hidden", className)} {...props} />
  )
);

NavItemSub.displayName = "NavItemSub";

export type NavItemSubItemProps = ComponentPropsWithoutRef<"li"> & { value: string };

const NavItemSubItem = forwardRef<HTMLLIElement, NavItemSubItemProps>(
  ({ className, value, ...props }, ref) => (
    <li ref={ref} data-slot="nav-item-sub-item" data-value={value} className={cn("min-w-0", className)} {...props} />
  )
);

NavItemSubItem.displayName = "NavItemSubItem";

export type NavItemSubTriggerProps = useRender.ComponentProps<"a">;

const NavItemSubTrigger = forwardRef<HTMLElement, NavItemSubTriggerProps>(
  ({ className, render, ...props }, ref) =>
    useRender({
      defaultTagName: "a",
      props: {
        ref: ref as React.Ref<HTMLAnchorElement>,
        "data-slot": "nav-item-sub-trigger",
        className: cn(
          "flex h-control-md min-w-0 items-center px-2 text-body text-fg-muted outline-none transition-colors duration-fast hover:text-fg-default focus-visible:text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring",
          className
        ),
        ...props,
      },
      render,
      state: { slot: "nav-item-sub-trigger" },
    })
);

NavItemSubTrigger.displayName = "NavItemSubTrigger";

export {
  NavItem,
  NavItemTrigger,
  NavItemLeading,
  NavItemContent,
  NavItemLabel,
  NavItemDescription,
  NavItemTrailing,
  NavItemBadge,
  NavItemAction,
  NavItemSub,
  NavItemSubItem,
  NavItemSubTrigger,
};

export default NavItem;
