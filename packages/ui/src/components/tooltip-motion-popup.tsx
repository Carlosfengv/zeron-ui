"use client";

import type { ComponentPropsWithRef } from "react";
import { motion } from "motion/react";
import { spring } from "#system/springs";

export default function TooltipMotionPopup({
  slideOffset,
  starting,
  exiting,
  // Let Motion own the drag and animation callbacks on the popup.
  onDrag: _onDrag,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  onAnimationStart: _onAnimationStart,
  onAnimationEnd: _onAnimationEnd,
  onAnimationIteration: _onAnimationIteration,
  ...props
}: ComponentPropsWithRef<"div"> & {
  slideOffset: { x?: number; y?: number };
  starting: boolean;
  exiting: boolean;
}) {
  const closed = { opacity: 0, ...slideOffset };
  return <motion.div
    {...props}
    initial={starting ? closed : false}
    animate={exiting ? closed : { opacity: 1, x: 0, y: 0 }}
    transition={exiting ? spring.fast.exit : spring.fast}
  />;
}
