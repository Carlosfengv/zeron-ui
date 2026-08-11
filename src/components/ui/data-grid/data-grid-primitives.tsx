"use client";

import type * as React from "react";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 bg-border/60",
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        className
      )}
      orientation={orientation}
      {...props}
    />
  );
}

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  const shape = useShape();
  return (
    <div
      className={cn("animate-pulse bg-accent", shape.item, className)}
      {...props}
    />
  );
}

function Textarea({ className, rows = 1, ...props }: React.ComponentProps<"textarea">) {
  const shape = useShape();
  return (
    <textarea
      className={cn(
        "flex min-h-control-sm w-full resize-none border border-input bg-transparent px-3 py-2 text-body-sm text-foreground outline-none",
        "placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        "disabled:pointer-events-none disabled:opacity-50",
        shape.input,
        className
      )}
      rows={rows}
      {...props}
    />
  );
}

export { Separator, Skeleton, Textarea };
