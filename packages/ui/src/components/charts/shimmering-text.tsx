"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "#system/utils";

/** Private replacement for the missing reference loading-label dependency. */
export function ShimmeringText({ text, className }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className={cn("bg-clip-text text-transparent", className)}
      style={{ backgroundImage: "linear-gradient(90deg, var(--fg-muted) 30%, var(--fg-default) 50%, var(--fg-muted) 70%)", backgroundSize: "200% 100%" }}
      animate={{ backgroundPosition: reduced ? "50% 0" : ["200% 0", "0% 0"] }}
      transition={reduced ? { duration: 0 } : { duration: 2, ease: "linear", repeat: Infinity }}
    >{text}</motion.span>
  );
}
