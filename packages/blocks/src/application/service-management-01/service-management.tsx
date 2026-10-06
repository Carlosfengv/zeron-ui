"use client";

import { OperationsWorkspaceShell, defaultOperationsServiceNavigation, type OperationsWorkspaceOptions } from "../operations-workspace-shell-01";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ComponentPropsWithoutRef } from "react";
import { Badge } from "@zeron/ui/badge";
import { DataTable, useDataTable } from "@zeron/ui/data-table";
import { PageBody, PageContent } from "@zeron/ui/page-layout";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
export type ServiceManagementView = "service-progress" | "service-authorizations" | "operation-history";

export interface ServiceTicketItem {
  id: string;
  subject: string;
  priority: "P1" | "P2";
  stage: "待受理" | "问题分析" | "方案确认" | "实施中" | "验收确认" | "已关闭";
  progress: number;
  engineer: string;
  updatedAt: string;
}

export interface ServiceAuthorizationItem {
  id: string;
  vendor: string;
  service: string;
  coverage: string;
  validThrough: string;
  status: "生效中" | "即将到期";
  engineer: string;
  remaining: string;
}

export interface ClusterOperationItem {
  id: string;
  occurredAt: string;
  actor: string;
  role: "当前用户" | "厂家" | "专属运维工程师" | "巡检助手";
  action: string;
  environment: string;
  result: string;
  source: string;
}

export interface ServiceManagementProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  workspace?: OperationsWorkspaceOptions;
  defaultView?: ServiceManagementView;
  view?: ServiceManagementView;
  onViewChange?: (view: ServiceManagementView) => void;
  tickets?: readonly ServiceTicketItem[];
  authorizations?: readonly ServiceAuthorizationItem[];
  operations?: readonly ClusterOperationItem[];
}

export const defaultServiceTickets = [
  { id: "SR-20260819-018", subject: "Ceph 容量扩容与均衡", priority: "P1", stage: "实施中", progress: 60, engineer: "李锐 / 专属运维工程师", updatedAt: "10:18" },
  { id: "SR-20260818-032", subject: "核心业务区网络冗余核查", priority: "P1", stage: "方案确认", progress: 35, engineer: "陈浩 / 厂家工程师", updatedAt: "昨日 16:40" },
  { id: "SR-20260816-011", subject: "平台版本补丁升级", priority: "P2", stage: "验收确认", progress: 90, engineer: "华东金融服务团队", updatedAt: "08-18 18:25" },
  { id: "SR-20260815-007", subject: "主机 CPU 高负载分析", priority: "P2", stage: "已关闭", progress: 100, engineer: "巡检助手 + 王敏", updatedAt: "08-16 11:12" },
] as const satisfies readonly ServiceTicketItem[];

export const defaultServiceAuthorizations = [
  { id: "auth-zstack-advanced", vendor: "ZStack", service: "高级运维支持", coverage: "金融核心环境 / 全资源", validThrough: "2026-12-31", status: "生效中", engineer: "李锐、陈浩", remaining: "134 天" },
  { id: "auth-zstack-inspection", vendor: "ZStack", service: "巡检与健康评估", coverage: "管理节点、集群、主机", validThrough: "2026-09-30", status: "即将到期", engineer: "巡检助手", remaining: "42 天" },
  { id: "auth-east-finance", vendor: "华东金融服务团队", service: "紧急故障响应", coverage: "生产区核心业务资源", validThrough: "2026-12-31", status: "生效中", engineer: "7×24 值守团队", remaining: "134 天" },
  { id: "auth-dr", vendor: "云灾备服务中心", service: "灾备演练支持", coverage: "灾备环境、复制链路", validThrough: "2026-08-31", status: "即将到期", engineer: "周凯", remaining: "12 天" },
] as const satisfies readonly ServiceAuthorizationItem[];

export const defaultClusterOperations = [
  { id: "operation-1", occurredAt: "2026-08-19 10:32", actor: "张晨", role: "当前用户", action: "调整巡检计划执行时间", environment: "金融核心环境", result: "已生效", source: "控制台" },
  { id: "operation-2", occurredAt: "2026-08-19 10:18", actor: "李锐", role: "专属运维工程师", action: "扩容 Ceph 存储节点", environment: "金融核心环境", result: "执行中（60%）", source: "运维平台" },
  { id: "operation-3", occurredAt: "2026-08-19 09:56", actor: "巡检助手", role: "巡检助手", action: "生成例行巡检报告", environment: "金融核心环境", result: "已完成，评分 82", source: "自动任务" },
  { id: "operation-4", occurredAt: "2026-08-19 09:42", actor: "华东金融服务团队", role: "厂家", action: "更新平台组件补丁", environment: "金融核心环境", result: "已完成", source: "服务工单" },
  { id: "operation-5", occurredAt: "2026-08-19 09:20", actor: "王敏", role: "当前用户", action: "确认 P1 网络链路告警", environment: "金融核心环境", result: "已确认，待处理", source: "控制台" },
  { id: "operation-6", occurredAt: "2026-08-19 09:08", actor: "巡检助手", role: "巡检助手", action: "标记存储容量风险并创建服务工单", environment: "金融核心环境", result: "已完成", source: "自动任务" },
  { id: "operation-7", occurredAt: "2026-08-19 08:45", actor: "陈浩", role: "专属运维工程师", action: "复核核心业务区网络冗余状态", environment: "金融核心环境", result: "已提交处理方案", source: "运维平台" },
  { id: "operation-8", occurredAt: "2026-08-19 08:26", actor: "张晨", role: "当前用户", action: "授权厂家访问灾备复制链路", environment: "金融核心环境", result: "已生效", source: "控制台" },
  { id: "operation-9", occurredAt: "2026-08-19 08:15", actor: "华东金融服务团队", role: "厂家", action: "执行平台版本补丁预检", environment: "金融核心环境", result: "通过，待升级窗口", source: "服务工单" },
  { id: "operation-10", occurredAt: "2026-08-19 07:58", actor: "李锐", role: "专属运维工程师", action: "更新 Ceph 扩容实施计划", environment: "金融核心环境", result: "已同步给当前用户", source: "运维平台" },
  { id: "operation-11", occurredAt: "2026-08-19 07:30", actor: "巡检助手", role: "巡检助手", action: "采集主机 CPU 基线并更新趋势", environment: "金融核心环境", result: "已完成", source: "自动任务" },
  { id: "operation-12", occurredAt: "2026-08-19 07:12", actor: "王敏", role: "当前用户", action: "关闭已恢复的备份延迟告警", environment: "金融核心环境", result: "已关闭", source: "控制台" },
] as const satisfies readonly ClusterOperationItem[];

function ServiceProgress({ tickets }: { tickets: readonly ServiceTicketItem[] }) {
  const [ticketView, setTicketView] = useState<"in-progress" | "completed">("in-progress");
  const inProgressTickets = useMemo(() => tickets.filter((ticket) => ticket.stage !== "已关闭"), [tickets]);
  const completedTickets = useMemo(() => tickets.filter((ticket) => ticket.stage === "已关闭"), [tickets]);
  const visibleTickets = useMemo(() => ticketView === "in-progress" ? inProgressTickets : completedTickets, [completedTickets, inProgressTickets, ticketView]);
  const columns = useMemo<ColumnDef<ServiceTicketItem, unknown>[]>(() => [
    { accessorKey: "id", cell: ({ row }) => <span className="font-mono text-body text-fg-muted">{row.original.id}</span>, header: "工单号" },
    { accessorKey: "subject", cell: ({ row }) => <span className="text-body font-medium text-fg-default">{row.original.subject}</span>, header: "服务事项" },
    { accessorKey: "priority", cell: ({ row }) => <Badge status={row.original.priority === "P1" ? "danger" : "warning"} size="sm" variant="strong">{row.original.priority}</Badge>, header: "优先级" },
    { accessorKey: "stage", cell: ({ row }) => <span className="text-body text-fg-default">{row.original.stage}</span>, header: "当前阶段" },
    { accessorKey: "progress", cell: ({ row }) => <span className="text-label text-fg-muted">{row.original.progress}%</span>, header: "进度" },
    { accessorKey: "engineer", cell: ({ row }) => <span className="text-body text-fg-default">{row.original.engineer}</span>, header: "当前处理人" },
    { accessorKey: "updatedAt", cell: ({ row }) => <span className="text-body text-fg-muted">{row.original.updatedAt}</span>, header: "最近更新" },
  ], []);
  const data = useMemo(() => [...visibleTickets], [visibleTickets]);
  const { table } = useDataTable({ columns, data, getRowId: (ticket) => ticket.id, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } });
  return <div className="flex flex-col gap-2"><Tabs aria-label="服务进度状态" color="neutral" onValueChange={(value) => setTicketView(value as "in-progress" | "completed")} value={ticketView} variant="pill"><TabsList><TabItem badge={inProgressTickets.length} label="进行中" onClick={() => setTicketView("in-progress")} value="in-progress" /><TabItem badge={completedTickets.length} label="已完成" onClick={() => setTicketView("completed")} value="completed" /></TabsList></Tabs><DataTable emptyMessage="暂无服务工单。" key={ticketView} table={table} /></div>;
}

function ServiceAuthorizations({ authorizations }: { authorizations: readonly ServiceAuthorizationItem[] }) {
  const columns = useMemo<ColumnDef<ServiceAuthorizationItem, unknown>[]>(() => [
    { accessorKey: "vendor", cell: ({ row }) => <span className="text-body font-medium text-fg-default">{row.original.vendor}</span>, header: "厂商" },
    { accessorKey: "service", cell: ({ row }) => <span className="text-body text-fg-default">{row.original.service}</span>, header: "授权服务" },
    { accessorKey: "coverage", cell: ({ row }) => <span className="text-body text-fg-muted">{row.original.coverage}</span>, header: "覆盖范围" },
    { accessorKey: "validThrough", cell: ({ row }) => <span className="text-body text-fg-default">{row.original.validThrough}</span>, header: "授权有效期至" },
    { accessorKey: "status", cell: ({ row }) => <span className={cn("text-body", row.original.status === "生效中" ? "text-fg-success" : "text-fg-warning")}>{row.original.status}</span>, header: "状态" },
    { accessorKey: "engineer", cell: ({ row }) => <span className="text-body text-fg-default">{row.original.engineer}</span>, header: "专属工程师" },
    { accessorKey: "remaining", cell: ({ row }) => <span className={cn("text-body", row.original.status === "即将到期" ? "text-fg-warning" : "text-fg-muted")}>{row.original.remaining}</span>, header: "剩余时间" },
  ], []);
  const data = useMemo(() => [...authorizations], [authorizations]);
  const { table } = useDataTable({ columns, data, getRowId: (authorization) => authorization.id, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } });
  return <DataTable emptyMessage="暂无服务授权。" table={table} />;
}

function OperationHistory({ operations }: { operations: readonly ClusterOperationItem[] }) {
  const columns = useMemo<ColumnDef<ClusterOperationItem, unknown>[]>(() => [
    { accessorKey: "occurredAt", cell: ({ row }) => <span className="text-label text-fg-muted">{row.original.occurredAt}</span>, header: "时间" },
    { accessorKey: "actor", cell: ({ row }) => <span className="text-body font-medium text-fg-default">{row.original.actor}</span>, header: "操作人" },
    { accessorKey: "role", cell: ({ row }) => <span className="text-body text-fg-default">{row.original.role}</span>, header: "身份" },
    { accessorKey: "action", cell: ({ row }) => <span className="text-body text-fg-default">{row.original.action}</span>, header: "操作内容" },
    { accessorKey: "environment", cell: ({ row }) => <span className="text-body text-fg-muted">{row.original.environment}</span>, header: "目标环境" },
    { accessorKey: "result", cell: ({ row }) => <span className="text-body text-fg-default">{row.original.result}</span>, header: "结果" },
    { accessorKey: "source", cell: ({ row }) => <span className="text-body text-fg-muted">{row.original.source}</span>, header: "来源" },
  ], []);
  const data = useMemo(() => [...operations], [operations]);
  const { table } = useDataTable({ columns, data, getRowId: (operation) => operation.id, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } });
  return <DataTable emptyMessage="暂无操作记录。" table={table} />;
}

/** A ZAIops service workspace that switches between progress, authorization, and operation-history mock data. */
export function ServiceManagement({ workspace, authorizations = defaultServiceAuthorizations, className, defaultView = "service-progress", onViewChange, operations = defaultClusterOperations, tickets = defaultServiceTickets, view, ...props }: ServiceManagementProps) {
  const [internalView, setInternalView] = useState<ServiceManagementView>(defaultView);
  const activeView = view ?? internalView;
  const Clock = useIcon("clock");
  const User = useIcon("user");
  const Layers = useIcon("doc-surfaces");
  const current = activeView === "service-progress" ? { icon: Clock, title: "服务进度" } : activeView === "service-authorizations" ? { icon: User, title: "服务授权" } : { icon: Layers, title: "操作记录" };
  const setView = (next: ServiceManagementView) => { if (view === undefined) setInternalView(next); onViewChange?.(next); };
  return <OperationsWorkspaceShell workspace={{ ...workspace, serviceNavigation: (workspace?.serviceNavigation ?? defaultOperationsServiceNavigation).map(item => ({ ...item, onSelect: item.value === "service-progress" || item.value === "service-authorizations" || item.value === "operation-history" ? () => { item.onSelect?.(); setView(item.value as ServiceManagementView); } : item.onSelect })) }} activeNavigation={activeView} title={current.title} icon={current.icon} className={cn("min-h-[42rem]", className)} {...props}><PageContent><PageBody className="max-w-[101.25rem] p-3">{activeView === "service-progress" ? <ServiceProgress tickets={tickets} /> : activeView === "service-authorizations" ? <ServiceAuthorizations authorizations={authorizations} /> : <OperationHistory operations={operations} />}</PageBody></PageContent></OperationsWorkspaceShell>;
}
