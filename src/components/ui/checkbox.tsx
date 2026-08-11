"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<
  CheckboxPrimitive.Root.Props,
  "checked" | "indeterminate"
> & {
  checked?: boolean | "indeterminate";
  indeterminate?: boolean;
};

/**
 * A compact Base UI checkbox aligned with the controls used throughout
 * Zeron Design. Pass `checked="indeterminate"` or `indeterminate` for a
 * mixed state.
 */
function Checkbox({
  checked,
  className,
  indeterminate,
  ...props
}: CheckboxProps) {
  const isIndeterminate = checked === "indeterminate" || indeterminate;

  return (
    <CheckboxPrimitive.Root
      checked={checked === "indeterminate" ? false : checked}
      className={cn(
        "peer relative inline-flex size-[15px] shrink-0 cursor-pointer appearance-none items-center justify-center rounded-[5px] border-[1.5px] border-input bg-transparent p-0 text-fg-brand outline-none transition-[border-color,box-shadow,opacity] duration-80",
        "data-unchecked:hover:border-input-hover",
        "data-checked:border-transparent data-indeterminate:border-transparent",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      data-slot="checkbox"
      indeterminate={isIndeterminate}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-current transition-[opacity,transform] duration-80 data-starting-style:scale-75 data-starting-style:opacity-0 data-ending-style:scale-75 data-ending-style:opacity-0"
        data-slot="checkbox-indicator"
      >
        <motion.svg
          aria-hidden="true"
          className="size-[18px]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <motion.path
            animate={{ pathLength: 1 }}
            d={isIndeterminate ? "M7 12H17" : "M6 12L10 16L18 8"}
            initial={{ pathLength: 0 }}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            transition={{ duration: 0.08, ease: "easeOut" }}
          />
        </motion.svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
