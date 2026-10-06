"use client";

import { useMemo, useState } from "react";
import { ClusterEnvironmentList, defaultClusterEnvironments, type ClusterEnvironmentItem } from "@zeron/blocks/cluster-environment-list-01";
import { MonitoringAlertList, defaultMonitoringAlertItems, type MonitoringAlertItem } from "@zeron/blocks/monitoring-alert-list-01";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { useDataStateDemo } from "./DataStateDemoControls";
import { useOperationsDemoWorkspace } from "./OperationsWorkspaceDemos";

export function ClusterEnvironmentListDemo() {
  const demo = useDataStateDemo();
  const workspace = useOperationsDemoWorkspace();
  const [selected, setSelected] = useState<ClusterEnvironmentItem | null>(null);
  const environments = useMemo(() => demo.empty ? [] : [...defaultClusterEnvironments], [demo.empty, demo.revision]);
  return <div className="flex h-full min-h-0 flex-col">
    
    <ClusterEnvironmentList workspace={workspace} className="min-h-0 flex-1" environments={environments} state={demo.loading ? "loading" : demo.failed ? "error" : demo.stale ? "stale" : "ready"} refreshing={demo.refreshing} retainDataOnError={demo.retainData} onRefresh={demo.refresh} onRetry={demo.recover} onViewDetails={setSelected} />
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent><DialogHeader><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>示例环境详情 · {selected?.location}</DialogDescription></DialogHeader><p className="text-body text-fg-muted">{selected?.incident?.description ?? "巡检已完成，当前无待处理异常。"}</p></DialogContent></Dialog>
  </div>;
}

export function MonitoringAlertListDemo() {
  const demo = useDataStateDemo();
  const workspace = useOperationsDemoWorkspace();
  const [overrides, setOverrides] = useState<Record<string, MonitoringAlertItem>>({});
  const [muted, setMuted] = useState<readonly string[]>([]);
  const [analyzed, setAnalyzed] = useState<MonitoringAlertItem | null>(null);
  const alerts = useMemo(() => demo.empty ? [] : defaultMonitoringAlertItems.filter((alert) => !muted.includes(alert.id)).map((alert) => overrides[alert.id] ?? alert), [demo.empty, demo.revision, muted, overrides]);
  const resolve = (alert: MonitoringAlertItem) => setOverrides((previous) => ({ ...previous, [alert.id]: { ...alert, resolutionState: "resolved", resolutionRecords: [...(alert.resolutionRecords ?? []), { id: `${alert.id}-demo-resolution`, operator: "演示用户", occurredAt: "本次操作", detail: "已执行模拟处置。告警严重程度保留原始等级。" }] } }));
  return <div className="flex h-full min-h-0 flex-col">
    
    <MonitoringAlertList workspace={workspace} className="min-h-0 flex-1" alerts={alerts} state={demo.loading ? "loading" : demo.failed ? "error" : demo.stale ? "stale" : "ready"} refreshing={demo.refreshing} retainDataOnError={demo.retainData} onRefresh={demo.refresh} onRetry={demo.recover} onResolve={resolve} onMute={(alert) => setMuted((previous) => [...previous, alert.id])} onAnalyze={setAnalyzed} />
    <Dialog open={analyzed !== null} onOpenChange={(open) => { if (!open) setAnalyzed(null); }}><DialogContent><DialogHeader><DialogTitle>分析 {analyzed?.resource}</DialogTitle><DialogDescription>示例分析 · 未连接真实 AI 服务</DialogDescription></DialogHeader><p className="text-body text-fg-muted">{analyzed?.title}：{analyzed?.description}</p></DialogContent></Dialog>
  </div>;
}
