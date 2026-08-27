"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import { SurfaceProvider } from "#system/surface-context";
import { cn } from "#system/utils";

/**
 * A composable, raised container for one cohesive area of work. It is a
 * surface component — like Card — rather than a page-layout primitive. Its
 * optional header and footer stay on the raised frame while the body becomes
 * the floating content surface.
 */
export type ContainerProps = ComponentPropsWithoutRef<"div">;
export type ContainerHeaderProps = ComponentPropsWithoutRef<"header">;
export interface ContainerBodyProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Caps a content-driven body and lets its overflowing content scroll
   * vertically. Leave unset when the body should grow with its content.
   */
  maxHeight?: CSSProperties["maxHeight"];
}
export type ContainerFooterProps = ComponentPropsWithoutRef<"footer">;

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, ...props }, ref) => (
    <SurfaceProvider role="raised">
      <div
        ref={ref}
        data-slot="container"
        className={cn(
          "flex min-h-0 min-w-0 flex-col gap-2 rounded-3xl bg-surface-raised p-2",
          className
        )}
        {...props}
      />
    </SurfaceProvider>
  )
);

Container.displayName = "Container";

const ContainerHeader = forwardRef<HTMLElement, ContainerHeaderProps>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      data-slot="container-header"
      className={cn(
        "flex shrink-0 min-w-0 flex-wrap items-center justify-between gap-2 px-3",
        className
      )}
      {...props}
    />
  )
);

ContainerHeader.displayName = "ContainerHeader";

const ContainerBody = forwardRef<HTMLDivElement, ContainerBodyProps>(
  ({ className, maxHeight, style, ...props }, ref) => (
    <SurfaceProvider role="floating">
      <div
        ref={ref}
        data-slot="container-body"
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain rounded-2xl border-[0.5px] border-border bg-surface-floating p-4",
          className
        )}
        style={maxHeight === undefined ? style : { ...style, maxHeight }}
        {...props}
      />
    </SurfaceProvider>
  )
);

ContainerBody.displayName = "ContainerBody";

const ContainerFooter = forwardRef<HTMLElement, ContainerFooterProps>(
  ({ className, ...props }, ref) => (
    <footer
      ref={ref}
      data-slot="container-footer"
      className={cn(
        "flex shrink-0 min-w-0 flex-wrap items-center justify-end gap-2 px-3 py-2",
        className
      )}
      {...props}
    />
  )
);

ContainerFooter.displayName = "ContainerFooter";

export {
  Container,
  ContainerHeader,
  ContainerBody,
  ContainerFooter,
};
