"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import type { FileManagerItem } from "@zeron/blocks/file-manager-01";

const fileManagerPreviewItems: FileManagerItem[] = [
  { id: "design", kind: "folder", name: "Design", parentId: null, modifiedAt: "2026-08-18" },
  { id: "reports", kind: "folder", name: "Reports", parentId: null, modifiedAt: "2026-08-14" },
  { id: "brief", kind: "file", name: "Project brief.pdf", parentId: null, extension: "pdf", size: 2_450_000, modifiedAt: "2026-08-20" },
  { id: "roadmap", kind: "file", name: "Roadmap.xlsx", parentId: null, extension: "xlsx", size: 645_000, modifiedAt: "2026-08-19" },
];

type PreviewModule = { default: ComponentType };
type PreviewLoader = () => Promise<PreviewModule>;

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
      <div className="origin-top-left" style={{ height: canvasHeight, transform: `scale(${scale})`, width: canvasWidth }}>
        {children}
      </div>
    </div>
  );
}

const previewLoaders: Record<string, PreviewLoader> = {
  "availability-monitor-01": () => import("@zeron/blocks/availability-monitor-01").then(({ AvailabilityMonitor }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1046}><div className="min-h-full bg-surface-base p-8"><AvailabilityMonitor /></div></ResponsivePreview>,
  })),
  "agent-trace-01": () => import("@zeron/blocks/agent-trace-01").then(({ AgentTrace }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1160}><AgentTrace className="h-full min-h-0 rounded-none border-0" /></ResponsivePreview>,
  })),
  "agent-session-detail-01": () => import("@zeron/blocks/agent-session-detail-01").then(({ AgentSessionDetail }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1160}><AgentSessionDetail className="h-full min-h-0" /></ResponsivePreview>,
  })),
  "mcp-detail-01": () => import("@zeron/blocks/mcp-detail-01").then(({ McpDetail }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={1320}><McpDetail /></ResponsivePreview>,
  })),
  "model-detail-01": () => import("@zeron/blocks/model-detail-01").then(({ ModelDetail }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={1320}><ModelDetail /></ResponsivePreview>,
  })),
  "cluster-environment-detail-01": () => import("@zeron/blocks/cluster-environment-detail-01").then(({ ClusterEnvironmentDetail }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={1200}><ClusterEnvironmentDetail /></ResponsivePreview>,
  })),
  "cluster-environment-list-01": () => import("@zeron/blocks/cluster-environment-list-01").then(({ ClusterEnvironmentList }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={1200}><ClusterEnvironmentList /></ResponsivePreview>,
  })),
  "inspection-report-list-01": () => import("@zeron/blocks/inspection-report-list-01").then(({ InspectionReportList }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1280}><InspectionReportList className="h-full min-h-0" /></ResponsivePreview>,
  })),
  "monitoring-alert-list-01": () => import("@zeron/blocks/monitoring-alert-list-01").then(({ MonitoringAlertList }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1280}><MonitoringAlertList className="h-full min-h-0" /></ResponsivePreview>,
  })),
  "service-management-01": () => import("@zeron/blocks/service-management-01").then(({ ServiceManagement }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1280}><ServiceManagement className="h-full min-h-0" /></ResponsivePreview>,
  })),
  "personal-settings-01": () => import("@zeron/blocks/personal-settings-01").then(({ PersonalSettings }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={960}><PersonalSettings /></ResponsivePreview>,
  })),
  "personal-model-usage-01": () => import("@zeron/blocks/personal-model-usage-01").then(({ PersonalModelUsage }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={960}><PersonalModelUsage /></ResponsivePreview>,
  })),
  "personal-usage-01": () => import("@zeron/blocks/personal-usage-01").then(({ PersonalUsage }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={960}><PersonalUsage /></ResponsivePreview>,
  })),
  "resource-settings-01": () => import("@zeron/blocks/resource-settings-01").then(({ ResourceSettings }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={960}><ResourceSettings /></ResponsivePreview>,
  })),
  "provider-create-form-01": () => import("@zeron/blocks/provider-create-form-01").then(({ ProviderCreateForm }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={960}><ProviderCreateForm /></ResponsivePreview>,
  })),
  "resource-catalog-01": () => import("@zeron/blocks/resource-catalog-01").then(({ ResourceCatalog }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={1560}><ResourceCatalog /></ResponsivePreview>,
  })),
  "resource-details-01": () => import("@zeron/blocks/resource-details-01").then(({ ResourceDetails }) => ({
    default: () => <ResponsivePreview canvasHeight={520} canvasWidth={400}><ResourceDetails /></ResponsivePreview>,
  })),
  "resource-metric-list-01": () => import("@zeron/blocks/resource-metric-list-01").then(({ ResourceMetricList }) => ({
    default: () => <ResponsivePreview canvasHeight={560} canvasWidth={700}><ResourceMetricList /></ResponsivePreview>,
  })),
  "resource-list-table-01": () => import("@zeron/blocks/resource-list-table-01").then(({ ResourceListTable }) => ({
    default: () => <ResponsivePreview canvasHeight={700} canvasWidth={1120} surface="bg-surface-raised"><ResourceListTable /></ResponsivePreview>,
  })),
  "infinite-log-table-01": () => import("@zeron/blocks/infinite-log-table-01").then(({ InfiniteLogTable }) => ({
    default: () => <ResponsivePreview canvasHeight={700} canvasWidth={1120} surface="bg-surface-raised"><InfiniteLogTable className="h-full rounded-none border-0" /></ResponsivePreview>,
  })),
  "file-manager-01": () => import("@zeron/blocks/file-manager-01").then(({ FileManager }) => ({
    default: () => <ResponsivePreview canvasHeight={700} canvasWidth={1120} surface="bg-surface-raised"><FileManager className="h-full rounded-none border-0" items={fileManagerPreviewItems} /></ResponsivePreview>,
  })),
  "resource-status-all-01": () => import("@zeron/blocks/resource-status-all-01").then(({ ResourceStatusAll }) => ({
    default: () => <ResponsivePreview canvasHeight={560} canvasWidth={701}><ResourceStatusAll /></ResponsivePreview>,
  })),
  "top-nav-app-shell-01": () => import("@zeron/blocks/top-nav-app-shell-01").then(({ TopNavAppShell }) => ({
    default: () => (
      <ResponsivePreview canvasHeight={560} canvasWidth={960}>
        <TopNavAppShell className="h-full min-h-0 border-0" brand="Zentrix" context={null} activeHref="#mcp" navigation={[{ label: "Home", href: "#home" }, { label: "Models", href: "#models" }, { label: "MCP", href: "#mcp" }]}>
          <div className="p-5"><p className="text-label text-fg-muted">MCP marketplace</p><p className="mt-2 text-title font-semibold text-fg-default">A focused capability surface.</p></div>
        </TopNavAppShell>
      </ResponsivePreview>
    ),
  })),
  "zaiops-operations-01": () => import("@zeron/blocks/zaiops-operations-01").then(({ ZaiopsOperations }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1280}><ZaiopsOperations className="h-full min-h-0" /></ResponsivePreview>,
  })),
  zlrlist: () => import("@zeron/blocks/zlrlist").then(({ ZlrList }) => ({
    default: () => <ResponsivePreview canvasHeight={800} canvasWidth={1280}><ZlrList /></ResponsivePreview>,
  })),
};

function PreviewPlaceholder() {
  return <div aria-hidden="true" className="aspect-video w-full animate-pulse bg-surface-raised" />;
}

function usePreviewVisibility() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { isVisible, ref };
}

export function BlockPreview({ name }: { name: string }) {
  const { isVisible, ref } = usePreviewVisibility();
  const [Preview, setPreview] = useState<ComponentType | null>(null);
  const loader = previewLoaders[name];

  useEffect(() => {
    if (!isVisible || !loader || Preview) return;
    let cancelled = false;
    void loader().then((module) => {
      if (!cancelled) setPreview(() => module.default);
    });
    return () => {
      cancelled = true;
    };
  }, [Preview, isVisible, loader]);

  return <div ref={ref} className="w-full">{Preview ? <Preview /> : <PreviewPlaceholder />}</div>;
}
