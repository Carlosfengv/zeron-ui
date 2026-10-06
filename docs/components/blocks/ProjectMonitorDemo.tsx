"use client";

import { useMemo, useState } from "react";
import { ProjectMonitor, projectMonitorDemoData, type ProjectMonitorTab } from "@zeron/blocks/project-monitor-01";
import { Button } from "@zeron/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zeron/ui/card";
import { Switch } from "@zeron/ui/switch";
import { DataStateDemoControls, useDataStateDemo } from "./DataStateDemoControls";

export function ProjectMonitorDemo() {
  const demo = useDataStateDemo();
  const data = useMemo(() => demo.empty ? {
    ...projectMonitorDemoData, metrics: [], windows: [],
    storage: { ...projectMonitorDemoData.storage, categories: [], buckets: [] },
  } : { ...projectMonitorDemoData, updatedAt: projectMonitorDemoData.updatedAt === null ? null : projectMonitorDemoData.updatedAt + demo.revision * 1000 }, [demo.empty, demo.revision]);
  const [customizing, setCustomizing] = useState(false);
  const [resources, setResources] = useState(true);
  const [activity, setActivity] = useState(true);
  const [tab, setTab] = useState<ProjectMonitorTab>("overview");
  const [range, setRange] = useState(projectMonitorDemoData.windows[0]?.id);
  return <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8">
    <div className="m-auto w-full max-w-3xl space-y-3">
      <DataStateDemoControls value={demo.scenario} onChange={demo.changeScenario} failNextRefresh={demo.failNextRefresh} onFailNextRefreshChange={demo.setFailNextRefresh} />
      <ProjectMonitor data={data} tab={tab} onTabChange={setTab} range={range} onRangeChange={setRange} state={demo.loading ? "loading" : demo.failed ? "error" : demo.stale ? "stale" : "ready"}
        refreshing={demo.refreshing} retainDataOnError={demo.retainData} visibleSections={{ resources, activity }}
        labels={{ openDashboard: "打开独立预览" }}
        actions={{ onRetry: demo.recover, onRefresh: demo.refresh, onOpenDashboard: () => window.open("/zh-CN/block-demo/project-monitor-01", "_blank", "noopener,noreferrer"), onCustomize: () => setCustomizing((current) => !current) }} />
      {customizing && <Card>
        <CardHeader><CardTitle>自定义概览</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-5">
          <Switch label="显示资源用量" checked={resources} onCheckedChange={setResources} />
          <Switch label="显示服务活动" checked={activity} onCheckedChange={setActivity} />
          <Button size="sm" variant="secondary" onClick={() => setCustomizing(false)}>完成</Button>
        </CardContent>
      </Card>}
      <p className="text-center text-label text-fg-subtle">交互演示 · 示例数据，未连接真实项目</p>
    </div>
  </div>;
}
