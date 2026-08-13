"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
} from "react";
import { cn } from "#system/utils";
import { useShape } from "#system/shape-context";

type KbdProps = ComponentPropsWithoutRef<"kbd">;

const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ className, style, ...props }, ref) => {
    const shape = useShape();

    return (
      <kbd
        ref={ref}
        className={cn(
          "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-1 border border-border-subtle bg-muted px-1 font-mono text-label text-fg-muted shadow-control",
          shape.item,
          "font-medium",
          className
        )}
        data-slot="kbd"
        style={style}
        {...props}
      />
    );
  }
);

Kbd.displayName = "Kbd";

type KbdGroupProps = HTMLAttributes<HTMLDivElement>;

const KbdGroup = forwardRef<HTMLDivElement, KbdGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("inline-flex items-center gap-1", className)}
      data-slot="kbd-group"
      {...props}
    />
  )
);

KbdGroup.displayName = "KbdGroup";

export { Kbd, KbdGroup };
export type { KbdProps, KbdGroupProps };
