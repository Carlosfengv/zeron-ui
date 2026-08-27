"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AvailabilityMonitor } from "@zeron/blocks/availability-monitor-01";
import { TopNavAppShell } from "@zeron/blocks/top-nav-app-shell-01";
import { ZaiopsOperations } from "@zeron/blocks/zaiops-operations-01";
import { PersonalSettings } from "@zeron/blocks/personal-settings-01";
import { PersonalModelUsage } from "@zeron/blocks/personal-model-usage-01";
import { PersonalUsage } from "@zeron/blocks/personal-usage-01";
import { ResourceSettings } from "@zeron/blocks/resource-settings-01";
import { ResourceDetails } from "@zeron/blocks/resource-details-01";
import { ResourceListTable } from "@zeron/blocks/resource-list-table-01";
import { InfiniteLogTable } from "@zeron/blocks/infinite-log-table-01";
import { FileManager, type FileManagerItem } from "@zeron/blocks/file-manager-01";
import { ResourceMetricList } from "@zeron/blocks/resource-metric-list-01";
import { ResourceStatusAll } from "@zeron/blocks/resource-status-all-01";
import { ProviderCreateForm } from "@zeron/blocks/provider-create-form-01";
import { ResourceCatalog } from "@zeron/blocks/resource-catalog-01";
import { McpDetail } from "@zeron/blocks/mcp-detail-01";
import { ModelDetail } from "@zeron/blocks/model-detail-01";
import { ClusterEnvironmentList } from "@zeron/blocks/cluster-environment-list-01";
import { ClusterEnvironmentDetail } from "@zeron/blocks/cluster-environment-detail-01";
import { InspectionReportList } from "@zeron/blocks/inspection-report-list-01";
import { MonitoringAlertList } from "@zeron/blocks/monitoring-alert-list-01";
import { ServiceManagement } from "@zeron/blocks/service-management-01";
import { ZlrList } from "@zeron/blocks/zlrlist";
import { AgentTrace } from "@zeron/blocks/agent-trace-01";
import { AgentSessionDetail } from "@zeron/blocks/agent-session-detail-01";

const fileManagerPreviewItems: FileManagerItem[] = [
  { id: "design", kind: "folder", name: "Design", parentId: null, modifiedAt: "2026-08-18" },
  { id: "reports", kind: "folder", name: "Reports", parentId: null, modifiedAt: "2026-08-14" },
  { id: "brief", kind: "file", name: "Project brief.pdf", parentId: null, extension: "pdf", size: 2_450_000, modifiedAt: "2026-08-20" },
  { id: "roadmap", kind: "file", name: "Roadmap.xlsx", parentId: null, extension: "xlsx", size: 645_000, modifiedAt: "2026-08-19" },
];

function ResponsivePreview({
  canvasHeight,
  canvasWidth,
  children,
  surface = "bg-surface-base",
}: {
  canvasHeight: number;
  canvasWidth: number;
  children: ReactNode;
  surface?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.32);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateScale = () => setScale(Math.max(0.01, container.clientWidth / canvasWidth));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasWidth]);

  return (
    <div ref={containerRef} className={`relative aspect-video w-full overflow-hidden ${surface}`}>
      <div
        className="origin-top-left"
        style={{ height: canvasHeight, transform: `scale(${scale})`, width: canvasWidth }}
      >
        {children}
      </div>
    </div>
  );
}

export function BlockPreview({ name }: { name: string }) {
  if (name === "availability-monitor-01") {
    return <ResponsivePreview canvasHeight={760} canvasWidth={1046}><div className="min-h-full bg-surface-base p-8"><AvailabilityMonitor /></div></ResponsivePreview>;
  }

  if (name === "agent-trace-01") {
    return <ResponsivePreview canvasHeight={760} canvasWidth={1160}><AgentTrace className="h-full min-h-0 rounded-none border-0" /></ResponsivePreview>;
  }

  if (name === "agent-session-detail-01") {
    return <ResponsivePreview canvasHeight={760} canvasWidth={1160}><AgentSessionDetail className="h-full min-h-0" /></ResponsivePreview>;
  }

  if (name === "mcp-detail-01") {
    return (
      <ResponsivePreview canvasHeight={900} canvasWidth={1320}><McpDetail /></ResponsivePreview>
    );
  }

  if (name === "model-detail-01") {
    return (
      <ResponsivePreview canvasHeight={900} canvasWidth={1320}><ModelDetail /></ResponsivePreview>
    );
  }

  if (name === "cluster-environment-detail-01") {
    return (
      <ResponsivePreview canvasHeight={900} canvasWidth={1200}><ClusterEnvironmentDetail /></ResponsivePreview>
    );
  }

  if (name === "cluster-environment-list-01") {
    return (
      <ResponsivePreview canvasHeight={900} canvasWidth={1200}><ClusterEnvironmentList /></ResponsivePreview>
    );
  }

  if (name === "inspection-report-list-01") {
    return (
      <ResponsivePreview canvasHeight={760} canvasWidth={1280}><InspectionReportList className="h-full min-h-0" /></ResponsivePreview>
    );
  }

  if (name === "monitoring-alert-list-01") {
    return (
      <ResponsivePreview canvasHeight={760} canvasWidth={1280}><MonitoringAlertList className="h-full min-h-0" /></ResponsivePreview>
    );
  }

  if (name === "service-management-01") {
    return (
      <ResponsivePreview canvasHeight={760} canvasWidth={1280}><ServiceManagement className="h-full min-h-0" /></ResponsivePreview>
    );
  }

  if (name === "personal-settings-01") {
    return (
      <ResponsivePreview canvasHeight={900} canvasWidth={960}><PersonalSettings /></ResponsivePreview>
    );
  }

  if (name === "personal-model-usage-01") {
    return <ResponsivePreview canvasHeight={900} canvasWidth={960}><PersonalModelUsage /></ResponsivePreview>;
  }

  if (name === "personal-usage-01") {
    return <ResponsivePreview canvasHeight={900} canvasWidth={960}><PersonalUsage /></ResponsivePreview>;
  }

  if (name === "resource-settings-01") {
    return <ResponsivePreview canvasHeight={900} canvasWidth={960}><ResourceSettings /></ResponsivePreview>;
  }

  if (name === "provider-create-form-01") {
    return (
      <ResponsivePreview canvasHeight={760} canvasWidth={960}><ProviderCreateForm /></ResponsivePreview>
    );
  }

  if (name === "resource-catalog-01") {
    return (
      <ResponsivePreview canvasHeight={900} canvasWidth={1560}><ResourceCatalog /></ResponsivePreview>
    );
  }

  if (name === "resource-details-01") {
    return (
      <ResponsivePreview canvasHeight={520} canvasWidth={400}><ResourceDetails /></ResponsivePreview>
    );
  }

  if (name === "resource-metric-list-01") {
    return (
      <ResponsivePreview canvasHeight={560} canvasWidth={700}><ResourceMetricList /></ResponsivePreview>
    );
  }

  if (name === "resource-list-table-01") {
    return (
      <ResponsivePreview canvasHeight={700} canvasWidth={1120} surface="bg-surface-raised"><ResourceListTable /></ResponsivePreview>
    );
  }

  if (name === "infinite-log-table-01") {
    return (
      <ResponsivePreview canvasHeight={700} canvasWidth={1120} surface="bg-surface-raised"><InfiniteLogTable className="h-full rounded-none border-0" /></ResponsivePreview>
    );
  }

  if (name === "file-manager-01") {
    return (
      <ResponsivePreview canvasHeight={700} canvasWidth={1120} surface="bg-surface-raised">
        <FileManager className="h-full rounded-none border-0" items={fileManagerPreviewItems} />
      </ResponsivePreview>
    );
  }

  if (name === "resource-status-all-01") {
    return (
      <ResponsivePreview canvasHeight={560} canvasWidth={701}><ResourceStatusAll /></ResponsivePreview>
    );
  }

  if (name === "top-nav-app-shell-01") {
    return (
      <ResponsivePreview canvasHeight={560} canvasWidth={960}>
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
      </ResponsivePreview>
    );
  }

  if (name === "zaiops-operations-01") {
    return (
      <ResponsivePreview canvasHeight={760} canvasWidth={1280}><ZaiopsOperations className="h-full min-h-0" /></ResponsivePreview>
    );
  }

  if (name === "zlrlist") {
    return (
      <ResponsivePreview canvasHeight={800} canvasWidth={1280}><ZlrList /></ResponsivePreview>
    );
  }
  return null;
}
