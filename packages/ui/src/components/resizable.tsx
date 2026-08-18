"use client";

import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "#system/utils";

type ResizablePanelGroupProps = ResizablePrimitive.GroupProps;
type ResizablePanelProps = ResizablePrimitive.PanelProps;

/**
 * A keyboard-accessible layout region whose direct Panel children can be
 * resized with a pointer or the arrow keys. This wraps react-resizable-panels
 * so product surfaces share Zeron's focus, divider, and hit-target treatment.
 */
function ResizablePanelGroup({
  className,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn("flex size-full min-h-0 min-w-0 overflow-hidden", className)}
      {...props}
    />
  );
}

function ResizablePanel({ className, ...props }: ResizablePanelProps) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      className={cn("min-h-0 min-w-0", className)}
      {...props}
    />
  );
}

interface ResizableHandleProps extends ResizablePrimitive.SeparatorProps {
  /** Shows a quiet visual grip without changing the full-size resize target. */
  withHandle?: boolean;
}

function ResizableHandle({
  className,
  withHandle = false,
  ...props
}: ResizableHandleProps) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "group/resizable-handle relative z-raised flex w-px shrink-0 items-center justify-center bg-border outline-none transition-colors duration-fast",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2 after:content-['']",
        "data-[separator=hover]:bg-fg-subtle/60 data-[separator=active]:bg-fg-brand focus-visible:z-control focus-visible:bg-fg-brand focus-visible:ring-1 focus-visible:ring-focus-ring",
        "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:inset-y-auto aria-[orientation=horizontal]:after:h-3 aria-[orientation=horizontal]:after:w-auto aria-[orientation=horizontal]:after:-translate-y-1/2 aria-[orientation=horizontal]:after:translate-x-0",
        className
      )}
      {...props}
    >
      {withHandle && (
        <span
          aria-hidden="true"
          className="relative z-content flex size-4 items-center justify-center rounded-md bg-surface-floating text-[10px] leading-none text-fg-subtle opacity-0 transition-opacity duration-fast group-data-[separator=hover]/resizable-handle:opacity-100 group-data-[separator=active]/resizable-handle:opacity-100 group-focus-visible/resizable-handle:opacity-100 aria-[orientation=horizontal]:rotate-90"
        >
          ⋮
        </span>
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
export type {
  ResizableHandleProps,
  ResizablePanelGroupProps,
  ResizablePanelProps,
};
