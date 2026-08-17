"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "#system/utils";

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive>;

const Separator = forwardRef<
  ComponentRef<typeof SeparatorPrimitive>,
  SeparatorProps
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <SeparatorPrimitive
    ref={ref}
    orientation={orientation}
    data-slot="separator"
    className={cn(
      "pointer-events-none flex shrink-0 items-center justify-center",
      "after:block after:shrink-0 after:bg-border after:content-['']",
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
