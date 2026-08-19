export const artifactKinds = ["block", "page", "flow", "prototype", "layout"] as const;
export type ArtifactKind = (typeof artifactKinds)[number];

export const artifactProducts = ["zaiops", "zlr", "zentrix", "shared"] as const;
export type ArtifactProduct = (typeof artifactProducts)[number];

export const artifactReadiness = ["copy-ready", "adapter-required", "demo-only"] as const;
export type ArtifactReadiness = (typeof artifactReadiness)[number];

export const artifactDataModes = ["static", "mock", "controlled", "api-ready"] as const;
export type ArtifactDataMode = (typeof artifactDataModes)[number];

export interface ArtifactEntry {
  slug: string;
  registryName: string;
  title: string;
  description: string;
  kind: ArtifactKind;
  product: ArtifactProduct;
  domains: string[];
  patterns: string[];
  searchTerms: string[];
  readiness: ArtifactReadiness;
  dataMode: ArtifactDataMode;
  devices: Array<"desktop" | "responsive" | "mobile">;
  featured?: boolean;
}

/**
 * User-facing taxonomy for the current registry assets.
 * Registry item types remain `registry:block`; `kind` is only used for
 * discovery, documentation and progressive asset splitting.
 */
export const artifactCatalog: readonly ArtifactEntry[] = [
  {
    slug: "agent-trace-01", registryName: "agent-trace-01",
    title: "Agent Trace", description: "A turn-aware agent execution trace with local JSON upload and raw-record inspection.",
    kind: "block", product: "shared", domains: ["ai agent", "observability"], patterns: ["trace", "timeline", "debugging"], searchTerms: ["agent", "trace", "tool call", "message", "轨迹", "调用链", "消息"], readiness: "copy-ready", dataMode: "controlled", devices: ["desktop", "responsive"], featured: true,
  },
  {
    slug: "provider-create-form-01", registryName: "provider-create-form-01",
    title: "Provider Create Flow", description: "A guided provider setup with credential validation, model discovery and a final review.",
    kind: "flow", product: "zentrix", domains: ["model provider", "configuration"], patterns: ["wizard", "validation"], searchTerms: ["provider", "create", "模型服务商", "创建流程"], readiness: "adapter-required", dataMode: "controlled", devices: ["desktop", "responsive"], featured: true,
  },
  {
    slug: "cluster-environment-detail-01", registryName: "cluster-environment-detail-01",
    title: "Cluster Environment Detail", description: "An inspection workspace that combines environment context, resource health and incident follow-up.",
    kind: "page", product: "zaiops", domains: ["operations", "cluster", "monitoring"], patterns: ["detail", "health report"], searchTerms: ["cluster", "environment", "detail", "集群", "详情", "巡检"], readiness: "adapter-required", dataMode: "api-ready", devices: ["desktop", "responsive"], featured: true,
  },
  {
    slug: "cluster-environment-list-01", registryName: "cluster-environment-list-01",
    title: "Cluster Environment List", description: "A filterable cluster overview with health, freshness and status states.",
    kind: "page", product: "zaiops", domains: ["operations", "cluster", "monitoring"], patterns: ["list", "data table", "filter"], searchTerms: ["cluster", "environment", "list", "table", "集群", "列表", "分页表格"], readiness: "adapter-required", dataMode: "api-ready", devices: ["desktop", "responsive"], featured: true,
  },
  {
    slug: "personal-settings-01", registryName: "personal-settings-01",
    title: "Personal Settings", description: "A multi-view settings workspace for model services, API keys, credentials and usage.",
    kind: "prototype", product: "shared", domains: ["settings", "account"], patterns: ["settings", "sidebar"], searchTerms: ["settings", "api key", "account", "个人设置", "凭证"], readiness: "demo-only", dataMode: "mock", devices: ["desktop", "responsive"], featured: true,
  },
  {
    slug: "personal-model-usage-01", registryName: "personal-model-usage-01",
    title: "Personal Model Usage", description: "A standalone billing dashboard with usage filters, spending trends, attribution and call details.",
    kind: "page", product: "zentrix", domains: ["settings", "billing", "model usage"], patterns: ["analytics", "data table", "sidebar"], searchTerms: ["model usage", "billing", "spend", "token", "模型用量", "消费", "计费"], readiness: "adapter-required", dataMode: "api-ready", devices: ["desktop", "responsive"], featured: true,
  },
  {
    slug: "personal-usage-01", registryName: "personal-usage-01",
    title: "Personal Usage", description: "A standalone dashboard for personal activity, calls and token usage.",
    kind: "page", product: "zentrix", domains: ["settings", "usage"], patterns: ["analytics", "sidebar"], searchTerms: ["personal usage", "activity", "token", "调用", "个人使用情况"], readiness: "adapter-required", dataMode: "api-ready", devices: ["desktop", "responsive"],
  },
  {
    slug: "resource-settings-01", registryName: "resource-settings-01",
    title: "Model Service Settings", description: "A standalone model-service settings page with contextual navigation.",
    kind: "page", product: "zentrix", domains: ["settings", "model service"], patterns: ["settings", "table", "sidebar"], searchTerms: ["model service", "provider", "settings", "模型服务", "设置"], readiness: "adapter-required", dataMode: "api-ready", devices: ["desktop", "responsive"],
  },
  {
    slug: "resource-catalog-01", registryName: "model-mcp-marketplace-01",
    title: "Model & MCP Marketplace", description: "A responsive marketplace with search, sorting, filters and resource cards.",
    kind: "page", product: "zentrix", domains: ["model", "mcp", "marketplace"], patterns: ["catalog", "search", "filter"], searchTerms: ["model", "mcp", "marketplace", "模型", "广场", "资源目录"], readiness: "adapter-required", dataMode: "api-ready", devices: ["desktop", "responsive"], featured: true,
  },
  {
    slug: "mcp-detail-01", registryName: "mcp-detail-01",
    title: "MCP Detail", description: "A resource detail page with safe connection generation and a minimal tool test panel.",
    kind: "page", product: "zentrix", domains: ["mcp", "integration"], patterns: ["detail", "connection"], searchTerms: ["mcp", "detail", "connection", "工具", "连接", "详情"], readiness: "adapter-required", dataMode: "api-ready", devices: ["desktop", "responsive"],
  },
  {
    slug: "model-detail-01", registryName: "model-detail-01",
    title: "Model Detail", description: "A model detail page with API-key handoff, samples, benchmark data and endpoint information.",
    kind: "page", product: "zentrix", domains: ["model", "integration"], patterns: ["detail", "api reference"], searchTerms: ["model", "api key", "endpoint", "模型", "详情", "接口"], readiness: "adapter-required", dataMode: "api-ready", devices: ["desktop", "responsive"],
  },
  {
    slug: "resource-details-01", registryName: "resource-details-01",
    title: "Resource Details", description: "A grouped metadata panel for health, configuration, usage and API compatibility.",
    kind: "block", product: "shared", domains: ["resource", "monitoring"], patterns: ["detail", "metadata"], searchTerms: ["resource", "details", "metadata", "资源", "详情", "配置"], readiness: "copy-ready", dataMode: "controlled", devices: ["desktop", "responsive"],
  },
  {
    slug: "resource-list-table-01", registryName: "resource-list-table-01",
    title: "Resource List Table", description: "A searchable, selectable resource inventory with status filters and reusable row actions.",
    kind: "block", product: "shared", domains: ["resource", "operations"], patterns: ["data table", "filter", "bulk action"], searchTerms: ["resource", "list", "table", "filter", "资源", "表格", "筛选"], readiness: "copy-ready", dataMode: "controlled", devices: ["desktop", "responsive"], featured: true,
  },
  {
    slug: "resource-metric-list-01", registryName: "resource-metric-list-01",
    title: "Resource Metric List", description: "A compact resource inventory with status distribution bars for infrastructure health.",
    kind: "block", product: "zaiops", domains: ["resource", "monitoring"], patterns: ["metrics", "status"], searchTerms: ["metric", "resource", "status", "资源", "指标", "状态"], readiness: "copy-ready", dataMode: "controlled", devices: ["desktop", "responsive"],
  },
  {
    slug: "resource-status-all-01", registryName: "resource-status-all-01",
    title: "Resource Status Overview", description: "A status summary with circular distribution, detailed counts and determinate coverage.",
    kind: "block", product: "zaiops", domains: ["resource", "monitoring"], patterns: ["status", "summary"], searchTerms: ["resource", "status", "summary", "资源", "状态", "概览"], readiness: "copy-ready", dataMode: "controlled", devices: ["desktop", "responsive"],
  },
  {
    slug: "top-nav-app-shell-01", registryName: "top-nav-app-shell-01",
    title: "TopNav App Shell", description: "A focused application frame with a centered TopNav and content area.",
    kind: "layout", product: "shared", domains: ["navigation", "application shell"], patterns: ["top navigation", "shell"], searchTerms: ["top nav", "layout", "shell", "navigation", "顶部导航", "应用框架", "布局"], readiness: "copy-ready", dataMode: "static", devices: ["desktop", "responsive"],
  },
  {
    slug: "zaiops-operations-01", registryName: "zaiops-operations-01",
    title: "ZAIops Operations Shell", description: "An operations workspace shell with responsive sidebar, organization switcher and grouped navigation.",
    kind: "layout", product: "zaiops", domains: ["operations", "navigation"], patterns: ["sidebar", "shell"], searchTerms: ["zaiops", "operations", "layout", "sidebar", "运维", "侧边栏", "工作台", "布局"], readiness: "copy-ready", dataMode: "static", devices: ["desktop", "responsive"], featured: true,
  },
  {
    slug: "zlrlist", registryName: "zlrlist",
    title: "ZLR Protection Groups", description: "A protection-group workspace with site switching, list/detail views and row actions.",
    kind: "prototype", product: "zlr", domains: ["recovery", "protection group"], patterns: ["workspace", "list-detail"], searchTerms: ["zlr", "protection group", "recovery", "保护组", "容灾", "列表详情"], readiness: "demo-only", dataMode: "mock", devices: ["desktop", "responsive"], featured: true,
  },
];

export function getArtifact(slug: string) {
  return artifactCatalog.find((artifact) => artifact.slug === slug);
}
