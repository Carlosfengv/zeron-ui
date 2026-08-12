"use client";

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type MouseEventHandler,
  type TextareaHTMLAttributes,
} from "react";
import { Field } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";

// ── Compound input group ─────────────────────────────────

type InputGroupProps = HTMLAttributes<HTMLDivElement>;

const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, ...props }, ref) => {
    const shape = useShape();

    return (
      <div
        ref={ref}
        className={cn(
          "group/input-group relative flex w-full min-w-0 items-center border border-input bg-transparent outline-none hover:border-input-hover hover:bg-hover",
          "transition-[background-color,border-color,box-shadow,color] duration-fast",
          "has-[[data-slot=input-group-control]:focus-visible]:ring-1 has-[[data-slot=input-group-control]:focus-visible]:ring-focus-ring",
          "has-aria-invalid:border-danger-border has-aria-invalid:hover:border-danger-border has-aria-invalid:ring-1 has-aria-invalid:ring-danger-border/40 has-aria-invalid:has-[[data-slot=input-group-control]:focus-visible]:outline-1 has-aria-invalid:has-[[data-slot=input-group-control]:focus-visible]:outline-focus-ring has-aria-invalid:has-[[data-slot=input-group-control]:focus-visible]:outline-offset-2",
          "has-data-[align=block-start]:flex-col has-data-[align=block-start]:items-stretch",
          "has-data-[align=block-end]:flex-col has-data-[align=block-end]:items-stretch",
          shape.input,
          className
        )}
        data-slot="input-group"
        role="group"
        {...props}
      />
    );
  }
);

InputGroup.displayName = "InputGroup";

const inputGroupAddonVariants = cva(
  "flex cursor-text select-none items-center justify-center gap-2 px-3 text-body text-fg-muted [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      align: {
        "inline-start": "order-first",
        "inline-end": "order-last",
        "block-start": "order-first w-full justify-start py-2",
        "block-end": "order-last w-full justify-start py-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
);

interface InputGroupAddonProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inputGroupAddonVariants> {}

const InputGroupAddon = forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = "inline-start", onClick, ...props }, ref) => {
    const handleClick: MouseEventHandler<HTMLDivElement> = (event) => {
      onClick?.(event);
      if (event.defaultPrevented || (event.target as HTMLElement).closest("button")) {
        return;
      }

      event.currentTarget.parentElement
        ?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")
        ?.focus();
    };

    return (
      <div
        ref={ref}
        className={cn(inputGroupAddonVariants({ align }), className)}
        data-align={align}
        data-slot="input-group-addon"
        onClick={handleClick}
        role="group"
        {...props}
      />
    );
  }
);

InputGroupAddon.displayName = "InputGroupAddon";

const inputGroupButtonVariants = cva("flex items-center shadow-none", {
  variants: {
    size: {
      xs: "h-control-xs px-2 text-label",
      sm: "h-control-xs px-2.5 text-label",
      "icon-xs": "size-control-xs p-0",
      "icon-sm": "size-control-xs p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

interface InputGroupButtonProps
  extends Omit<ButtonProps, "size">,
    VariantProps<typeof inputGroupButtonVariants> {}

const InputGroupButton = forwardRef<HTMLButtonElement, InputGroupButtonProps>(
  (
    {
      className,
      size = "xs",
      type = "button",
      variant = "ghost",
      ...props
    },
    ref
  ) => {
    const buttonSize = size === "icon-xs" || size === "icon-sm" ? "icon-sm" : "sm";

    return (
      <Button
        ref={ref}
        className={cn(inputGroupButtonVariants({ size }), className)}
        data-size={size}
        data-slot="input-group-button"
        size={buttonSize}
        type={type}
        variant={variant}
        {...props}
      />
    );
  }
);

InputGroupButton.displayName = "InputGroupButton";

type InputGroupTextProps = HTMLAttributes<HTMLSpanElement>;

const InputGroupText = forwardRef<HTMLSpanElement, InputGroupTextProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "flex items-center text-body text-fg-muted [&_svg]:pointer-events-none",
        className
      )}
      data-slot="input-group-text"
      {...props}
    />
  )
);

InputGroupText.displayName = "InputGroupText";

type InputGroupInputProps = InputProps;

const InputGroupInput = forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn(
        "flex-1 border-0 bg-transparent shadow-none hover:bg-transparent focus-visible:ring-0",
        "group-has-data-[align=inline-start]/input-group:pl-0",
        "group-has-data-[align=inline-end]/input-group:pr-0",
        className
      )}
      data-slot="input-group-control"
      {...props}
    />
  )
);

InputGroupInput.displayName = "InputGroupInput";

type InputGroupTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const InputGroupTextarea = forwardRef<
  HTMLTextAreaElement,
  InputGroupTextareaProps
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "field-sizing-content min-h-24 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-body text-fg-default outline-none focus-visible:ring-0",
      "placeholder:text-fg-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    data-slot="input-group-control"
    {...props}
  />
));

InputGroupTextarea.displayName = "InputGroupTextarea";

// ── Legacy multi-field group ────────────────────────────
// Kept under an explicit name so existing field-group compositions can migrate
// without competing with the shadcn-style compound InputGroup above.

interface InputGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

function useInputGroup() {
  const ctx = useContext(InputGroupContext);
  if (!ctx)
    throw new Error("InputField must be used within an InputFieldGroup");
  return ctx;
}

interface InputFieldGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const InputFieldGroup = forwardRef<HTMLDivElement, InputFieldGroupProps>(
  ({ children, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { activeIndex, handlers, registerItem, measureItems } =
      useProximityHover(containerRef);

    useEffect(() => {
      measureItems();
    }, [measureItems, children]);

    const contextValue = useMemo(
      () => ({ registerItem, activeIndex }),
      [registerItem, activeIndex]
    );

    return (
      <InputGroupContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
          // `relative` makes this div the fields' offsetParent — the proximity
          // hook measures items via offsetTop and compares against
          // container-relative mouse coords, so the two coordinate spaces must
          // share this origin (same as every other proximity consumer).
          className={cn("relative flex flex-col gap-3 w-72 max-w-full", className)}
          {...props}
        >
          {children}
        </div>
      </InputGroupContext.Provider>
    );
  }
);

InputFieldGroup.displayName = "InputFieldGroup";

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "index"> {
  label: string;
  placeholder?: string;
  icon?: IconComponent;
  index: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const InputField = forwardRef<HTMLDivElement, InputFieldProps>(
  (
    {
      label,
      placeholder,
      icon: Icon,
      index,
      value,
      onChange,
      error,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLElement | null>(null);
    const { registerItem, activeIndex } = useInputGroup();
    const [isFocused, setIsFocused] = useState(false);
    const shape = useShape();

    useEffect(() => {
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    const isActive = activeIndex === index;
    const labelActive = isActive || isFocused;

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    // Input container classes
    let bgClass: string;
    let ringClass: string;
    const focusOutlineClass = isFocused
      ? "outline-1 outline-focus-ring outline-offset-2"
      : undefined;

    if (disabled) {
      bgClass = "bg-transparent";
      ringClass = "ring-border";
    } else if (error) {
      bgClass = isFocused ? "bg-surface-raised" : isActive ? "bg-danger-surface" : "bg-transparent";
      ringClass = isFocused || isActive ? "ring-danger-border/50" : "ring-transparent";
    } else if (isFocused) {
      bgClass = "bg-surface-raised";
      ringClass = "ring-border";
    } else if (isActive) {
      bgClass = "bg-muted/50";
      ringClass = "ring-border";
    } else {
      bgClass = "bg-transparent";
      ringClass = "ring-transparent";
    }

    return (
      // Base UI Field wires the accessibility plumbing: Field.Label's htmlFor
      // targets the control, Field.Error's generated id lands in the control's
      // aria-describedby, and `invalid` drives aria-invalid / data-invalid.
      <Field.Root
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        invalid={!!error}
        disabled={disabled}
        className={cn(
          "flex flex-col gap-1 cursor-text",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        {/* Label */}
        <Field.Label className="inline-grid text-body pl-3">
          <span
            className="col-start-1 row-start-1 invisible font-semibold"
            aria-hidden="true"
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1",
              error ? "text-fg-danger" : "text-fg-muted", "font-normal"
            )}
          >
            {label}
          </span>
        </Field.Label>

        {/* Input container */}
        <div
          onMouseDown={(e) => {
            // The old wrapper was one big <label>, so a click anywhere (icon,
            // padding) focused the input. Keep that, without disturbing the
            // input's own caret placement.
            if (e.target === inputRef.current) return;
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(
            `flex items-center gap-2 ${shape.input} px-3 py-2 ring-1 transition-all duration-fast`,
            bgClass,
            ringClass,
            focusOutlineClass
          )}
        >
          {Icon && (
            <Icon
              size={16}
              strokeWidth={labelActive ? 2 : 1.5}
              className={cn(
                "shrink-0 transition-[color,stroke-width] duration-fast",
                labelActive
                  ? "text-fg-default"
                  : "text-fg-muted"
              )}
            />
          )}
          <Field.Control
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="w-full bg-transparent text-body text-fg-default placeholder:text-fg-muted outline-none font-[inherit] font-normal"
            {...props}
          />
        </div>

        {/* Error message — `match` pins it visible while our controlled
            `error` prop is standing. */}
        {error && (
          <Field.Error
            match
            className="text-label text-fg-danger pl-3 font-medium"
          >
            {error}
          </Field.Error>
        )}
      </Field.Root>
    );
  }
);

InputField.displayName = "InputField";

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
  inputGroupAddonVariants,
  inputGroupButtonVariants,
  InputFieldGroup,
  InputField,
};
export type {
  InputGroupProps,
  InputGroupAddonProps,
  InputGroupButtonProps,
  InputGroupTextProps,
  InputGroupInputProps,
  InputGroupTextareaProps,
  InputFieldGroupProps,
  InputFieldProps,
};
export default InputGroup;
