"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "#system/utils";
import { spring } from "#system/springs";
import { useShape } from "#system/shape-context";
import {
  resolveSurface,
  SurfaceProvider,
  useSurface,
} from "#system/surface-context";
import { surfaceClasses } from "#system/surface-classes";
import { usePortalContainer } from "#system/portal-container-context";

type PopoverSide = "top" | "right" | "bottom" | "left";
type PopoverAlign = "start" | "center" | "end";
type PopoverTriggerMode = "click" | "hover";

interface PopoverVisualContextValue {
  closeDelay: number;
  filterId: string;
  gooStrength: number;
  hoverDelay: number;
  liquid: boolean;
  triggerMode: PopoverTriggerMode;
}

const PopoverVisualContext = createContext<PopoverVisualContextValue | null>(
  null
);

const PopoverPortalContainerContext = createContext<HTMLElement | null>(null);

export interface PopoverProps
  extends Omit<PopoverPrimitive.Root.Props, "onOpenChange"> {
  /** Opens from a press by default; hover mode also supports keyboard focus. */
  trigger?: PopoverTriggerMode;
  hoverDelay?: number;
  closeDelay?: number;
  /** Enables the soft connector between the trigger and panel. */
  liquid?: boolean;
  /** Blur feeding the liquid merge. Larger values produce a softer neck. */
  gooStrength?: number;
  onOpenChange?: (open: boolean) => void;
}

function Popover({
  children,
  closeDelay = 120,
  gooStrength = 5,
  hoverDelay = 160,
  liquid = false,
  onOpenChange,
  trigger = "click",
  ...props
}: PopoverProps) {
  const filterId = `popover-goo-${useId().replace(/:/g, "")}`;

  return (
    <PopoverVisualContext.Provider
      value={{
        closeDelay,
        filterId,
        gooStrength,
        hoverDelay,
        liquid,
        triggerMode: trigger,
      }}
    >
      <PopoverPrimitive.Root
        onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
        {...props}
      >
        {children}
      </PopoverPrimitive.Root>
    </PopoverVisualContext.Provider>
  );
}

export type PopoverTriggerProps = PopoverPrimitive.Trigger.Props;

const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ closeDelay, delay, openOnHover, ...props }, ref) => {
    const visual = useContext(PopoverVisualContext);
    const hover = openOnHover ?? visual?.triggerMode === "hover";

    return (
      <PopoverPrimitive.Trigger
        ref={ref}
        closeDelay={closeDelay ?? (hover ? visual?.closeDelay : undefined)}
        delay={delay ?? (hover ? visual?.hoverDelay : undefined)}
        openOnHover={hover}
        {...props}
      />
    );
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

function PopoverPortalContainer({
  children,
  value,
}: {
  children: ReactNode;
  value: HTMLElement | null;
}) {
  return (
    <PopoverPortalContainerContext.Provider value={value}>
      {children}
    </PopoverPortalContainerContext.Provider>
  );
}

function motionOffset(side: PopoverSide) {
  switch (side) {
    case "top":
      return { y: 6 };
    case "right":
      return { x: -6 };
    case "bottom":
      return { y: -6 };
    case "left":
      return { x: 6 };
  }
}

function bridgePosition(
  side: PopoverSide,
  align: PopoverAlign,
  sideOffset: number
): React.CSSProperties {
  const crossAxis =
    align === "start"
      ? "calc(min(var(--anchor-width), 40px) / 2)"
      : align === "end"
        ? "calc(100% - min(var(--anchor-width), 40px) / 2)"
        : "50%";
  const length = sideOffset + 12;

  if (side === "top" || side === "bottom") {
    return {
      height: length,
      left: crossAxis,
      width: 18,
      ...(side === "bottom"
        ? { top: -sideOffset }
        : { bottom: -sideOffset }),
    };
  }

  return {
    height: 18,
    top: crossAxis,
    width: length,
    ...(side === "right" ? { left: -sideOffset } : { right: -sideOffset }),
  };
}

function bridgeTransform(side: PopoverSide) {
  return side === "top" || side === "bottom"
    ? { x: "-50%" }
    : { y: "-50%" };
}

export interface PopoverContentProps
  extends Omit<PopoverPrimitive.Popup.Props, "className" | "render"> {
  align?: PopoverAlign;
  alignOffset?: number;
  className?: string;
  /** Portal target for bounded previews or embedded canvases. */
  container?: HTMLElement | null;
  collisionPadding?: number;
  liquid?: boolean;
  side?: PopoverSide;
  sideOffset?: number;
}

const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      align = "center",
      alignOffset = 0,
      children,
      className,
      collisionPadding = 12,
      container,
      liquid,
      side = "bottom",
      sideOffset = 10,
      ...props
    },
    ref
  ) => {
    const visual = useContext(PopoverVisualContext);
    const ambientPortal = useContext(PopoverPortalContainerContext);
    const fullscreenPortal = usePortalContainer();
    const reduceMotion = useReducedMotion();
    const shape = useShape();
    const substrate = useSurface();
    const surface = resolveSurface(substrate, "floating");
    const showLiquid = liquid ?? visual?.liquid ?? false;
    const filterId = visual?.filterId;
    const gooStrength = visual?.gooStrength ?? 5;

    return (
      <PopoverPrimitive.Portal
        container={container ?? ambientPortal ?? fullscreenPortal ?? undefined}
      >
        <PopoverPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          collisionPadding={collisionPadding}
          className="z-popover outline-none"
          side={side}
          sideOffset={sideOffset}
        >
          <PopoverPrimitive.Popup
            ref={ref}
            {...props}
            render={(popupProps, state) => {
              const exiting = state.transitionStatus === "ending";
              const offset = motionOffset(state.side as PopoverSide);
              const {
                className: _primitiveClassName,
                style: baseStyle,
                onDrag: _onDrag,
                onDragStart: _onDragStart,
                onDragEnd: _onDragEnd,
                onAnimationStart: _onAnimationStart,
                onAnimationEnd: _onAnimationEnd,
                onAnimationIteration: _onAnimationIteration,
                ...rest
              } = popupProps as React.HTMLAttributes<HTMLDivElement>;

              return (
                <motion.div
                  {...rest}
                  className={cn(
                    "relative isolate w-max min-w-48 max-w-[min(92vw,22rem)] p-4 text-body text-fg-default outline-none",
                    className
                  )}
                  data-slot="popover-content"
                  initial={{ opacity: 0, scale: 0.96, ...offset }}
                  animate={
                    exiting
                      ? { opacity: 0, scale: 0.97, ...offset }
                      : { opacity: 1, scale: 1, x: 0, y: 0 }
                  }
                  style={{
                    ...(baseStyle as React.CSSProperties | undefined),
                    transformOrigin: "var(--transform-origin)",
                  }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : exiting
                        ? spring.moderate.exit
                        : spring.moderate
                  }
                >
                  {showLiquid && filterId && (
                    <svg
                      aria-hidden="true"
                      className="absolute size-0"
                      focusable="false"
                    >
                      <defs>
                        <filter
                          height="180%"
                          id={filterId}
                          width="180%"
                          x="-40%"
                          y="-40%"
                        >
                          <feGaussianBlur
                            in="SourceGraphic"
                            result="blur"
                            stdDeviation={gooStrength}
                          />
                          <feColorMatrix
                            in="blur"
                            mode="matrix"
                            result="goo"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                          />
                        </filter>
                      </defs>
                    </svg>
                  )}

                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-0 z-underlay",
                      surfaceClasses(surface, "floating"),
                      shape.container
                    )}
                  />

                  {showLiquid && filterId && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-underlay overflow-visible"
                      style={{ filter: `url(#${filterId})` }}
                    >
                      <div
                        className={cn(
                          "absolute inset-0",
                          surfaceClasses(surface),
                          shape.container
                        )}
                      />
                      <motion.span
                        animate={
                          exiting
                            ? { opacity: 0, scaleX: 0.45, scaleY: 0.45 }
                            : { opacity: 1, scaleX: 1, scaleY: 1 }
                        }
                        className={cn(
                          "absolute rounded-full",
                          surfaceClasses(surface, "floating")
                        )}
                        initial={{ opacity: 0, scaleX: 0.35, scaleY: 0.35 }}
                        style={{
                          ...bridgePosition(
                            state.side as PopoverSide,
                            state.align as PopoverAlign,
                            sideOffset
                          ),
                          ...bridgeTransform(state.side as PopoverSide),
                        }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : exiting
                              ? spring.fast.exit
                              : spring.moderate
                        }
                      />
                    </div>
                  )}

                  <SurfaceProvider role={surface}>{children}</SurfaceProvider>
                </motion.div>
              );
            }}
          />
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    );
  }
);
PopoverContent.displayName = "PopoverContent";

const PopoverTitle = forwardRef<
  HTMLHeadingElement,
  PopoverPrimitive.Title.Props
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Title
    ref={ref}
    className={cn("text-body font-medium text-fg-default", className)}
    {...props}
  />
));
PopoverTitle.displayName = "PopoverTitle";

const PopoverDescription = forwardRef<
  HTMLParagraphElement,
  PopoverPrimitive.Description.Props
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Description
    ref={ref}
    className={cn("text-body text-fg-muted", className)}
    {...props}
  />
));
PopoverDescription.displayName = "PopoverDescription";

function PopoverHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

function PopoverFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 flex items-center justify-end gap-2", className)}
      {...props}
    />
  );
}

const PopoverClose = PopoverPrimitive.Close;

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverPortalContainer,
  PopoverTitle,
  PopoverTrigger,
};
export type { PopoverAlign, PopoverSide, PopoverTriggerMode };
