import type { IntegrationMonitorCheck, IntegrationMonitorItem, IntegrationMonitorsSnapshot, MonitorIntegration } from "./integration-monitors-types";

export const integrationMonitorsDemoEpoch = Date.UTC(2026, 9, 5, 16);
const definitions = [
  ["mercury", "Mercury", "Spend management", 38, 0, 18],
  ["github", "GitHub", "Version control", 73, 3, 36],
  ["atlassian", "Atlassian", "Work management", 0, 0, 0],
  ["stripe", "Stripe", "Payments", 64, 0, 24],
  ["vercel", "Vercel", "Deployments", 41, 2, 17],
  ["slack", "Slack", "Team communication", 52, 0, 22],
  ["jira", "Jira", "Issue tracking", 58, 2, 34],
  ["confluence", "Confluence", "Knowledge management", 48, 0, 19],
  ["coda", "Coda", "Collaborative docs", 32, 0, 11],
  ["loom", "Loom", "Video messaging", 39, 0, 13],
  ["mailchimp", "Mailchimp", "Marketing automation", 47, 4, 28],
  ["square", "Square", "Commerce", 54, 0, 20],
  ["notion", "Notion", "Workspace documents", 36, 1, 15],
  ["figma", "Figma", "Product design", 44, 0, 21],
  ["linear", "Linear", "Project planning", 29, 2, 12],
  ["surveymonkey", "SurveyMonkey", "Surveys", 0, 0, 0],
  ["asana", "Asana", "Task management", 0, 0, 0],
  ["sentry", "Sentry", "Error reporting", 24, 0, 10],
] as const;
export function createMonitorDemoChecks(id: string, total = 12, failed = 0, checkedAt = integrationMonitorsDemoEpoch): IntegrationMonitorCheck[] {
  return Array.from({ length: total }, (_, i) => ({ id: `${id}-check-${i + 1}`, name: `检查项 ${i + 1}`, result: i < failed ? "failed" : "passed", checkedAt }));
}
export function createIntegrationMonitorsDemoData(): IntegrationMonitorsSnapshot {
  const items: IntegrationMonitorItem[] = definitions.map(([id, name, description, total, failed, assetCount]) => ({
    id, integrationId: id, name, description, assetCount,
    lifecycle: total === 0 ? "needs-setup" : id === "coda" ? "paused" : "active",
    checks: createMonitorDemoChecks(id, total, failed),
    shareUrl: `/block-demo/integration-monitors-01?monitor=${id}`,
  }));
  // 6 failing, 8 compliant, 4 inactive. Warning/unknown cases are selectable in the demo.
  const integrations: MonitorIntegration[] = [
    ...definitions.map(([id, name, description]) => ({ id, name, description })),
    { id: "dropbox", name: "Dropbox", description: "Cloud storage" },
    { id: "harmonic", name: "Harmonic", description: "Company intelligence" },
    { id: "synthesia", name: "Synthesia", description: "Video generation" },
  ];
  return { scopeId: "demo-workspace", snapshotId: "integrations-1", updatedAt: integrationMonitorsDemoEpoch, lastCheckedAt: integrationMonitorsDemoEpoch, items, integrations, mutedUntil: null };
}
