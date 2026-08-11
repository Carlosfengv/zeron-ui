"use client";

import {
  Children,
  useRef,
  useState,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  isValidElement,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { useShape } from "@/lib/shape-context";

export type RadioGroupItemProps = RadioPrimitive.Root.Props;

/** Atomic radio control shared by simple groups and enhanced RadioItem rows. */
function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <RadioPrimitive.Root
      className={cn(
        "peer relative inline-flex size-5 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-full border border-input bg-transparent p-0 outline-none transition-[border-color,box-shadow,opacity,transform] duration-moderate active:scale-[.92] motion-reduce:active:scale-100",
        "data-unchecked:hover:border-input-hover",
        "data-checked:border-brand",
        "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
        "aria-invalid:border-danger-border aria-invalid:ring-1 aria-invalid:ring-danger-border/30",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      data-slot="radio-group-item"
      {...props}
    >
      <RadioPrimitive.Indicator
        className="pointer-events-none absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-moderate data-starting-style:scale-50 data-starting-style:opacity-0 data-ending-style:scale-50 data-ending-style:opacity-0"
        data-slot="radio-group-indicator"
      >
        <motion.span
          animate={{ opacity: 1, scale: 1 }}
          className="size-2.5 rounded-full bg-brand"
          initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
          transition={reduceMotion ? { duration: 0 } : spring.fast}
        />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

interface RadioGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  disabled: boolean;
  readOnly: boolean;
  selectedIndex: number | null;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  /** Whether any item in the group is currently selected. Drives the roving
   *  tabindex fallback: with no selection, the first item must stay tabbable
   *  or the whole group becomes unreachable by keyboard. */
  hasSelection: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext() {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error("useRadioGroup must be used within a RadioGroup");
  return ctx;
}

interface RadioGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onSelect"> {
  children: ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  form?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  name?: string;
  readOnly?: boolean;
  required?: boolean;
  selectedIndex?: number;
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      children,
      className,
      defaultValue,
      disabled,
      form,
      inputRef,
      name,
      onValueChange,
      readOnly,
      required,
      selectedIndex,
      value,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const childElements = Children.toArray(children).filter(isValidElement);
    const childValues = childElements.map(
      (child) => (child.props as { value?: string }).value
    );
    const selectedChildIndex = childElements.findIndex(
      (child) => (child.props as { selected?: boolean }).selected === true
    );
    const enhancedMode = childElements.some(
      (child) => (child.props as { index?: number }).index !== undefined
    );
    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef);

    useEffect(() => {
      measureItems();
    }, [measureItems, children]);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const resolvedSelectedIndex =
      value !== undefined
        ? childValues.findIndex((childValue) => childValue === value)
        : selectedIndex ?? selectedChildIndex;
    const hasSelection = resolvedSelectedIndex >= 0;
    const primitiveValue =
      value ??
      (resolvedSelectedIndex >= 0
        ? `__zeron-radio-index-${resolvedSelectedIndex}`
        : undefined);

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    const selectedRect =
      resolvedSelectedIndex >= 0 ? itemRects[resolvedSelectedIndex] : null;
    const shape = useShape();

    const content = (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        onMouseEnter={handlers.onMouseEnter}
        onMouseMove={handlers.onMouseMove}
        onMouseLeave={handlers.onMouseLeave}
        onFocus={(e) => {
          const indexAttr = (e.target as HTMLElement)
            .closest("[data-proximity-index]")
            ?.getAttribute("data-proximity-index");
          if (indexAttr != null) {
            const idx = Number(indexAttr);
            setActiveIndex(idx);
            setFocusedIndex(
              (e.target as HTMLElement).matches(":focus-visible") ? idx : null
            );
          }
        }}
        onBlur={(e) => {
          if (containerRef.current?.contains(e.relatedTarget as Node)) return;
          setFocusedIndex(null);
          setActiveIndex(null);
        }}
        onKeyDown={(e) => {
          // Scope to row wrappers only. The hidden radio primitive also
          // carries role="radio", so a bare [role="radio"] selector matches
          // twice per row and arrows land on the invisible control.
          const items = Array.from(
            containerRef.current?.querySelectorAll("[data-proximity-index]") ?? []
          ) as HTMLElement[];
          const currentIdx = items.indexOf(e.target as HTMLElement);
          if (currentIdx === -1) return;

          // In value mode this handler is merged with Base UI RadioGroup's
          // composite onto the same element; suppress the composite's own
          // roving focus (it targets the hidden sr-only radios).
          const preventBaseUI = (
            e as unknown as { preventBaseUIHandler?: () => void }
          ).preventBaseUIHandler;

          if (["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) {
            e.preventDefault();
            preventBaseUI?.();
            const next = ["ArrowDown", "ArrowRight"].includes(e.key)
              ? (currentIdx + 1) % items.length
              : (currentIdx - 1 + items.length) % items.length;
            items[next].focus();
            items[next].click();
          } else if (e.key === "Home") {
            e.preventDefault();
            preventBaseUI?.();
            items[0]?.focus();
            items[0]?.click();
          } else if (e.key === "End") {
            e.preventDefault();
            preventBaseUI?.();
            items[items.length - 1]?.focus();
            items[items.length - 1]?.click();
          }
        }}
          role="radiogroup"
          className={cn(
            enhancedMode
              ? "relative flex w-72 max-w-full flex-col select-none"
              : "grid gap-3",
            className
          )}
        {...props}
      >
        {/* Selected background */}
        {selectedRect && (
          <motion.div
            className={`absolute ${shape.bg} bg-selection pointer-events-none`}
            initial={false}
            animate={{
              top: selectedRect.top,
              left: selectedRect.left,
              width: selectedRect.width,
              height: selectedRect.height,
              opacity: 1,
            }}
            transition={{
              ...spring.moderate,
              opacity: { duration: spring.fast.duration },
            }}
          />
        )}

        {/* Hover background */}
        <AnimatePresence>
          {activeRect && (
            <motion.div
              key={sessionRef.current}
              className={`absolute ${shape.bg} bg-hover pointer-events-none`}
              initial={{
                opacity: 0,
                top: activeRect.top,
                left: activeRect.left,
                width: activeRect.width,
                height: activeRect.height,
              }}
              animate={{
                opacity: 1,
                top: activeRect.top,
                left: activeRect.left,
                width: activeRect.width,
                height: activeRect.height,
              }}
              exit={{ opacity: 0, transition: spring.fast.exit }}
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
              className={`absolute ${shape.focusRing} pointer-events-none z-raised border border-focus-ring`}
              initial={false}
              animate={{
                left: focusRect.left - 2,
                top: focusRect.top - 2,
                width: focusRect.width + 4,
                height: focusRect.height + 4,
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
      </div>
    );

    return (
      <RadioGroupContext.Provider
        value={{
          registerItem,
          activeIndex,
          disabled: disabled ?? false,
          readOnly: readOnly ?? false,
          selectedIndex:
            resolvedSelectedIndex >= 0 ? resolvedSelectedIndex : null,
          selectedValue: value,
          onValueChange,
          hasSelection,
        }}
      >
        <RadioGroupPrimitive
          defaultValue={value === undefined ? defaultValue : undefined}
          disabled={disabled}
          form={form}
          inputRef={inputRef}
          name={name}
          onValueChange={(nextValue) => onValueChange?.(nextValue as string)}
          readOnly={readOnly}
          render={content}
          required={required}
          value={primitiveValue}
        />
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

interface RadioItemProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  index: number;
  selected?: boolean;
  onSelect?: () => void;
  value?: string;
}

const RadioItem = forwardRef<HTMLDivElement, RadioItemProps>(
  ({ label, index, selected, onSelect, value, className, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const {
      registerItem,
      activeIndex,
      disabled,
      readOnly,
      selectedIndex,
      selectedValue,
      onValueChange,
      hasSelection,
    } = useRadioGroupContext();

    useEffect(() => {
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    const isActive = activeIndex === index;
    const shape = useShape();
    const isSelected =
      value !== undefined && selectedValue !== undefined
        ? selectedValue === value
        : selected ?? selectedIndex === index;

    const handleSelect = () => {
      if (disabled || readOnly) return;
      if (value !== undefined) {
        onValueChange?.(value);
      }
      onSelect?.();
    };
    const radioValue = value ?? `__zeron-radio-index-${index}`;

    return (
      <div
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-proximity-index={index}
        // Roving tabindex: selected item is the tab stop; with no selection the
        // first item takes it so the group stays keyboard-reachable.
        tabIndex={disabled ? -1 : isSelected ? 0 : !hasSelection && index === 0 ? 0 : -1}
        role="radio"
        aria-checked={isSelected}
        aria-disabled={disabled || undefined}
        aria-label={label}
        aria-readonly={readOnly || undefined}
        onClick={handleSelect}
        onMouseDown={(e) => {
          // Clicking the 15px radio circle would natively focus the hidden
          // primitive (nearest focusable ancestor of the click target), after
          // which arrow-key nav dead-zones: the group keydown handler can't
          // find the target among the row wrappers. Prevent the native focus
          // move (click still fires) and land focus on the row instead. Skip
          // genuinely interactive children so we don't hijack their focus.
          const interactive = (e.target as HTMLElement).closest(
            'button:not([tabindex="-1"]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (interactive && interactive !== e.currentTarget) return;
          e.preventDefault();
          e.currentTarget.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            handleSelect();
          }
        }}
        className={cn(
          // Fixed height keeps every option row aligned and easy to target.
          `relative z-content flex h-control-sm items-center gap-2.5 ${shape.item} px-3 cursor-pointer outline-none`,
          disabled && "pointer-events-none opacity-50",
          readOnly && "cursor-default",
          className
        )}
        {...props}
      >
        <RadioGroupItem
          aria-hidden
          className={cn(
            "pointer-events-none",
            !isSelected &&
              isActive &&
              "border-input-hover"
          )}
          tabIndex={-1}
          value={radioValue}
        />

        {/* The invisible bold copy reserves width so weight changes do not reflow. */}
        <span className="inline-grid text-body">
          <span
            className="col-start-1 row-start-1 invisible font-semibold"
            aria-hidden="true"
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[color,font-weight] duration-fast motion-reduce:transition-none",
              isSelected || isActive
                ? "text-fg-default"
                : "text-fg-muted",
              isSelected ? "font-semibold" : "font-normal"
            )}
          >
            {label}
          </span>
        </span>

      </div>
    );
  }
);

RadioItem.displayName = "RadioItem";

export { RadioGroup, RadioGroupItem, RadioItem };
export default RadioGroup;
