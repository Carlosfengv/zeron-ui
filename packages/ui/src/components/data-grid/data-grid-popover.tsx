"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "#system/utils";
import { useComposedRefs } from "#system/compose-refs";
import {
  resolveSurface,
  SurfaceProvider,
  useSurface,
} from "#system/surface-context";
import { surfaceClasses } from "#system/surface-classes";
import { usePortalContainer } from "#system/portal-container-context";

interface DataGridPopoverContextValue {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
}

const DataGridPopoverContext = React.createContext<DataGridPopoverContextValue | null>(null);

function Popover({
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
  ...props
}: PopoverPrimitive.Root.Props) {
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;

  return (
    <DataGridPopoverContext.Provider value={{ anchorRef, open }}>
      <PopoverPrimitive.Root
        {...props}
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          if (controlledOpen === undefined) setInternalOpen(nextOpen);
          onOpenChange?.(nextOpen, eventDetails);
        }}
      />
    </DataGridPopoverContext.Provider>
  );
}

function PopoverAnchor({
  asChild,
  children,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const context = React.useContext(DataGridPopoverContext);
  const child = React.isValidElement(children)
    ? (children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>)
    : null;
  const childRef = child?.props.ref;
  const ref = useComposedRefs<HTMLElement>(childRef, (node) => {
    if (context) context.anchorRef.current = node;
  });

  if (asChild && child) {
    return React.cloneElement(child, { ref });
  }

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} data-slot="data-grid-popover-anchor" {...props}>
      {children}
    </div>
  );
}

type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    onEscapeKeyDown?: (event: Event) => void;
    onOpenAutoFocus?: (event: Event) => void;
  };

function PopoverContent({
  align = "center",
  alignOffset = 0,
  className,
  onEscapeKeyDown,
  onKeyDownCapture,
  onOpenAutoFocus,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverContentProps) {
  const context = React.useContext(DataGridPopoverContext);
  const portalContainer = usePortalContainer();
  const substrate = useSurface();
  const surface = resolveSurface(substrate, "floating");

  React.useEffect(() => {
    if (!context?.open || !onOpenAutoFocus) return;
    const frame = requestAnimationFrame(() => {
      onOpenAutoFocus(new Event("openAutoFocus", { cancelable: true }));
    });
    return () => cancelAnimationFrame(frame);
  }, [context?.open, onOpenAutoFocus]);

  return (
    <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={context?.anchorRef}
        className="z-popover outline-none"
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          {...props}
          className={cn(
            "flex w-72 origin-[var(--transform-origin)] flex-col gap-2.5 p-2.5 text-body text-fg-default outline-none",
            "data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0",
            surfaceClasses(surface, "floating"),
            "rounded-xl",
            className
          )}
          data-grid-popover=""
          onKeyDownCapture={(event) => {
            onKeyDownCapture?.(event);
            if (event.defaultPrevented || event.key !== "Escape" || !onEscapeKeyDown) return;
            const escapeEvent = new Event("escapeKeyDown", { cancelable: true });
            onEscapeKeyDown(escapeEvent);
            if (escapeEvent.defaultPrevented) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
          <SurfaceProvider role={surface}>{props.children}</SurfaceProvider>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverAnchor, PopoverContent };
