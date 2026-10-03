"use client";

import { useLinkStatus } from "next/link";
import { NavItemContent, NavItemLabel } from "@zeron/ui/nav-item";

/** Router-owned pending state also covers an uncached loading boundary itself.
 * Keeping it inside Link preserves cancellation, modifier clicks and history.
 */
export function PrimaryNavigationLabel({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useLinkStatus();

  return (
    <NavItemContent>
      <NavItemLabel className={pending ? "text-fg-brand" : undefined}>{label}</NavItemLabel>
      {pending && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 animate-pulse rounded-full bg-fg-brand motion-reduce:animate-none"
          data-navigation-pending="true"
        />
      )}
      <span className="sr-only" role="status">{pending ? loadingLabel : ""}</span>
    </NavItemContent>
  );
}
