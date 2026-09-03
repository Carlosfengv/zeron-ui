import "server-only";

import type { DocPageLoader } from "./page-loader-types";

export const blockPageLoaders: Record<string, DocPageLoader> = {
  "blocks/login-01": () => import("@docs/pages/blocks/login-01/page"),
  "blocks/signup-01": () => import("@docs/pages/blocks/signup-01/page"),
  "blocks/availability-monitor-01": () => import("@docs/pages/blocks/availability-monitor-01/page"),
  "blocks/agent-trace-01": () => import("@docs/pages/blocks/agent-trace-01/page"),
  "blocks/agent-session-detail-01": () => import("@docs/pages/blocks/agent-session-detail-01/page"),
  "blocks/cluster-environment-detail-01": () => import("@docs/pages/blocks/cluster-environment-detail-01/page"),
  "blocks/cluster-environment-list-01": () => import("@docs/pages/blocks/cluster-environment-list-01/page"),
  "blocks/inspection-report-list-01": () => import("@docs/pages/blocks/inspection-report-list-01/page"),
  "blocks/monitoring-alert-list-01": () => import("@docs/pages/blocks/monitoring-alert-list-01/page"),
  "blocks/service-management-01": () => import("@docs/pages/blocks/service-management-01/page"),
  "blocks/mcp-detail-01": () => import("@docs/pages/blocks/mcp-detail-01/page"),
  "blocks/model-detail-01": () => import("@docs/pages/blocks/model-detail-01/page"),
  "blocks/personal-model-usage-01": () => import("@docs/pages/blocks/personal-model-usage-01/page"),
  "blocks/personal-settings-01": () => import("@docs/pages/blocks/personal-settings-01/page"),
  "blocks/personal-usage-01": () => import("@docs/pages/blocks/personal-usage-01/page"),
  "blocks/provider-create-form-01": () => import("@docs/pages/blocks/provider-create-form-01/page"),
  "blocks/resource-catalog-01": () => import("@docs/pages/blocks/resource-catalog-01/page"),
  "blocks/resource-details-01": () => import("@docs/pages/blocks/resource-details-01/page"),
  "blocks/resource-list-table-01": () => import("@docs/pages/blocks/resource-list-table-01/page"),
  "blocks/infinite-log-table-01": () => import("@docs/pages/blocks/infinite-log-table-01/page"),
  "blocks/file-manager-01": () => import("@docs/pages/blocks/file-manager-01/page"),
  "blocks/resource-metric-list-01": () => import("@docs/pages/blocks/resource-metric-list-01/page"),
  "blocks/resource-status-all-01": () => import("@docs/pages/blocks/resource-status-all-01/page"),
  "blocks/resource-settings-01": () => import("@docs/pages/blocks/resource-settings-01/page"),
  "blocks/top-nav-app-shell-01": () => import("@docs/pages/blocks/top-nav-app-shell-01/page"),
  "blocks/zaiops-operations-01": () => import("@docs/pages/blocks/zaiops-operations-01/page"),
  "blocks/zlrlist": () => import("@docs/pages/blocks/zlrlist/page"),
};
