"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ComponentPropsWithoutRef, type DragEvent } from "react";
import { Button } from "@zeron/ui/button";
import { Checkbox as ZeronCheckbox } from "@zeron/ui/checkbox";
import { DataTable, useDataTable } from "@zeron/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Input } from "@zeron/ui/input";
import { MenuItem } from "@zeron/ui/menu-item";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageActions, PageBody, PageContent, PageContentHeader, PageHeader, PageHeaderContent, PageLayout, PageSubnav, PageSubnavItem, PageSubnavList } from "@zeron/ui/page-layout";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarProvider, SidebarTrigger } from "@zeron/ui/sidebar";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
import { Switch } from "@zeron/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { Tooltip } from "@zeron/ui/tooltip";
import { LimitForm } from "./limit-form";
import type { RuleFormValue } from "./rule-config";
import { RuleWorkflow } from "./rule-workflow";
import { RuleDetailView } from "./rule-detail";
import { LimitDetailView } from "./limit-detail";
import { TableFooter } from "./table-footer";
import type { GlobalLimit } from "./traffic-types";

type Rule = RuleFormValue;
type Tab = "rules" | "limits";
type Page = "list" | "rule-detail" | "rule-edit" | "limit-create" | "limit-detail" | "limit-edit";
type HistoryTarget = "rule" | "limit";
type HistoryRecord = { action: string; id: string; log: string; time: string };
type ConfirmAction = { action: "delete" | "enable" | "disable"; ids: string[]; target: "rule" | "limit" } | null;

function Checkbox(props: ComponentPropsWithoutRef<typeof ZeronCheckbox>) {
  const alignWithRows = props["aria-label"] === "选择全部规则";
  return <ZeronCheckbox {...props} className={cn(alignWithRows && "sm:-translate-x-1.5", props.className)} />;
}

const initialRules: Rule[] = [
  { id: "routing-policy-prod-model", priority: 10, name: "生产模型请求转发与内容检测", matcher: "/v1/chat/", enabled: true, conditions: ["调用类型 · 等于 模型调用", "调用方 · 等于 service · gateway-router"], actions: ["转发到", "内容检测（护栏）"], workflow: { name: "生产模型请求转发与内容检测", logic: "and", fallback: "reject", conditions: [{ id: "prod-path", kind: "path", operator: "前缀", primary: "/v1/chat/" }, { id: "prod-call-type", kind: "call-type", operator: "等于", primary: "模型调用" }, { id: "prod-principal", kind: "caller", operator: "等于", primary: "service · gateway-router" }], actions: [{ id: "prod-route", type: "转发到", phase: "before", primary: "gateway-model-general-prod", secondary: "weightedHash" }, { id: "prod-guard", type: "内容检测（护栏）", phase: "before", primary: "通用", secondary: "拦截" }] } },
  { id: "routing-policy-mcp", priority: 20, name: "MCP 工具调用保护", matcher: "capability-mcp-search", enabled: true, conditions: ["调用类型 · 等于 MCP 调用", "数据来源 · 包含 mcp"], actions: ["内容检测（护栏）", "应用限额"], workflow: { name: "MCP 工具调用保护", logic: "and", fallback: "reject", conditions: [{ id: "mcp-call-type", kind: "call-type", operator: "等于", primary: "MCP 调用" }, { id: "mcp-capability", kind: "capability", operator: "等于", primary: "capability-mcp-search" }, { id: "mcp-source", kind: "data-source", operator: "包含", primary: "mcp" }], actions: [{ id: "mcp-guard", type: "内容检测（护栏）", phase: "before", primary: "研发安全", secondary: "仅记录，放行" }, { id: "mcp-limit", type: "应用限额", phase: "before", primary: "MCP 工具调用限速", secondary: "拒绝（429）" }] } },
  { id: "routing-policy-a2a-hours", priority: 30, name: "A2A 非服务时段拒绝", matcher: "A2A 调用 · 00:00–08:00", enabled: false, conditions: ["调用类型 · 等于 A2A 调用", "时段 · 位于 00:00–08:00 · Asia/Shanghai"], actions: ["拒绝本次调用"], workflow: { name: "A2A 非服务时段拒绝", logic: "and", fallback: "reject", conditions: [{ id: "a2a-call-type", kind: "call-type", operator: "等于", primary: "A2A 调用" }, { id: "a2a-schedule", kind: "period", operator: "位于", primary: "00:00–08:00", secondary: "Asia/Shanghai" }], actions: [{ id: "a2a-deny", type: "拒绝本次调用", phase: "before", primary: "a2a_outside_service_window" }] } },
];

const initialLimits: GlobalLimit[] = [
  { id: "limit-prod-model-rate", name: "生产环境模型调用限速", limitType: "限速（GCRA）", dimension: "网关模型密钥", conditionLogic: "and", conditions: [{ id: "limit-prod-policy-set", field: "策略集", operator: "等于", value: "model-gateway" }, { id: "limit-prod-model", field: "网关模型", operator: "等于", value: "gateway-model-general-prod" }], windows: [{ id: "limit-prod-second", unit: "秒", count: 20, burst: 30 }, { id: "limit-prod-minute", unit: "分钟", count: 600, burst: 720 }], temporaryEnabled: false, temporaryWindows: [{ id: "temporary-prod-second", unit: "秒", count: 30, burst: 40 }, { id: "temporary-prod-minute", unit: "分钟", count: 900, burst: 1000 }], temporaryStart: "2026-09-11T14:38", temporaryEnd: "2026-09-11T15:38", action: "reject", queueSize: 64, queueWaitMs: 3000, replyContent: "当前请求量较大，请稍后重试。", reasonCode: "TRAFFIC_RATE_LIMITED", enabled: true, order: 1000, code: "limit-fixture-prod-model-rate" },
  { id: "limit-mcp-tool-rate", name: "MCP 工具调用限速", limitType: "限速（GCRA）", dimension: "MCP 工具", conditionLogic: "and", conditions: [{ id: "limit-mcp-policy-set", field: "策略集", operator: "等于", value: "mcp-gateway" }, { id: "limit-mcp-capability", field: "具体能力", operator: "等于", value: "capability-mcp-search" }], windows: [{ id: "limit-mcp-second", unit: "秒", count: 8, burst: 12 }, { id: "limit-mcp-hour", unit: "小时", count: 1200, burst: 1200 }], temporaryEnabled: false, temporaryWindows: [{ id: "temporary-mcp-second", unit: "秒", count: 12, burst: 16 }, { id: "temporary-mcp-hour", unit: "小时", count: 1800, burst: 1800 }], temporaryStart: "2026-09-11T14:38", temporaryEnd: "2026-09-11T15:38", action: "queue", queueSize: 128, queueWaitMs: 5000, replyContent: "当前请求量较大，请稍后重试。", reasonCode: "TRAFFIC_QUEUE_TIMEOUT", enabled: true, order: 1010, code: "limit-fixture-mcp-tool-rate" },
  { id: "limit-http-proxy-rate", name: "HTTP 直传端点保护", limitType: "限速（GCRA）", dimension: "端点", conditionLogic: "and", conditions: [{ id: "limit-http-policy-set", field: "策略集", operator: "等于", value: "http-proxy-gateway" }, { id: "limit-http-endpoint", field: "端点", operator: "等于", value: "endpoint-document-parser" }], windows: [{ id: "limit-http-minute", unit: "分钟", count: 120, burst: 150 }], temporaryEnabled: false, temporaryWindows: [{ id: "temporary-http-minute", unit: "分钟", count: 180, burst: 220 }], temporaryStart: "2026-09-11T14:38", temporaryEnd: "2026-09-11T15:38", action: "reply", queueSize: 64, queueWaitMs: 3000, replyContent: "服务繁忙，请稍后重试。", reasonCode: "UPSTREAM_CAPACITY_PROTECTED", enabled: false, order: 1020, code: "limit-fixture-http-proxy-rate" },
];

const navigationGroups: Array<{ label: string; items: Array<{ label: string; icon: IconName; active?: boolean }> }> = [
  { label: "概览", items: [{ label: "概览", icon: "home" }] },
  { label: "路由策略", items: [{ label: "流量规则", icon: "list-checks", active: true }, { label: "命中事件", icon: "inbox" }] },
];

function NavigationItem({ icon, label }: { active?: boolean; icon: IconName; label: string }) {
  const Icon = useIcon(icon);
  return <NavItem value={label}><NavItemTrigger className="px-2" render={<button type="button" />} tooltip={label}><NavItemLeading><Icon aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{label}</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>;
}

function TrafficRulesNavigation() {
  const ProductIcon = useIcon("shield");
  const More = useIcon("ellipsis");
  return <>
    <SidebarHeader className="px-2 py-1.5"><SidebarIdentityRow leading={<span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-fg-on-brand"><ProductIcon aria-hidden className="size-4" /></span>} primary="管理后台" description="内部" /></SidebarHeader>
    <SidebarContent contentClassName="gap-2 px-2 py-1">{navigationGroups.map((group) => <SidebarGroup key={group.label}><SidebarGroupLabel>{group.label}</SidebarGroupLabel><SidebarGroupContent><NavMenu activeValue={group.items.find((item) => item.active)?.label ?? null} aria-label={group.label} keyboardNavigation="roving">{group.items.map((item) => <NavigationItem key={item.label} {...item} />)}</NavMenu></SidebarGroupContent></SidebarGroup>)}</SidebarContent>
    <SidebarFooter className="px-2 py-1.5"><SidebarIdentityRow description="admin@zstack.io" leading={<SidebarIdentityAvatar>AD</SidebarIdentityAvatar>} primary="admin" trailing={<More aria-hidden size={16} strokeWidth={1.5} />} trailingPlacement="edge" /></SidebarFooter>
  </>;
}

function AdminSidebar() {
  return <Sidebar ariaLabel="管理后台导航" className="relative h-full" collapsible="offcanvas" mobileWidth="min(252px, calc(100vw - 24px))" width="252px"><TrafficRulesNavigation /></Sidebar>;
}

function RuleStatusSwitch({ rule, onAction }: { rule: Rule; onAction: (action: NonNullable<ConfirmAction>) => void }) {
  return <Switch checked={rule.enabled} className="w-fit gap-0 p-0" label={`启用${rule.name}`} labelVisibility="sr-only" onCheckedChange={(checked) => onAction({ action: checked ? "enable" : "disable", ids: [rule.id], target: "rule" })} />;
}

function EmptyTableState({ description, onCreate, title }: { description: string; onCreate: () => void; title: string }) {
  const EmptyIcon = useIcon("doc-data-table");
  return <div className="grid min-h-[280px] place-items-center px-4 py-10"><div className="flex max-w-[480px] flex-col items-center text-center"><span className="grid size-16 place-items-center rounded-2xl bg-surface-raised text-fg-muted"><EmptyIcon aria-hidden className="size-7" /></span><p className="mt-3 text-body font-medium">{title}</p><p className="mt-1 text-label leading-5 text-fg-subtle">{description}</p><Button className="mt-3" onClick={onCreate} size="sm" type="button" variant={title.includes("限额") ? "neutral" : "primary"}>{title.includes("限额") ? "新增限额" : "新建规则"}</Button></div></div>;
}

function RuleActions({ rule, onAction, onMove, canMoveUp, canMoveDown }: { rule: Rule; onAction: (action: NonNullable<ConfirmAction>) => void; onMove: (direction: -1 | 1) => void; canMoveUp: boolean; canMoveDown: boolean }) {
  const More = useIcon("ellipsis");
  return <div className="flex items-center justify-end whitespace-nowrap"><DropdownMenu><DropdownTrigger render={<Button aria-label={`${rule.name} 更多操作`} iconOnly type="button" variant="tertiary"><More /></Button>} /><DropdownContent align="end" className="w-32"><MenuItem disabled={!canMoveUp} index={0} label="上移" onSelect={() => onMove(-1)} /><MenuItem disabled={!canMoveDown} index={1} label="下移" onSelect={() => onMove(1)} /><MenuItem className="text-fg-danger" index={2} label="删除规则" onSelect={() => onAction({ action: "delete", ids: [rule.id], target: "rule" })} /></DropdownContent></DropdownMenu></div>;
}

function RuleNameButton({ rule, onDetail, className }: { rule: Rule; onDetail: (rule: Rule) => void; className?: string }) {
  return <button aria-label={`查看${rule.name}详情`} className={cn("cursor-pointer truncate text-left font-medium text-fg-brand underline decoration-current/35 underline-offset-2 outline-none hover:decoration-current focus-visible:ring-1 focus-visible:ring-focus-ring", className)} onClick={() => onDetail(rule)} title={rule.name} type="button">{rule.name}</button>;
}

function RulesTable({ rules, selected, onSelectedChange, onAction, onDetail, onReorder }: { rules: Rule[]; selected: Set<string>; onSelectedChange: (next: Set<string>) => void; onAction: (action: NonNullable<ConfirmAction>) => void; onDetail: (rule: Rule) => void; onReorder: (rules: Rule[]) => void }) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; placement: "before" | "after" } | null>(null);
  const clearDragState = () => {
    setDraggedId(null);
    setDropTarget(null);
  };
  const getPlacement = (event: DragEvent<HTMLTableRowElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
  };
  const handleDragStart = (event: DragEvent<HTMLTableRowElement>, id: string) => {
    setDraggedId(id);
    setDropTarget(null);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
    }
  };
  const handleDragOver = (event: DragEvent<HTMLTableRowElement>, id: string) => {
    event.preventDefault();
    if (!draggedId || draggedId === id) {
      setDropTarget(null);
      return;
    }
    const placement = getPlacement(event);
    setDropTarget((current) => current?.id === id && current.placement === placement ? current : { id, placement });
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  };
  const reorder = (targetId: string, placement: "before" | "after") => {
    if (!draggedId || draggedId === targetId) {
      clearDragState();
      return;
    }
    const from = rules.findIndex((rule) => rule.id === draggedId);
    if (from < 0) {
      clearDragState();
      return;
    }
    const next = [...rules];
    const [moved] = next.splice(from, 1);
    const targetIndex = next.findIndex((rule) => rule.id === targetId);
    if (targetIndex < 0) {
      clearDragState();
      return;
    }
    const insertAt = targetIndex + (placement === "after" ? 1 : 0);
    // Dropping at the boundary immediately next to the dragged row is a no-op.
    if (insertAt === from) {
      clearDragState();
      return;
    }
    next.splice(insertAt, 0, moved);
    onReorder(next.map((rule, index) => ({ ...rule, priority: (index + 1) * 10 })));
    clearDragState();
  };
  const allSelected = rules.length > 0 && rules.every((rule) => selected.has(rule.id));
  const toggleSelection = (rule: Rule, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(rule.id);
    else next.delete(rule.id);
    onSelectedChange(next);
  };
  const moveRule = (id: string, direction: -1 | 1) => {
    const from = rules.findIndex((rule) => rule.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= rules.length) return;
    const next = [...rules];
    [next[from], next[to]] = [next[to]!, next[from]!];
    onReorder(next.map((rule, index) => ({ ...rule, priority: (index + 1) * 10 })));
  };
  return <div className="overflow-visible rounded-xl border border-border bg-surface-floating"><div className="sm:hidden"><div className="flex h-10 items-center gap-2 border-b border-border px-3 text-label text-fg-subtle"><Checkbox aria-label="选择全部规则" checked={allSelected} onCheckedChange={(checked) => onSelectedChange(checked ? new Set(rules.map((rule) => rule.id)) : new Set())} /><span>选择全部</span><span className="ml-auto tabular-nums">{rules.length} 条</span></div>{rules.map((rule, index) => <article className="space-y-3 border-b border-border p-3 last:border-b-0" key={rule.id}><div className="flex items-center gap-2"><Checkbox aria-label={`选择${rule.name}`} checked={selected.has(rule.id)} onCheckedChange={(checked) => toggleSelection(rule, Boolean(checked))} /><span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface-raised text-label font-medium tabular-nums">{rule.priority}</span><RuleStatusSwitch onAction={onAction} rule={rule} /><RuleNameButton className="min-w-0 flex-1 text-body" onDetail={onDetail} rule={rule} /></div><p className="flex min-w-0 items-center gap-1.5 pl-8 text-label"><span className="max-w-[45%] truncate rounded-md bg-surface-raised px-2 py-0.5">{rule.matcher}</span><span className="text-fg-subtle">→</span><span className="truncate">{rule.actions[0] || "继续路由"}</span></p><RuleActions canMoveDown={index < rules.length - 1} canMoveUp={index > 0} onAction={onAction} onMove={(direction) => moveRule(rule.id, direction)} rule={rule} /></article>)}</div><div className="hidden overflow-x-auto sm:block"><Table className="min-w-[900px] table-fixed"><colgroup><col className="w-[58px]" /><col className="w-[66px]" /><col className="w-[100px]" /><col /><col className="w-[420px]" /><col className="w-[72px]" /></colgroup><TableHeader><TableRow><TableHead className="pl-9 pr-2"><Checkbox aria-label="选择全部规则" checked={allSelected} onCheckedChange={(checked) => onSelectedChange(checked ? new Set(rules.map((rule) => rule.id)) : new Set())} /></TableHead><TableHead>优先级</TableHead><TableHead>状态</TableHead><TableHead>规则名称</TableHead><TableHead>匹配条件与动作</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody>{rules.map((rule, index) => <TableRow draggable index={index} onDragEnd={clearDragState} onDragOver={(event) => handleDragOver(event, rule.id)} onDragStart={(event) => handleDragStart(event, rule.id)} onDrop={(event) => { event.preventDefault(); reorder(rule.id, getPlacement(event)); }} className={cn("h-12", draggedId === rule.id && "opacity-50", dropTarget?.id === rule.id && dropTarget.placement === "before" && "shadow-[inset_0_2px_var(--brand)]", dropTarget?.id === rule.id && dropTarget.placement === "after" && "shadow-[inset_0_-2px_var(--brand)]")} key={rule.id}><TableCell className="px-2"><div className="flex items-center gap-2"><span aria-label="拖动调整规则优先级" className="grid size-4 cursor-grab grid-cols-2 content-center gap-[2px] px-[3px] text-fg-subtle" role="img">{Array.from({ length: 6 }, (_, dotIndex) => <span className="size-[2px] rounded-full bg-current" key={dotIndex} />)}</span><Checkbox aria-label={`选择${rule.name}`} checked={selected.has(rule.id)} onCheckedChange={(checked) => toggleSelection(rule, Boolean(checked))} /></div></TableCell><TableCell className="font-medium tabular-nums">{rule.priority}</TableCell><TableCell><RuleStatusSwitch onAction={onAction} rule={rule} /></TableCell><TableCell><RuleNameButton className="block max-w-full" onDetail={onDetail} rule={rule} /></TableCell><TableCell><div className="flex min-w-0 items-center gap-1.5"><span className="max-w-[250px] truncate rounded-md bg-surface-raised px-2 py-0.5">{rule.matcher}</span><span className="text-fg-subtle">→</span><span className="truncate">{rule.actions[0] || "继续路由"}</span></div></TableCell><TableCell><RuleActions canMoveDown={index < rules.length - 1} canMoveUp={index > 0} onAction={onAction} onMove={(direction) => moveRule(rule.id, direction)} rule={rule} /></TableCell></TableRow>)}</TableBody></Table></div></div>;
}

function ConfirmDialog({ action, onCancel, onConfirm }: { action: NonNullable<ConfirmAction>; onCancel: () => void; onConfirm: () => void }) {
  const noun = action.target === "rule" ? "规则" : "限额";
  const verb = action.action === "delete" ? "删除" : action.action === "enable" ? "启用" : "停用";
  return <Dialog onOpenChange={(open) => { if (!open) onCancel(); }} open><DialogContent size="sm"><DialogHeader><DialogTitle>{verb}所选{noun}</DialogTitle><DialogDescription>{action.action === "delete" ? `删除后将无法再使用所选${noun}，请确认是否继续。` : `所选${noun}将被${verb}，新的状态会立即用于后续请求。`}</DialogDescription></DialogHeader><DialogFooter><Button onClick={onCancel} size="sm" type="button" variant="tertiary">取消</Button><Button onClick={onConfirm} size="sm" type="button" variant={action.action === "enable" ? "neutral" : "destructive"}>{verb}</Button></DialogFooter></DialogContent></Dialog>;
}

function RuleList({ rules, onRulesChange, onCreate, onOpen }: { rules: Rule[]; onRulesChange: (rules: Rule[]) => void; onCreate: () => void; onOpen: (rule: Rule) => void }) {
  const Search = useIcon("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set<string>());
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const visible = useMemo(() => rules.filter((rule) => `${rule.name} ${rule.id} ${rule.matcher}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === "all" || rule.enabled === (statusFilter === "enabled"))), [query, rules, statusFilter]);
  const applyReorder = (nextVisible: Rule[]) => {
    const visibleIds = new Set(visible.map((rule) => rule.id));
    let visibleIndex = 0;
    const next = rules.map((rule) => visibleIds.has(rule.id) ? nextVisible[visibleIndex++]! : rule);
    onRulesChange(next.map((rule, index) => ({ ...rule, priority: (index + 1) * 10 })));
  };
  const applyConfirm = () => { if (!confirm) return; if (confirm.action === "delete") onRulesChange(rules.filter((rule) => !confirm.ids.includes(rule.id))); else onRulesChange(rules.map((rule) => confirm.ids.includes(rule.id) ? { ...rule, enabled: confirm.action === "enable" } : rule)); setSelected(new Set()); setConfirm(null); };
  return <>
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <label className="relative w-full sm:w-72">
        <span className="sr-only">搜索规则</span>
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
        <Input className="pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="按规则名、规则 ID 或目标模型搜索" size="md" value={query} />
      </label>
      <Select itemDensity="compact" onValueChange={(value) => setStatusFilter(value as "all" | "enabled" | "disabled")} size="md" value={statusFilter}>
        <SelectTrigger aria-label="筛选规则状态" className="w-36" />
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="enabled">已启用</SelectItem>
          <SelectItem value="disabled">已停用</SelectItem>
        </SelectContent>
      </Select>
      <span className="ml-auto text-label tabular-nums">{visible.length} / 500 条</span>
      {selected.size > 0 ? <div className="flex flex-wrap items-center justify-end gap-2">
          <Button onClick={() => setConfirm({ action: "delete", ids: [...selected], target: "rule" })} size="md" type="button" variant="destructive">删除所选</Button>
          <Button onClick={() => setConfirm({ action: "disable", ids: [...selected], target: "rule" })} size="md" type="button" variant="tertiary">停用所选</Button>
          <Button onClick={() => setConfirm({ action: "enable", ids: [...selected], target: "rule" })} size="md" type="button" variant="tertiary">启用所选</Button>
      </div> : null}
    </div>
    {visible.length ? <RulesTable onAction={setConfirm} onDetail={onOpen} onReorder={applyReorder} onSelectedChange={setSelected} rules={visible} selected={selected} /> : <div className="rounded-xl border border-border"><div className="hidden h-9 grid-cols-[58px_66px_100px_1fr_420px_72px] border-b border-border text-body sm:grid"><span /><span className="px-3 py-2">优先级</span><span className="px-3 py-2">状态</span><span className="px-3 py-2">规则名称</span><span className="px-3 py-2">匹配条件与动作</span><span className="px-3 py-2">操作</span></div><EmptyTableState description="所有请求都会继续按网关既有选路执行。" onCreate={onCreate} title={rules.length ? "没有找到符合条件的规则" : "还没有任何规则"} /></div>}
    {confirm ? <ConfirmDialog action={confirm} onCancel={() => setConfirm(null)} onConfirm={applyConfirm} /> : null}
  </>;
}


function Avatar() { return <span className="grid size-6 shrink-0 place-items-center rounded-md bg-emphasis text-label">AD</span>; }

function ChangeHistoryDialog({ objectName, onOpenChange, open, records, restorable = false }: { objectName: string; onOpenChange: (open: boolean) => void; open: boolean; records: HistoryRecord[]; restorable?: boolean }) {
  const Restore = useIcon("rotate-ccw");
  const Search = useIcon("search");
  const [query, setQuery] = useState("");
  const [restored, setRestored] = useState<string | null>(null);
  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) => [record.time, record.action, record.log, objectName, "admin", "admin@zstack.io"].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)));
  }, [objectName, query, records]);
  const columns = useMemo<ColumnDef<HistoryRecord, unknown>[]>(() => {
    const baseColumns: ColumnDef<HistoryRecord, unknown>[] = [
      { accessorKey: "time", cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{row.original.time}</span>, header: "时间" },
      { id: "user", cell: () => <span className="flex min-w-44 items-center gap-2"><Avatar /><span><span className="block">admin</span><span className="block text-fg-subtle">admin@zstack.io</span></span></span>, header: "用户" },
      { accessorKey: "action", header: "操作" },
      { id: "object", cell: () => <span className="block min-w-44 max-w-64 truncate" title={objectName}>{objectName}</span>, header: "对象" },
      { accessorKey: "log", cell: ({ row }) => <span className="block min-w-52">{row.original.log}</span>, header: "日志" },
    ];
    if (restorable) {
      baseColumns.push({ id: "actions", cell: ({ row }) => <Tooltip content="回到这一版"><Button aria-label="回到这一版" disabled={restored === row.original.id} iconOnly onClick={() => setRestored(row.original.id)} type="button" variant="tertiary"><Restore aria-hidden /></Button></Tooltip>, header: "操作" });
    }
    return baseColumns;
  }, [Restore, objectName, restorable, restored]);
  const { table } = useDataTable({ columns, data: visibleRecords, getRowId: (record) => record.id, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } });
  return <Dialog onOpenChange={onOpenChange} open={open}>
    <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-[1120px] flex-col overflow-hidden p-0" size="lg">
      <DialogHeader className="mb-0 shrink-0 px-5 pb-3 pt-5 pr-14">
        <DialogTitle>修改记录</DialogTitle>
        <DialogDescription className="truncate">{objectName}</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto px-5 pb-5">
        {restored ? <div className="mb-3 rounded-lg bg-success-surface px-3 py-2 text-label text-fg-success">已恢复到 {restored} 版本</div> : null}
        <div className="mb-3 p-px"><label className="relative block w-full sm:w-72"><span className="sr-only">搜索修改记录</span><Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" /><Input className="pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="搜索修改记录" size="md" value={query} /></label></div>
        <DataTable className="[&_table]:min-w-[960px]" emptyMessage="没有找到匹配的修改记录。" paginationProps={{ labels: { firstPage: "第一页", lastPage: "最后一页", nextPage: "下一页", pageSummary: (page, pageCount) => `第 ${page} / ${pageCount} 页`, previousPage: "上一页", rowsPerPage: "每页行数" }, pageSizeOptions: [10, 20, 50] }} table={table} />
      </div>
    </DialogContent>
  </Dialog>;
}

function limitSentence(limit: GlobalLimit, compact = false) {
  const condition = limit.conditions[0];
  const conditionValue = condition?.value ?? "";
  const visibleValue = compact && conditionValue.length > 24 ? `${conditionValue.slice(0, 12)}...${conditionValue.slice(-6)}` : conditionValue;
  const windows = limit.windows.map((windowItem) => `每${windowItem.unit} ${windowItem.count} 次`).join("、");
  const action = limit.action === "reject" ? "超限时立即拒绝" : limit.action === "queue" ? "超限时进入队列" : "超限时返回固定答复";
  return `当 ${condition?.field || "所有请求"}${condition ? `${condition.operator} ${visibleValue}` : ""} 时 → 限速至 ${windows}、${action}`;
}

function LimitSummary({ limit, compact = false }: { limit: GlobalLimit; compact?: boolean }) {
  return <div className="min-w-0"><p className={cn("mt-1 text-body leading-5", compact ? "max-w-[660px]" : "max-w-none")}>{limitSentence(limit, compact)}</p><div className="mt-2 space-y-0.5 text-label leading-4 text-fg-subtle">{limit.windows.map((windowItem) => <p key={windowItem.id}>基线 {windowItem.unit}: 频次 {windowItem.count} / 突发 {windowItem.burst}</p>)}</div></div>;
}

function LimitStatusSwitch({ limit, onToggle }: { limit: GlobalLimit; onToggle: (limit: GlobalLimit) => void }) {
  return <Switch checked={limit.enabled} className="w-fit gap-0 p-0" label={`启用${limit.name || "未命名限额"}`} labelVisibility="sr-only" onCheckedChange={(checked) => { if (checked !== limit.enabled) onToggle(limit); }} />;
}

function LimitNameButton({ limit, onDetail }: { limit: GlobalLimit; onDetail: (limit: GlobalLimit) => void }) {
  const name = limit.name || "未命名限额";
  return <button aria-label={`查看${name}详情`} className="block max-w-full cursor-pointer truncate text-left text-body font-medium text-fg-brand underline decoration-current/35 underline-offset-2 outline-none hover:decoration-current focus-visible:ring-1 focus-visible:ring-focus-ring" onClick={() => onDetail(limit)} title={name} type="button">{name}</button>;
}

function LimitActions({ limit, onDelete }: { limit: GlobalLimit; onDelete: (limit: GlobalLimit) => void }) {
  const More = useIcon("ellipsis");
  return <div className="flex items-center justify-end whitespace-nowrap"><DropdownMenu><DropdownTrigger render={<Button aria-label={`${limit.name || "未命名限额"} 更多操作`} iconOnly type="button" variant="tertiary"><More /></Button>} /><DropdownContent align="end" className="w-32"><MenuItem className="text-fg-danger" index={0} label="删除限额" onSelect={() => onDelete(limit)} /></DropdownContent></DropdownMenu></div>;
}

function LimitsList({ limits, onCreate, onDelete, onOpen, onToggle }: { limits: GlobalLimit[]; onCreate: () => void; onDelete: (limit: GlobalLimit) => void; onOpen: (limit: GlobalLimit) => void; onToggle: (limit: GlobalLimit) => void }) {
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled">("all");
  const visible = statusFilter === "enabled" ? limits.filter((limit) => limit.enabled) : limits;
  return <>
    <div className="mb-3 flex items-center gap-2">
      <Select itemDensity="compact" onValueChange={(value) => setStatusFilter(value as "all" | "enabled")} size="md" value={statusFilter}>
        <SelectTrigger aria-label="筛选全局限额" className="w-36" />
        <SelectContent>
          <SelectItem value="all">全部限额</SelectItem>
          <SelectItem value="enabled">仅已生效</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto"><Table className="min-w-[900px] table-fixed"><colgroup><col className="w-[100px]" /><col /><col className="w-[140px]" /><col className="w-[72px]" /></colgroup><TableHeader><TableRow><TableHead>状态</TableHead><TableHead>全局限额</TableHead><TableHead>来源</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody>{visible.map((limit, index) => <TableRow index={index} key={limit.id}><TableCell className="py-4"><LimitStatusSwitch limit={limit} onToggle={onToggle} /></TableCell><TableCell className="py-4"><LimitNameButton limit={limit} onDetail={onOpen} /><LimitSummary compact limit={limit} /></TableCell><TableCell className="py-4">租户策略</TableCell><TableCell className="py-4"><LimitActions limit={limit} onDelete={onDelete} /></TableCell></TableRow>)}</TableBody></Table></div>
      {!visible.length ? <EmptyTableState description="创建限额后，可以按策略集、主体、能力或端点等真实计数维度限制请求。" onCreate={onCreate} title="还没有任何全局限额" /> : null}
    </div>
    {visible.length ? <TableFooter bordered={false} total={visible.length} /> : null}
  </>;
}

function LimitDetail({ limit, onBack, onDelete, onEdit, onHistory, onToggle }: { limit: GlobalLimit; onBack: () => void; onDelete: () => void; onEdit: () => void; onHistory: () => void; onToggle: () => void }) {
  return <LimitDetailView limit={limit} onBack={onBack} onDelete={onDelete} onEdit={onEdit} onHistory={onHistory} onToggle={onToggle} />;
}

export type TrafficRulesProps = Omit<ComponentPropsWithoutRef<"div">, "children">;

function TrafficRulesContent({ className, ...props }: TrafficRulesProps) {
  const FeatureIcon = useIcon("list-checks");
  const [rules, setRules] = useState(initialRules);
  const [limits, setLimits] = useState(initialLimits);
  const [tab, setTab] = useState<Tab>("rules");
  const [page, setPage] = useState<Page>("list");
  const [activeRule, setActiveRule] = useState<Rule | null>(null);
  const [activeLimit, setActiveLimit] = useState<GlobalLimit | null>(null);
  const [historyTarget, setHistoryTarget] = useState<HistoryTarget | null>(null);
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const openRule = (rule: Rule) => { setActiveRule(rule); setPage("rule-detail"); };
  const openLimit = (limit: GlobalLimit) => { setActiveLimit(limit); setPage("limit-detail"); };
  const updateRule = (next: Rule) => { setRules((current) => current.map((rule) => rule.id === next.id ? next : rule)); setActiveRule(next); };
  const updateLimit = (next: GlobalLimit) => { setLimits((current) => current.map((limit) => limit.id === next.id ? next : limit)); setActiveLimit(next); };
  const applyConfirm = () => { if (!confirm) return; if (confirm.target === "rule") { if (confirm.action === "delete") { setRules((current) => current.filter((rule) => !confirm.ids.includes(rule.id))); setActiveRule(null); setPage("list"); } else { const enabled = confirm.action === "enable"; setRules((current) => current.map((rule) => confirm.ids.includes(rule.id) ? { ...rule, enabled } : rule)); if (activeRule) setActiveRule({ ...activeRule, enabled }); } } else if (confirm.action === "delete") { setLimits((current) => current.filter((limit) => !confirm.ids.includes(limit.id))); setActiveLimit(null); setPage("list"); } else { const enabled = confirm.action === "enable"; setLimits((current) => current.map((limit) => confirm.ids.includes(limit.id) ? { ...limit, enabled } : limit)); if (activeLimit && confirm.ids.includes(activeLimit.id)) setActiveLimit({ ...activeLimit, enabled }); } setConfirm(null); };
  if (page === "limit-create") {
    return <div className={cn("h-full w-full", className)} {...props}>
      <LimitForm
        onCancel={() => setPage("list")}
        onSave={(limit) => {
          setLimits((current) => [...current, limit]);
          setActiveLimit(limit);
          setPage("limit-detail");
        }}
      />
    </div>;
  }
  if (page === "limit-edit" && activeLimit) {
    return <div className={cn("h-full w-full", className)} {...props}>
      <LimitForm
        initial={activeLimit}
        onCancel={() => setPage("limit-detail")}
        onSave={(limit) => {
          updateLimit(limit);
          setPage("limit-detail");
        }}
      />
    </div>;
  }
  const breadcrumb = page === "list" ? "流量规则" : page.startsWith("limit") ? "流量规则 › 全局限额 › 限额详情" : "流量规则 › 规则详情";
  return <SidebarProvider breakpointBehavior="drawer">
    <div className={cn("flex h-full min-h-[620px] w-full overflow-hidden bg-surface-base text-fg-default selection:bg-selection", className)} {...props}>
      <AdminSidebar />
      <PageLayout className="h-full min-w-0 flex-1">
        <PageHeader className="h-control-sm py-0 max-sm:flex-row">
          <div className="flex h-full min-w-0 items-center gap-2">
            <SidebarTrigger className="shrink-0 xl:hidden" label="打开管理后台导航" size="sm" />
            <PageHeaderContent className="h-full">
              <nav aria-label="当前位置" className="flex min-w-0 items-center gap-2 text-body text-fg-subtle">
                <span className="inline-flex shrink-0 items-center gap-1.5"><FeatureIcon aria-hidden size={16} strokeWidth={1.5} /><span>路由策略</span></span><span aria-hidden>›</span><span className="truncate text-fg-default">{breadcrumb}</span>
              </nav>
              <h1 className="sr-only">流量规则</h1>
            </PageHeaderContent>
          </div>
        </PageHeader>
        {page === "rule-detail" && activeRule ? <RuleDetailView
          key={activeRule.id}
          rule={activeRule}
          onBack={() => setPage("list")}
          onEdit={() => setPage("rule-edit")}
          onHistory={() => setHistoryTarget("rule")}
          onToggle={() => setConfirm({ action: activeRule.enabled ? "disable" : "enable", ids: [activeRule.id], target: "rule" })}
          onDelete={() => setConfirm({ action: "delete", ids: [activeRule.id], target: "rule" })}
        /> : null}
        {page === "rule-edit" && activeRule ? <RuleWorkflow initial={activeRule} onCancel={() => setPage("rule-detail")} onSave={(rule) => { updateRule(rule); setPage("rule-detail"); }} /> : null}
        {page === "limit-detail" && activeLimit ? <LimitDetail limit={activeLimit} onBack={() => setPage("list")} onDelete={() => setConfirm({ action: "delete", ids: [activeLimit.id], target: "limit" })} onEdit={() => setPage("limit-edit")} onHistory={() => setHistoryTarget("limit")} onToggle={() => setConfirm({ action: activeLimit.enabled ? "disable" : "enable", ids: [activeLimit.id], target: "limit" })} /> : null}
        {page === "list" ? <PageContent>
          <PageContentHeader>
            <PageSubnav aria-label="流量规则视图">
              <PageSubnavList activeValue={tab}>
                <PageSubnavItem href="#rules" onClick={(event) => { event.preventDefault(); setTab("rules"); }} value="rules">规则清单</PageSubnavItem>
                <PageSubnavItem href="#limits" onClick={(event) => { event.preventDefault(); setTab("limits"); }} value="limits">全局限额</PageSubnavItem>
              </PageSubnavList>
            </PageSubnav>
            <PageActions>
              {tab === "rules" ? <Button onClick={() => setCreateRuleOpen(true)} type="button" variant="primary">新建规则</Button> : <Button onClick={() => setPage("limit-create")} type="button" variant="neutral">新增限额</Button>}
            </PageActions>
          </PageContentHeader>
          <PageBody className="max-w-none p-4">
            {tab === "rules" ? <RuleList onCreate={() => setCreateRuleOpen(true)} onOpen={openRule} onRulesChange={setRules} rules={rules} /> : <LimitsList limits={limits} onCreate={() => setPage("limit-create")} onDelete={(limit) => setConfirm({ action: "delete", ids: [limit.id], target: "limit" })} onOpen={openLimit} onToggle={(limit) => setConfirm({ action: limit.enabled ? "disable" : "enable", ids: [limit.id], target: "limit" })} />}
          </PageBody>
        </PageContent> : null}
      </PageLayout>
      {createRuleOpen ? <RuleWorkflow onCancel={() => setCreateRuleOpen(false)} onSave={(rule) => { setRules((current) => [...current, { ...rule, priority: current.length + 1 }]); setCreateRuleOpen(false); }} /> : null}
      {historyTarget === "rule" && activeRule ? <ChangeHistoryDialog objectName={activeRule.name} onOpenChange={(open) => { if (!open) setHistoryTarget(null); }} open records={[{ id: "v2", time: "9月3日 10:02:11", action: "修改", log: "更新请求路径与处置动作" }, { id: "v1", time: "9月2日 18:31:42", action: "新增", log: "创建规则并设为停用" }]} restorable /> : null}
      {historyTarget === "limit" && activeLimit ? <ChangeHistoryDialog objectName={activeLimit.name || "未命名限额"} onOpenChange={(open) => { if (!open) setHistoryTarget(null); }} open records={[{ id: "limit-v2", time: "9月3日 10:12:31", action: "修改", log: "更新基线分钟阈值" }, { id: "limit-v1", time: "9月3日 09:54:20", action: "新增", log: "创建全局限额" }]} /> : null}
      {confirm ? <ConfirmDialog action={confirm} onCancel={() => setConfirm(null)} onConfirm={applyConfirm} /> : null}
    </div>
  </SidebarProvider>;
}

export function TrafficRules(props: TrafficRulesProps) {
  return <TrafficRulesContent {...props} />;
}
