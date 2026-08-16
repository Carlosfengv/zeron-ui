"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type Ref,
} from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#system/utils";
import {
  controlFieldPaddingClasses,
  controlSizeClasses,
  type ControlSize,
} from "../tokens/control-size";

const inputSizeVariants = {
  xs: cn(controlSizeClasses.xs, controlFieldPaddingClasses.xs, "text-label"),
  sm: cn(controlSizeClasses.sm, controlFieldPaddingClasses.sm, "text-label"),
  md: cn(controlSizeClasses.md, controlFieldPaddingClasses.md, "text-body"),
  lg: cn(controlSizeClasses.lg, controlFieldPaddingClasses.lg, "text-body"),
  xl: cn(controlSizeClasses.xl, controlFieldPaddingClasses.xl, "text-body"),
} satisfies Record<ControlSize, string>;

const inputVariants = cva(
  [
    "flex w-full min-w-0 text-fg-default outline-none",
    "transition-[background-color,border-color,box-shadow,color] duration-fast",
    "selection:bg-selection selection:text-fg-default",
    "file:mr-2 file:border-0 file:bg-transparent file:[font:inherit] file:text-fg-default",
    "placeholder:text-fg-subtle",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:ring-1 focus-visible:ring-focus-ring",
    "aria-invalid:border-danger-border aria-invalid:hover:border-danger-border aria-invalid:ring-1 aria-invalid:ring-danger-border/40 aria-invalid:focus-visible:outline-1 aria-invalid:focus-visible:outline-focus-ring aria-invalid:focus-visible:outline-offset-2",
  ],
  {
    variants: {
      variant: {
        outline: "border border-border bg-transparent hover:border-input-hover hover:bg-hover",
        secondary: "border border-transparent bg-emphasis shadow-none",
        ghost: "border border-transparent bg-transparent shadow-none",
      },
      size: inputSizeVariants,
    },
    defaultVariants: {
      variant: "outline",
      size: "md",
    },
  }
);

interface InputProps
  extends Omit<ComponentPropsWithoutRef<typeof InputPrimitive>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = "md",
      type,
      variant = "outline",
      ...props
    },
    ref
  ) => {

    return (
      <InputPrimitive
        ref={ref as Ref<HTMLElement>}
        className={cn(inputVariants({ size, variant }), "rounded-lg", className)}
        data-size={size}
        data-slot="input"
        data-variant={variant}
        type={type}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
export type { InputProps };
