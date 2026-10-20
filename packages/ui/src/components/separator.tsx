"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "#system/utils";

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive> & {
  /** Semantic strength of the divider. Defaults to the standard border tone. */
  tone?: "default" | "subtle";
};

const Separator = forwardRef<
  ComponentRef<typeof SeparatorPrimitive>,
  SeparatorProps
>(({ className, orientation = "horizontal", tone = "default", ...props }, ref) => (
  <SeparatorPrimitive
    ref={ref}
    orientation={orientation}
    data-slot="separator"
    data-tone={tone}
    className={cn(
      "pointer-events-none flex shrink-0 items-center justify-center",
      "after:block after:shrink-0 after:content-['']",
      tone === "subtle" ? "after:bg-border-subtle" : "after:bg-border",
      orientation === "horizontal"
        ? "h-2 w-full after:h-px after:w-full"
        : "w-2 self-stretch after:h-full after:w-px",
      className
    )}
    {...props}
  />
));

Separator.displayName = "Separator";

export { Separator };
export type { SeparatorProps };
