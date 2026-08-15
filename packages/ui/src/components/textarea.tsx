"use client";

import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#system/utils";

const textareaVariants = cva(
  [
    "flex w-full min-w-0 resize-y text-body text-fg-default outline-none",
    "transition-[background-color,border-color,box-shadow,color] duration-fast",
    "selection:bg-selection selection:text-fg-default placeholder:text-fg-subtle",
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
        default: "min-h-24 px-3 py-2",
        lg: "min-h-32 px-3.5 py-2.5",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
);

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = "default", variant = "outline", ...props }, ref) => {
    const controlProps = {
      ...props,
      className: cn(textareaVariants({ size, variant }), "rounded-lg", className),
      "data-size": size,
      "data-slot": "textarea",
      "data-variant": variant,
    } as ComponentPropsWithoutRef<typeof FieldPrimitive.Control>;

    return (
      <FieldPrimitive.Control
        {...controlProps}
        ref={ref as Ref<HTMLElement>}
        render={<textarea />}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
