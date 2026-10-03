"use client";

import { DeferredDetailDemo } from "@docs/components/content/DeferredDetailDemo";

const loadDemo = () => import("@docs/components/shell/site/data-grid-demo").then((module) => module.DataGridDemo);

export function DeferredDataGridDemo({ height = 360, shortcuts = false, nearViewport = false }: { height?: number; shortcuts?: boolean; nearViewport?: boolean }) {
  return <DeferredDetailDemo loader={loadDemo} demoProps={{ height, shortcuts }} minHeight={height + (shortcuts ? 32 : 0)} nearViewport={nearViewport} />;
}
