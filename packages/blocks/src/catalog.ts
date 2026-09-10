import blockCapabilities from "../block-capabilities.json";

export type BlockFramework = "react" | "next";
export type BlockInstallationKind = "data-block" | "template";

export interface BlockCapability {
  framework: BlockFramework;
  kind: BlockInstallationKind;
}

const capabilities = blockCapabilities as Record<string, BlockCapability>;

/**
 * The Registry composer reads the same JSON manifest.  Keep installation
 * boundaries here rather than maintaining a second docs-only classification.
 */
export function getBlockCapability(name: string): BlockCapability {
  const capability = capabilities[name];
  if (!capability) throw new Error(`Missing installation capability for Block: ${name}`);
  return capability;
}

const blockCatalogEntries = [
  {
    name: "login-01",
    title: "Login",
    description: "A card-based authentication block with credential and Apple or Google sign-in paths.",
    categories: ["application", "authentication", "forms"],
    dependencies: ["auth-layout", "button", "card", "field", "icon-context", "input", "separator", "@lobehub/icons"],
  },
  {
    name: "signup-01",
    title: "Signup",
    description: "A surface-neutral account creation block with email and Apple or Google signup paths.",
    categories: ["application", "authentication", "forms"],
    dependencies: ["auth-layout", "button", "field", "icon-context", "input", "separator", "@lobehub/icons"],
  },
  {
    name: "availability-monitor-01",
    title: "Availability Monitor",
    description: "A routing-aware service availability block with summary metrics, a 72-hour status strip, and a 24-hour comparison chart.",
    categories: ["application", "monitoring", "observability"],
    dependencies: ["button", "chart", "container", "icon-context", "status-overview", "tooltip", "recharts"],
  },
  {
    name: "ai-gateway-overview-01",
    title: "AI Gateway Overview",
    description: "A complete AI gateway analytics workspace with responsive navigation, traffic, spend, tokens, latency, reliability, providers, and operations.",
    categories: ["application", "analytics", "observability"],
    dependencies: ["badge", "button", "card", "chart", "empty", "icon-context", "inline-notice", "metric-card", "nav-item", "nav-menu", "page-layout", "sidebar", "sidebar-identity-row", "skeleton", "tabs", "recharts"],
  },
  {
    name: "file-manager-01",
    title: "File Manager",
    description: "A token-native, storage-agnostic file-management workspace with icon, list, and Finder-style column views.",
    categories: ["application", "storage", "files"],
    dependencies: ["button", "dialog", "input", "select", "tabs", "@tanstack/react-virtual"],
  },
  {
    name: "agent-message-trace-01",
    title: "Agent Message Trace",
    description: "A responsive, resizable agent trace workspace with a virtualized timeline and span inspector.",
    categories: ["application", "agent", "observability"],
    dependencies: ["badge", "button", "detail-list", "empty", "input-copy", "resizable", "scroll-area", "switch", "tabs", "@tanstack/react-virtual"],
  },
  {
    name: "agent-trace-01",
    title: "Agent Trace",
    description: "A turn-aware trace viewer that projects agent messages, tool calls, and results from uploaded JSON.",
    categories: ["application", "agent", "observability"],
    dependencies: ["badge", "button", "detail-list", "@lobehub/icons"],
  },
  {
    name: "agent-session-detail-01",
    title: "Agent Session Detail",
    description: "A session detail workspace with agent navigation, switchable sessions, and an embedded execution trace.",
    categories: ["application", "agent", "details"],
    dependencies: ["agent-trace-01", "badge", "breadcrumb", "button", "dropdown", "input-message", "menu-item", "nav-item", "nav-menu", "page-layout", "sidebar", "sidebar-identity-row"],
  },
  {
    name: "mcp-detail-01",
    title: "MCP 详情",
    description: "An MCP resource detail page with connection generation, safe copy feedback, and a minimal tool test panel.",
    categories: ["application", "details"],
    dependencies: ["page-layout", "breadcrumb", "tabs", "select", "textarea", "input-copy", "inline-notice", "card", "badge", "button"],
  },
  {
    name: "resource-detail-page-01",
    title: "Resource Detail Page",
    description: "A full-width generic resource detail page with shared navigation, editable metadata, protection settings, and caller-owned tab content.",
    categories: ["application", "resources", "details", "navigation"],
    dependencies: ["resource-detail-layout", "resource-workspace-shell-01", "detail-list", "tabs", "switch", "badge", "button", "dropdown", "menu-item", "select", "react-markdown"],
  },
  {
    name: "model-detail-01",
    title: "模型详情",
    description: "A model detail page with API-key handoff, runnable code samples, benchmarks, and endpoint information.",
    categories: ["application", "details"],
    dependencies: ["page-layout", "breadcrumb", "tabs", "table", "input-copy", "card", "badge", "button"],
  },
  {
    name: "model-detail-02",
    title: "Model Analytics Detail",
    description: "A complete model analytics page with providers, pricing, performance, uptime, benchmarks, apps, activity, and FAQ.",
    categories: ["application", "details", "analytics"],
    dependencies: ["availability-monitor-01", "accordion", "badge", "breadcrumb", "button", "card", "chart", "checkbox", "data-table", "icon-context", "info-item", "metric-card", "page-layout", "select", "tabs", "tooltip", "recharts"],
  },
  {
    name: "cluster-environment-detail-01",
    title: "集群环境详情",
    description: "An inspection-report workspace that combines environment context, resource health, and incident follow-up.",
    categories: ["application", "operations"],
    dependencies: ["page-layout", "breadcrumb", "button", "card", "dialog", "dropdown", "kbd", "nav-item", "nav-menu", "sidebar", "sidebar-identity-row", "tabs", "metric-card", "info-item", "resource-status-all-01", "resource-metric-list-01"],
  },
  {
    name: "cluster-environment-list-01",
    title: "集群环境列表",
    description: "A filterable cluster-environment overview with critical, warning, normal, offline, and data-freshness states.",
    categories: ["application", "operations"],
    dependencies: ["page-layout", "tabs", "input", "button", "card", "badge", "dialog", "dropdown", "kbd", "nav-item", "nav-menu", "sidebar", "sidebar-identity-row", "inline-notice"],
  },
  {
    name: "inspection-report-list-01",
    title: "巡检报告列表",
    description: "An inspection report workspace with operations navigation, filters, report status, and contextual actions.",
    categories: ["application", "operations"],
    dependencies: ["page-layout", "sidebar", "nav-menu", "nav-item", "input", "dropdown", "badge", "button"],
  },
  {
    name: "monitoring-alert-list-01",
    title: "监控告警列表",
    description: "A monitoring alert workspace with shared operations navigation, severity filters, resolution history, and contextual actions.",
    categories: ["application", "operations", "monitoring"],
    dependencies: ["page-layout", "sidebar", "nav-menu", "nav-item", "input", "dropdown", "badge", "button", "button-group", "popover"],
  },
  {
    name: "service-management-01",
    title: "服务管理",
    description: "A service workspace with progress, vendor authorizations, and cluster operation history.",
    categories: ["application", "operations", "service"],
    dependencies: ["page-layout", "sidebar", "nav-menu", "nav-item", "data-table", "tabs", "badge", "button", "dialog", "dropdown", "kbd"],
  },
  {
    name: "personal-settings-01",
    title: "个人设置",
    description: "A personal settings workspace for model services, API keys, credentials, profile details, usage, and call logs.",
    categories: ["application", "settings"],
    dependencies: ["app-shell", "top-nav", "page-layout", "nav-menu", "nav-item", "input-group", "table", "field", "badge", "button", "detail-list", "inline-notice", "@lobehub/icons"],
  },
  {
    name: "personal-model-usage-01",
    title: "个人模型用量",
    description: "A standalone personal model workspace with billing analysis, atomic call logs, and answer-level execution traces.",
    categories: ["application", "settings", "analytics"],
    dependencies: ["personal-settings-01"],
  },
  {
    name: "credit-usage-01",
    title: "Credit Usage",
    description: "A compact credit-cycle summary with model attribution, depletion guidance, and plan controls.",
    categories: ["application", "settings", "analytics"],
    dependencies: ["badge", "button", "card", "icon-context", "inline-notice", "switch", "tabs", "@lobehub/icons"],
  },
  {
    name: "personal-usage-01",
    title: "个人使用情况",
    description: "A standalone personal activity dashboard with contextual read-only settings navigation.",
    categories: ["application", "settings", "analytics"],
    dependencies: ["personal-settings-01"],
  },
  {
    name: "resource-settings-01",
    title: "模型服务设置",
    description: "A standalone model-service settings page with contextual read-only settings navigation.",
    categories: ["application", "settings"],
    dependencies: ["personal-settings-01"],
  },
  {
    name: "model-mcp-marketplace-01",
    slug: "resource-catalog-01",
    title: "模型和 MCP 广场",
    description: "A filterable model and MCP marketplace with page-local navigation, search, and responsive resource cards.",
    categories: ["application", "catalog"],
    dependencies: ["app-shell", "top-nav", "page-layout", "nav-menu", "nav-item", "input", "kbd", "card", "badge", "button", "@lobehub/icons"],
  },
  {
    name: "provider-create-form-01",
    title: "Provider Create Form 1",
    description: "A three-step workflow for provider details, credential verification, model discovery, and per-model availability.",
    categories: ["application", "forms"],
    dependencies: ["field", "input", "textarea", "select", "switch", "stepper", "container", "alert", "badge", "detail-list", "button", "toast", "@lobehub/icons"],
  },
  {
    name: "rule-flow-editor-01",
    title: "Rule Flow Editor",
    description: "A controlled rule canvas for arranging triggers, conditions, and actions with editable condition clauses.",
    categories: ["application", "forms", "workflow"],
    dependencies: ["badge", "button", "card", "icon-context", "input", "select", "sortable-collection"],
  },
  {
    name: "resource-details-01",
    title: "Resource Details",
    description: "A grouped resource metadata panel with health, configuration, usage, and API compatibility details.",
    categories: ["application", "details"],
    dependencies: ["detail-list", "switch", "badge"],
  },
  {
    name: "resource-list-page-01",
    title: "MCP Resource List Page",
    description: "A Sidebar workspace for managing MCP applications and categories with design-system-native tabs, filters, and tables.",
    categories: ["application", "resources", "tables", "navigation"],
    dependencies: ["resource-list-table-01", "resource-workspace-shell-01", "page-layout", "tabs"],
  },
  {
    name: "resource-list-table-01",
    title: "Resource List Table 1",
    description: "A searchable, selectable resource inventory with status filtering and reusable row actions.",
    categories: ["application", "tables"],
    dependencies: ["data-table", "info-item", "badge", "checkbox", "button", "input-group"],
  },
  {
    name: "member-department-01",
    title: "成员与部门",
    description: "A department-scoped member directory with search, account-status filtering, pagination, and responsive organization navigation.",
    categories: ["application", "organization", "tables"],
    dependencies: ["avatar", "badge", "button", "data-table", "input-group", "member-tree", "mobile-drawer", "page-layout", "tabs"],
  },
  {
    name: "resource-metric-list-01",
    title: "Resource Metric List 1",
    description: "A compact resource inventory with status distribution bars for infrastructure health at a glance.",
    categories: ["application", "metrics"],
    dependencies: ["detail-list"],
  },
  {
    name: "resource-status-all-01",
    title: "Resource Status All 1",
    description: "A resource-status summary with a circular distribution, detailed counts, and determinate-state coverage.",
    categories: ["application", "metrics"],
    dependencies: ["card"],
  },
  {
    name: "top-nav-app-shell-01",
    title: "TopNav App Shell",
    description: "A stacked application shell with a centered TopNav and focused content area.",
    categories: ["application", "navigation"],
    dependencies: ["app-shell", "page-layout", "top-nav", "nav-menu", "nav-item"],
  },
  {
    name: "zaiops-operations-01",
    title: "ZAIops Operations",
    description: "An operations workspace recipe with a responsive Sidebar, organization switcher, and grouped navigation.",
    categories: ["application", "operations"],
    dependencies: ["sidebar", "page-layout", "nav-menu", "nav-item"],
  },
  {
    name: "zlrlist",
    title: "ZLR 保护组",
    description: "A ZS Live Recovery protection-group list and detail workspace with site switching, recovery plans, and Chinese pagination.",
    categories: ["application", "operations", "tables"],
    dependencies: ["sidebar", "nav-menu", "nav-item", "tabs", "input-group", "table", "checkbox", "select", "button", "badge", "detail-list"],
  },
  {
    name: "infinite-log-table-01",
    title: "Infinite Log Table",
    description: "A schema-driven virtualized log explorer with dynamic fields and filters, cursor pagination, live tailing, and record detail.",
    categories: ["application", "tables", "observability"],
    dependencies: ["button", "checkbox", "dialog", "input-group", "mobile-drawer", "recharts", "@tanstack/react-table", "@tanstack/react-virtual"],
  },
] as const;

export const blockCatalog = blockCatalogEntries.map((block) => ({
  ...block,
  installation: getBlockCapability(block.name),
}));
