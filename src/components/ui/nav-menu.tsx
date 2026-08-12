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
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useShape } from "@/lib/shape-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";

export type NavOrientation = "vertical" | "horizontal";
export type NavKeyboardNavigation = "native" | "roving";
export type NavMenuVariant = "default" | "segment" | "underline";

export interface NavMenuProps extends ComponentPropsWithoutRef<"nav"> {
  /** Renders the interactive menu structure inside a parent navigation landmark. */
  as?: "nav" | "div";
  orientation?: NavOrientation;
  variant?: NavMenuVariant;
  activeValue?: string | null;
  keyboardNavigation?: NavKeyboardNavigation;
  children: ReactNode;
}

interface NavItemRegistration {
  id: string;
  value: string;
  element: HTMLElement;
  disabled: boolean;
}

interface NavMenuContextValue {
  activeValue: string | null;
  activeId: string | null;
  hoveredId: string | null;
  focusedId: string | null;
  variant: NavMenuVariant;
  keyboardNavigation: NavKeyboardNavigation;
  rovingTabStopId: string | null;
  registerItem: (registration: NavItemRegistration) => () => void;
}

const NavMenuContext = createContext<NavMenuContextValue | null>(null);

export function useNavMenu() {
  const context = useContext(NavMenuContext);
  if (!context) throw new Error("NavItem must be used within a NavMenu");
  return context;
}

export function useNavMenuOptional() {
  return useContext(NavMenuContext);
}

function itemOrder(items: Map<string, NavItemRegistration>) {
  return [...items.values()].sort((a, b) => {
    if (a.element === b.element) return 0;
    const position = a.element.compareDocumentPosition(b.element);
    return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
}

const NavMenu = forwardRef<HTMLElement, NavMenuProps>(
  (
    {
      children,
      as: Root = "nav",
      orientation = "vertical",
      variant = "default",
      activeValue = null,
      keyboardNavigation = "native",
      className,
      onFocusCapture,
      onBlurCapture,
      onPointerDownCapture,
      onKeyDown,
      ...props
    },
    forwardedRef
  ) => {
    const containerRef = useRef<HTMLElement | null>(null);
    const itemMapRef = useRef(new Map<string, NavItemRegistration>());
    const [items, setItems] = useState<Map<string, NavItemRegistration>>(
      () => new Map()
    );
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const reduceMotion = useReducedMotion() ?? false;
    const shape = useShape();
    const axis = orientation === "vertical" ? "y" : "x";
    const {
      activeIndex: hoveredIndex,
      setActiveIndex: setHoveredIndex,
      itemRects,
      isMeasured,
      sessionRef,
      handlers,
      registerItem: registerMeasuredItem,
      remeasure,
    } = useProximityHover(containerRef, { axis });

    const orderedItems = useMemo(() => itemOrder(items), [items]);
    const activeId = useMemo(
      () =>
        activeValue === null
          ? null
          : orderedItems.find((item) => item.value === activeValue)?.id ?? null,
      [activeValue, orderedItems]
    );
    const hoveredId =
      hoveredIndex === null ? null : orderedItems[hoveredIndex]?.id ?? null;

    const registerItem = useCallback((registration: NavItemRegistration) => {
      itemMapRef.current.set(registration.id, registration);
      setItems(new Map(itemMapRef.current));
      return () => {
        itemMapRef.current.delete(registration.id);
        setItems(new Map(itemMapRef.current));
      };
    }, []);

    useEffect(() => {
      orderedItems.forEach((item, index) => registerMeasuredItem(index, item.element));
      return () => {
        orderedItems.forEach((_, index) => registerMeasuredItem(index, null));
      };
    }, [orderedItems, registerMeasuredItem]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => remeasure());
      observer.observe(container);
      orderedItems.forEach((item) => observer.observe(item.element));
      return () => observer.disconnect();
    }, [orderedItems, remeasure]);

    const rovingTabStopId = activeId ?? orderedItems.find((item) => !item.disabled)?.id ?? null;
    const activeIndex = activeId ? orderedItems.findIndex((item) => item.id === activeId) : -1;
    const focusIndex = focusedId ? orderedItems.findIndex((item) => item.id === focusedId) : -1;
    const hoverRect = hoveredIndex === null ? null : itemRects[hoveredIndex] ?? null;
    const activeRect = activeIndex >= 0 ? itemRects[activeIndex] ?? null : null;
    const focusRect = focusIndex >= 0 ? itemRects[focusIndex] ?? null : null;

    const focusByOffset = (startIndex: number, direction: 1 | -1) => {
      const enabled = orderedItems.filter((item) => !item.disabled);
      if (!enabled.length) return;
      const current = enabled.findIndex((item) => item.id === orderedItems[startIndex]?.id);
      const next = enabled[(current + direction + enabled.length) % enabled.length];
      next?.element.querySelector<HTMLElement>("[data-slot=nav-item-trigger]")?.focus();
    };

    const context = useMemo<NavMenuContextValue>(
      () => ({
        activeValue,
        activeId,
        hoveredId,
        focusedId,
        variant,
        keyboardNavigation,
        rovingTabStopId,
        registerItem,
      }),
      [activeValue, activeId, hoveredId, focusedId, variant, keyboardNavigation, registerItem, rovingTabStopId]
    );

    return (
      <NavMenuContext.Provider value={context}>
        <Root
          ref={(node) => {
            containerRef.current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          data-slot="nav-menu"
          data-orientation={orientation}
          data-variant={variant}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
          onFocusCapture={(event) => {
            const target = event.target as HTMLElement;
            const id = target
              .closest<HTMLElement>("[data-nav-item-id]")
              ?.dataset.navItemId;

            const isVisiblePrimaryFocus = target.matches(
              '[data-slot="nav-item-trigger"]:focus-visible'
            );
            setFocusedId(isVisiblePrimaryFocus ? id ?? null : null);
            onFocusCapture?.(event);
          }}
          onBlurCapture={(event) => {
            if (!containerRef.current?.contains(event.relatedTarget as Node)) {
              setFocusedId(null);
              setHoveredIndex(null);
            }
            onBlurCapture?.(event);
          }}
          onPointerDownCapture={(event) => {
            const trigger = (event.target as HTMLElement).closest<HTMLElement>(
              '[data-slot="nav-item-trigger"]'
            );

            // A pointer press on an already keyboard-focused trigger may not
            // emit a new focus event. Re-check after the browser updates its
            // focus-visible heuristic, so pointer interaction clears the
            // moving ring while an explicit "always show focus" preference
            // remains respected.
            requestAnimationFrame(() => {
              if (!trigger?.matches(":focus-visible")) setFocusedId(null);
            });

            onPointerDownCapture?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || keyboardNavigation !== "roving") return;
            const currentId = (event.target as HTMLElement)
              .closest<HTMLElement>("[data-nav-item-id]")
              ?.dataset.navItemId;
            const currentIndex = orderedItems.findIndex((item) => item.id === currentId);
            if (currentIndex < 0) return;

            const forwardKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
            const backwardKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
            if (event.key === forwardKey || event.key === backwardKey) {
              event.preventDefault();
              focusByOffset(currentIndex, event.key === forwardKey ? 1 : -1);
            } else if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              const enabled = orderedItems.filter((item) => !item.disabled);
              const target = event.key === "Home" ? enabled[0] : enabled[enabled.length - 1];
              target?.element.querySelector<HTMLElement>("[data-slot=nav-item-trigger]")?.focus();
            }
          }}
          className={cn(
            "relative isolate flex select-none",
            orientation === "vertical"
              ? "min-w-0 max-w-full w-full flex-col"
              : ["min-w-0 items-center", variant === "underline" || variant === "segment" ? "gap-0.5" : "gap-1"],
            orientation === "horizontal" && variant === "segment" &&
              "max-w-[calc(100%_+_8px)] overflow-x-auto scrollbar-hide",
            orientation === "horizontal" && variant === "underline" &&
              "max-w-[calc(100%_+_8px)] overflow-x-auto border-b border-border px-1 scrollbar-hide",
            className
          )}
          {...props}
        >
          <AnimatePresence>
            {isMeasured && activeRect && (
              <motion.div
                aria-hidden="true"
                data-slot="nav-item-active-indicator"
                className={cn(
                  "pointer-events-none absolute z-base",
                  variant === "underline" || variant === "segment"
                    ? "bg-brand"
                    : "bg-active",
                  variant !== "underline" && shape.bg
                )}
                initial={false}
                animate={{
                  top:
                    variant === "underline"
                      ? activeRect.top + activeRect.height - 2
                      : activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: variant === "underline" ? 2 : activeRect.height,
                  opacity:
                    variant === "underline" && hoveredId && hoveredId !== activeId
                      ? 0.85
                      : 1,
                }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={reduceMotion ? { duration: 0 } : spring.moderate}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {variant !== "underline" && isMeasured && hoverRect && (
              <motion.div
                key={sessionRef.current}
                aria-hidden="true"
                data-slot="nav-item-hover-indicator"
                className={cn(
                  "pointer-events-none absolute z-base",
                  variant === "segment" ? "bg-active" : "bg-hover",
                  shape.bg
                )}
                initial={{ opacity: 0, top: hoverRect.top, left: hoverRect.left, width: hoverRect.width, height: hoverRect.height }}
                animate={{ top: hoverRect.top, left: hoverRect.left, width: hoverRect.width, height: hoverRect.height, opacity: 1 }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={reduceMotion ? { duration: 0 } : spring.fast}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isMeasured && focusRect && (
              <motion.div
                aria-hidden="true"
                data-slot="nav-item-focus-indicator"
                className={cn("pointer-events-none absolute z-raised border border-focus-ring", shape.focusRing)}
                initial={false}
                animate={{
                  top: focusRect.top,
                  left: focusRect.left,
                  width: focusRect.width,
                  height: focusRect.height,
                  opacity: 1,
                }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={reduceMotion ? { duration: 0 } : spring.fast}
              />
            )}
          </AnimatePresence>
          <ul data-slot="nav-list" className={cn("relative z-content flex min-w-0 list-none p-0", orientation === "vertical" ? "w-full flex-col gap-0.5" : ["items-center", variant === "underline" || variant === "segment" ? "gap-0.5" : "gap-1"])}>
            {children}
          </ul>
        </Root>
      </NavMenuContext.Provider>
    );
  }
);

NavMenu.displayName = "NavMenu";

export { NavMenu };
export default NavMenu;
