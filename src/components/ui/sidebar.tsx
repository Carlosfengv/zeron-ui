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
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useShape } from "@/lib/shape-context";
import { useSurface, SurfaceProvider } from "@/lib/surface-context";
import { resolveSurface, surfaceClasses } from "@/lib/surface-classes";
import { useIcon } from "@/lib/icon-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileDrawer } from "@/components/ui/mobile-drawer";

export const SIDEBAR_MOBILE_QUERY = "(max-width: 1279px)";

export type SidebarState = "expanded" | "collapsed";
export type SidebarVariant = "sidebar" | "floating";
export type SidebarCollapsible = "offcanvas" | "icon" | "none";

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
  const isMobile = useSidebarMobile();
  const open = openProp ?? internalOpen;
  const mobileOpen = mobileOpenProp ?? internalMobileOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, openProp]
  );
  const setMobileOpen = useCallback(
    (nextOpen: boolean) => {
      if (mobileOpenProp === undefined) setInternalMobileOpen(nextOpen);
      onMobileOpenChange?.(nextOpen);
    },
    [mobileOpenProp, onMobileOpenChange]
  );
  const setActiveTrigger = useCallback((trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
  }, []);
  const closeMobile = useCallback(() => setMobileOpen(false), [setMobileOpen]);
  const toggle = useCallback(() => {
    if (isMobile) setMobileOpen(!mobileOpen);
    else setOpen(!open);
  }, [isMobile, mobileOpen, open, setMobileOpen, setOpen]);

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
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboardShortcut, toggle]);

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
      mobileLabel = "Navigation",
      className,
      children,
      style,
      ...props
    },
    forwardedRef
  ) => {
    const { state, isMobile, mobileOpen, closeMobile, triggerRef } = useSidebar();
    const reduceMotion = useReducedMotion() ?? false;
    const shape = useShape();
    const surface = resolveSurface(useSurface(), variant === "floating" ? "raised" : "base");
    const visualState: SidebarState = isMobile || collapsible === "none" ? "expanded" : state;
    const panelWidth = visualState === "collapsed" && collapsible === "icon" ? collapsedWidth : width;
    const offcanvas = visualState === "collapsed" && collapsible === "offcanvas";
    const rootStyle = style;
    const panel = (
      <aside
        data-slot="sidebar-panel"
        aria-label={mobileLabel}
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden",
          variant === "floating" && cn("m-2 h-[calc(100%-1rem)]", shape.container),
          surfaceClasses(surface, variant === "floating" ? "raised" : "none")
        )}
      >
        <SurfaceProvider role={surface}>{children}</SurfaceProvider>
      </aside>
    );

    if (isMobile) {
      return (
        <MobileDrawer
          open={mobileOpen}
          onClose={closeMobile}
          triggerRef={triggerRef}
          ariaLabel={mobileLabel}
          panelClassName="overflow-hidden p-0"
          panelStyle={{ width: mobileWidth }}
        >
          <div
            ref={forwardedRef}
            data-slot="sidebar"
            data-state="expanded"
            data-collapsible={collapsible}
            data-variant={variant}
            data-mobile="true"
            className={cn("group/sidebar h-full", className)}
            style={rootStyle}
            {...props}
          >
            {panel}
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
        data-mobile="false"
        className={cn("group/sidebar sticky top-0 h-svh shrink-0", className)}
        style={rootStyle}
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
          className="absolute inset-y-0 left-0 w-[var(--sidebar-panel-width)]"
          style={{ "--sidebar-panel-width": panelWidth } as CSSProperties}
          initial={false}
          animate={{ x: offcanvas ? "-100%" : 0, opacity: offcanvas ? 0 : 1 }}
          transition={reduceMotion ? { duration: 0 } : spring.moderate}
        >
          {panel}
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
    const { toggle, setActiveTrigger } = useSidebar();
    const MenuIcon = useIcon("menu");
    return (
      <Button
        ref={forwardedRef}
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          setActiveTrigger(event.currentTarget);
          toggle();
        }}
        {...props}
      >
        <MenuIcon />
      </Button>
    );
  }
);

SidebarTrigger.displayName = "SidebarTrigger";

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
      className={cn("absolute inset-y-0 -right-2 z-raised hidden w-4 cursor-pointer xl:block", className)}
      {...props}
    />
  );
});

SidebarRail.displayName = "SidebarRail";

export type SidebarHeaderProps = ComponentPropsWithoutRef<"div">;
export type SidebarFooterProps = ComponentPropsWithoutRef<"div">;
export type SidebarContentProps = ComponentPropsWithoutRef<"div">;
export type SidebarGroupProps = ComponentPropsWithoutRef<"section">;
export type SidebarGroupLabelProps = ComponentPropsWithoutRef<"div">;
export type SidebarGroupActionProps = Omit<ComponentPropsWithoutRef<typeof Button>, "size" | "variant">;
export type SidebarGroupContentProps = ComponentPropsWithoutRef<"div">;
export type SidebarSeparatorProps = ComponentPropsWithoutRef<"hr">;

const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-header" className={cn("shrink-0 p-3", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(({ className, children, ...props }, ref) => (
  <ScrollArea ref={ref} data-slot="sidebar-content" className={cn("min-h-0 flex-1", className)} viewportClassName="h-full">
    <div className="flex min-h-full flex-col gap-4 p-3" {...props}>{children}</div>
  </ScrollArea>
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-footer" className={cn("shrink-0 p-3", className)} {...props} />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarGroup = forwardRef<HTMLElement, SidebarGroupProps>(({ className, ...props }, ref) => (
  <section ref={ref} data-slot="sidebar-group" className={cn("relative min-w-0", className)} {...props} />
));
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = forwardRef<HTMLDivElement, SidebarGroupLabelProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-group-label" className={cn("px-2 pb-1.5 text-label text-fg-muted group-data-[state=collapsed]/sidebar:hidden", className)} {...props} />
));
SidebarGroupLabel.displayName = "SidebarGroupLabel";

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

const SidebarGroupContent = forwardRef<HTMLDivElement, SidebarGroupContentProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-group-content" className={cn("min-w-0", className)} {...props} />
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
  SidebarRail,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarSeparator,
};
