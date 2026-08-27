"use client";

import { lazy, Suspense } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { internalPathname } from "@docs/components/shell/site/locale-path";

const ComponentsDetailWorkspace = lazy(() =>
  import("@docs/components/components/ComponentsGallery").then((module) => ({ default: module.ComponentsDetailWorkspace }))
);

export default function DocsLayout({ children }: { children: ReactNode }) {
  const pathname = internalPathname(usePathname());
  const isBlocksCollection = pathname === "/docs/blocks";
  const isComponentsCollection = pathname === "/docs/components";
  const isIconsCollection = pathname === "/docs/icons";
  const isComponentsDetail = pathname.startsWith("/docs/components/");
  const isBlocksDetail = pathname.startsWith("/docs/blocks/");
  const isBlocksWorkspace = pathname === "/docs/blocks" || pathname.startsWith("/docs/blocks/");

  if (isBlocksCollection) {
    return <div className="h-[calc(100svh-3rem)] min-h-0 w-full">{children}</div>;
  }

  if (isComponentsCollection) {
    return <div className="h-full min-h-0 w-full">{children}</div>;
  }

  if (isIconsCollection) return children;

  if (isBlocksDetail) {
    return <div className="w-full">{children}</div>;
  }

  if (isComponentsDetail) {
    return (
      <Suspense fallback={<div className="h-full min-h-0 w-full">{children}</div>}>
        <ComponentsDetailWorkspace>{children}</ComponentsDetailWorkspace>
      </Suspense>
    );
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
