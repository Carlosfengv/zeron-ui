"use client";

import { useId, useState } from "react";
import { useLocale } from "next-intl";
import { AgentTasks, agentTasksChineseLabels, agentTasksDemoData, type AgentTask, type AgentTaskFilter } from "@zeron/blocks/agent-tasks-01";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { Input } from "@zeron/ui/input";

const chineseTitles: Record<string, string> = {
  crm: "清理重复的 CRM 联系人", migration: "迁移用户表至 Postgres 17", review: "审查 PR #482 – 计费 Webhook",
  release: "编写 v2.4 发布说明", translate: "将引导邮件翻译成德语", metrics: "每周指标摘要", react: "升级 React 至 19.2",
};
const chineseEvents: Record<string, string> = {
  duplicates: "发现 18 位重复联系人", failed: "CRM 连接已过期，请重新连接后继续", write: "已编写迁移 0042_split_users",
  "dry-run": "预发布环境试运行 – 无错误", request: "请求在生产环境运行", approved: "你已批准 – 正在生产环境运行",
};

export function AgentTasksDemo() {
  const chinese = useLocale() === "zh-CN";
  const titleInputId = useId();
  const [tasks, setTasks] = useState<readonly AgentTask[]>(agentTasksDemoData);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("migration");
  const [filter, setFilter] = useState<AgentTaskFilter>("all");
  const localizedTasks = tasks.map((task) => chinese ? { ...task, title: chineseTitles[task.id] ?? task.title,
    events: task.events?.map((event) => ({ ...event, message: chineseEvents[event.id] ?? event.message,
      time: event.time === "now" ? "刚刚" : event.time.replace("m ago", " 分钟前") })) } : task);

  function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const task: AgentTask = { id: crypto.randomUUID(), title: title.trim(), model: "Sonnet 5.5", duration: "0s", status: "running",
      events: [{ id: "created", message: chinese ? "已创建本地演示任务" : "Local demo task created", time: chinese ? "刚刚" : "now", current: true }] };
    setTasks((current) => [...current, task]);
    setExpandedTaskId(task.id);
    setFilter("all");
    setCreating(false);
    setTitle("");
  }

  return (
    <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-4 sm:p-8">
      <div className="m-auto flex w-full justify-center py-2">
        <AgentTasks tasks={localizedTasks} filter={filter} onFilterChange={setFilter} expandedTaskId={expandedTaskId} onExpandedTaskChange={setExpandedTaskId}
          onOpenTask={setSelectedTask} onNewTask={() => { setTitle(""); setCreating(true); }} labels={chinese ? agentTasksChineseLabels : undefined} />
      </div>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <form onSubmit={createTask}>
            <DialogHeader>
              <DialogTitle>{chinese ? "新建任务" : "New task"}</DialogTitle>
              <DialogDescription>{chinese ? "本地交互演示，不会启动真实 Agent。" : "Local demo. This will not start a real agent."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <label htmlFor={titleInputId} className="text-label font-medium text-fg-default">{chinese ? "任务名称" : "Task name"}</label>
              <Input id={titleInputId} autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={chinese ? "你想完成什么任务？" : "What would you like to do?"} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>{chinese ? "取消" : "Cancel"}</Button>
              <Button type="submit" disabled={!title.trim()}>{chinese ? "创建任务" : "Create task"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={selectedTask !== null} onOpenChange={(open) => { if (!open) setSelectedTask(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="break-words">{selectedTask?.title}</DialogTitle>
            <DialogDescription className="break-words">{selectedTask?.model} · {selectedTask?.duration}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedTask?.events?.length ? <ol className="space-y-3">{selectedTask.events.map((event) => <li key={event.id} className="flex items-start justify-between gap-4 text-body text-fg-default"><span className="min-w-0 flex-1 break-words">{event.message}</span><span className="shrink-0 text-label text-fg-subtle">{event.time}</span></li>)}</ol>
              : <p className="text-body text-fg-subtle">{chinese ? "暂无活动记录。" : "No activity yet."}</p>}
            <p className="text-label text-fg-subtle">{chinese ? "此为本地演示，实际任务由宿主接入。" : "Local demo. Connect host callbacks to open real tasks."}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
