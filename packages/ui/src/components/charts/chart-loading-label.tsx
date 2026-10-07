"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "#system/utils";
import { ShimmeringText } from "./shimmering-text";
import {
  LINE_LOADING_PULSE_EASE,
  LOADING_LABEL_EXIT_S,
  LOADING_LABEL_EXIT_Y_PX,
} from "./line-loading-timing";

export interface ChartLoadingLabelProps {
  /** Label shown centered over the chart. */
  text?: string;
  className?: string;
  /** Animate down, fade, and blur during loading → ready handoff. */
  exiting?: boolean;
}

export function ChartLoadingLabel({
  text = "Loading",
  className,
  exiting = false,
}: ChartLoadingLabelProps) {
  const reducedMotion = useReducedMotion();
  if (!text.trim()) {
    return null;
  }

  return (
    <motion.div
      animate={{
        y: exiting && !reducedMotion ? LOADING_LABEL_EXIT_Y_PX : 0,
        opacity: exiting ? 0 : 1,
        filter: exiting && !reducedMotion ? "blur(2px)" : "blur(0px)",
      }}
      aria-live="polite"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        className
      )}
      initial={false}
      role="status"
      transition={{
        duration: reducedMotion ? 0 : LOADING_LABEL_EXIT_S,
        ease: [...LINE_LOADING_PULSE_EASE],
      }}
    >
      <ShimmeringText
        className="font-medium text-body tracking-wide [--color:var(--fg-muted)] [--shimmering-color:var(--fg-default)]"
        text={text}
      />
    </motion.div>
  );
}

export default ChartLoadingLabel;
