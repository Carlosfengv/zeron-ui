"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";

const inputVariants = cva(
  [
    "flex w-full min-w-0 text-fg-default outline-none",
    "transition-[background-color,border-color,box-shadow,color] duration-80",
    "selection:bg-selection-background selection:text-fg-default",
    "file:inline-flex file:h-control-xs file:border-0 file:bg-transparent file:text-body-sm file:text-fg-default",
    "placeholder:text-fg-subtle",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
    "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/40",
  ],
  {
    variants: {
      variant: {
        outline: "border border-input bg-transparent shadow-xs",
        secondary: "border border-transparent bg-accent shadow-none",
        ghost: "border border-transparent bg-transparent shadow-none",
      },
      size: {
        sm: "h-control-xs px-2.5 py-0.5 text-label",
        default: "min-h-control-sm px-3 py-1 text-body-sm",
        lg: "min-h-control-md px-3.5 py-1.5 text-body",
        xl: "h-control-xl px-4 py-2 text-body-lg",
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
