"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";

const inputVariants = cva(
  [
    "flex w-full min-w-0 text-fg-default outline-none",
    "transition-[background-color,border-color,box-shadow,color] duration-fast",
    "selection:bg-selection selection:text-fg-default",
    "file:inline-flex file:h-control-xs file:border-0 file:bg-transparent file:text-body file:text-fg-default",
    "placeholder:text-fg-subtle",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:ring-1 focus-visible:ring-focus-ring",
    "aria-invalid:border-danger-border aria-invalid:hover:border-danger-border aria-invalid:ring-1 aria-invalid:ring-danger-border/40 aria-invalid:focus-visible:outline-1 aria-invalid:focus-visible:outline-focus-ring aria-invalid:focus-visible:outline-offset-2",
  ],
  {
    variants: {
      variant: {
        outline: "border border-input bg-transparent hover:border-input-hover hover:bg-hover",
        secondary: "border border-transparent bg-emphasis shadow-none",
        ghost: "border border-transparent bg-transparent shadow-none",
      },
      size: {
        sm: "h-control-xs px-2.5 py-0.5 text-label",
        default: "min-h-control-sm px-3 py-1 text-body",
        lg: "min-h-control-md px-3.5 py-1.5 text-body",
        xl: "h-control-xl px-4 py-2 text-body",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
);

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = "default",
      type,
      variant = "outline",
      ...props
    },
    ref
  ) => {
    const shape = useShape();

    return (
      <input
        ref={ref}
        className={cn(inputVariants({ size, variant }), shape.input, className)}
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
