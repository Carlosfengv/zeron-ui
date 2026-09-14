/** Documentation destinations describe the delivered interface, not its Registry type. */
export type ArtifactCollection = "blocks" | "pages";

export const pageArtifactSlugs = [
  "login-01",
  "signup-01",
  "ai-gateway-overview-01",
  "ai-gateway-session-list-01",
  "agent-trace-01",
  "agent-session-detail-01",
  "provider-create-form-01",
  "cluster-environment-detail-01",
  "cluster-environment-list-01",
  "inspection-report-list-01",
  "monitoring-alert-list-01",
  "service-management-01",
  "traffic-rules-01",
  "personal-settings-01",
  "personal-model-usage-01",
  "personal-usage-01",
  "resource-settings-01",
  "resource-catalog-01",
  "mcp-detail-01",
  "resource-detail-page-01",
  "model-detail-01",
  "model-detail-02",
  "resource-list-page-01",
  "infinite-log-table-01",
  "zaiops-operations-01",
  "zlrlist",
] as const;

const pageSlugs = new Set<string>(pageArtifactSlugs);

export function artifactCollectionFor(slug: string): ArtifactCollection {
  return pageSlugs.has(slug) ? "pages" : "blocks";
}

export function artifactPathname(slug: string) {
  return `/docs/${artifactCollectionFor(slug)}/${slug}` as const;
}
