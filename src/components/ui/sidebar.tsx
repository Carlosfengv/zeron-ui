"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Collapsible } from "@base-ui/react/collapsible";
import { useDirection } from "@base-ui/react/direction-provider";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useShape } from "@/lib/shape-context";
import { useSurface, SurfaceProvider } from "@/lib/surface-context";
import { resolveSurface, surfaceClasses } from "@/lib/surface-classes";
import { useIcon } from "@/lib/icon-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileDrawer } from "@/components/ui/mobile-drawer";

export const SIDEBAR_MOBILE_QUERY = "(max-width: 1279px)";

export type SidebarState = "expanded" | "collapsed";
export type SidebarVariant = "sidebar" | "floating";
export type SidebarCollapsible = "offcanvas" | "icon" | "none";
export type SidebarSide = "start" | "end";

export interface SidebarProviderProps {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMobileOpen?: boolean;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  persistenceKey?: string;
  keyboardShortcut?: string;
}

export interface SidebarContextValue {
  state: SidebarState;
  open: boolean;
  setOpen: (open: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isMobile: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  /** Set the element that should regain focus after the next compact-drawer close. */
  setActiveTrigger: (trigger: HTMLElement | null) => void;
  toggle: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function subscribeToSidebarBreakpoint(listener: () => void) {
  const media = window.matchMedia(SIDEBAR_MOBILE_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function getSidebarBreakpointSnapshot() {
  return window.matchMedia(SIDEBAR_MOBILE_QUERY).matches;
}

function useSidebarMobile() {
  return useSyncExternalStore(subscribeToSidebarBreakpoint, getSidebarBreakpointSnapshot, () => false);
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || target.isContentEditable;
}

const SidebarProvider = ({
  children,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  defaultMobileOpen = false,
  mobileOpen: mobileOpenProp,
  onMobileOpenChange,
  persistenceKey,
  keyboardShortcut,
}: SidebarProviderProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalMobileOpen, setInternalMobileOpen] = useState(defaultMobileOpen);
  const triggerRef = useRef<HTMLElement | null>(null);
  const finalFocusPreparedRef = useRef(false);
  const previousMobileOpenRef = useRef(defaultMobileOpen);
  const isMobile = useSidebarMobile();
  const open = openProp ?? internalOpen;
  const mobileOpen = mobileOpenProp ?? internalMobileOpen;
  const mobileOpenRef = useRef(mobileOpen);

  useEffect(() => {
    mobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, openProp]
  );
  const setMobileOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !mobileOpenRef.current) {
        // A programmatic open cannot infer which element initiated it. Clear a
        // previous session's owner unless the caller explicitly supplied one
        // with setActiveTrigger() immediately before opening.
        if (!finalFocusPreparedRef.current) triggerRef.current = null;
      }
      if (mobileOpenProp === undefined) setInternalMobileOpen(nextOpen);
      onMobileOpenChange?.(nextOpen);
    },
    [mobileOpenProp, onMobileOpenChange]
  );
  const setActiveTrigger = useCallback((trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
    finalFocusPreparedRef.current = true;
  }, []);
  const closeMobile = useCallback(() => setMobileOpen(false), [setMobileOpen]);
  const toggle = useCallback(() => {
    if (isMobile) setMobileOpen(!mobileOpen);
    else setOpen(!open);
  }, [isMobile, mobileOpen, open, setMobileOpen, setOpen]);

  useEffect(() => {
    const wasMobileOpen = previousMobileOpenRef.current;
    if (mobileOpen && !wasMobileOpen) {
      // Also handles consumers that control mobileOpen directly instead of
      // opening through setMobileOpen(). A direct open without an explicitly
      // prepared owner must never reuse a previous drawer session's trigger.
      if (!finalFocusPreparedRef.current) triggerRef.current = null;
      finalFocusPreparedRef.current = false;
    }
    previousMobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  useEffect(() => {
    if (!persistenceKey || openProp !== undefined) return;
    try {
      const stored = window.localStorage.getItem(persistenceKey);
      if (stored === "open" || stored === "closed") setInternalOpen(stored === "open");
    } catch {
      // Storage is optional; the controlled/default state remains authoritative.
    }
  }, [openProp, persistenceKey]);

  useEffect(() => {
    if (!persistenceKey || openProp !== undefined) return;
    try {
      window.localStorage.setItem(persistenceKey, open ? "open" : "closed");
    } catch {
      // Best-effort persistence only.
    }
  }, [open, openProp, persistenceKey]);

  useEffect(() => {
    if (isMobile || !mobileOpen) return;
    setMobileOpen(false);
    const trigger = triggerRef.current;
    if (trigger?.isConnected) trigger.focus();
  }, [isMobile, mobileOpen, setMobileOpen]);

  useEffect(() => {
    if (!keyboardShortcut) return;
    const normalized = keyboardShortcut.toLowerCase();
    const match = normalized.match(/^mod\+(.+)$/);
    if (!match) return;
    const key = match[1];
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== key) return;
      event.preventDefault();
      if (isMobile && !mobileOpen) {
        const activeElement = document.activeElement;
        setActiveTrigger(
          activeElement instanceof HTMLElement &&
            activeElement !== document.body &&
            activeElement.isConnected
            ? activeElement
            : null
        );
      }
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile, keyboardShortcut, mobileOpen, setActiveTrigger, toggle]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      mobileOpen,
      setMobileOpen,
      isMobile,
      triggerRef,
      setActiveTrigger,
      toggle,
      closeMobile,
    }),
    [closeMobile, isMobile, mobileOpen, open, setActiveTrigger, setMobileOpen, setOpen, toggle]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

SidebarProvider.displayName = "SidebarProvider";

export interface SidebarProps extends ComponentPropsWithoutRef<"div"> {
  variant?: SidebarVariant;
  collapsible?: SidebarCollapsible;
  width?: string;
  collapsedWidth?: string;
  mobileWidth?: string;
  /** Accessible name shared by the desktop aside and compact drawer. */
  ariaLabel?: string;
  /** Logical edge occupied by the sidebar. */
  side?: SidebarSide;
  /** @deprecated Use ariaLabel. */
  mobileLabel?: string;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      variant = "sidebar",
      collapsible = "offcanvas",
      width = "16rem",
      collapsedWidth = "3rem",
      mobileWidth = "16rem",
      ariaLabel,
      side = "start",
      mobileLabel,
      className,
      children,
      style,
      dir: dirProp,
      ...props
    },
    forwardedRef
  ) => {
    const { state, isMobile, mobileOpen, closeMobile, triggerRef } = useSidebar();
    const reduceMotion = useReducedMotion() ?? false;
    const shape = useShape();
    const contextDir = useDirection();
    const dir = dirProp ?? contextDir;
    const parentSurface = useSurface();
    const surface = variant === "floating" ? resolveSurface(parentSurface, "raised") : parentSurface;
    const resolvedAriaLabel = ariaLabel ?? mobileLabel ?? "Navigation";
    const visualState: SidebarState = isMobile || collapsible === "none" ? "expanded" : state;
    const panelWidth = visualState === "collapsed" && collapsible === "icon"
      ? "var(--sidebar-width-collapsed)"
      : "var(--sidebar-width)";
    const offcanvas = visualState === "collapsed" && collapsible === "offcanvas";
    const physicalLeft = (side === "start") === (dir !== "rtl");
    const offcanvasX = physicalLeft ? "-100%" : "100%";
    const rootStyle = {
      ...style,
      "--sidebar-width": width,
      "--sidebar-width-collapsed": collapsedWidth,
      "--sidebar-width-mobile": mobileWidth,
    } as CSSProperties;

    const renderPanel = (mobile: boolean) => (
      <aside
        data-slot="sidebar-panel"
        aria-label={resolvedAriaLabel}
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden",
          !mobile && variant === "sidebar" && cn(
            "border-border-subtle",
            side === "start" ? "border-e-[0.5px]" : "border-s-[0.5px]"
          ),
          !mobile && variant === "floating" && cn(
            "m-2 h-[calc(100%-1rem)] border border-border-subtle",
            shape.container
          ),
          mobile ? "bg-transparent" : surfaceClasses(surface, variant === "floating" ? "raised" : "none")
        )}
      >
        {mobile ? children : <SurfaceProvider role={surface}>{children}</SurfaceProvider>}
      </aside>
    );

    if (isMobile) {
      return (
        <MobileDrawer
          open={mobileOpen}
          onClose={closeMobile}
          triggerRef={triggerRef}
          ariaLabel={resolvedAriaLabel}
          dir={dir}
          side={side}
          panelClassName="overflow-hidden p-0"
          panelStyle={{ width: mobileWidth }}
        >
          <div
            ref={forwardedRef}
            data-slot="sidebar"
            data-state="expanded"
            data-collapsible={collapsible}
            data-variant={variant}
            data-side={side}
            data-mobile="true"
            className={cn("group/sidebar h-full", className)}
            style={rootStyle}
            dir={dir}
            {...props}
          >
            {renderPanel(true)}
          </div>
        </MobileDrawer>
      );
    }

    return (
      <div
        ref={forwardedRef}
        data-slot="sidebar"
        data-state={visualState}
        data-collapsible={collapsible}
        data-variant={variant}
        data-side={side}
        data-mobile="false"
        className={cn(
          "group/sidebar sticky top-0 h-svh shrink-0",
          className,
          "hidden xl:block"
        )}
        style={rootStyle}
        dir={dir}
        {...props}
      >
        <div
          aria-hidden="true"
          data-slot="sidebar-gap"
          className="h-full"
          style={{ width: offcanvas ? 0 : panelWidth }}
        />
        <motion.div
          data-slot="sidebar-panel-wrapper"
          className={cn(
            "absolute inset-y-0 w-[var(--sidebar-panel-width)]",
            physicalLeft ? "left-0" : "right-0"
          )}
          style={{ "--sidebar-panel-width": panelWidth } as CSSProperties}
          initial={false}
          animate={{ x: offcanvas ? offcanvasX : 0, opacity: offcanvas ? 0 : 1 }}
          transition={reduceMotion ? { duration: 0 } : spring.moderate}
        >
          {renderPanel(false)}
        </motion.div>
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";

export interface SidebarTriggerProps extends Omit<ComponentPropsWithoutRef<typeof Button>, "children"> {
  label?: string;
}

const SidebarTrigger = forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ label = "Toggle sidebar", onClick, ...props }, forwardedRef) => {
    const { isMobile, mobileOpen, state, toggle, setActiveTrigger } = useSidebar();
    const MenuIcon = useIcon("menu");
    const CollapseIcon = useIcon("chevrons-left");
    const ExpandIcon = useIcon("chevrons-right");
    const Icon = isMobile ? MenuIcon : state === "collapsed" ? ExpandIcon : CollapseIcon;
    return (
      <Button
        ref={forwardedRef}
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          // Only an external closed → open trigger owns final focus. The
          // matching close button rendered inside the drawer must not replace
          // the owner with an element that is about to unmount.
          if (isMobile && !mobileOpen) setActiveTrigger(event.currentTarget);
          toggle();
        }}
        {...props}
      >
        <Icon aria-hidden="true" strokeWidth={1.5} />
      </Button>
    );
  }
);

SidebarTrigger.displayName = "SidebarTrigger";

export interface SidebarFloatingTriggerProps extends Omit<ComponentPropsWithoutRef<typeof Button>, "children"> {
  /** The Sidebar collapse mode that exposes this trigger. */
  collapsedBehavior?: SidebarCollapsible;
  /** Accessible label for the collapsed-navigation trigger. */
  label?: string;
  /** Renders the complete navigation panel; call close() after an in-place navigation action. */
  renderContent: (controls: { close: () => void }) => ReactNode;
  /** Classes for the anchored navigation popover. */
  contentClassName?: string;
}

const SidebarFloatingTrigger = forwardRef<HTMLButtonElement, SidebarFloatingTriggerProps>(
  (
    {
      collapsedBehavior = "offcanvas",
      contentClassName,
      label = "Expand sidebar",
      renderContent,
      className,
      onClick,
      ...props
    },
    forwardedRef
  ) => {
    const { isMobile, state, toggle } = useSidebar();
    const [open, setOpen] = useState(false);
    const ExpandIcon = useIcon("chevrons-right");
    const visible = !isMobile && state === "collapsed" && collapsedBehavior === "offcanvas";

    useEffect(() => {
      if (!visible) setOpen(false);
    }, [visible]);

    if (!visible) return null;

    return (
      <Popover trigger="hover" open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              ref={forwardedRef}
              variant="tertiary"
              size="icon-sm"
              aria-label={label}
              active={open}
              className={className}
              onClick={(event) => {
                onClick?.(event);
                if (event.defaultPrevented) return;
                setOpen(false);
                toggle();
              }}
              {...props}
            >
              <ExpandIcon aria-hidden="true" strokeWidth={1.5} />
            </Button>
          }
        />
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className={cn("flex min-h-0 flex-col overflow-hidden", contentClassName)}
        >
          {renderContent({ close: () => setOpen(false) })}
        </PopoverContent>
      </Popover>
    );
  }
);

SidebarFloatingTrigger.displayName = "SidebarFloatingTrigger";

export type SidebarRailProps = ComponentPropsWithoutRef<"button">;

const SidebarRail = forwardRef<HTMLButtonElement, SidebarRailProps>(({ className, onClick, ...props }, ref) => {
  const { toggle } = useSidebar();
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      data-slot="sidebar-rail"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggle();
      }}
      className={cn(
        "absolute inset-y-0 -end-2 z-raised hidden w-4 cursor-pointer xl:block",
        "group-data-[side=end]/sidebar:end-auto group-data-[side=end]/sidebar:start-[-0.5rem]",
        className
      )}
      {...props}
    />
  );
});

SidebarRail.displayName = "SidebarRail";

export type SidebarHeaderProps = ComponentPropsWithoutRef<"div">;
export type SidebarFooterProps = ComponentPropsWithoutRef<"div">;
export interface SidebarContentProps extends ComponentPropsWithoutRef<"div"> {
  viewportClassName?: string;
  contentClassName?: string;
}
export interface SidebarGroupProps
  extends Omit<ComponentPropsWithoutRef<typeof Collapsible.Root>, "render"> {
  /** Enables the label trigger and collapsible group content. */
  collapsible?: boolean;
}
export type SidebarGroupLabelProps = ComponentPropsWithoutRef<"div">;
export interface SidebarGroupTriggerProps
  extends ComponentPropsWithoutRef<typeof Collapsible.Trigger> {
  indicator?: ReactNode;
}
export type SidebarGroupActionProps = Omit<ComponentPropsWithoutRef<typeof Button>, "size" | "variant">;
export type SidebarGroupContentProps = ComponentPropsWithoutRef<typeof Collapsible.Panel>;
export type SidebarSeparatorProps = ComponentPropsWithoutRef<"hr">;

const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-header" className={cn("shrink-0 p-3", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(({
  className,
  viewportClassName,
  contentClassName,
  children,
  ...props
}, ref) => (
  <ScrollArea
    ref={ref}
    data-slot="sidebar-content"
    className={cn("min-h-0 min-w-0 flex-1", className)}
    viewportClassName={cn("h-full overflow-x-hidden", viewportClassName)}
  >
    <div
      data-slot="sidebar-content-inner"
      className={cn("flex min-h-full w-full min-w-0 flex-col gap-4 p-3", contentClassName)}
      {...props}
    >
      {children}
    </div>
  </ScrollArea>
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-footer" className={cn("shrink-0 p-3", className)} {...props} />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarGroup = forwardRef<HTMLElement, SidebarGroupProps>(({
  collapsible = false,
  open,
  defaultOpen = true,
  disabled,
  className,
  ...props
}, ref) => (
  <Collapsible.Root
    ref={ref as React.Ref<HTMLDivElement>}
    render={<section />}
    open={collapsible ? open : true}
    defaultOpen={collapsible && open === undefined ? defaultOpen : undefined}
    disabled={collapsible ? disabled : true}
    data-slot="sidebar-group"
    data-collapsible={collapsible ? "true" : "false"}
    className={cn("group/sidebar-group relative min-w-0", className)}
    {...props}
  />
));
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = forwardRef<HTMLDivElement, SidebarGroupLabelProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-group-label" className={cn("px-2 pb-1.5 text-label text-fg-muted group-data-[state=collapsed]/sidebar:hidden", className)} {...props} />
));
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupTrigger = forwardRef<HTMLButtonElement, SidebarGroupTriggerProps>(({
  className,
  children,
  indicator,
  type = "button",
  ...props
}, ref) => {
  const Chevron = useIcon("chevron-right");
  const shape = useShape();

  return (
    <Collapsible.Trigger
      ref={ref}
      type={type}
      data-slot="sidebar-group-trigger"
      className={cn(
        "group/sidebar-group-trigger mb-1.5 flex h-6 w-full items-center gap-1.5 px-2 text-start text-label text-fg-muted outline-none",
        "transition-colors duration-fast hover:text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring",
        "group-data-[state=collapsed]/sidebar:hidden",
        shape.item,
        className
      )}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {indicator ?? (
        <Chevron
          aria-hidden="true"
          size={14}
          strokeWidth={1.5}
          className="shrink-0 transition-transform duration-fast group-data-[panel-open]/sidebar-group-trigger:rotate-90 motion-reduce:transition-none"
        />
      )}
    </Collapsible.Trigger>
  );
});
SidebarGroupTrigger.displayName = "SidebarGroupTrigger";

const SidebarGroupAction = forwardRef<HTMLButtonElement, SidebarGroupActionProps>(({ className, type = "button", ...props }, ref) => (
  <Button
    ref={ref}
    type={type}
    variant="ghost"
    size="icon-sm"
    data-slot="sidebar-group-action"
    className={cn("absolute right-1 top-0 text-fg-muted group-data-[state=collapsed]/sidebar:hidden", className)}
    {...props}
  />
));
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = forwardRef<HTMLDivElement, SidebarGroupContentProps>(({ className, children, ...props }, ref) => (
  <Collapsible.Panel
    ref={ref}
    keepMounted
    data-slot="sidebar-group-content"
    className={cn(
      "grid w-full min-w-0 grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-moderate",
      "data-[starting-style]:grid-rows-[0fr] data-[starting-style]:opacity-0",
      "data-[ending-style]:grid-rows-[0fr] data-[ending-style]:opacity-0",
      "motion-reduce:transition-none",
      className
    )}
    {...props}
  >
    <div className="min-h-0 min-w-0 w-full">{children}</div>
  </Collapsible.Panel>
));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarSeparator = forwardRef<HTMLHRElement, SidebarSeparatorProps>(({ className, ...props }, ref) => (
  <hr ref={ref} data-slot="sidebar-separator" className={cn("mx-3 border-border", className)} {...props} />
));
SidebarSeparator.displayName = "SidebarSeparator";

export {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarFloatingTrigger,
  SidebarRail,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupTrigger,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarSeparator,
};
