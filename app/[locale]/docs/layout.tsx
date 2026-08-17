"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { internalPathname } from "@docs/components/shell/site/locale-path";
import { ComponentsDetailWorkspace } from "@docs/components/components/ComponentsGallery";

export default function DocsLayout({ children }: { children: ReactNode }) {
  const pathname = internalPathname(usePathname());
  const isBlocksCollection = pathname === "/docs/blocks";
  const isComponentsCollection = pathname === "/docs/components";
  const isComponentsDetail = pathname.startsWith("/docs/components/");
  const isBlocksDetail = pathname.startsWith("/docs/blocks/");
  const isBlocksWorkspace = pathname === "/docs/blocks" || pathname.startsWith("/docs/blocks/");

  if (isBlocksCollection) {
    return <div className="h-[calc(100svh-3rem)] min-h-0 w-full">{children}</div>;
  }

  if (isComponentsCollection) {
    return <div className="h-full min-h-0 w-full">{children}</div>;
  }

  if (isBlocksDetail) {
    return <div className="w-full">{children}</div>;
  }

  if (isComponentsDetail) {
    return <ComponentsDetailWorkspace>{children}</ComponentsDetailWorkspace>;
  }

  return (
    <div
      className={`mx-auto mt-12 w-full py-20 sm:py-28 lg:mt-0 ${
        isBlocksWorkspace ? "max-w-[1800px]" : "max-w-[960px]"
      }`}
    >
      {children}
    </div>
  );
}
