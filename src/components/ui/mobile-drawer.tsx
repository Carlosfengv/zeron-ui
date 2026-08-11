"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
import {
  resolveSurface,
  useSurface,
  SurfaceProvider,
} from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";

// Built on Base UI Dialog rather than Base UI Drawer: Drawer's
// swipe-to-dismiss writes inline `transform` + `--drawer-swipe-movement-*`
// CSS vars onto its Popup and expects CSS-transition choreography (plus a
// mandatory <Drawer.Viewport>), which fights framer-motion's transform
// management on the same element. Dialog provides everything we actually
// need — scroll lock (scrollbar-gap safe, blocks iOS touch scrolling),
// focus trap, focus restore timed after close, Esc + outside-click
// dismissal — while leaving the slide animation to framer-motion.

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  triggerRef?: RefObject<HTMLElement | null>;
  ariaLabel?: string;
  /** Explicit direction for portals rendered outside a locally directed subtree. */
  dir?: string;
  /** Logical edge from which the drawer enters. */
  side?: "start" | "end";
  panelClassName?: string;
  panelStyle?: CSSProperties;
}

// Props framer-motion redefines with incompatible signatures; they must not
// be forwarded from Base UI's render-prop payload onto a motion.div.
type MotionSafeDivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export function MobileDrawer({
  open,
  onClose,
  children,
  triggerRef,
  ariaLabel = "Navigation",
  dir: dirProp,
  side = "start",
  panelClassName,
  panelStyle,
}: MobileDrawerProps) {
  const contextDir = useDirection();
  const dir = dirProp ?? contextDir;
  const substrate = useSurface();
  const surface = resolveSurface(substrate, "overlay");
  const physicalLeft = (side === "start") === (dir !== "rtl");
  const hiddenX = physicalLeft ? "-100%" : "100%";

  // With `actionsRef` set, Base UI defers unmounting the portal on close
  // until `actionsRef.current.unmount()` is called, letting the
  // framer-motion exit tween below play out first.
  const actionsRef = useRef<DialogPrimitive.Root.Actions | null>(null);

  // Fallback release for the deferred unmount: onAnimationComplete on the
  // panel is the primary signal, but rAF-driven animation callbacks can
  // stall in throttled/background tabs. The longest exit tween is
  // spring.moderate.exit (backdrop), so the fallback tracks that tier's exit
  // duration plus a safety buffer.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(
      () => actionsRef.current?.unmount(),
      exitFallbackMs(spring.moderate)
    );
    return () => clearTimeout(id);
  }, [open]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      actionsRef={actionsRef}
    >
      <DialogPrimitive.Portal>
        {/* Overlay — same scrim as the library's dialogs: an always-on
            bg-scrim base that stays visible for system-dark users (the
            `dark:` variant only matches the explicit .dark class), boosted
            to /80 in explicit dark mode. */}
        <DialogPrimitive.Backdrop
          render={(backdropProps) => {
            const {
              style: _style,
              ...rest
            } = backdropProps as React.HTMLAttributes<HTMLDivElement>;
            return (
              <motion.div
                {...(rest as MotionSafeDivProps)}
                className="fixed inset-0 bg-scrim z-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: open ? 1 : 0 }}
                transition={open ? { duration: spring.moderate.duration } : spring.moderate.exit}
              />
            );
          }}
        />

        {/* Panel */}
        <DialogPrimitive.Popup
          aria-label={ariaLabel}
          finalFocus={triggerRef}
          render={(popupProps) => {
            const {
              style: baseStyle,
              ...rest
            } = popupProps as React.HTMLAttributes<HTMLDivElement>;
            return (
              <motion.div
                {...(rest as MotionSafeDivProps)}
                className={cn(
                  "fixed inset-y-0 w-64 z-popover overflow-y-auto p-4",
                  physicalLeft ? "left-0" : "right-0",
                  panelClassName,
                  surfaceClasses(surface, "overlay")
                )}
                style={{
                  ...(baseStyle as React.CSSProperties | undefined),
                  ...panelStyle,
                }}
                initial={{ x: hiddenX }}
                animate={{ x: open ? 0 : hiddenX }}
                // spring.moderate: critically damped, so the panel decelerates
                // into x: 0 without overshooting (a bounce briefly exposed the
                // page background through the gap on the left edge).
                transition={open ? spring.moderate : spring.moderate.exit}
                // Release Base UI's deferred unmount once the exit tween has
                // finished so the close animation fully plays.
                onAnimationComplete={() => {
                  if (!open) actionsRef.current?.unmount();
                }}
              >
                <SurfaceProvider role={surface}>{children}</SurfaceProvider>
              </motion.div>
            );
          }}
        />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default MobileDrawer;
