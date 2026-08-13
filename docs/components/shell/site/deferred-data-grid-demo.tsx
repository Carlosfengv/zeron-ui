"use client";

import dynamic from "next/dynamic";

const DataGridDemo = dynamic(
  () => import("@docs/components/shell/site/data-grid-demo").then((module) => module.DataGridDemo),
  { ssr: false }
);

export function DeferredDataGridDemo({ height = 360, shortcuts = false }: { height?: number; shortcuts?: boolean }) {
  return <DataGridDemo height={height} shortcuts={shortcuts} />;
}
