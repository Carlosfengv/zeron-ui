"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import * as React from "react";
import { cn } from "@/lib/utils";
import { usePortalContainer } from "@/lib/portal-container-context";

export function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  );
}

export function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

export function TooltipTrigger({
  asChild,
  children,
  render,
  ...props
}: TooltipPrimitive.Trigger.Props & {
  asChild?: boolean;
}) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      render={asChild && React.isValidElement(children) ? children : render}
      {...props}
    >
      {asChild ? null : children}
    </TooltipPrimitive.Trigger>
  );
}

export function TooltipContent({
  align = "center",
  alignOffset = 0,
  children,
  className,
  side = "top",
  sideOffset = 8,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const portalContainer = usePortalContainer();

  return (
    <TooltipPrimitive.Portal container={portalContainer ?? undefined}>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-tooltip"
        side={side}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          className={cn(
            "z-tooltip w-fit max-w-xs origin-[var(--transform-origin)] rounded-control bg-inverse-background px-2 py-1 text-fg-on-inverse text-label text-balance data-closed:animate-out data-open:animate-in data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95",
            className,
          )}
          data-slot="tooltip-content"
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="z-tooltip size-2 rotate-45 rounded-[1px] bg-inverse-background fill-inverse-background data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}
