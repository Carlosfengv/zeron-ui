"use client";

import { ClusterEnvironmentDetail } from "@zeron/blocks/cluster-environment-detail-01";
import { ClusterEnvironmentList } from "@zeron/blocks/cluster-environment-list-01";
import { McpDetail } from "@zeron/blocks/mcp-detail-01";
import { ModelDetail } from "@zeron/blocks/model-detail-01";
import { PersonalSettings } from "@zeron/blocks/personal-settings-01";
import { ProviderCreateForm } from "@zeron/blocks/provider-create-form-01";
import { ResourceCatalog } from "@zeron/blocks/resource-catalog-01";
import { ResourceDetails } from "@zeron/blocks/resource-details-01";
import { ResourceListTable } from "@zeron/blocks/resource-list-table-01";
import { ResourceMetricList } from "@zeron/blocks/resource-metric-list-01";
import { ResourceStatusAll } from "@zeron/blocks/resource-status-all-01";
import { TopNavAppShell } from "@zeron/blocks/top-nav-app-shell-01";
import { ZaiopsOperations } from "@zeron/blocks/zaiops-operations-01";
import { ZlrWorkspace } from "@zeron/blocks/zlrlist";
import { AgentTrace } from "@zeron/blocks/agent-trace-01";
import { Button } from "@zeron/ui/button";
import { DetailBlockPreviewShell } from "@docs/pages/blocks/_components/DetailBlockPreviewShell";
import type { StandaloneBlockSlug } from "./standalone-blocks";

const centeredDemoClass = "flex h-full min-h-0 w-full items-center justify-center overflow-auto bg-surface-base p-4 sm:p-8";

export function StandaloneBlockDemo({ slug }: { slug: StandaloneBlockSlug }) {
  switch (slug) {
    case "agent-trace-01":
      return <AgentTrace className="h-full min-h-0 rounded-none border-0" />;
    case "cluster-environment-detail-01":
      return <ClusterEnvironmentDetail className="h-full" />;
    case "cluster-environment-list-01":
      return <ClusterEnvironmentList className="h-full min-h-0" />;
    case "mcp-detail-01":
      return <DetailBlockPreviewShell active="mcp"><McpDetail /></DetailBlockPreviewShell>;
    case "model-detail-01":
      return <DetailBlockPreviewShell active="models"><ModelDetail /></DetailBlockPreviewShell>;
    case "personal-settings-01":
      return <PersonalSettings />;
    case "provider-create-form-01":
      return <div className="h-full bg-surface-base"><ProviderCreateForm /></div>;
    case "resource-catalog-01":
      return <ResourceCatalog />;
    case "resource-details-01":
      return <div className={`${centeredDemoClass} items-start`}><ResourceDetails /></div>;
    case "resource-list-table-01":
      return <div className="h-full overflow-auto bg-surface-raised p-3 sm:p-6"><ResourceListTable /></div>;
    case "resource-metric-list-01":
      return <div className={centeredDemoClass}><ResourceMetricList /></div>;
    case "resource-status-all-01":
      return <div className={centeredDemoClass}><ResourceStatusAll /></div>;
    case "top-nav-app-shell-01":
      return (
        <TopNavAppShell
          className="h-full rounded-none border-0"
          brand="Zentrix"
          context="Capability center"
          activeHref="#mcp"
          actions={<Button type="button" size="md" variant="neutral" className="whitespace-nowrap px-2">Sign in</Button>}
          navigation={[
            { label: "Home", href: "#home" },
            { label: "Models", href: "#models" },
            { label: "MCP", href: "#mcp" },
          ]}
        >
          <section className="p-5 sm:p-6">
            <p className="text-caption text-fg-muted">MCP marketplace</p>
            <h1 className="mt-1 text-title text-fg-default">Extend your agents with reusable capabilities.</h1>
            <p className="mt-2 max-w-lg text-body text-fg-muted">A calm, top-led application frame for products where navigation should not compete with the working surface.</p>
          </section>
        </TopNavAppShell>
      );
    case "zaiops-operations-01":
      return <ZaiopsOperations title="Inspection overview" description="Review cluster health and governance tasks." />;
    case "zlrlist":
      return <ZlrWorkspace />;
  }
}
