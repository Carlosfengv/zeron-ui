"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { cva } from "class-variance-authority";
import type { IconComponent } from "#system/icon-context";
import { cn } from "#system/utils";
import { Elevated } from "#system/elevated";
import { usePortalContainer } from "#system/portal-container-context";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "#components/input-group";
import { Button } from "#components/button";
import {
  controlFieldPaddingClasses,
  controlSizeClasses,
  controlSizeRecipe,
  type ControlSize,
} from "#tokens/control-size";

export type ComboboxItemDensity = "compact" | "regular" | "comfortable";
export type ComboboxInputVariant = "outline" | "secondary" | "ghost";

interface ComboboxVisualContextValue {
  itemDensity: ComboboxItemDensity;
  size: ControlSize;
}

const ComboboxVisualContext = createContext<ComboboxVisualContextValue | null>(
  null
);

function useComboboxVisualContext() {
  return useContext(ComboboxVisualContext) ?? {
    itemDensity: "regular" as const,
    size: "md" as const,
  };
}

export type ComboboxProps<
  Value,
  Multiple extends boolean | undefined = false,
> = ComboboxPrimitive.Root.Props<Value, Multiple> & {
  /** Height, padding, text size, and icon size of the input or trigger. */
  size?: ControlSize;
  /** Option density is independent from the outer control size. */
  itemDensity?: ComboboxItemDensity;
};

function Combobox<
  Value,
  Multiple extends boolean | undefined = false,
>({
  size = "md",
  itemDensity = "regular",
  ...props
}: ComboboxProps<Value, Multiple>) {
  return (
    <ComboboxVisualContext.Provider value={{ itemDensity, size }}>
      <ComboboxPrimitive.Root {...props} />
    </ComboboxVisualContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Shared icons
// ---------------------------------------------------------------------------

function ChevronDownIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CloseIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Input and clear action
// ---------------------------------------------------------------------------

export interface ComboboxClearProps
  extends Omit<ComboboxPrimitive.Clear.Props, "className"> {
  className?: string;
}

const ComboboxClear = forwardRef<HTMLButtonElement, ComboboxClearProps>(
  (
    {
      "aria-label": ariaLabel,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const { size } = useComboboxVisualContext();
    const iconSize = controlSizeRecipe[size].icon;

    return (
      <ComboboxPrimitive.Clear
        ref={ref}
        aria-label={ariaLabel ?? (children == null ? "Clear selection" : undefined)}
        className={className}
        data-slot="combobox-clear"
        render={<InputGroupButton iconOnly type="button" />}
        {...props}
      >
        {children ?? <CloseIcon size={iconSize} />}
      </ComboboxPrimitive.Clear>
    );
  }
);

ComboboxClear.displayName = "ComboboxClear";

const comboboxInputGroupVariants: Record<ComboboxInputVariant, string> = {
  outline: "",
  secondary:
    "border-transparent bg-emphasis shadow-none hover:border-transparent hover:bg-secondary-action-hover",
  ghost:
    "border-transparent bg-transparent shadow-none hover:border-transparent hover:bg-hover",
};

export interface ComboboxInputProps
  extends Omit<ComboboxPrimitive.Input.Props, "className"> {
  /** Classes applied to the visible InputGroup frame. */
  className?: string;
  /** Classes applied to the native input control. */
  inputClassName?: string;
  /** Optional addons rendered inside the InputGroup. */
  children?: ReactNode;
  showTrigger?: boolean;
  showClear?: boolean;
  triggerAriaLabel?: string;
  clearAriaLabel?: string;
  variant?: ComboboxInputVariant;
}

const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(
  (
    {
      className,
      inputClassName,
      children,
      clearAriaLabel = "Clear selection",
      disabled = false,
      showClear = false,
      showTrigger = true,
      triggerAriaLabel = "Open options",
      variant = "outline",
      render,
      ...props
    },
    ref
  ) => {
    const { size } = useComboboxVisualContext();
    const iconSize = controlSizeRecipe[size].icon;

    return (
      <InputGroup
        size={size}
        className={cn(comboboxInputGroupVariants[variant], className)}
        data-slot="combobox-input"
        data-variant={variant}
      >
        <ComboboxPrimitive.Input
          ref={ref}
          disabled={disabled}
          render={render ?? (
            <InputGroupInput
              className={inputClassName}
              data-slot="combobox-input-control"
              disabled={disabled}
            />
          )}
          {...props}
        />

        {(showTrigger || showClear) && (
          <InputGroupAddon align="inline-end" className="gap-0.5 pl-0">
            {showTrigger && (
              <ComboboxPrimitive.Trigger
                aria-label={triggerAriaLabel}
                data-slot="combobox-input-trigger"
                disabled={disabled}
                render={
                  <InputGroupButton
                    className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
                    iconOnly
                    type="button"
                  />
                }
              >
                <ChevronDownIcon size={iconSize} />
              </ComboboxPrimitive.Trigger>
            )}

            {showClear && (
              <ComboboxClear
                aria-label={clearAriaLabel}
                disabled={disabled}
              />
            )}
          </InputGroupAddon>
        )}

        {children}
      </InputGroup>
    );
  }
);

ComboboxInput.displayName = "ComboboxInput";

// ---------------------------------------------------------------------------
// Trigger and value (input-inside-popup composition)
// ---------------------------------------------------------------------------

const comboboxTriggerVariants = cva(
  [
    "group inline-flex min-w-[160px] items-center justify-between outline-none cursor-pointer",
    "transition-[background-color,border-color,box-shadow,color] duration-fast",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:ring-1 focus-visible:ring-focus-ring",
  ],
  {
    variants: {
      variant: {
        bordered:
          "border border-input bg-transparent text-fg-default shadow-control hover:border-input-hover hover:bg-hover",
        borderless:
          "border border-transparent bg-transparent text-fg-default hover:bg-hover",
      },
      size: {
        xs: cn(
          controlSizeClasses.xs,
          controlFieldPaddingClasses.xs,
          "gap-1 text-label"
        ),
        sm: cn(
          controlSizeClasses.sm,
          controlFieldPaddingClasses.sm,
          "gap-1 text-label"
        ),
        md: cn(
          controlSizeClasses.md,
          controlFieldPaddingClasses.md,
          "gap-1.5 text-body"
        ),
        lg: cn(
          controlSizeClasses.lg,
          controlFieldPaddingClasses.lg,
          "gap-1.5 text-body"
        ),
        xl: cn(
          controlSizeClasses.xl,
          controlFieldPaddingClasses.xl,
          "gap-2 text-body"
        ),
      },
    },
    defaultVariants: {
      variant: "bordered",
      size: "md",
    },
  }
);

export interface ComboboxTriggerProps
  extends Omit<ComboboxPrimitive.Trigger.Props, "className"> {
  className?: string;
  showIcon?: boolean;
  variant?: "bordered" | "borderless";
}

const ComboboxTrigger = forwardRef<HTMLButtonElement, ComboboxTriggerProps>(
  (
    {
      className,
      children,
      showIcon = true,
      variant = "bordered",
      ...props
    },
    ref
  ) => {
    const { size } = useComboboxVisualContext();
    const iconSize = controlSizeRecipe[size].icon;

    return (
      <ComboboxPrimitive.Trigger
        ref={ref}
        className={cn(
          comboboxTriggerVariants({ size, variant }),
          "rounded-lg",
          className
        )}
        data-size={size}
        data-slot="combobox-trigger"
        data-variant={variant}
        {...props}
      >
        <span className="min-w-0 flex-1 truncate text-left">{children}</span>
        {showIcon && (
          <span className="shrink-0 text-fg-subtle transition-transform duration-fast group-data-[popup-open]:rotate-180">
            <ChevronDownIcon size={iconSize} />
          </span>
        )}
      </ComboboxPrimitive.Trigger>
    );
  }
);

ComboboxTrigger.displayName = "ComboboxTrigger";

function ComboboxValue(props: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value {...props} />;
}

// ---------------------------------------------------------------------------
// Popup
// ---------------------------------------------------------------------------

type ComboboxPositionerProps = ComponentProps<
  typeof ComboboxPrimitive.Positioner
>;

export interface ComboboxContentProps
  extends Omit<
      ComboboxPrimitive.Popup.Props,
      "className"
    >,
    Pick<
      ComboboxPositionerProps,
      | "align"
      | "alignOffset"
      | "anchor"
      | "collisionBoundary"
      | "collisionPadding"
      | "side"
      | "sideOffset"
    > {
  className?: string;
  surfaceClassName?: string;
  /** Portal target override for embedded previews and bounded canvases. */
  container?: HTMLElement | null;
}

const ComboboxContent = forwardRef<HTMLDivElement, ComboboxContentProps>(
  (
    {
      align = "start",
      alignOffset = 0,
      anchor,
      className,
      collisionBoundary,
      collisionPadding = 12,
      container,
      render,
      side = "bottom",
      sideOffset = 6,
      surfaceClassName,
      ...props
    },
    ref
  ) => {
    const portalContainer = usePortalContainer();

    return (
      <ComboboxPrimitive.Portal
        container={container ?? portalContainer ?? undefined}
      >
        <ComboboxPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          collisionBoundary={collisionBoundary}
          collisionPadding={collisionPadding}
          side={side}
          sideOffset={sideOffset}
          className="isolate z-popover outline-none"
        >
          <ComboboxPrimitive.Popup
            ref={ref}
            data-chips={Boolean(anchor) || undefined}
            data-slot="combobox-content"
            render={render ?? <Elevated surface="floating" shadow="floating" />}
            className={cn(
              "relative flex max-h-[min(320px,var(--available-height))] w-[var(--anchor-width)] min-w-[160px] max-w-[min(92vw,24rem)] flex-col overflow-hidden rounded-xl p-1 text-body text-fg-default outline-none",
              "origin-[var(--transform-origin)] transition-[opacity,transform] duration-moderate",
              "data-starting-style:translate-y-[-4px] data-starting-style:scale-[0.97] data-starting-style:opacity-0",
              "data-ending-style:translate-y-[-2px] data-ending-style:scale-[0.98] data-ending-style:opacity-0",
              "motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:transition-opacity",
              anchor && "min-w-[var(--anchor-width)]",
              surfaceClassName,
              className
            )}
            {...props}
          />
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    );
  }
);

ComboboxContent.displayName = "ComboboxContent";

const ComboboxList = forwardRef<
  HTMLDivElement,
  ComboboxPrimitive.List.Props
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.List
    ref={ref}
    className={cn(
      "min-h-0 overflow-y-auto overscroll-contain scroll-py-1 outline-none",
      className
    )}
    data-slot="combobox-list"
    {...props}
  />
));

ComboboxList.displayName = "ComboboxList";

const comboboxItemVariants = cva(
  [
    "relative flex w-full shrink-0 cursor-default items-center rounded-lg outline-none select-none",
    "text-fg-muted transition-[background-color,color] duration-fast",
    "data-highlighted:bg-hover data-highlighted:text-fg-default",
    "data-selected:bg-selection data-selected:text-fg-default",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    "focus-visible:ring-1 focus-visible:ring-focus-ring",
  ],
  {
    variants: {
      density: {
        compact: "h-control-md gap-1.5 px-2 text-label",
        regular: "h-control-lg gap-2 px-2.5 text-body",
        comfortable: "h-control-xl gap-2 px-3 text-body",
      },
    },
    defaultVariants: {
      density: "regular",
    },
  }
);

const comboboxItemIconSizes: Record<ComboboxItemDensity, number> = {
  compact: 14,
  regular: 16,
  comfortable: 18,
};

export interface ComboboxItemProps
  extends Omit<ComboboxPrimitive.Item.Props, "className"> {
  className?: string;
  icon?: IconComponent;
}

const ComboboxItem = forwardRef<HTMLDivElement, ComboboxItemProps>(
  ({ className, children, icon: Icon, ...props }, ref) => {
    const { itemDensity } = useComboboxVisualContext();
    const iconSize = comboboxItemIconSizes[itemDensity];

    return (
      <ComboboxPrimitive.Item
        ref={ref}
        className={cn(
          comboboxItemVariants({ density: itemDensity }),
          className
        )}
        data-slot="combobox-item"
        {...props}
      >
        {Icon && (
          <Icon
            size={iconSize}
            strokeWidth={1.5}
            className="shrink-0 transition-[color,stroke-width] duration-fast"
          />
        )}

        <span className="min-w-0 flex-1 truncate">{children}</span>

        <span
          aria-hidden
          className="flex shrink-0 items-center justify-center text-fg-brand"
          style={{ height: iconSize, width: iconSize }}
        >
          <ComboboxPrimitive.ItemIndicator
            className="animate-in fade-in zoom-in-75 duration-fast motion-reduce:animate-none"
            data-slot="combobox-item-indicator"
          >
            <CheckIcon size={iconSize} />
          </ComboboxPrimitive.ItemIndicator>
        </span>
      </ComboboxPrimitive.Item>
    );
  }
);

ComboboxItem.displayName = "ComboboxItem";

const ComboboxEmpty = forwardRef<
  HTMLDivElement,
  ComboboxPrimitive.Empty.Props
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.Empty
    ref={ref}
    className={cn(
      "px-3 py-6 text-center text-body text-fg-subtle empty:h-0 empty:p-0",
      className
    )}
    data-slot="combobox-empty"
    {...props}
  />
));

ComboboxEmpty.displayName = "ComboboxEmpty";

const ComboboxGroup = forwardRef<
  HTMLDivElement,
  ComboboxPrimitive.Group.Props
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.Group
    ref={ref}
    className={cn("py-0.5", className)}
    data-slot="combobox-group"
    {...props}
  />
));

ComboboxGroup.displayName = "ComboboxGroup";

const ComboboxLabel = forwardRef<
  HTMLDivElement,
  ComboboxPrimitive.GroupLabel.Props
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.GroupLabel
    ref={ref}
    className={cn("px-2 py-1.5 text-label text-fg-subtle", className)}
    data-slot="combobox-label"
    {...props}
  />
));

ComboboxLabel.displayName = "ComboboxLabel";

const ComboboxSeparator = forwardRef<
  HTMLDivElement,
  ComboboxPrimitive.Separator.Props
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border-subtle", className)}
    data-slot="combobox-separator"
    {...props}
  />
));

ComboboxSeparator.displayName = "ComboboxSeparator";

function ComboboxCollection(props: ComboboxPrimitive.Collection.Props) {
  return <ComboboxPrimitive.Collection {...props} />;
}

// ---------------------------------------------------------------------------
// Multiple selection
// ---------------------------------------------------------------------------

export interface ComboboxChipsProps
  extends Omit<ComboboxPrimitive.Chips.Props, "className"> {
  className?: string;
  variant?: ComboboxInputVariant;
}

const comboboxChipsMinHeightClasses: Record<ControlSize, string> = {
  xs: "min-h-control-xs",
  sm: "min-h-control-sm",
  md: "min-h-control-md",
  lg: "min-h-control-lg",
  xl: "min-h-control-xl",
};

const ComboboxChips = forwardRef<HTMLDivElement, ComboboxChipsProps>(
  ({ className, variant = "outline", ...props }, ref) => {
    const { size } = useComboboxVisualContext();

    return (
      <ComboboxPrimitive.Chips
        ref={ref}
        className={cn(
          "flex min-w-[200px] flex-wrap items-center gap-1 border border-input bg-transparent p-1 outline-none",
          "h-auto rounded-lg shadow-control",
          comboboxChipsMinHeightClasses[size],
          "transition-[background-color,border-color,box-shadow,color] duration-fast hover:border-input-hover hover:bg-hover",
          "focus-within:ring-1 focus-within:ring-focus-ring",
          "has-aria-invalid:border-danger-border has-aria-invalid:ring-1 has-aria-invalid:ring-danger-border/40",
          comboboxInputGroupVariants[variant],
          className
        )}
        data-size={size}
        data-slot="combobox-chips"
        data-variant={variant}
        {...props}
      />
    );
  }
);

ComboboxChips.displayName = "ComboboxChips";

export interface ComboboxChipProps
  extends Omit<ComboboxPrimitive.Chip.Props, "className"> {
  className?: string;
  showRemove?: boolean;
  removeAriaLabel?: string;
}

const ComboboxChip = forwardRef<HTMLDivElement, ComboboxChipProps>(
  (
    {
      className,
      children,
      removeAriaLabel = "Remove selection",
      showRemove = true,
      ...props
    },
    ref
  ) => {
    const { size } = useComboboxVisualContext();
    const iconSize = Math.max(12, controlSizeRecipe[size].icon - 2);

    return (
      <ComboboxPrimitive.Chip
        ref={ref}
        className={cn(
          "inline-flex h-6 max-w-full items-center gap-1 rounded-md bg-emphasis pl-2 pr-1 text-label text-fg-default",
          "data-disabled:pointer-events-none data-disabled:opacity-50",
          className
        )}
        data-slot="combobox-chip"
        {...props}
      >
        <span className="min-w-0 truncate">{children}</span>
        {showRemove && (
          <ComboboxPrimitive.ChipRemove
            aria-label={removeAriaLabel}
            data-slot="combobox-chip-remove"
            render={
              <Button
                className="h-5 w-5 rounded-sm p-0 [&_[data-slot=button-background]]:inset-0"
                iconOnly
                size="xs"
                type="button"
                variant="ghost"
              />
            }
          >
            <CloseIcon size={iconSize} />
          </ComboboxPrimitive.ChipRemove>
        )}
      </ComboboxPrimitive.Chip>
    );
  }
);

ComboboxChip.displayName = "ComboboxChip";

const ComboboxChipsInput = forwardRef<
  HTMLInputElement,
  ComboboxPrimitive.Input.Props
>(({ className, ...props }, ref) => {
  const { size } = useComboboxVisualContext();

  return (
    <ComboboxPrimitive.Input
      ref={ref}
      className={cn(
        "min-w-16 flex-1 bg-transparent px-1 text-fg-default outline-none placeholder:text-fg-subtle disabled:pointer-events-none disabled:opacity-50",
        controlSizeRecipe[size].text,
        className
      )}
      data-slot="combobox-chip-input"
      {...props}
    />
  );
});

ComboboxChipsInput.displayName = "ComboboxChipsInput";

function useComboboxAnchor() {
  return useRef<HTMLDivElement | null>(null);
}

export {
  Combobox,
  ComboboxClear,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxSeparator,
  ComboboxCollection,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  useComboboxAnchor,
  comboboxItemVariants,
  comboboxTriggerVariants,
};
