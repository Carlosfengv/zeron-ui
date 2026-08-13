"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "#system/utils";

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
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <CheckboxPrimitive.Root
      checked={checked === "indeterminate" ? false : checked}
      className={cn(
        "peer relative inline-flex size-5 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-control border border-input bg-transparent p-0 text-fg-on-brand outline-none transition-[border-color,background-color,box-shadow,opacity,transform] duration-moderate active:scale-[.92] motion-reduce:active:scale-100",
        "data-unchecked:hover:border-input-hover",
        "data-checked:border-brand data-checked:bg-brand data-indeterminate:border-brand data-indeterminate:bg-brand",
        "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
        "aria-invalid:border-danger-border aria-invalid:ring-1 aria-invalid:ring-danger-border/30 aria-invalid:focus-visible:outline-1 aria-invalid:focus-visible:outline-focus-ring aria-invalid:focus-visible:outline-offset-2",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      data-slot="checkbox"
      indeterminate={isIndeterminate}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-current transition-[opacity,transform,filter] duration-moderate data-starting-style:scale-50 data-starting-style:opacity-0 data-ending-style:scale-50 data-ending-style:opacity-0 data-ending-style:blur-[4px]"
        data-slot="checkbox-indicator"
      >
        <motion.svg
          aria-hidden="true"
          className="size-3"
          fill="none"
          viewBox="0 0 24 24"
        >
          <motion.path
            animate={{ pathLength: 1 }}
            d={isIndeterminate ? "M6 12H18" : "M5 13L9 17L19 7"}
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: isIndeterminate ? 0.2 : 0.3,
                    ease: "easeOut",
                    delay: 0.04,
                  }
            }
          />
        </motion.svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
