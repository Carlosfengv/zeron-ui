"use client";

import type { ReactNode } from "react";
import { ComponentsDetailWorkspace } from "@docs/components/components/ComponentsGallery";

export default function ComponentDocumentationLayout({ children }: { children: ReactNode }) {
  return <ComponentsDetailWorkspace>{children}</ComponentsDetailWorkspace>;
}
