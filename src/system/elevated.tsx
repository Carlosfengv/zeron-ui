"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  resolveSurface,
  useSurface,
  SurfaceProvider,
} from "@/lib/surface-context";
import {
  surfaceClasses,
  type ShadowRole,
  type SurfaceRole,
} from "@/lib/surface-classes";

interface ElevatedProps extends ComponentPropsWithoutRef<"div"> {
  /** Lowest semantic role for this container. Nested surfaces resolve to the
   * next available role and stop at `top`. */
  surface?: Exclude<SurfaceRole, "base">;
  /**
   * The component's spatial-separation role. It stays independent from the
   * relative background level: a dropdown inside a dialog can use the top
   * surface while retaining a floating shadow.
   */
  shadow?: ShadowRole;
  children?: ReactNode;
}

const Elevated = forwardRef<HTMLDivElement, ElevatedProps>(
  (
    {
      surface = "floating",
      shadow = "floating",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const substrate = useSurface();
    const role = resolveSurface(substrate, surface);
    return (
      <SurfaceProvider role={role}>
        <div
          ref={ref}
          className={cn(surfaceClasses(role, shadow), className)}
          data-surface={role}
          {...props}
        >
          {children}
        </div>
      </SurfaceProvider>
    );
  }
);
Elevated.displayName = "Elevated";

export { Elevated };
