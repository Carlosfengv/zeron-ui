"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  createContext,
  useContext,
  forwardRef,
  Children,
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { motion, AnimatePresence } from "framer-motion";
import type { IconComponent } from "#system/icon-context";
import { cn } from "#system/utils";
import { spring } from "#system/springs";
import { useProximityHover } from "#hooks/use-proximity-hover";
import { Badge, type BadgeProps } from "#components/badge";

/* ─────────────────────── Contexts ─────────────────────── */

interface TabsValueOrderContextValue {
  valueOrder: string[];
  setValueOrder: (order: string[]) => void;
  selectedValue: string | undefined;
  variant: TabsVariant;
  color: TabsColor;
}

const TabsValueOrderContext = createContext<TabsValueOrderContextValue | null>(null);

interface TabsListContextValue {
  registerTab: (index: number, value: string, el: HTMLElement | null) => void;
  hoveredIndex: number | null;
  selectedValue: string | undefined;
  setOptimisticIdx: (index: number) => void;
  variant: TabsVariant;
  color: TabsColor;
  labelVisibility: TabLabelVisibility;
}

const TabsListContext = createContext<TabsListContextValue | null>(null);

function useTabsList() {
  const ctx = useContext(TabsListContext);
  if (!ctx) throw new Error("TabItem must be used within a TabsList");
  return ctx;
}

export type TabsVariant = "pill" | "segment" | "underline";
export type TabsColor = "brand" | "neutral";
export type TabLabelVisibility = "all" | "active";

/**
 * A compact Badge configuration for a TabItem. Pass a number or text for the
 * default badge, or use the complete Badge API for color and status badges.
 */
export type TabBadgeProps = Omit<BadgeProps, "children"> & {
  children: ReactNode;
};

export type TabBadge = ReactNode | TabBadgeProps;

function isTabBadgeProps(badge: TabBadge): badge is TabBadgeProps {
  return typeof badge === "object" && badge !== null && !isValidElement(badge) && "children" in badge;
}

/* ─────────────────────── Tabs (Root) ─────────────────────── */

interface TabsProps
  extends Omit<
    ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
    "onValueChange" | "value" | "defaultValue" | "onSelect"
  > {
  value?: string;
  onValueChange?: (value: string) => void;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  defaultValue?: string;
  /** Visual treatment. Pill preserves the original Tabs appearance. */
  variant?: TabsVariant;
  /** Color treatment for the selected tab. Defaults to the current brand color. */
  color?: TabsColor;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value,
      onValueChange,
      selectedIndex,
      onSelect,
      defaultValue,
      variant = "pill",
      color = "brand",
      children,
      ...props
    },
    ref
  ) => {
    const [valueOrder, setValueOrder] = useState<string[]>([]);
    const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(
      defaultValue
    );
    const updateValueOrder = useCallback((order: string[]) => {
      setValueOrder((current) => {
        if (
          current.length === order.length &&
          current.every((v, i) => v === order[i])
        ) {
          return current;
        }
        return order;
      });
    }, []);

    // Resolve value: explicit value > selectedIndex lookup > uncontrolled state.
    // Uncontrolled with no defaultValue falls back to the first tab so the
    // FF layer's selectedValue matches what the primitive shows.
    const resolvedValue =
      value ??
      (selectedIndex != null
        ? valueOrder[selectedIndex]
        : uncontrolledValue ?? valueOrder[0]);

    // Base UI passes (value, eventDetails); we only need value.
    const handleValueChange = useCallback(
      (newValue: unknown) => {
        const v = newValue as string;
        if (value === undefined && selectedIndex == null) {
          setUncontrolledValue(v);
        }
        onValueChange?.(v);
        if (onSelect) {
          const idx = valueOrder.indexOf(v);
          if (idx !== -1) onSelect(idx);
        }
      },
      [onValueChange, onSelect, valueOrder, value, selectedIndex]
    );

    return (
      <TabsValueOrderContext.Provider
        value={{
          valueOrder,
          setValueOrder: updateValueOrder,
          selectedValue: resolvedValue,
          variant,
          color,
        }}
      >
        {/*
          Always controlled: Base UI's useControlled logs a dev warning when
          value flips undefined → defined. valueOrder is empty on the first
          commit, so fall back to an empty-string sentinel — TabsList's
          layout effect populates valueOrder pre-paint, so the corrected
          value lands before anything is visible.
        */}
        <TabsPrimitive.Root
          ref={ref}
          value={resolvedValue ?? ""}
          onValueChange={handleValueChange}
          {...props}
        >
          {children}
        </TabsPrimitive.Root>
      </TabsValueOrderContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";

/* ─────────────────────── TabsList ─────────────────────── */

interface TabsListProps
  extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** Controls icon-tab labels for every Tabs variant. Defaults to showing all labels. */
  labelVisibility?: TabLabelVisibility;
  /** @deprecated Use labelVisibility="active" instead. */
  activeLabel?: boolean;
  /** Whether arrow-key focus immediately selects a tab. */
  activationMode?: "automatic" | "manual";
}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className, labelVisibility, activeLabel, activationMode, activateOnFocus, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isMouseInside = useRef(false);
    const valueOrderCtx = useContext(TabsValueOrderContext);
    const variant = valueOrderCtx?.variant ?? "pill";
    const color = valueOrderCtx?.color ?? "brand";
    const resolvedLabelVisibility = labelVisibility ?? (activeLabel ? "active" : "all");
    const [optimisticIdx, setOptimisticIdx] = useState<number | null>(null);

    const values = Children.toArray(children)
      .filter(isValidElement)
      .map((child) => (child.props as { value?: string }).value)
      .filter((v): v is string => typeof v === "string");
    const valueOrderKey = values.join(",");
    const setValueOrder = valueOrderCtx?.setValueOrder;

    useLayoutEffect(() => {
      setValueOrder?.(values);
    }, [setValueOrder, valueOrderKey]);

    const {
      activeIndex: hoveredIndex,
      setActiveIndex: setHoveredIndex,
      itemRects,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef, { axis: "x" });
    const tabElementsRef = useRef(new Map<number, HTMLElement>());

    const registerTab = useCallback(
      (index: number, _value: string, el: HTMLElement | null) => {
        registerItem(index, el);
        if (el) tabElementsRef.current.set(index, el);
        else tabElementsRef.current.delete(index);
      },
      [registerItem]
    );

    useEffect(() => {
      measureItems();
    }, [measureItems, children]);

    // Active-only labels change an individual trigger's width after selection.
    // Keep every variant's indicator aligned as labels expand/collapse.
    useEffect(() => {
      if (tabElementsRef.current.size === 0 || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => measureItems());
      tabElementsRef.current.forEach((element) => observer.observe(element));
      return () => observer.disconnect();
    }, [measureItems, children]);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        isMouseInside.current = true;
        handlers.onMouseMove(e);
      },
      [handlers]
    );

    const handleMouseLeave = useCallback(() => {
      isMouseInside.current = false;
      handlers.onMouseLeave();
    }, [handlers]);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const selectedValue = valueOrderCtx?.selectedValue;
    const selectedIdx =
      selectedValue !== undefined ? values.indexOf(selectedValue) : -1;

    useEffect(() => {
      setOptimisticIdx(selectedIdx >= 0 ? selectedIdx : null);
    }, [selectedIdx]);

    const activeSelectedIdx = optimisticIdx;
    const selectedRect =
      activeSelectedIdx !== null ? itemRects[activeSelectedIdx] : null;
    const hoverRect = hoveredIndex !== null ? itemRects[hoveredIndex] : null;
    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    const isHoveringSelected = hoveredIndex === activeSelectedIdx;
    const isHovering = hoveredIndex !== null && !isHoveringSelected;

    const indexedChildren = Children.map(children, (child, i) => {
      // Skip plain DOM elements — injecting _index into e.g. a <div>
      // triggers React's unknown-prop warning.
      if (isValidElement(child) && typeof child.type !== "string") {
        return cloneElement(child, { _index: i } as Record<string, unknown>);
      }
      return child;
    });

    return (
      <TabsListContext.Provider
        value={{
          registerTab,
          hoveredIndex,
          selectedValue,
          setOptimisticIdx,
          variant,
          color,
          labelVisibility: resolvedLabelVisibility,
        }}
      >
        <TabsPrimitive.List
          activateOnFocus={
            activationMode === "manual"
              ? false
              : activateOnFocus ?? true
          }
          ref={(node) => {
            (
              containerRef as React.MutableRefObject<HTMLDivElement | null>
            ).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref)
              (
                ref as React.MutableRefObject<HTMLDivElement | null>
              ).current = node;
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onFocus={(e) => {
            const trigger = (e.target as HTMLElement).closest('[role="tab"]');
            if (!trigger) return;
            const indexAttr = trigger.getAttribute("data-proximity-index");
            if (indexAttr != null) {
              const idx = Number(indexAttr);
              setHoveredIndex(idx);
              setFocusedIndex(
                (e.target as HTMLElement).matches(":focus-visible") ? idx : null
              );
            }
          }}
          onBlur={(e) => {
            if (containerRef.current?.contains(e.relatedTarget as Node)) return;
            setFocusedIndex(null);
            if (isMouseInside.current) return;
            setHoveredIndex(null);
          }}
          className={cn(
            variant === "pill" && [
              "relative inline-flex items-center gap-0.5 p-1 select-none bg-muted",
              "rounded-xl",
            ],
            variant === "segment" &&
              "relative flex items-center gap-0.5 select-none overflow-x-auto max-w-[calc(100%_+_8px)] scrollbar-hide -mx-1 px-1 -my-1 py-1",
            variant === "underline" &&
              "relative flex items-center gap-0.5 select-none overflow-x-auto max-w-[calc(100%_+_8px)] scrollbar-hide -mx-1 px-1 -my-1 border-b border-border",
            className
          )}
          {...props}
        >
          {/* Active indicator */}
          {selectedRect && (
            <motion.div
              className={cn(
                "absolute pointer-events-none",
                color === "neutral" ? "bg-inverse-background" : "bg-brand",
                variant !== "underline" && "rounded-lg"
              )}
              initial={false}
              animate={{
                left: selectedRect.left,
                width: selectedRect.width,
                top:
                  variant === "underline"
                    ? selectedRect.top + selectedRect.height - 2
                    : selectedRect.top,
                height: variant === "underline" ? 2 : selectedRect.height,
                opacity: isHovering ? 0.85 : 1,
              }}
              transition={{
                ...spring.moderate,
                opacity: { duration: spring.fast.duration },
              }}
            />
          )}

          {/* Hover indicator */}
          <AnimatePresence>
            {variant !== "underline" && hoverRect && !isHoveringSelected && selectedRect && (
              <motion.div
                className={cn(
                  "absolute pointer-events-none",
                  variant === "pill" ? "bg-hover" : "bg-active",
                  "rounded-lg"
                )}
                initial={{
                  left: selectedRect.left,
                  width: selectedRect.width,
                  top: selectedRect.top,
                  height: selectedRect.height,
                  opacity: 0,
                }}
                animate={{
                  left: hoverRect.left,
                  width: hoverRect.width,
                  top: hoverRect.top,
                  height: hoverRect.height,
                  opacity: 0.4,
                }}
                exit={
                  !isMouseInside.current && selectedRect
                    ? {
                        left: selectedRect.left,
                        width: selectedRect.width,
                        top: selectedRect.top,
                        height: selectedRect.height,
                        opacity: 0,
                        transition: {
                          ...spring.moderate,
                          opacity: { duration: spring.fast.exit.duration },
                        },
                      }
                    : { opacity: 0, transition: spring.fast.exit }
                }
                transition={{
                  ...spring.fast,
                  opacity: { duration: spring.fast.duration },
                }}
              />
            )}
          </AnimatePresence>

          {/* Focus ring */}
          <AnimatePresence>
            {focusRect && (
              <motion.div
                className={cn(
                  "absolute pointer-events-none z-raised outline outline-1 outline-focus-ring outline-offset-2",
                  "rounded-lg"
                )}
                initial={false}
                animate={{
                  left: focusRect.left,
                  top: focusRect.top,
                  width: focusRect.width,
                  height: focusRect.height,
                }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={{
                  ...spring.fast,
                  opacity: { duration: spring.fast.duration },
                }}
              />
            )}
          </AnimatePresence>

          {indexedChildren}
        </TabsPrimitive.List>
      </TabsListContext.Provider>
    );
  }
);

TabsList.displayName = "TabsList";

/* ─────────────────────── TabItem ─────────────────────── */

interface TabItemProps
  extends ComponentPropsWithoutRef<typeof TabsPrimitive.Tab> {
  value: string;
  icon?: IconComponent;
  label: string;
  /** A number, text, Badge element, or Badge props shown after the label. */
  badge?: TabBadge;
  /** @internal Auto-assigned by TabsList. */
  _index?: number;
}

const TabItem = forwardRef<HTMLButtonElement, TabItemProps>(
  ({ value, icon: Icon, label, badge, _index = 0, className, onClick, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const {
      registerTab,
      hoveredIndex,
      selectedValue,
      setOptimisticIdx,
      variant,
      color,
      labelVisibility,
    } = useTabsList();

    useEffect(() => {
      registerTab(_index, value, internalRef.current);
      return () => registerTab(_index, value, null);
    }, [_index, value, registerTab]);

    const isSelected = selectedValue === value;
    const isActive = hoveredIndex === _index || isSelected;
    const collapseLabel = labelVisibility === "active" && !!Icon;
    const showLabel = !collapseLabel || isSelected;
    const badgeContent = badge == null
      ? null
      : isTabBadgeProps(badge)
        ? <Badge size="sm" {...badge} />
        : <Badge size="sm">{badge}</Badge>;

    const labelContent = (
      <span className="inline-grid text-body whitespace-nowrap">
        <span
          className="col-start-1 row-start-1 invisible font-semibold"
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 transition-[color,font-weight] duration-fast motion-reduce:transition-none",
            isSelected && variant !== "underline"
              ? color === "neutral"
                ? "text-fg-on-inverse"
                : "text-fg-on-brand"
              : isActive
                ? "text-fg-default"
                : "text-fg-muted",
            isSelected ? "font-semibold" : "font-normal"
          )}
        >
          {label}
        </span>
      </span>
    );

    return (
      <TabsPrimitive.Tab
        // Composed (not spread-overridable): a consumer onClick must not
        // replace the optimistic indicator jump.
        onClick={(e) => {
          setOptimisticIdx(_index);
          onClick?.(e);
        }}
        ref={(node) => {
          (
            internalRef as React.MutableRefObject<HTMLElement | null>
          ).current = node as HTMLButtonElement | null;
          if (typeof ref === "function") ref(node as HTMLButtonElement);
          else if (ref)
            (
              ref as React.MutableRefObject<HTMLButtonElement | null>
            ).current = node as HTMLButtonElement | null;
        }}
        value={value}
        data-proximity-index={_index}
        aria-label={collapseLabel && !showLabel ? label : undefined}
        className={cn(
          // Fixed heights keep every tab variant aligned and easy to target.
          "relative z-content flex items-center cursor-pointer bg-transparent border-none outline-none",
          badge == null ? "px-3" : "pl-3 pr-1.5",
          variant === "pill" && [
            "h-control-md",
            collapseLabel ? "gap-0" : "gap-2",
          ],
          variant === "segment" && [
            "h-control-md",
            collapseLabel ? "gap-0" : "gap-2",
            "rounded-lg",
          ],
          variant === "underline" && [
            "h-control-lg",
            collapseLabel ? "gap-0" : "gap-2",
          ],
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={16}
            strokeWidth={isActive ? 2 : 1.5}
            className={cn(
              "transition-[color,stroke-width] duration-fast",
              isSelected && variant !== "underline"
                ? color === "neutral"
                  ? "text-fg-on-inverse"
                  : "text-fg-on-brand"
                : isActive
                  ? "text-fg-default"
                  : "text-fg-muted"
            )}
          />
        )}
        {collapseLabel ? (
          <AnimatePresence initial={false}>
            {showLabel && (
              <motion.span
                key="label"
                className="overflow-hidden"
                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                transition={{ ...spring.fast, opacity: { duration: spring.fast.exit.duration } }}
              >
                {labelContent}
              </motion.span>
            )}
          </AnimatePresence>
        ) : (
          labelContent
        )}
        {badgeContent}
      </TabsPrimitive.Tab>
    );
  }
);

TabItem.displayName = "TabItem";

/* ─────────────────────── TabPanel ─────────────────────── */

interface TabPanelProps
  extends ComponentPropsWithoutRef<typeof TabsPrimitive.Panel> {
  value: string;
}

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ className, ...props }, ref) => {
    return (
      <TabsPrimitive.Panel
        ref={ref}
        className={cn("outline-none", className)}
        {...props}
      />
    );
  }
);

TabPanel.displayName = "TabPanel";

export { Tabs, TabsList, TabItem, TabPanel };
export type { TabsProps, TabsListProps, TabItemProps, TabPanelProps };
