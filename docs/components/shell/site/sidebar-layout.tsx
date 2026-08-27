"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { internalPathname } from "@docs/components/shell/site/locale-path";
import { SiteShell } from "@docs/components/shell/site/site-shell";

export function SidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pagePathname = internalPathname(pathname);
  const isFullscreen =
    pagePathname === "/demo" ||
    pagePathname === "/stars" ||
    pagePathname.startsWith("/concepts") ||
    pagePathname.startsWith("/block-demo/");

  if (isFullscreen) return <main className="min-h-screen">{children}</main>;

  return <SiteShell>{children}</SiteShell>;
}

export default SidebarLayout;
