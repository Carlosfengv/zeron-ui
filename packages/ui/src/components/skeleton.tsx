import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "#system/utils";

export type SkeletonProps = ComponentPropsWithoutRef<"div">;

/**
 * A decorative placeholder that preserves layout while content is loading.
 *
 * Size and shape are intentionally composed with `className` so a skeleton can
 * mirror the content it replaces without growing a second sizing API.
 */
const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, "aria-hidden": ariaHidden = true, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden={ariaHidden}
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-lg bg-emphasis motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
