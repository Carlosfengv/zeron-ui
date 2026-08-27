export const standaloneBlockSlugs = [
  "availability-monitor-01",
  "agent-trace-01",
  "agent-session-detail-01",
  "cluster-environment-detail-01",
  "cluster-environment-list-01",
  "inspection-report-list-01",
  "monitoring-alert-list-01",
  "service-management-01",
  "mcp-detail-01",
  "model-detail-01",
  "personal-settings-01",
  "personal-model-usage-01",
  "personal-usage-01",
  "provider-create-form-01",
  "resource-catalog-01",
  "resource-details-01",
  "resource-list-table-01",
  "infinite-log-table-01",
  "file-manager-01",
  "resource-metric-list-01",
  "resource-status-all-01",
  "resource-settings-01",
  "top-nav-app-shell-01",
  "zaiops-operations-01",
  "zlrlist",
] as const;

export type StandaloneBlockSlug = (typeof standaloneBlockSlugs)[number];

export function isStandaloneBlockSlug(slug: string): slug is StandaloneBlockSlug {
  return standaloneBlockSlugs.some((candidate) => candidate === slug);
}
