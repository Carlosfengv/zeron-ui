"use client";

import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
} from "react";
import { cn } from "#system/utils";

/** Semantic intent for a page-level callout. */
export type AlertStatus = "default" | "neutral" | "info" | "warning" | "danger";

const statusClasses: Record<AlertStatus, string> = {
  default: "border-border bg-surface-floating text-fg-default",
  neutral:
    "border-neutral-status-border bg-neutral-status-surface text-fg-neutral-status",
  info: "border-info-border bg-info-surface text-fg-info",
  warning: "border-warning-border bg-warning-surface text-fg-warning",
  danger: "border-danger-border bg-danger-surface text-fg-danger",
};

const AlertStatusContext = createContext<AlertStatus>("default");

export interface AlertProps extends ComponentPropsWithoutRef<"div"> {
  /** Semantic intent. It controls the alert's surface, border, and foreground token. */
  status?: AlertStatus;
}

/**
 * A persistent, in-context callout for status, guidance, warnings, and errors.
 *
 * Compose it from an optional AlertIcon, an AlertTitle, an optional
 * AlertDescription, and an optional AlertAction. The action moves below the
 * message on narrow screens instead of compressing the content.
 */
const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ status = "default", role, className, ...props }, ref) => (
    <AlertStatusContext.Provider value={status}>
      <div
        ref={ref}
        role={role ?? (status === "danger" ? "alert" : "status")}
        data-slot="alert"
        data-status={status}
        className={cn(
          "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 rounded-xl border px-3 py-2.5",
          "sm:grid-cols-[auto_minmax(0,1fr)_auto]",
          statusClasses[status],
          className
        )}
        {...props}
      />
    </AlertStatusContext.Provider>
  )
);

Alert.displayName = "Alert";

export type AlertIconProps = ComponentPropsWithoutRef<"div">;

/** A presentational leading icon. Its colour follows the parent Alert status. */
const AlertIcon = forwardRef<HTMLDivElement, AlertIconProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="alert-icon"
      className={cn(
        "col-start-1 row-span-2 mt-0.5 flex size-5 shrink-0 items-center justify-center",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
);

AlertIcon.displayName = "AlertIcon";

export type AlertTitleProps = ComponentPropsWithoutRef<"div">;

/** The primary, single-line capable message for an Alert. */
const AlertTitle = forwardRef<HTMLDivElement, AlertTitleProps>(
  ({ className, ...props }, ref) => {
    const status = useContext(AlertStatusContext);

    return (
      <div
        ref={ref}
        data-slot="alert-title"
        className={cn(
          "col-start-2 min-w-0 text-body leading-5 font-medium",
          status === "default" && "text-fg-default",
          className
        )}
        {...props}
      />
    );
  }
);

AlertTitle.displayName = "AlertTitle";

export type AlertDescriptionProps = ComponentPropsWithoutRef<"div">;

/** Optional supporting detail. Rendering this creates the standard two-line alert. */
const AlertDescription = forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => {
    const status = useContext(AlertStatusContext);

    return (
      <div
        ref={ref}
        data-slot="alert-description"
        className={cn(
          "col-start-2 min-w-0 text-label leading-5",
          status === "default" && "text-fg-muted",
          className
        )}
        {...props}
      />
    );
  }
);

AlertDescription.displayName = "AlertDescription";

export type AlertActionProps = ComponentPropsWithoutRef<"div">;

/** Optional action slot for a Button, link, or other compact interactive element. */
const AlertAction = forwardRef<HTMLDivElement, AlertActionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="alert-action"
      className={cn(
        "col-start-2 mt-2 flex min-w-0 items-center gap-2",
        "sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:self-start",
        className
      )}
      {...props}
    />
  )
);

AlertAction.displayName = "AlertAction";

export { Alert, AlertAction, AlertDescription, AlertIcon, AlertTitle };
