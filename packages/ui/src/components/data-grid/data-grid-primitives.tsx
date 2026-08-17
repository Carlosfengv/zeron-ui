"use client";

import type * as React from "react";
import { cn } from "#system/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse bg-muted", "rounded-lg", className)}
      {...props}
    />
  );
}

function Textarea({ className, rows = 1, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-control-md w-full resize-none border border-input bg-transparent px-3 py-2 text-body text-fg-default outline-none",
        "placeholder:text-fg-muted focus-visible:ring-1 focus-visible:ring-focus-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "rounded-lg",
        className
      )}
      rows={rows}
      {...props}
    />
  );
}

export { Skeleton, Textarea };
