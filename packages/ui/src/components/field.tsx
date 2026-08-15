"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
} from "react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";
import { cn } from "#system/utils";

export type FieldProps = ComponentPropsWithoutRef<typeof FieldPrimitive.Root>;
export type FieldLabelProps = ComponentPropsWithoutRef<typeof FieldPrimitive.Label>;
export type FieldDescriptionProps = ComponentPropsWithoutRef<
  typeof FieldPrimitive.Description
>;
export type FieldErrorProps = ComponentPropsWithoutRef<typeof FieldPrimitive.Error>;
export type FieldItemProps = ComponentPropsWithoutRef<typeof FieldPrimitive.Item>;
export type FieldsetProps = ComponentPropsWithoutRef<typeof FieldsetPrimitive.Root>;
export type FieldsetLegendProps = ComponentPropsWithoutRef<
  typeof FieldsetPrimitive.Legend
>;
export type FieldGroupProps = HTMLAttributes<HTMLDivElement>;

/** Accessible field composition shared by text, selection, and toggle controls. */
const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ className, ...props }, ref) => (
    <FieldPrimitive.Root
      ref={ref}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      data-slot="field"
      {...props}
    />
  )
);

Field.displayName = "Field";

const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, ...props }, ref) => (
    <FieldPrimitive.Label
      ref={ref}
      className={cn(
        "px-1.5 text-body font-medium text-fg-muted data-disabled:cursor-not-allowed",
        className
      )}
      data-slot="field-label"
      {...props}
    />
  )
);

FieldLabel.displayName = "FieldLabel";

const FieldDescription = forwardRef<HTMLDivElement, FieldDescriptionProps>(
  ({ className, ...props }, ref) => (
    <FieldPrimitive.Description
      ref={ref}
      className={cn("px-1.5 text-label text-fg-subtle", className)}
      data-slot="field-description"
      {...props}
    />
  )
);

FieldDescription.displayName = "FieldDescription";

const FieldError = forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ className, ...props }, ref) => (
    <FieldPrimitive.Error
      ref={ref}
      className={cn(
        "px-3 text-label font-medium text-fg-danger transition-[opacity,transform] duration-moderate data-starting-style:-translate-y-0.5 data-starting-style:opacity-0 data-ending-style:-translate-y-0.5 data-ending-style:opacity-0",
        className
      )}
      data-slot="field-error"
      {...props}
    />
  )
);

FieldError.displayName = "FieldError";

const FieldItem = forwardRef<HTMLDivElement, FieldItemProps>(
  ({ className, ...props }, ref) => (
    <FieldPrimitive.Item
      ref={ref}
      className={cn("flex min-w-0 items-start gap-2.5", className)}
      data-slot="field-item"
      {...props}
    />
  )
);

FieldItem.displayName = "FieldItem";

const FieldGroup = forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid min-w-0 gap-4", className)}
      data-slot="field-group"
      {...props}
    />
  )
);

FieldGroup.displayName = "FieldGroup";

const Fieldset = forwardRef<HTMLElement, FieldsetProps>(
  ({ className, ...props }, ref) => (
    <FieldsetPrimitive.Root
      ref={ref}
      className={cn(
        "m-0 flex min-w-0 flex-col gap-3 border-0 p-0 data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      data-slot="fieldset"
      {...props}
    />
  )
);

Fieldset.displayName = "Fieldset";

const FieldsetLegend = forwardRef<HTMLDivElement, FieldsetLegendProps>(
  ({ className, ...props }, ref) => (
    <FieldsetPrimitive.Legend
      ref={ref}
      className={cn("px-1.5 text-body font-medium text-fg-muted", className)}
      data-slot="fieldset-legend"
      {...props}
    />
  )
);

FieldsetLegend.displayName = "FieldsetLegend";

export {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldItem,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
};
