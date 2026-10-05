"use client";

import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Alert, AlertAction, AlertDescription, AlertIcon, AlertTitle } from "#components/alert";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";

export interface ErrorStateProps extends Omit<ComponentPropsWithoutRef<"div">, "title" | "children"> {
  title: ReactNode;
  description?: ReactNode;
  /** Consumer-owned action, such as a retry Button with its own pending state. */
  action?: ReactNode;
  scope?: "page" | "section" | "inline";
  /** Opts a newly reported error into a live region. Static examples stay silent. */
  announce?: boolean;
}

const scopeClasses = {
  page: "min-h-[min(60vh,36rem)] px-6 py-12 sm:px-10 sm:py-16",
  section: "min-h-60 px-4 py-8",
  inline: "px-0 py-0",
};

/** A confirmed failure, distinct from a successful request with zero results. */
const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  ({ title, description, action, scope = "section", announce = false, role, className, ...props }, ref) => {
    const titleId = useId();
    const ErrorIcon = useIcon("circle-x");

    return (
      <div
        {...props}
        ref={ref}
        role={role ?? (announce ? "alert" : undefined)}
        data-slot="error-state"
        data-scope={scope}
        className={cn("flex min-w-0 w-full items-center justify-center", scopeClasses[scope], className)}
      >
        <Alert aria-labelledby={titleId} className="w-full max-w-xl" role="group" status="danger">
          <AlertIcon><ErrorIcon /></AlertIcon>
          <AlertTitle id={titleId}>{title}</AlertTitle>
          {description != null && <AlertDescription>{description}</AlertDescription>}
          {action != null && <AlertAction>{action}</AlertAction>}
        </Alert>
      </div>
    );
  },
);

ErrorState.displayName = "ErrorState";

export { ErrorState };
