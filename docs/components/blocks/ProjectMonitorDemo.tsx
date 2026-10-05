"use client";

import { useState } from "react";
import { ProjectMonitor, projectMonitorDemoData } from "@zeron/blocks/project-monitor-01";
import { Button } from "@zeron/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zeron/ui/card";
import { Switch } from "@zeron/ui/switch";

export function ProjectMonitorDemo() {
  const [customizing, setCustomizing] = useState(false);
  const [resources, setResources] = useState(true);
  const [activity, setActivity] = useState(true);
  return <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8">
    <div className="m-auto w-full max-w-3xl space-y-3">
      <ProjectMonitor data={projectMonitorDemoData} visibleSections={{ resources, activity }}
        labels={{ openDashboard: "打开独立预览" }}
        actions={{ onOpenDashboard: () => window.open("/zh-CN/block-demo/project-monitor-01", "_blank", "noopener,noreferrer"), onCustomize: () => setCustomizing((current) => !current) }} />
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
