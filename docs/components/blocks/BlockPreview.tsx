"use client";

import { startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
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
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
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
      {/* Zoom lays out text at its displayed size; transform would blur it. */}
      <div style={{ height: canvasHeight, width: canvasWidth, zoom: scale }}>
        {children}
      </div>
    </div>
  );
}

const previewLoaders: Record<string, PreviewLoader> = {
  "workflow": () => import("@/app/(internal)/workflow/_components/workflow-preview").then(({ WorkflowPreview }) => ({
    default: () => <ResponsivePreview canvasHeight={1060} canvasWidth={1824}><WorkflowPreview /></ResponsivePreview>,
  })),
  "login-01": () => import("@zeron/blocks/login-01").then(({ Login01 }) => ({
    default: () => <ResponsivePreview canvasHeight={600} canvasWidth={1024}><Login01 className="h-full min-h-0" landmark={false} /></ResponsivePreview>,
  })),
  "signup-01": () => import("@zeron/blocks/signup-01").then(({ Signup01 }) => ({
    default: () => <ResponsivePreview canvasHeight={600} canvasWidth={1024}><Signup01 className="h-full min-h-0" landmark={false} /></ResponsivePreview>,
  })),
  "availability-monitor-01": () => import("@zeron/blocks/availability-monitor-01").then(({ AvailabilityMonitor }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1046}><div className="min-h-full bg-surface-base p-8"><AvailabilityMonitor /></div></ResponsivePreview>,
  })),
  "ai-gateway-overview-01": () => import("@zeron/blocks/ai-gateway-overview-01").then(({ AiGatewayOverview, createAiGatewayOverviewDemoData }) => ({
    default: function AiGatewayOverviewPreview() {
      const [range, setRange] = useState<"1d" | "7d" | "30d" | "90d">("30d");
      const [refreshCount, setRefreshCount] = useState(0);
      const data = useMemo(() => {
        const next = createAiGatewayOverviewDemoData(range);
        return {
          ...next,
          window: {
            ...next.window,
            generatedAt: new Date(Date.parse(next.window.generatedAt) + refreshCount * 1000).toISOString(),
          },
        };
      }, [range, refreshCount]);

      return (
        <ResponsivePreview canvasHeight={1200} canvasWidth={1728}>
          <AiGatewayOverview
            actions={{
              onRangeChange: setRange,
              onRefresh: () => setRefreshCount((value) => value + 1),
            }}
            className="h-full min-h-0"
            data={data}
            range={range}
          />
        </ResponsivePreview>
      );
    },
  })),
  "ai-gateway-session-list-01": () => import("@zeron/blocks/ai-gateway-session-list-01").then(({ AiGatewaySessionList, aiGatewaySessionListDemoData, aiGatewaySessionListDemoQuery }) => ({
    default: () => (
      <ResponsivePreview canvasHeight={760} canvasWidth={1440}>
        <AiGatewaySessionList
          className="h-full min-h-0"
          data={aiGatewaySessionListDemoData}
          now={aiGatewaySessionListDemoData.generatedAt}
          query={aiGatewaySessionListDemoQuery}
        />
      </ResponsivePreview>
    ),
  })),
  "agent-message-trace-01": () => import("@zeron/blocks/agent-message-trace-01").then(({ AgentMessageTrace, agentMessageTraceDemoData }) => ({
    default: () => (
      <ResponsivePreview canvasHeight={760} canvasWidth={1160}>
        <div className="h-full bg-surface-base p-6">
          <AgentMessageTrace
            className="h-full min-h-0 w-full rounded-xl"
            data={agentMessageTraceDemoData}
            nowOffsetMs={154_000}
          />
        </div>
      </ResponsivePreview>
    ),
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
  "model-detail-02": () => import("@zeron/blocks/model-detail-02").then(({ ModelDetail02 }) => ({
    default: () => <ResponsivePreview canvasHeight={960} canvasWidth={1440}><ModelDetail02 className="h-full min-h-0" /></ResponsivePreview>,
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
  "traffic-rules-01": () => import("@zeron/blocks/traffic-rules-01").then(({ TrafficRules }) => ({
    default: () => <ResponsivePreview canvasHeight={810} canvasWidth={1440}><TrafficRules className="h-full min-h-0" /></ResponsivePreview>,
  })),
  "personal-settings-01": () => import("./AccountBlocksDemo").then(({ PersonalSettingsDemo: PersonalSettings }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={960}><PersonalSettings /></ResponsivePreview>,
  })),
  "personal-model-usage-01": () => import("@zeron/blocks/personal-model-usage-01").then(({ PersonalModelUsage }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={960}><PersonalModelUsage /></ResponsivePreview>,
  })),
  "storage-usage-01": () => import("@zeron/blocks/storage-usage-01").then(({ StorageUsage, storageUsageDemoData }) => ({
    default: () => <ResponsivePreview canvasHeight={360} canvasWidth={1040}><div className="flex min-h-full items-center justify-center bg-surface-base p-8"><StorageUsage data={storageUsageDemoData} /></div></ResponsivePreview>,
  })),
  "credit-usage-01": () => import("@zeron/blocks/credit-usage-01").then(({ CreditUsage, creditUsageDemoData }) => ({
    default: function CreditUsagePreview() {
      const [cycle, setCycle] = useState<"current" | "previous">("current");
      const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);

      return (
        <ResponsivePreview canvasHeight={820} canvasWidth={1080}>
          <div className="flex min-h-full items-center justify-center bg-surface-base p-10">
            <CreditUsage
              actions={{
                onAutoSwitchChange: setAutoSwitchEnabled,
                onCycleChange: setCycle,
                onSetLimit: () => undefined,
                onUpgrade: () => undefined,
              }}
              autoSwitchEnabled={autoSwitchEnabled}
              cycle={cycle}
              data={creditUsageDemoData}
            />
          </div>
        </ResponsivePreview>
      );
    },
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
  "filter-rule-builder-01": () => import("@zeron/blocks/filter-rule-builder-01").then(({ FilterRuleBuilder, filterRuleBuilderDemoDraft, filterRuleBuilderDemoFields, filterRuleBuilderDemoPresets, filterRuleBuilderDemoValue }) => ({
    default: () => (
      <ResponsivePreview canvasHeight={820} canvasWidth={1040}>
        <div className="min-h-full bg-surface-base p-8">
          <FilterRuleBuilder
            defaultDraft={filterRuleBuilderDemoDraft}
            defaultValue={filterRuleBuilderDemoValue}
            fields={filterRuleBuilderDemoFields}
            maxBodyHeight={620}
            presets={filterRuleBuilderDemoPresets}
            resultCount={128}
          />
        </div>
      </ResponsivePreview>
    ),
  })),
  "rule-flow-editor-01": () => import("@zeron/blocks/rule-flow-editor-01").then(({ RuleFlowEditor }) => ({
    default: () => <ResponsivePreview canvasHeight={700} canvasWidth={1120} surface="bg-surface-raised"><div className="h-full p-6"><RuleFlowEditor /></div></ResponsivePreview>,
  })),
  "resource-catalog-01": () => import("@zeron/blocks/resource-catalog-01").then(({ ResourceCatalog }) => ({
    default: () => <ResponsivePreview canvasHeight={900} canvasWidth={1560}><ResourceCatalog /></ResponsivePreview>,
  })),
  "resource-detail-page-01": () => import("@zeron/blocks/resource-detail-page-01").then(({ defaultResourceDetailPageData, ResourceDetailPage }) => ({
    default: () => (
      <ResponsivePreview canvasHeight={900} canvasWidth={1440}>
        <ResourceDetailPage
          className="h-full min-h-0"
          data={defaultResourceDetailPageData}
        />
      </ResponsivePreview>
    ),
  })),
  "resource-list-page-01": () => import("@zeron/blocks/resource-list-page-01").then(({ ResourceListPage }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1280}><ResourceListPage className="h-full min-h-0" /></ResponsivePreview>,
  })),
  "resource-metric-list-01": () => import("@zeron/blocks/resource-metric-list-01").then(({ ResourceMetricList }) => ({
    default: () => <ResponsivePreview canvasHeight={560} canvasWidth={700}><ResourceMetricList /></ResponsivePreview>,
  })),
  "resource-list-table-01": () => import("@zeron/blocks/resource-list-table-01").then(({ defaultResourceListItems, ResourceListTable }) => ({
    default: () => <ResponsivePreview canvasHeight={700} canvasWidth={1120} surface="bg-surface-raised"><ResourceListTable resources={defaultResourceListItems} /></ResponsivePreview>,
  })),
  "member-department-01": () => import("@zeron/blocks/member-department-01").then(({ MemberDepartment }) => ({
    default: () => (
      <ResponsivePreview canvasHeight={810} canvasWidth={1440} surface="bg-surface-raised">
        <div className="h-full bg-surface-raised p-3">
          <MemberDepartment className="h-full" defaultView="departments" />
        </div>
      </ResponsivePreview>
    ),
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
  "user-account-01": () => import("./AccountBlocksDemo").then(({ UserAccountDemo }) => ({ default: () => <div className="aspect-video w-full"><UserAccountDemo /></div> })),
  "zaiops-operations-01": () => import("./AccountBlocksDemo").then(({ ZaiopsOperationsDemo: ZaiopsOperations }) => ({
    default: () => <ResponsivePreview canvasHeight={760} canvasWidth={1280}><ZaiopsOperations className="h-full min-h-0" /></ResponsivePreview>,
  })),
  zlrlist: () => import("@zeron/blocks/zlrlist").then(({ ZlrList }) => ({
    default: () => <ResponsivePreview canvasHeight={800} canvasWidth={1280}><ZlrList /></ResponsivePreview>,
  })),
};

function PreviewPlaceholder() {
  return <div aria-hidden="true" className="aspect-video w-full animate-pulse bg-surface-raised" />;
}

// Import visible previews in parallel, but mount them one at a time so several
// complex demos do not occupy the main thread in the same frame.
const pendingPreviewMounts: Array<() => void> = [];
let previewMountScheduled = false;

function flushPreviewMount() {
  pendingPreviewMounts.shift()?.();
  if (pendingPreviewMounts.length) {
    window.setTimeout(flushPreviewMount, 80);
  } else {
    previewMountScheduled = false;
  }
}

function queuePreviewMount(mount: () => void) {
  pendingPreviewMounts.push(mount);
  if (!previewMountScheduled) {
    previewMountScheduled = true;
    window.setTimeout(flushPreviewMount, 0);
  }

  return () => {
    const index = pendingPreviewMounts.indexOf(mount);
    if (index !== -1) pendingPreviewMounts.splice(index, 1);
  };
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
        if (!entry) return;
        // Keep offscreen demos unmounted: their effects and live updates are
        // unnecessary in a non-interactive gallery thumbnail.
        startTransition(() => setIsVisible(entry.isIntersecting));
      },
      { rootMargin: "0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { isVisible, ref };
}

export function BlockPreview({ name }: { name: string }) {
  const { isVisible, ref } = usePreviewVisibility();
  const [Preview, setPreview] = useState<ComponentType | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const loader = previewLoaders[name];

  useEffect(() => {
    if (!isVisible || !loader || Preview || loadFailed) return;
    let cancelled = false;
    let cancelMount = () => {};
    void loader()
      .then((module) => {
        if (cancelled) return;
        cancelMount = queuePreviewMount(() => {
          // Navigation stays responsive while each live demo becomes available.
          startTransition(() => setPreview(() => module.default));
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
      cancelMount();
    };
  }, [Preview, isVisible, loadFailed, loader]);

  return <div ref={ref} className="w-full">
    {isVisible && Preview ? <Preview /> : loadFailed ? (
      <div className="flex aspect-video items-center justify-center bg-surface-raised text-label text-fg-muted">
        {document.documentElement.lang.startsWith("en") ? "Preview unavailable" : "预览暂不可用"}
      </div>
    ) : <PreviewPlaceholder />}
  </div>;
}
