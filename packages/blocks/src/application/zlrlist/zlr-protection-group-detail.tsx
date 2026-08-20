"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import { useDataTable } from "@zeron/ui/data-table";
import {
  DetailList,
  DetailListItem,
  DetailListLabel,
  DetailListSeparator,
  DetailListValue,
} from "@zeron/ui/detail-list";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zeron/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@zeron/ui/select";
import {
  Sidebar,
  SidebarProvider,
} from "@zeron/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zeron/ui/table";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { type ZlrProtectionGroup, ZlrNavigation } from "./zlrlist";

export type ZlrRecoveryPlanStatus = "ready" | "failback-pending" | "recovery-incomplete" | "drilling";

export interface ZlrRecoveryPlan {
  id: string;
  name: string;
  status: ZlrRecoveryPlanStatus;
  lastRunAt: string;
}

export interface ZlrVmMember {
  id: string;
  name: string;
  status: "已保护" | "未保护";
  host: string;
  cluster: string;
  createdAt: string;
}

export interface ZlrOperationHistoryEntry {
  id: string;
  operation: "添加虚拟机" | "移除虚拟机";
  result: "成功" | "失败";
  operator: string;
  executedAt: string;
}

export interface ZlrProtectionGroupDetailData extends ZlrProtectionGroup {
  description: string;
  updatedAt: string;
  replicationTask: {
    name: string;
    connectionStatus: "已失联" | "已连接";
    runningStatus: "运行中" | "已暂停";
    proInterval: string;
    targetStorage: string;
    lastSyncedAt: string;
  };
}

export interface ZlrProtectionGroupDetailProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  group?: ZlrProtectionGroupDetailData;
  recoveryPlans?: readonly ZlrRecoveryPlan[];
  vmMembers?: readonly ZlrVmMember[];
  operationHistory?: readonly ZlrOperationHistoryEntry[];
  siteLabel?: string;
  onBack?: () => void;
  onEdit?: (group: ZlrProtectionGroupDetailData) => void;
  onDelete?: (group: ZlrProtectionGroupDetailData) => void;
  onNavigate?: (value: string) => void;
  onAddVm?: () => void;
  onRemoveVm?: (members: readonly ZlrVmMember[]) => void;
  onVmAction?: (member: ZlrVmMember) => void;
  vmMembersContent?: ReactNode;
  operationHistoryContent?: ReactNode;
}

export const defaultZlrProtectionGroupDetail: ZlrProtectionGroupDetailData = {
  id: "shanghai-core-01",
  name: "上海核心应用",
  description: "上海核心应用，承载上海地区主要业务",
  memberCount: 33,
  alertCount: 2,
  createdAt: "2026-06-20 10:00",
  updatedAt: "2026-06-20 10:00",
  replicationTask: {
    name: "复制任务名称",
    connectionStatus: "已失联",
    runningStatus: "运行中",
    proInterval: "5 分钟",
    targetStorage: "目标存储名称",
    lastSyncedAt: "2026-06-20 10:00",
  },
};

export const defaultZlrRecoveryPlans: readonly ZlrRecoveryPlan[] = [
  { id: "plan-ready", name: "核心业务恢复计划", status: "ready", lastRunAt: "2026-07-31 14:03" },
  { id: "plan-failback", name: "核心业务恢复计划", status: "failback-pending", lastRunAt: "2026-07-31 14:03" },
  { id: "plan-incomplete", name: "核心业务恢复计划", status: "recovery-incomplete", lastRunAt: "2026-07-31 14:03" },
  { id: "plan-drilling", name: "核心业务恢复计划", status: "drilling", lastRunAt: "2026-07-31 14:03" },
];

export const defaultZlrVmMembers: readonly ZlrVmMember[] = [
  { id: "vm-01", name: "虚拟机名称 xxxx", status: "已保护", host: "host-shanghai-01", cluster: "cluster-a", createdAt: "2026-07-31 14:03" },
  { id: "vm-02", name: "虚拟机名称 xxxx", status: "已保护", host: "host-shanghai-01", cluster: "cluster-a", createdAt: "2026-07-31 14:03" },
  { id: "vm-03", name: "虚拟机名称 xxxx", status: "已保护", host: "host-shanghai-01", cluster: "cluster-a", createdAt: "2026-07-31 14:03" },
  { id: "vm-04", name: "虚拟机名称 xxxx", status: "已保护", host: "host-shanghai-01", cluster: "cluster-a", createdAt: "2026-07-31 14:03" },
  { id: "vm-05", name: "虚拟机名称 xxxx", status: "已保护", host: "host-shanghai-01", cluster: "cluster-a", createdAt: "2026-07-31 14:03" },
];

export const defaultZlrOperationHistory: readonly ZlrOperationHistoryEntry[] = [
  { id: "history-01", operation: "添加虚拟机", result: "成功", operator: "admin", executedAt: "2026-07-31 14:03" },
  { id: "history-02", operation: "移除虚拟机", result: "失败", operator: "admin", executedAt: "2026-07-31 14:03" },
  { id: "history-03", operation: "添加虚拟机", result: "成功", operator: "admin", executedAt: "2026-07-31 14:03" },
  { id: "history-04", operation: "移除虚拟机", result: "失败", operator: "admin", executedAt: "2026-07-31 14:03" },
  { id: "history-05", operation: "添加虚拟机", result: "成功", operator: "admin", executedAt: "2026-07-31 14:03" },
  { id: "history-06", operation: "移除虚拟机", result: "失败", operator: "admin", executedAt: "2026-07-31 14:03" },
];

const recoveryPlanStatus: Record<ZlrRecoveryPlanStatus, { label: string; status: "success" | "warning" | "danger" | "info" }> = {
  ready: { label: "就绪", status: "success" },
  "failback-pending": { label: "待回切", status: "warning" },
  "recovery-incomplete": { label: "恢复未完成", status: "danger" },
  drilling: { label: "演练中", status: "info" },
};

function DetailSection({ children, className, title }: { children: ReactNode; className?: string; title: string }) {
  return (
    <DetailList className={cn("gap-0 rounded-lg border-border-subtle p-3", className)}>
      <h2 className="pb-2 text-body font-semibold text-fg-default">{title}</h2>
      <DetailListSeparator className="mb-1" />
      {children}
    </DetailList>
  );
}

function VmMembersTab({
  members,
  onAdd,
  onRemove,
  onAction,
}: {
  members: readonly ZlrVmMember[];
  onAdd?: () => void;
  onRemove?: (members: readonly ZlrVmMember[]) => void;
  onAction?: (member: ZlrVmMember) => void;
}) {
  const ChevronLeft = useIcon("chevron-left");
  const ChevronRight = useIcon("chevron-right");
  const ChevronsLeft = useIcon("chevrons-left");
  const ChevronsRight = useIcon("chevrons-right");
  const Layers = useIcon("list");
  const More = useIcon("ellipsis");
  const Search = useIcon("search");
  const columns = useMemo<ColumnDef<ZlrVmMember, unknown>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => <Checkbox aria-label="选择本页全部虚拟机" checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false} className="size-4 rounded-md" onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))} />,
        cell: ({ row }) => <Checkbox aria-label={`选择${row.original.name}`} checked={row.getIsSelected()} className="size-4 rounded-md" onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))} />,
        enableHiding: false,
        enableSorting: false,
        size: 36,
      },
      {
        accessorKey: "name",
        header: "虚拟机",
        cell: ({ row }) => <div className="flex min-w-[220px] items-center gap-2"><span className="flex size-5 shrink-0 items-center justify-center rounded bg-brand text-fg-on-brand"><Layers aria-hidden="true" size={12} strokeWidth={2} /></span><span className="truncate">{row.original.name}</span></div>,
        size: 300,
      },
      { accessorKey: "status", header: "状态", cell: ({ row }) => <Badge size="sm" status={row.original.status === "已保护" ? "success" : "warning"}>{row.original.status}</Badge>, size: 160 },
      { accessorKey: "host", header: "主机", size: 220 },
      { accessorKey: "cluster", header: "集群", size: 180 },
      { accessorKey: "createdAt", header: "创建时间", size: 220 },
      {
        id: "actions",
        header: () => <span className="block text-right">操作</span>,
        cell: ({ row }) => <div className="flex justify-end"><Button aria-label={`更多操作：${row.original.name}`} iconOnly onClick={() => onAction?.(row.original)} size="sm" variant="tertiary"><More aria-hidden="true" size={16} strokeWidth={1.5} /></Button></div>,
        enableHiding: false,
        enableSorting: false,
        size: 84,
      },
    ],
    [Layers, More, onAction]
  );
  const { table } = useDataTable({
    columns,
    data: useMemo(() => [...members], [members]),
    enableRowSelection: true,
    getRowId: (member) => member.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  const nameColumn = table.getColumn("name");
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const selectedMembers = table.getSelectedRowModel().rows.map((row) => row.original);

  return (
    <section className="flex min-h-full min-w-0 flex-col rounded-lg border border-border-subtle p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <InputGroup className="h-8 min-w-[180px] max-w-[450px] flex-1 rounded-lg" size="sm"><InputGroupAddon><Search aria-hidden="true" size={16} strokeWidth={1.5} /></InputGroupAddon><InputGroupInput aria-label="搜索虚拟机" onChange={(event) => nameColumn?.setFilterValue(event.target.value)} placeholder="搜索" value={(nameColumn?.getFilterValue() as string) ?? ""} /></InputGroup>
        <div className="flex shrink-0 items-center gap-2"><Button onClick={onAdd} size="sm" variant="tertiary">添加虚拟机</Button><Button disabled={!selectedMembers.length} onClick={() => onRemove?.(selectedMembers)} size="sm" variant="tertiary">移除虚拟机</Button></div>
      </div>
      <div className="min-w-0 overflow-x-auto rounded-lg border border-border-subtle">
        <Table className="min-w-[1040px]"><TableHeader>{table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => <TableHead className="h-9 whitespace-nowrap text-body font-medium text-fg-default" key={header.id} style={{ width: header.getSize() }}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row, index) => <TableRow className="h-[52px]" index={index} key={row.id}>{row.getVisibleCells().map((cell) => <TableCell className="whitespace-nowrap" key={cell.id} style={{ width: cell.column.getSize() }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell className="h-32 text-center text-fg-muted" colSpan={columns.length}>暂无虚拟机</TableCell></TableRow>}</TableBody></Table>
      </div>
      <footer className="mt-1 flex min-h-9 flex-wrap items-center justify-end gap-3 px-3 py-1 text-label text-fg-muted"><span>每页行数</span><Select itemDensity="compact" onValueChange={(value) => table.setPageSize(Number(value))} size="sm" value={`${table.getState().pagination.pageSize}`}><SelectTrigger aria-label="每页行数" className="h-7 w-[70px] min-w-[70px] rounded-lg px-2 text-body" /><SelectContent>{[10, 20, 30, 40].map((size) => <SelectItem key={size} value={`${size}`}>{size}</SelectItem>)}</SelectContent></Select><span>第 {pageIndex + 1} 页，共 {pageCount} 页</span><div className="flex items-center gap-2"><Button aria-label="首页" disabled={!table.getCanPreviousPage()} iconOnly onClick={() => table.setPageIndex(0)} size="sm" variant="tertiary"><ChevronsLeft aria-hidden="true" size={16} strokeWidth={1.5} /></Button><Button aria-label="上一页" disabled={!table.getCanPreviousPage()} iconOnly onClick={() => table.previousPage()} size="sm" variant="tertiary"><ChevronLeft aria-hidden="true" size={16} strokeWidth={1.5} /></Button><Button aria-label="下一页" disabled={!table.getCanNextPage()} iconOnly onClick={() => table.nextPage()} size="sm" variant="tertiary"><ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} /></Button><Button aria-label="末页" disabled={!table.getCanNextPage()} iconOnly onClick={() => table.setPageIndex(pageCount - 1)} size="sm" variant="tertiary"><ChevronsRight aria-hidden="true" size={16} strokeWidth={1.5} /></Button></div></footer>
    </section>
  );
}

function OperationHistoryTab({ entries }: { entries: readonly ZlrOperationHistoryEntry[] }) {
  const ChevronLeft = useIcon("chevron-left");
  const ChevronRight = useIcon("chevron-right");
  const ChevronsLeft = useIcon("chevrons-left");
  const ChevronsRight = useIcon("chevrons-right");
  const Search = useIcon("search");
  const columns = useMemo<ColumnDef<ZlrOperationHistoryEntry, unknown>[]>(
    () => [
      { accessorKey: "operation", header: "操作", size: 280 },
      { accessorKey: "result", header: "结果", cell: ({ row }) => <Badge size="sm" status={row.original.result === "成功" ? "success" : "danger"}>{row.original.result}</Badge>, size: 220 },
      { accessorKey: "operator", header: "操作人", size: 220 },
      { accessorKey: "executedAt", header: "执行时间", size: 260 },
    ],
    []
  );
  const { table } = useDataTable({ columns, data: useMemo(() => [...entries], [entries]), getRowId: (entry) => entry.id, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } });
  const operationColumn = table.getColumn("operation");
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <section className="flex min-h-full min-w-0 flex-col rounded-lg border border-border-subtle p-3">
      <div className="mb-3"><InputGroup className="h-8 max-w-[450px] rounded-lg" size="sm"><InputGroupAddon><Search aria-hidden="true" size={16} strokeWidth={1.5} /></InputGroupAddon><InputGroupInput aria-label="搜索操作历史" onChange={(event) => operationColumn?.setFilterValue(event.target.value)} placeholder="搜索" value={(operationColumn?.getFilterValue() as string) ?? ""} /></InputGroup></div>
      <div className="min-w-0 overflow-x-auto rounded-lg border border-border-subtle"><Table className="min-w-[680px]"><TableHeader>{table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => <TableHead className="h-9 whitespace-nowrap text-body font-medium text-fg-default" key={header.id} style={{ width: header.getSize() }}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row, index) => <TableRow className="h-[52px]" index={index} key={row.id}>{row.getVisibleCells().map((cell) => <TableCell className="whitespace-nowrap" key={cell.id} style={{ width: cell.column.getSize() }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell className="h-32 text-center text-fg-muted" colSpan={columns.length}>暂无操作历史</TableCell></TableRow>}</TableBody></Table></div>
      <footer className="mt-1 flex min-h-9 flex-wrap items-center justify-end gap-3 px-3 py-1 text-label text-fg-muted"><span>每页行数</span><Select itemDensity="compact" onValueChange={(value) => table.setPageSize(Number(value))} size="sm" value={`${table.getState().pagination.pageSize}`}><SelectTrigger aria-label="每页行数" className="h-7 w-[70px] min-w-[70px] rounded-lg px-2 text-body" /><SelectContent>{[10, 20, 30, 40].map((size) => <SelectItem key={size} value={`${size}`}>{size}</SelectItem>)}</SelectContent></Select><span>第 {pageIndex + 1} 页，共 {pageCount} 页</span><div className="flex items-center gap-2"><Button aria-label="首页" disabled={!table.getCanPreviousPage()} iconOnly onClick={() => table.setPageIndex(0)} size="sm" variant="tertiary"><ChevronsLeft aria-hidden="true" size={16} strokeWidth={1.5} /></Button><Button aria-label="上一页" disabled={!table.getCanPreviousPage()} iconOnly onClick={() => table.previousPage()} size="sm" variant="tertiary"><ChevronLeft aria-hidden="true" size={16} strokeWidth={1.5} /></Button><Button aria-label="下一页" disabled={!table.getCanNextPage()} iconOnly onClick={() => table.nextPage()} size="sm" variant="tertiary"><ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} /></Button><Button aria-label="末页" disabled={!table.getCanNextPage()} iconOnly onClick={() => table.setPageIndex(pageCount - 1)} size="sm" variant="tertiary"><ChevronsRight aria-hidden="true" size={16} strokeWidth={1.5} /></Button></div></footer>
    </section>
  );
}

/** Figma-aligned protection-group detail workspace composed from existing Zeron UI primitives. */
export function ZlrProtectionGroupDetail({
  className,
  group = defaultZlrProtectionGroupDetail,
  operationHistory = defaultZlrOperationHistory,
  recoveryPlans = defaultZlrRecoveryPlans,
  siteLabel = "上海生产站点",
  vmMembers = defaultZlrVmMembers,
  onAddVm,
  onBack,
  onDelete,
  onEdit,
  onNavigate,
  onRemoveVm,
  onVmAction,
  operationHistoryContent,
  vmMembersContent,
  ...props
}: ZlrProtectionGroupDetailProps) {
  const ArrowLeft = useIcon("arrow-left");
  const ChevronLeft = useIcon("chevron-left");
  const ChevronRight = useIcon("chevron-right");
  const ChevronsLeft = useIcon("chevrons-left");
  const ChevronsRight = useIcon("chevrons-right");
  const Layers = useIcon("list");
  const Pin = useIcon("pin");
  const Search = useIcon("search");
  const [tab, setTab] = useState("overview");

  const columns = useMemo<ColumnDef<ZlrRecoveryPlan, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "恢复计划",
        cell: ({ row }) => (
          <div className="flex min-w-[230px] items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded bg-brand text-fg-on-brand"><Layers aria-hidden="true" size={12} strokeWidth={2} /></span>
            <span className="truncate">{row.original.name}</span>
          </div>
        ),
        size: 360,
      },
      {
        accessorKey: "status",
        header: "状态",
        cell: ({ row }) => {
          const value = recoveryPlanStatus[row.original.status];
          return <Badge size="sm" status={value.status}>{value.label}</Badge>;
        },
        size: 270,
      },
      { accessorKey: "lastRunAt", header: "最近运行时间", size: 220 },
    ],
    [Layers]
  );

  const { table } = useDataTable({
    columns,
    data: useMemo(() => [...recoveryPlans], [recoveryPlans]),
    getRowId: (plan) => plan.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  const nameColumn = table.getColumn("name");
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <section className={cn("h-full min-h-0 w-full overflow-hidden bg-surface-base", className)} {...props}>
      <SidebarProvider breakpointBehavior="collapse" defaultOpen={false}>
        <div className="flex h-full min-h-0 min-w-0 overflow-hidden">
          <Sidebar ariaLabel="ZS Live Recovery 导航" className="relative h-full" collapsible="icon" collapsedWidth="3.5rem" mobileWidth="min(240px, calc(100vw - 24px))" width="240px">
            <ZlrNavigation onNavigate={onNavigate} />
          </Sidebar>
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden p-2">
            <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-floating">
              <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-3">
                <div className="flex min-w-0 items-center gap-1 text-body font-medium text-fg-default">
                  <Button aria-label="返回保护组" iconOnly onClick={onBack} size="sm" variant="ghost"><ArrowLeft aria-hidden="true" size={16} strokeWidth={1.5} /></Button>
                  <button className="shrink-0 rounded-sm outline-none hover:text-fg-brand focus-visible:ring-1 focus-visible:ring-focus-ring" onClick={onBack} type="button">保护组</button>
                  <span aria-hidden="true" className="text-fg-subtle">/</span>
                  <span className="truncate">{group.name}</span>
                </div>
                <div className="hidden min-w-0 items-center gap-1.5 text-body text-fg-muted sm:flex"><Pin aria-hidden="true" size={16} strokeWidth={1.5} /><span className="truncate">当前站点：{siteLabel}</span></div>
              </header>
              <section className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-3 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-active text-fg-brand"><Layers aria-hidden="true" size={24} strokeWidth={1.5} /></span>
                  <div className="min-w-0">
                    <h1 className="truncate text-body font-semibold text-fg-default">{group.name}</h1>
                    <p className="truncate text-label text-fg-muted">{group.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button onClick={() => onEdit?.(group)} size="sm" variant="tertiary">编辑</Button>
                  <Button onClick={() => onDelete?.(group)} size="sm" variant="tertiary">删除</Button>
                </div>
              </section>
              <Tabs className="flex min-h-0 flex-1 flex-col" onValueChange={setTab} value={tab} variant="pill">
                <div className="shrink-0 border-b border-border-subtle px-3 py-3">
                  <TabsList className="max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">
                    <TabItem className="h-7 px-2 text-label" label="概览" value="overview">概览</TabItem>
                    <TabItem className="h-7 px-2 text-label" label="VM 成员" value="members">VM 成员</TabItem>
                    <TabItem className="h-7 px-2 text-label" label="操作历史" value="history">操作历史</TabItem>
                  </TabsList>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-3">
                  <TabPanel className="m-0 h-full" value="overview">
                    <div className="grid min-h-full min-w-0 gap-3 xl:grid-cols-[minmax(19rem,1fr)_minmax(0,2fr)]">
                      <aside className="flex min-w-0 flex-col gap-3">
                        <DetailSection title="基本信息">
                          <DetailListItem><DetailListLabel>成员数</DetailListLabel><DetailListValue className="tabular-nums text-fg-default">{group.memberCount}</DetailListValue></DetailListItem>
                          <DetailListItem><DetailListLabel>创建时间</DetailListLabel><DetailListValue className="tabular-nums">{group.createdAt}</DetailListValue></DetailListItem>
                          <DetailListItem><DetailListLabel>最近修改时间</DetailListLabel><DetailListValue className="tabular-nums">{group.updatedAt}</DetailListValue></DetailListItem>
                        </DetailSection>
                        <DetailSection title="复制任务">
                          <DetailListItem><DetailListLabel>名称</DetailListLabel><DetailListValue className="text-fg-brand">{group.replicationTask.name}</DetailListValue></DetailListItem>
                          <DetailListItem><DetailListLabel>状态</DetailListLabel><DetailListValue className="flex max-w-none items-center justify-end gap-1.5"><Badge size="sm" status={group.replicationTask.connectionStatus === "已失联" ? "danger" : "success"}>{group.replicationTask.connectionStatus}</Badge><Badge size="sm" status={group.replicationTask.runningStatus === "运行中" ? "success" : "warning"}>{group.replicationTask.runningStatus}</Badge></DetailListValue></DetailListItem>
                          <DetailListItem><DetailListLabel>PRO</DetailListLabel><DetailListValue>{group.replicationTask.proInterval}</DetailListValue></DetailListItem>
                          <DetailListItem><DetailListLabel>目标存储</DetailListLabel><DetailListValue>{group.replicationTask.targetStorage}</DetailListValue></DetailListItem>
                          <DetailListItem><DetailListLabel>最近同步时间</DetailListLabel><DetailListValue className="tabular-nums">{group.replicationTask.lastSyncedAt}</DetailListValue></DetailListItem>
                        </DetailSection>
                      </aside>
                      <section className="flex min-h-0 min-w-0 flex-col rounded-lg border border-border-subtle p-3">
                        <h2 className="pb-2 text-body font-semibold text-fg-default">恢复计划</h2>
                        <div className="mb-3 border-t border-border-subtle pt-3">
                          <InputGroup className="h-8 max-w-[450px] rounded-lg" size="sm">
                            <InputGroupAddon><Search aria-hidden="true" size={16} strokeWidth={1.5} /></InputGroupAddon>
                            <InputGroupInput aria-label="搜索恢复计划" onChange={(event) => nameColumn?.setFilterValue(event.target.value)} placeholder="搜索" value={(nameColumn?.getFilterValue() as string) ?? ""} />
                          </InputGroup>
                        </div>
                        <div className="min-w-0 overflow-x-auto rounded-lg border border-border-subtle">
                          <Table className="min-w-[680px]">
                            <TableHeader>{table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => <TableHead className="h-9 whitespace-nowrap text-body font-medium text-fg-default" key={header.id} style={{ width: header.getSize() }}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                            <TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row, index) => <TableRow className="h-[52px]" index={index} key={row.id}>{row.getVisibleCells().map((cell) => <TableCell className="whitespace-nowrap" key={cell.id} style={{ width: cell.column.getSize() }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell className="h-32 text-center text-fg-muted" colSpan={columns.length}>暂无恢复计划</TableCell></TableRow>}</TableBody>
                          </Table>
                        </div>
                        <footer className="mt-1 flex min-h-9 flex-wrap items-center justify-end gap-3 px-3 py-1 text-label text-fg-muted">
                          <span>每页行数</span>
                          <Select itemDensity="compact" onValueChange={(value) => table.setPageSize(Number(value))} size="sm" value={`${table.getState().pagination.pageSize}`}><SelectTrigger aria-label="每页行数" className="h-7 w-[70px] min-w-[70px] rounded-lg px-2 text-body" /><SelectContent>{[10, 20, 30, 40].map((size) => <SelectItem key={size} value={`${size}`}>{size}</SelectItem>)}</SelectContent></Select>
                          <span>第 {pageIndex + 1} 页，共 {pageCount} 页</span>
                          <div className="flex items-center gap-2"><Button aria-label="首页" disabled={!table.getCanPreviousPage()} iconOnly onClick={() => table.setPageIndex(0)} size="sm" variant="tertiary"><ChevronsLeft aria-hidden="true" size={16} strokeWidth={1.5} /></Button><Button aria-label="上一页" disabled={!table.getCanPreviousPage()} iconOnly onClick={() => table.previousPage()} size="sm" variant="tertiary"><ChevronLeft aria-hidden="true" size={16} strokeWidth={1.5} /></Button><Button aria-label="下一页" disabled={!table.getCanNextPage()} iconOnly onClick={() => table.nextPage()} size="sm" variant="tertiary"><ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} /></Button><Button aria-label="末页" disabled={!table.getCanNextPage()} iconOnly onClick={() => table.setPageIndex(pageCount - 1)} size="sm" variant="tertiary"><ChevronsRight aria-hidden="true" size={16} strokeWidth={1.5} /></Button></div>
                        </footer>
                      </section>
                    </div>
                  </TabPanel>
                  <TabPanel className="m-0 h-full" value="members">{vmMembersContent ?? <VmMembersTab members={vmMembers} onAction={onVmAction} onAdd={onAddVm} onRemove={onRemoveVm} />}</TabPanel>
                  <TabPanel className="m-0 h-full" value="history">{operationHistoryContent ?? <OperationHistoryTab entries={operationHistory} />}</TabPanel>
                </div>
              </Tabs>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </section>
  );
}
