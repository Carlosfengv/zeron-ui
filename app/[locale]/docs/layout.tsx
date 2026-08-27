import type { ReactNode } from "react";

export default function DocsLayout({ children }: { children: ReactNode }) {
  // This layout is rendered before client-side route state is available. Keep
  // it geometry-neutral so a slow navigation cannot temporarily constrain a
  // block workspace to the generic 960px documentation column.
  return <div className="w-full">{children}</div>;
}
