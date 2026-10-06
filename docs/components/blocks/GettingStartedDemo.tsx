"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { GettingStarted, gettingStartedDemoTasks, type GettingStartedTask } from "@zeron/blocks/getting-started-01";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DemoSettingsMenu } from "./DemoSettingsMenu";

const chineseTitles = ["创建个人资料", "添加首个推广活动", "设置预算与规则", "邀请创作者", "审核并批准投稿"];

export function GettingStartedDemo() {
  const chinese = useLocale() === "zh-CN";
  const [open, setOpen] = useState(true);
  const [tasks, setTasks] = useState<readonly GettingStartedTask[]>(gettingStartedDemoTasks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const selected = tasks.find((task) => task.id === selectedId);
  const titleOf = (task: GettingStartedTask) => chinese ? chineseTitles[gettingStartedDemoTasks.findIndex((item) => item.id === task.id)] ?? task.title : task.title;
  const displayTasks = tasks.map((task) => ({ ...task, title: titleOf(task), disabled }));

  function reset() {
    setTasks(gettingStartedDemoTasks);
    setSelectedId(null);
    setDisabled(false);
    setOpen(true);
  }

  function completeSelected() {
    setTasks((current) => {
      const updated = current.map((task) => task.id === selectedId ? { ...task, status: "completed" as const } : task);
      if (updated.some((task) => task.status === "current")) return updated;
      const nextId = updated.find((task) => task.status === "pending")?.id;
      return updated.map((task) => task.id === nextId ? { ...task, status: "current" as const } : task);
    });
    setSelectedId(null);
  }

  return (
    <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8">
      <div className="m-auto w-full max-w-xl space-y-6">
        <GettingStarted title={chinese ? "开始使用" : "Getting started"} tasks={displayTasks} open={open} onOpenChange={setOpen}
          onTaskAction={setSelectedId} labels={chinese ? {
            completed: "已完成", current: "当前步骤", pending: "待完成", empty: "暂无入门任务。",
            progress: (completed, total) => `已完成 ${completed} 项，共 ${total} 项`,
          } : undefined} />
        <DemoSettingsMenu toggles={[
          { id: "expand", label: chinese ? "展开清单" : "Expand checklist", checked: open, onChange: setOpen },
          { id: "disable-actions", label: chinese ? "禁用任务入口" : "Disable actions", checked: disabled, onChange: setDisabled },
        ]} actions={[
          { label: chinese ? "重置示例" : "Reset demo", onSelect: reset },
          { label: chinese ? "全部完成" : "Complete all", onSelect: () => { setTasks(gettingStartedDemoTasks.map((task) => ({ ...task, status: "completed" }))); setSelectedId(null); } },
          { label: chinese ? "空清单" : "Empty list", onSelect: () => { setTasks([]); setSelectedId(null); } },
        ]} />
        <p className="text-center text-label text-fg-subtle">{chinese ? "交互演示 · 示例任务，未连接真实业务服务" : "Interactive demo · Example tasks, no service connected"}</p>
      </div>
      <Dialog open={selected !== undefined} onOpenChange={(next) => { if (!next) setSelectedId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? titleOf(selected) : ""}</DialogTitle>
            <DialogDescription>{chinese ? "这里演示宿主接收任务入口，并在完成后更新清单状态。" : "The host receives the task action and updates the checklist when the task is complete."}</DialogDescription>
          </DialogHeader>
          <Button onClick={completeSelected}>{chinese ? "完成此示例任务" : "Complete example task"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
