"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "#system/utils";
import { type SpringConfig, useChartConfig } from "../chart-config-context";
import { tooltipPosition } from "../chart-data";
import { chartCssVars } from "../chart-context";

export interface TooltipBoxProps {
  /** X position in pixels (relative to container) */
  x: number;
  /** Y position in pixels (relative to container) */
  y: number;
  /** Whether the tooltip is visible */
  visible: boolean;
  /** Container ref for portal rendering */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Container width for flip detection */
  containerWidth: number;
  /** Container height for bounds clamping */
  containerHeight: number;
  /** Offset from the target position */
  offset?: number;
  /** Custom class name */
  className?: string;
  /** Tooltip content */
  children: React.ReactNode;
  /** Override left position (bypasses internal calculation) */
  left?: number | ReturnType<typeof useSpring>;
  /** Override top position (bypasses internal calculation) */
  top?: number | ReturnType<typeof useSpring>;
  /** Force flip direction (for custom positioning) */
  flipped?: boolean;
  /** Per-chart override; falls back to `ChartConfigProvider.tooltipBoxSpring`. */
  springConfig?: SpringConfig;
  /** Animate panel position with a spring. Default: true */
  animate?: boolean;
  /** Fade/scale the panel on show. Default: true */
  entrance?: boolean;
  /** Inline styles for the inner tooltip panel. */
  panelStyle?: React.CSSProperties;
  /**
   * Tooltip panel background color (CSS variable or color value).
   * Default: `var(--surface-floating)`.
   */
  backgroundColor?: string;
}

// Inner-only-on-visible so `useSpring` initializes at the cursor's actual x/y
// instead of (0, 0) on first hover.
export function TooltipBox(props: TooltipBoxProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = props.containerRef.current;
  if (!(mounted && container)) {
    return null;
  }
  if (!props.visible) {
    return null;
  }
  return <TooltipBoxInner {...props} container={container} />;
}

function TooltipBoxInner({
  x,
  y,
  containerWidth,
  containerHeight,
  offset = 16,
  className = "",
  children,
  left: leftOverride,
  top: topOverride,
  flipped: flippedOverride,
  springConfig,
  animate = true,
  entrance = true,
  panelStyle,
  backgroundColor = chartCssVars.tooltipBackground,
  container,
}: Omit<TooltipBoxProps, "visible" | "containerRef"> & {
  container: HTMLElement;
}) {
  const { tooltipBoxSpring } = useChartConfig();
  const reducedMotion = useReducedMotion();
  const effectiveSpring = springConfig ?? tooltipBoxSpring;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 180, height: 80 });
  const position = tooltipPosition(x, y, size.width, size.height, containerWidth, containerHeight, offset);
  const animatedLeft = useSpring(position.left, effectiveSpring);
  const animatedTop = useSpring(position.top, effectiveSpring);
  const clampedLeft = useTransform(animatedLeft, value => Math.max(0, Math.min(value, containerWidth - size.width)));
  const clampedTop = useTransform(animatedTop, value => Math.max(0, Math.min(value, containerHeight - size.height)));

  useLayoutEffect(() => {
    const element = tooltipRef.current;
    if (!element) return;
    const measure = () => {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [children, containerWidth, containerHeight]);

  useLayoutEffect(() => {
    if (reducedMotion || !animate) {
      animatedLeft.jump(position.left);
      animatedTop.jump(position.top);
    } else {
      animatedLeft.set(position.left);
      animatedTop.set(position.top);
    }
  }, [position.left, position.top, animate, reducedMotion, animatedLeft, animatedTop]);

  const finalLeft = leftOverride ?? (animate && !reducedMotion ? clampedLeft : position.left);
  const finalTop = topOverride ?? (animate && !reducedMotion ? clampedTop : position.top);
  const isFlipped = flippedOverride ?? position.flipped;
  const transformOrigin = isFlipped ? "right top" : "left top";
  const flipKey = String(isFlipped);

  const panelClassName = cn(
    "min-w-0 break-words overflow-hidden rounded-lg text-fg-default shadow-lg",
    panelStyle?.backgroundColor === undefined &&
      backgroundColor === chartCssVars.tooltipBackground &&
      "bg-surface-floating",
    panelStyle?.backdropFilter === undefined && "backdrop-blur-md"
  );
  const panelStyleResolved = {
    transformOrigin,
    minWidth: Math.min(140, containerWidth),
    maxWidth: Math.max(0, containerWidth),
    ...(panelStyle?.backgroundColor === undefined && {
      backgroundColor,
    }),
    ...panelStyle,
  };

  if (!entrance || reducedMotion) {
    return createPortal(
      <motion.div
        className={cn("pointer-events-none absolute", className)}
        data-slot="chart-tooltip-box"
        ref={tooltipRef}
        style={{ left: finalLeft, top: finalTop, zIndex: 50, maxWidth: containerWidth }}
      >
        <div className={panelClassName} style={panelStyleResolved}>
          {children}
        </div>
      </motion.div>,
      container
    );
  }

  return createPortal(
    <motion.div
      animate={{ opacity: 1 }}
      className={cn("pointer-events-none absolute", className)}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      data-slot="chart-tooltip-box"
        ref={tooltipRef}
      style={{ left: finalLeft, top: finalTop, zIndex: 50, maxWidth: containerWidth }}
      transition={{ duration: 0.1 }}
    >
      <motion.div
        animate={{ scale: 1, opacity: 1, x: 0 }}
        className={panelClassName}
        initial={{ scale: 0.85, opacity: 0, x: isFlipped ? 20 : -20 }}
        key={flipKey}
        style={panelStyleResolved}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {children}
      </motion.div>
    </motion.div>,
    container
  );
}

TooltipBox.displayName = "TooltipBox";

export default TooltipBox;
