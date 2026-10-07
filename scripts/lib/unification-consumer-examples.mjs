/** Public imports and real rendered examples for the frozen 44-entry migration. */
const examples = {
  "availability-monitor-01": ["AvailabilityMonitor", "<AvailabilityMonitor chartData={[{ timestamp: 1791158400000, routed: 99, direct: 0 }, { timestamp: 1791162000000, routed: null, direct: 95 }]} />"],
  "ai-gateway-overview-01": ["AiGatewayOverview, createAiGatewayOverviewDemoData", '<AiGatewayOverview data={createAiGatewayOverviewDemoData("30d")} range="30d" sidebar={false} />'],
  "project-monitor-01": ["ProjectMonitor, projectMonitorDemoData", "<ProjectMonitor data={projectMonitorDemoData} />"],
  "security-overview-01": ["SecurityOverview, securityOverviewDemoData", '<SecurityOverview scopeId="northwind" data={securityOverviewDemoData} range="30d" onRangeChange={() => {}} />'],
  "resource-status-all-01": ["ResourceStatusAll", "<ResourceStatusAll />"],
  "resource-metric-list-01": ["ResourceMetricList", "<ResourceMetricList />"],
  "storage-usage-01": ["StorageUsage, storageUsageDemoData", "<StorageUsage data={storageUsageDemoData} />"],
  "credit-usage-01": ["CreditUsage, creditUsageDemoData", "<CreditUsage data={creditUsageDemoData} />"],
  "personal-settings-01": ["PersonalSettings, personalSettingsDemoData", '<PersonalSettings data={personalSettingsDemoData} defaultView="usage" lockedNavigation enabledViews={["usage", "modelUsage", "callLogs"]} />'],
  "personal-model-usage-01": ["PersonalModelUsage", "<PersonalModelUsage />"],
  "personal-usage-01": ["PersonalUsage", "<PersonalUsage />"],
  "resource-settings-01": ["ResourceSettings", "<ResourceSettings />"],
  "model-detail-02": ["ModelDetail02", "<ModelDetail02 />"],
  "resource-list-page-01": ["ResourceListPage", "<ResourceListPage />"],
  "resource-list-table-01": ["ResourceListTable", "<ResourceListTable />"],
  "model-mcp-marketplace-01": ["ResourceCatalog", "<ResourceCatalog />"],
  "member-department-01": ["MemberDepartment", "<MemberDepartment />"],
  "ai-gateway-session-list-01": ["AiGatewaySessionList, aiGatewaySessionListDemoData, aiGatewaySessionListDemoQuery", "<AiGatewaySessionList data={aiGatewaySessionListDemoData} query={aiGatewaySessionListDemoQuery} sidebar={false} />"],
  "infinite-log-table-01": ["InfiniteLogTable", '<InfiniteLogTable records={[{ id: "job-1", timestamp: "2026-10-05T00:00:00.000Z", queue: "batch" }, { id: "job-2", timestamp: "2026-10-05T01:00:00.000Z", queue: "online" }]} enableLive={false} />'],
  "file-manager-01": ["FileManager", '<FileManager items={[]} error="Install verified" />'],
  "zaiops-operations-01": ["ZaiopsOperations", "<ZaiopsOperations />"],
  "cluster-environment-list-01": ["ClusterEnvironmentList", "<ClusterEnvironmentList />"],
  "cluster-environment-detail-01": ["ClusterEnvironmentDetail", "<ClusterEnvironmentDetail />"],
  "inspection-report-list-01": ["InspectionReportList", "<InspectionReportList />"],
  "monitoring-alert-list-01": ["MonitoringAlertList", "<MonitoringAlertList />"],
  "service-management-01": ["ServiceManagement", "<ServiceManagement />"],
  "resource-detail-page-01": ["ResourceDetailPage, defaultResourceDetailPageData", "<ResourceDetailPage data={defaultResourceDetailPageData} />"],
  "model-detail-01": ["ModelDetail", "<ModelDetail />"],
  "mcp-detail-01": ["McpDetail", "<McpDetail />"],
  "deployment-detail-01": ["DeploymentDetail, deploymentDetailDemoData", "<DeploymentDetail data={deploymentDetailDemoData} />"],
  "agent-trace-01": ["AgentTrace", "<AgentTrace />"],
  "agent-message-trace-01": ["AgentMessageTrace, agentMessageTraceDemoData", "<AgentMessageTrace data={agentMessageTraceDemoData} />"],
  "agent-session-detail-01": ["AgentSessionDetail", "<AgentSessionDetail />"],
  "traffic-rules-01": ["TrafficRules", "<TrafficRules />"],
  "filter-rule-builder-01": ["FilterRuleBuilder, filterRuleBuilderDemoFields, filterRuleBuilderDemoValue", "<FilterRuleBuilder fields={filterRuleBuilderDemoFields} value={value} onValueChange={setValue} />", "const [value, setValue] = useState(filterRuleBuilderDemoValue);"],
  "rule-flow-editor-01": ["RuleFlowEditor, defaultRuleFlow", "<RuleFlowEditor value={value} onValueChange={setValue} />", "const [value, setValue] = useState(defaultRuleFlow);"],
  "model-router-01": ["ModelRouter, modelRouterDemoData", "<ModelRouter data={modelRouterDemoData} />"],
  "login-01": ["Login01", "<Login01 />"],
  "signup-01": ["Signup01", "<Signup01 />"],
  "provider-create-form-01": ["ProviderCreateForm", "<ProviderCreateForm />"],
  "user-account-01": ["UserAccount", '<UserAccount user={{ name: "Install verified" }} onSignOut={async () => {}} />'],
  "top-nav-app-shell-01": ["TopNavAppShell", '<TopNavAppShell><p>Install verified</p></TopNavAppShell>'],
  "zlrlist": ["ZlrList", "<ZlrList />"],
};
const primitives = {
  badge: ["Badge", '<div>{(["neutral", "info", "success", "warning", "danger"] as const).map(status => <div key={status}><Badge status={status} variant="strong">{status} · Install verified</Badge><Badge status={status} variant="plain">{status}</Badge></div>)}<Badge variant="plain" status="info" role="img" aria-label="Running" leadingIcon={<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" /></svg>} /></div>'],
  alert: ["Alert, AlertTitle, AlertDescription, AlertAction", '<Alert status="danger" role="group"><AlertTitle>{recovered ? "Recovered" : "Install verified"}</AlertTitle><AlertDescription>Confirmed failure</AlertDescription><AlertAction><button onClick={() => setRecovered(true)}>Retry</button></AlertAction></Alert>', 'const [recovered, setRecovered] = useState(false);'],
  "inline-notice": ["InlineNotice, InlineNoticeContent", '<InlineNotice variant="emphasized" tone="info"><span aria-hidden="true" className="animate-spin motion-reduce:animate-none"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" /></svg></span><InlineNoticeContent>Refreshing previous results with a long readable explanation and an unbroken identifier: verylongidentifierthatmustwrapinsidethemessageregionwithoutforcinghorizontaloverflow</InlineNoticeContent></InlineNotice>'],
  chart: ["TimeSeriesChart, DonutSummary", '<div><TimeSeriesChart label="Requests" data={[{ timestamp: 1791158400000, values: { requests: 0 } }, { timestamp: 1791162000000, values: { requests: null } }, { timestamp: 1791165600000, values: { requests: 12 } }]} series={[{ id: "requests", label: "Requests" }]} timeZone="UTC" locale="en" /><DonutSummary segments={[{ id: "used", label: "Used", value: 80 }]} total={100} center="80 / 100" aria-label="80 of 100" /></div>'],
  "chart-primitives": ["ChartLegend, SegmentedBar", '<div><SegmentedBar mode="capacity" total={100} segments={[{ id: "files", label: "Files", value: 120 }]} valueText="120 / 100" /><ChartLegend items={[{ id: "files", label: "Long category label for installed chart", value: "120", pressed: selected }]} onSelect={() => setSelected(!selected)} /></div>', "const [selected, setSelected] = useState(true);"],
  "list-pagination": ["ListPagination", '<ListPagination total={11} page={page} pageSize={5} onPageChange={setPage} onPageSizeChange={() => {}} />', "const [page, setPage] = useState(0);"],
};
examples["operations-workspace-shell-01"] = ["OperationsWorkspaceShell", '<OperationsWorkspaceShell title="Verify" activeNavigation="home"><p>Install verified</p></OperationsWorkspaceShell>'];
export const unificationConsumerItems = [...Object.keys(examples), ...Object.keys(primitives)];

export function unificationConsumerExample(component, framework) {
  if (framework === "vite" && ["login-01", "signup-01", "mcp-detail-01", "zlrlist"].includes(component)) return null;
  const spec = examples[component] ?? primitives[component];
  if (!spec) return null;
  const [exports, element, state = ""] = spec;
  const prefix = framework === "vite" ? "@/src" : "@";
  const category = Object.hasOwn(primitives, component) ? "ui" : "blocks";
  const directory = component === "model-mcp-marketplace-01" ? "resource-catalog-01" : component;
  return [
    ...(framework === "next" ? ['"use client";'] : ['import { createRoot } from "react-dom/client";', 'import "./index.css";']),
    'import { useState } from "react";',
    `import { ${exports} } from "${prefix}/components/${category}/${directory}";`,
    `function Demo() { ${state} return <main data-consumer="${component}" style={{ height: "100svh", minWidth: 0, overflow: "auto" }}>${element}</main>; }`,
    framework === "next" ? "export default Demo;" : 'createRoot(document.getElementById("root")!).render(<Demo />);',
    "",
  ].join("\n");
}
