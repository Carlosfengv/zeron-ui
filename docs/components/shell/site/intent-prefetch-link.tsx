"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";
import { LinkPendingIndicator } from "./link-pending-indicator";

/** Prefetch only the card the visitor is about to open. */
export function IntentPrefetchLink({ children, onMouseEnter, onFocus, ...props }: Omit<ComponentProps<typeof Link>, "prefetch">) {
  const [hasIntent, setHasIntent] = useState(false);

  return (
    <Link
      {...props}
      prefetch={hasIntent ? null : false}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (!event.defaultPrevented) setHasIntent(true);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) setHasIntent(true);
      }}
    >
      {children}
      <LinkPendingIndicator className="absolute right-3 top-3 rounded-full bg-surface-floating p-1.5 shadow-control" />
    </Link>
  );
}
