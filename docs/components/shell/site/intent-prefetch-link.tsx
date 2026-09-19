"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

/** Gallery cards should not download every visible detail page on arrival. */
export function IntentPrefetchLink({ onMouseEnter, onFocus, ...props }: Omit<ComponentProps<typeof Link>, "prefetch">) {
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
    />
  );
}
