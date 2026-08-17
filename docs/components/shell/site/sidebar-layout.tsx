"use client";

import { lazy, Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const SiteShell = lazy(() =>
  import("@docs/components/shell/site/site-shell").then((module) => ({ default: module.SiteShell }))
);

export function SidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullscreen =
    pathname === "/demo" ||
    pathname === "/stars" ||
    pathname.startsWith("/concepts");

  if (isFullscreen) return <main className="min-h-screen">{children}</main>;

  return (
    <Suspense fallback={<div className="min-h-screen">{children}</div>}>
      <SiteShell>{children}</SiteShell>
    </Suspense>
  );
}

export default SidebarLayout;
