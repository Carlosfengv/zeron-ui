"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { internalPathname } from "@docs/components/shell/site/locale-path";

export default function DocsLayout({ children }: { children: ReactNode }) {
  const pathname = internalPathname(usePathname());
  const isBlocksWorkspace = pathname === "/docs/blocks" || pathname.startsWith("/docs/blocks/");

  return (
    <div
      className={`mx-auto mt-12 w-full py-20 sm:py-28 lg:mt-0 ${
        isBlocksWorkspace ? "max-w-[1440px]" : "max-w-[960px]"
      }`}
    >
      {children}
    </div>
  );
}
