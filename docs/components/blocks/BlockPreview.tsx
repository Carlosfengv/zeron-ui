"use client";

import { TopNavAppShell } from "@zeron/blocks/top-nav-app-shell-01";
import { ZaiopsOperations } from "@zeron/blocks/zaiops-operations-01";

export function BlockPreview({ name }: { name: string }) {
  if (name === "top-nav-app-shell-01") {
    return (
      <div className="h-52 overflow-hidden">
        <TopNavAppShell
          className="h-full min-h-0 border-0"
          brand="Zentrix"
          context={null}
          activeHref="#mcp"
          navigation={[{ label: "Home", href: "#home" }, { label: "Models", href: "#models" }, { label: "MCP", href: "#mcp" }]}
        >
          <div className="p-5">
            <p className="text-label text-fg-muted">MCP marketplace</p>
            <p className="mt-2 text-title font-semibold text-fg-default">A focused capability surface.</p>
          </div>
        </TopNavAppShell>
      </div>
    );
  }

  if (name === "zaiops-operations-01") {
    return (
      <div className="h-52 overflow-hidden">
        <ZaiopsOperations className="h-full min-h-0" />
      </div>
    );
  }
  return null;
}
