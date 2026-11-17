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
  isValidElement,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
  type CSSProperties,
} from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useDirection } from "@base-ui/react/direction-provider";
import { motion, AnimatePresence } from "motion/react";
import { useIcon, type IconComponent } from "#system/icon-context";
import { cn } from "#system/utils";
import { useComposedRefs } from "#system/compose-refs";
import { spring } from "#system/springs";
import { useProximityHover } from "#hooks/use-proximity-hover";
import { Badge, type BadgeProps } from "#components/badge";
import { Button } from "#components/button";

/* ─────────────────────── Contexts ─────────────────────── */

interface TabsValueOrderContextValue {
  valueOrder: readonly string[];
  setValueOrder: (order: string[]) => void;
  selectedValue: string | undefined;
  variant: TabsVariant;
  color: TabsColor;
}

const TabsValueOrderContext = createContext<TabsValueOrderContextValue | null>(null);

interface TabsListContextValue {
  registerTab: (value: string, element: HTMLElement | null) => void;
  valueOrder: readonly string[];
  hoveredIndex: number | null;
  selectedValue: string | undefined;
  setOptimisticValue: (value: string) => void;
  variant: TabsVariant;
  color: TabsColor;
  labelVisibility: TabLabelVisibility;
}

const TabsListContext = createContext<TabsListContextValue | null>(null);
const emptyTabOrder: readonly string[] = [];

function useTabsList() {
  const ctx = useContext(TabsListContext);
  if (!ctx) throw new Error("TabItem must be used within a TabsList");
  return ctx;
}

export type TabsVariant = "pill" | "segment" | "underline";
export type TabsColor = "brand" | "neutral" | "default";
export type TabLabelVisibility = "all" | "active";

const selectedSurfaceClasses: Record<TabsColor, string> = {
  brand: "bg-brand",
  neutral: "bg-inverse-background",
  default: "border-hairline border-border bg-surface-floating",
};

const underlineIndicatorClasses: Record<TabsColor, string> = {
  brand: "bg-brand",
  neutral: "bg-inverse-background",
  // Underline keeps its linear geometry while using the default foreground tone.
  default: "bg-fg-default",
};

const selectedForegroundClasses: Record<TabsColor, string> = {
  brand: "text-fg-on-primary-action",
  neutral: "text-fg-on-inverse",
  default: "text-fg-default",
};

/**
 * A compact Badge configuration for a TabItem. Pass a number or text for the
 * default badge, or use the complete Badge API for color and status badges.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type TabBadgeProps = DistributiveOmit<BadgeProps, "children"> & {
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
  /** Visual treatment for the selected tab. Defaults to the current brand color. */
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
    const [valueOrder, setValueOrder] = useState<readonly string[]>(emptyTabOrder);
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

    // Keep a surviving uncontrolled selection through reorders. Commit the
    // fallback on removal so inserting the old tab again does not select it.
    const uncontrolledSelection =
      uncontrolledValue !== undefined && (valueOrder.length === 0 || valueOrder.includes(uncontrolledValue))
        ? uncontrolledValue
        : valueOrder[0];
    useLayoutEffect(() => {
      if (value === undefined && selectedIndex == null) {
        setUncontrolledValue(uncontrolledSelection);
      }
    }, [selectedIndex, uncontrolledSelection, value]);

    const resolvedValue =
      value ??
      (selectedIndex != null
        ? valueOrder[selectedIndex]
        : uncontrolledSelection);

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
          value flips undefined → defined. The list discovers its order at
          commit time, so use null when no registered tab is selected yet.
        */}
        <TabsPrimitive.Root
          ref={ref}
          value={resolvedValue ?? null}
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
  ({ children, className, labelVisibility, activeLabel, activationMode, activateOnFocus, loopFocus = true, onKeyDown, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useComposedRefs(ref, containerRef);
    const direction = useDirection();
    const isMouseInside = useRef(false);
    const valueOrderCtx = useContext(TabsValueOrderContext);
    const variant = valueOrderCtx?.variant ?? "pill";
    const color = valueOrderCtx?.color ?? "brand";
    const resolvedLabelVisibility = labelVisibility ?? (activeLabel ? "active" : "all");
    const [optimisticValue, setOptimisticValue] = useState<string | null>(null);

    const values = valueOrderCtx?.valueOrder ?? emptyTabOrder;
    const setValueOrder = valueOrderCtx?.setValueOrder;

    const {
      activeIndex: pointerIndex,
      setActiveIndex: setHoveredIndex,
      itemRects,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef, { axis: "x" });
    const tabElements = useRef(new Map<string, HTMLElement>());
    const orderedTabs = useRef<[string, HTMLElement][] | null>(null);

    const resizeObserver = useRef<ResizeObserver | null>(null);
    const syncTabOrder = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const next = [...tabElements.current].filter(([, element]) => container.contains(element))
        .sort(([, a], [, b]) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      const previous = orderedTabs.current;
      if (previous?.length === next.length && next.every(([value, node], index) =>
        value === previous[index][0] && node === previous[index][1])) return;

      orderedTabs.current = next;
      for (let index = 0; index < Math.max(next.length, previous?.length ?? 0); index++) {
        const element = next[index]?.[1];
        if (element !== previous?.[index]?.[1]) registerItem(index, element ?? null);
      }
      resizeObserver.current?.disconnect();
      next.forEach(([, element]) => resizeObserver.current?.observe(element));
      measureItems();
      setValueOrder?.(next.map(([value]) => value));
    }, [measureItems, registerItem, setValueOrder]);

    const registrationPending = useRef(false);
    const registerTab = useCallback((value: string, element: HTMLElement | null) => {
      if (element) tabElements.current.set(value, element);
      else tabElements.current.delete(value);
      if (registrationPending.current) return;
      registrationPending.current = true;
      queueMicrotask(() => {
        registrationPending.current = false;
        syncTabOrder();
      });
    }, [syncTabOrder]);

    useLayoutEffect(() => {
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver.current = new ResizeObserver(measureItems);
        orderedTabs.current?.forEach(([, element]) => resizeObserver.current?.observe(element));
      }
      const container = containerRef.current;
      // Moving keyed wrappers can reorder tabs without detaching their refs.
      const observer = new MutationObserver(syncTabOrder);
      if (container) observer.observe(container, { childList: true, subtree: true });
      return () => {
        observer.disconnect();
        resizeObserver.current?.disconnect();
        resizeObserver.current = null;
      };
    }, [measureItems, syncTabOrder]);

    useLayoutEffect(syncTabOrder, [children, syncTabOrder]);

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

    const [focusedValue, setFocusedValue] = useState<string | null>(null);
    const focusedIndex = focusedValue === null ? -1 : values.indexOf(focusedValue);
    const hoveredIndex = !isMouseInside.current && focusedIndex >= 0 ? focusedIndex : pointerIndex;
    const selectedValue = valueOrderCtx?.selectedValue;
    useEffect(() => {
      // A controlled host can reject or defer a click. Reconcile that request
      // even when the accepted selection has not changed.
      if (optimisticValue !== null) setOptimisticValue(null);
    }, [optimisticValue]);

    const indicatorValue = optimisticValue ?? selectedValue;
    const activeSelectedIdx = indicatorValue === undefined ? -1 : values.indexOf(indicatorValue);
    const selectedRect = activeSelectedIdx >= 0 ? itemRects[activeSelectedIdx] : null;
    const hoverRect = hoveredIndex !== null ? itemRects[hoveredIndex] : null;
    const focusRect = focusedIndex >= 0 ? itemRects[focusedIndex] : null;
    const isHoveringSelected = hoveredIndex === activeSelectedIdx;
    const isHovering = hoveredIndex !== null && !isHoveringSelected;

    const handleKeyDown: NonNullable<TabsListProps["onKeyDown"]> = (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.baseUIHandlerPrevented ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const vertical = event.currentTarget.getAttribute("aria-orientation") === "vertical";
      const forward = vertical ? "ArrowDown" : direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const backward = vertical ? "ArrowUp" : direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      if (![forward, backward, "Home", "End"].includes(event.key)) return;

      // Base UI watches each trigger's direct parent. Use our subtree order
      // for movement when those parents themselves can move.
      const tabs = orderedTabs.current ?? [];
      const index = tabs.findIndex(([, element]) => element.contains(event.target as Node));
      if (index < 0) return;
      event.preventBaseUIHandler();
      let nextIndex = event.key === "Home" ? 0
        : event.key === "End" ? tabs.length - 1
        : index + (event.key === forward ? 1 : -1);
      if (loopFocus) nextIndex = (nextIndex + tabs.length) % tabs.length;
      const next = tabs[nextIndex]?.[1];
      if (!next || nextIndex === index) return;
      event.preventDefault();
      event.stopPropagation();
      const trigger = next.matches('[role="tab"]') ? next : next.querySelector<HTMLElement>('[role="tab"]');
      trigger?.focus();
    };

    return (
      <TabsListContext.Provider
        value={{
          registerTab,
          valueOrder: values,
          hoveredIndex,
          selectedValue,
          setOptimisticValue,
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
          ref={listRef}
          loopFocus={loopFocus}
          onKeyDown={handleKeyDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onFocus={(e) => {
            const trigger = (e.target as HTMLElement).closest('[role="tab"]');
            if (!trigger) return;
            const indexAttr = trigger.getAttribute("data-proximity-index");
            if (indexAttr != null) {
              const idx = Number(indexAttr);
              setHoveredIndex(idx);
              setFocusedValue(
                (e.target as HTMLElement).matches(":focus-visible") ? values[idx] ?? null : null
              );
            }
          }}
          onBlur={(e) => {
            if (containerRef.current?.contains(e.relatedTarget as Node)) return;
            setFocusedValue(null);
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
              data-slot="tabs-selection-indicator"
              className={cn(
                "absolute pointer-events-none",
                variant === "underline"
                  ? underlineIndicatorClasses[color]
                  : selectedSurfaceClasses[color],
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
                data-slot="tabs-hover-indicator"
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
                data-slot="tabs-focus-indicator"
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

          {children}
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
  /** Decorative content before the label, such as a status marker. Takes precedence over icon. */
  leading?: ReactNode;
  label: string;
  /** A number, text, Badge element, or Badge props shown after the label. */
  badge?: TabBadge;
  /** Optional close action, rendered as a sibling button rather than inside the tab. */
  onClose?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Accessible name for the close action. Localize when onClose is supplied. */
  closeLabel?: string;
  /** Controls the close button without changing the tab's outer element. */
  closeVisibility?: "auto" | "always" | "hidden";
  /** Classes for the outer wrapper of a closable tab. */
  wrapperClassName?: string;
  /** Inline layout values for the outer wrapper of a closable tab. */
  wrapperStyle?: CSSProperties;
}

const TabItem = forwardRef<HTMLButtonElement, TabItemProps>(
  ({ value, icon: Icon, leading, label, badge, onClose, closeLabel = `Close ${label}`, closeVisibility = "auto", wrapperClassName, wrapperStyle, className, onClick, ...props }, ref) => {
    const closable = onClose !== undefined;
    const Close = useIcon("x");
    const {
      registerTab,
      valueOrder,
      hoveredIndex,
      selectedValue,
      setOptimisticValue,
      variant,
      color,
      labelVisibility,
    } = useTabsList();

    const registerElement = useCallback((element: HTMLElement | null) => {
      registerTab(value, element);
    }, [registerTab, value]);
    const triggerRef = useComposedRefs(ref, closable ? undefined : registerElement);
    const index = valueOrder.indexOf(value);

    const isSelected = selectedValue === value;
    const isActive = hoveredIndex === index || isSelected;
    const collapseLabel = labelVisibility === "active" && !!Icon && leading == null;
    const showLabel = !collapseLabel || isSelected;
    const badgeContent = badge == null
      ? null
      : isTabBadgeProps(badge)
        ? <Badge size="sm" {...badge} />
        : <Badge size="sm">{badge}</Badge>;

    // The pseudo-element reserves the semibold width without creating a
    // second DOM text node. A hidden DOM copy makes getByText(label)
    // ambiguous even when it is aria-hidden.
    const labelContent = (
      <span
        data-label={label}
        className="inline-grid min-w-0 text-body whitespace-nowrap after:pointer-events-none after:col-start-1 after:row-start-1 after:invisible after:truncate after:font-semibold after:content-[attr(data-label)]"
      >
        <span
          className={cn(
            "col-start-1 row-start-1 truncate transition-[color,font-weight] duration-fast motion-reduce:transition-none",
            isSelected && variant !== "underline"
              ? selectedForegroundClasses[color]
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

    const trigger = (
      <TabsPrimitive.Tab
        // Composed (not spread-overridable): a consumer onClick must not
        // replace the optimistic indicator jump.
        onClick={(e) => {
          setOptimisticValue(value);
          onClick?.(e);
        }}
        ref={triggerRef}
        value={value}
        data-proximity-index={index >= 0 ? index : undefined}
        aria-label={collapseLabel && !showLabel ? label : undefined}
        className={cn(
          // Fixed heights keep every tab variant aligned and easy to target.
          "relative z-content flex items-center cursor-pointer bg-transparent border-none outline-none",
          onClose && "min-w-0 flex-1",
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
        {leading ?? (Icon && (
          <Icon
            size={16}
            strokeWidth={isActive ? 2 : 1.5}
            className={cn(
              "shrink-0 transition-[color,stroke-width] duration-fast",
              isSelected && variant !== "underline"
                ? selectedForegroundClasses[color]
                : isActive
                  ? "text-fg-default"
                  : "text-fg-muted"
            )}
          />
        ))}
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
    if (!onClose) return trigger;
    return <div ref={registerElement} data-slot="closable-tab" data-proximity-index={index >= 0 ? index : undefined} className={cn("group/closable-tab relative z-content flex min-w-0 max-w-64 items-center", closeVisibility !== "hidden" && "pr-1", wrapperClassName)} style={wrapperStyle}>
      {trigger}
      {closeVisibility !== "hidden" && <span className={cn("shrink-0 transition-opacity duration-fast motion-reduce:transition-none", closeVisibility === "auto" && !isSelected && "opacity-0 group-hover/closable-tab:opacity-100 group-focus-within/closable-tab:opacity-100 pointer-coarse:opacity-100")}>
        <Button type="button" size="xs" variant="ghost" iconOnly tabIndex={isSelected ? 0 : -1} aria-label={closeLabel} disabled={props.disabled === true}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => { event.stopPropagation(); onClose(event); }}><Close /></Button>
      </span>}
    </div>;
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
