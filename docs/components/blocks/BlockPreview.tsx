"use client";

import { TopNavAppShell } from "@zeron/blocks/top-nav-app-shell-01";
import { ZaiopsOperations } from "@zeron/blocks/zaiops-operations-01";
import { PersonalSettings } from "@zeron/blocks/personal-settings-01";
import { ResourceDetails } from "@zeron/blocks/resource-details-01";
import { ResourceListTable } from "@zeron/blocks/resource-list-table-01";
import { ResourceMetricList } from "@zeron/blocks/resource-metric-list-01";
import { ResourceStatusAll } from "@zeron/blocks/resource-status-all-01";
import { ProviderCreateForm } from "@zeron/blocks/provider-create-form-01";
import { ResourceCatalog } from "@zeron/blocks/resource-catalog-01";
import { McpDetail } from "@zeron/blocks/mcp-detail-01";
import { ModelDetail } from "@zeron/blocks/model-detail-01";
import { ClusterEnvironmentList } from "@zeron/blocks/cluster-environment-list-01";
import { ClusterEnvironmentDetail } from "@zeron/blocks/cluster-environment-detail-01";
import { ZlrList } from "@zeron/blocks/zlrlist";

export function BlockPreview({ name }: { name: string }) {
  if (name === "mcp-detail-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-2">
        <div className="h-[900px] w-[1320px] origin-top scale-[0.26]">
          <McpDetail />
        </div>
      </div>
    );
  }

  if (name === "model-detail-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-2">
        <div className="h-[900px] w-[1320px] origin-top scale-[0.26]">
          <ModelDetail />
        </div>
      </div>
    );
  }

  if (name === "cluster-environment-detail-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-2">
        <div className="w-[1200px] origin-top scale-[0.27]">
          <ClusterEnvironmentDetail />
        </div>
      </div>
    );
  }

  if (name === "cluster-environment-list-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-2">
        <div className="w-[1200px] origin-top scale-[0.32]">
          <ClusterEnvironmentList />
        </div>
      </div>
    );
  }

  if (name === "personal-settings-01") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-2">
        <div className="w-[960px] origin-top scale-[0.26]">
          <PersonalSettings />
        </div>
      </div>
    );
  }

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

  if (name === "zlrlist") {
    return (
      <div className="flex h-52 justify-center overflow-hidden bg-surface-base p-2">
        <div className="h-[800px] w-[1280px] origin-top scale-[0.26]">
          <ZlrList />
        </div>
      </div>
    );
  }
  return null;
}
