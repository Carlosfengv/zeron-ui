"use client";

import { TopNavAppShell } from "@zeron/blocks/top-nav-app-shell-01";
import { ZaiopsOperations } from "@zeron/blocks/zaiops-operations-01";
import { ResourceDetails } from "@zeron/blocks/resource-details-01";
import { ResourceListTable } from "@zeron/blocks/resource-list-table-01";
import { ResourceMetricList } from "@zeron/blocks/resource-metric-list-01";
import { ResourceStatusAll } from "@zeron/blocks/resource-status-all-01";
import { ProviderCreateForm } from "@zeron/blocks/provider-create-form-01";
import { ResourceCatalog } from "@zeron/blocks/resource-catalog-01";

export function BlockPreview({ name }: { name: string }) {
  if (name === "provider-create-form-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-2">
        <div className="w-[960px] origin-top scale-[0.3]">
          <ProviderCreateForm />
        </div>
      </div>
    );
  }

  if (name === "resource-catalog-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-3">
        <div className="w-[1560px] origin-top scale-[0.32]">
          <ResourceCatalog />
        </div>
      </div>
    );
  }

  if (name === "resource-details-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-3">
        <div className="w-[400px] origin-top scale-[0.48]">
          <ResourceDetails />
        </div>
      </div>
    );
  }

  if (name === "resource-metric-list-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-3">
        <div className="w-[700px] origin-top scale-[0.44]">
          <ResourceMetricList />
        </div>
      </div>
    );
  }

  if (name === "resource-list-table-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-raised p-3">
        <div className="w-[1120px] origin-top scale-[0.32]">
          <ResourceListTable />
        </div>
      </div>
    );
  }

  if (name === "resource-status-all-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-3">
        <div className="w-[701px] origin-top scale-[0.44]">
          <ResourceStatusAll />
        </div>
      </div>
    );
  }

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
