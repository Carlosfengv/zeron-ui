"use client";

import Image from "next/image";
import { useMemo, useState, type ComponentPropsWithoutRef, type DragEvent, type ReactNode } from "react";
import { Button } from "@zeron/ui/button";
import { Checkbox as ZeronCheckbox } from "@zeron/ui/checkbox";
import { Input } from "@zeron/ui/input";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { LimitForm } from "./limit-form";
import type { RuleFormValue } from "./rule-config";
import { RuleWorkflow } from "./rule-workflow";
import { RuleDetailView } from "./rule-detail";
import { LimitDetailView } from "./limit-detail";
import { RuleValidation } from "./rule-validation";
import { TableFooter } from "./table-footer";
import type { GlobalLimit } from "./traffic-types";
import { useDialogFocus } from "./use-dialog-focus";

type Rule = RuleFormValue;
type Tab = "rules" | "limits";
type Page = "list" | "rule-detail" | "rule-edit" | "rule-history" | "validate" | "limit-create" | "limit-detail" | "limit-edit" | "limit-history";
type ConfirmAction = { action: "delete" | "enable" | "disable"; ids: string[]; target: "rule" | "limit" } | null;

function Checkbox(props: ComponentPropsWithoutRef<typeof ZeronCheckbox>) {
  const alignWithRows = props["aria-label"] === "选择全部规则";
  return <ZeronCheckbox {...props} className={cn("data-checked:border-[#00030a] data-checked:bg-[#00030a] data-indeterminate:border-[#00030a] data-indeterminate:bg-[#00030a]", alignWithRows && "sm:-translate-x-1.5", props.className)} />;
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
  { label: "搭建", items: [{ label: "技能", icon: "brain" }, { label: "MCP 服务", icon: "square-library" }, { label: "外部 Agent", icon: "user" }, { label: "模型服务", icon: "message-circle" }, { label: "模型供应商", icon: "doc-surfaces" }, { label: "插件", icon: "settings" }, { label: "外部注册中心", icon: "list" }] },
  { label: "组织与权限", items: [{ label: "SSO 配置", icon: "lock" }, { label: "账号与会话安全", icon: "shield" }, { label: "成员与部门", icon: "users" }, { label: "职能组", icon: "square-library" }] },
  { label: "护栏", items: [{ label: "护栏", icon: "shield" }, { label: "威胁情报", icon: "monitor" }] },
  { label: "路由策略", items: [{ label: "流量规则", icon: "list-checks", active: true }, { label: "命中事件", icon: "inbox" }] },
  { label: "运行与排障", items: [{ label: "日志管理", icon: "file-text" }, { label: "运行时", icon: "monitor" }] },
  { label: "告警与处置", items: [{ label: "告警规则", icon: "bell" }] },
  { label: "审计与合规", items: [{ label: "操作审计", icon: "check-square" }] },
  { label: "系统设置", items: [{ label: "授权许可", icon: "lock" }, { label: "品牌", icon: "palette" }, { label: "SMTP 配置", icon: "mail" }] },
];

function NavItem({ active, icon, label }: { active?: boolean; icon: IconName; label: string }) {
  const Icon = useIcon(icon);
  return <button className={cn("flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-left text-[14px] outline-none transition-colors hover:bg-white/70 focus-visible:ring-1 focus-visible:ring-focus-ring", active && "bg-[#e4e8f0] font-medium")} type="button"><Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.6} /><span className="truncate">{label}</span></button>;
}

function SidebarContent() {
  const ArrowLeft = useIcon("arrow-left");
  const More = useIcon("ellipsis");
  return <>
    <div className="flex h-[60px] shrink-0 items-center gap-2 px-3"><div className="size-8 overflow-hidden rounded-lg border border-black/10 bg-white"><Image alt="Zentirx Evaluation" className="size-full object-cover" height={32} src="/figma/traffic-rules-01/zentrix-evaluation.png" width={32} /></div><div className="leading-[18px]"><div className="text-[14px] font-semibold">管理后台</div><div className="text-[12px] text-black/45">内部</div></div></div>
    <div className="shrink-0 px-3 pb-2"><button className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-[14px] outline-none hover:bg-white/70 focus-visible:ring-1 focus-visible:ring-focus-ring" type="button"><span className="grid size-5 place-items-center rounded-full bg-[#00030a] text-white"><ArrowLeft className="size-3" /></span>返回工作台</button></div>
    <nav aria-label="管理后台导航" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-color:rgba(0,3,10,.2)_transparent] [scrollbar-width:thin]">{navigationGroups.map((group) => <section className="mb-2" key={group.label}><h2 className="h-8 px-2 py-1 text-[12px] font-normal leading-6 text-black/40">{group.label}</h2><div className="space-y-0.5">{group.items.map((item) => <NavItem key={item.label} {...item} />)}</div></section>)}</nav>
    <button className="mx-1 mb-1 flex h-[59px] shrink-0 cursor-pointer items-center gap-2 rounded-xl px-2 text-left outline-none hover:bg-white/70 focus-visible:ring-1 focus-visible:ring-focus-ring" type="button"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e4e8f0] text-[12px]">AD</span><span className="min-w-0 flex-1"><span className="block text-[14px] font-medium">admin</span><span className="block truncate text-[12px] text-black/45">admin@zstack.io</span></span><More className="size-4 text-black/45" /></button>
  </>;
}

function AdminSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  return <><aside className="hidden h-full w-[252px] shrink-0 flex-col overflow-hidden bg-[#f1f3f9] min-[760px]:flex"><SidebarContent /></aside>{mobileOpen ? <div className="fixed inset-0 z-[80] min-[760px]:hidden"><button aria-label="关闭导航" className="absolute inset-0 bg-black/40" onClick={onClose} type="button" /><aside className="relative flex h-full w-[252px] flex-col bg-[#f1f3f9] shadow-[12px_0_32px_rgba(0,0,0,.18)]"><SidebarContent /></aside></div> : null}</>;
}

function Status({ enabled }: { enabled: boolean }) {
  return <span className="inline-flex h-6 items-center gap-1.5 rounded-lg border border-black/[0.10] px-2.5 text-[12px] font-medium"><span className={cn("size-[7px] rounded-full", enabled ? "bg-[#1fca68]" : "bg-[#ff416c]")} />{enabled ? "已启用" : "已停用"}</span>;
}

function PageCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("min-h-[calc(100svh-56px)] overflow-hidden rounded-t-2xl border-[0.5px] border-black/[0.12] bg-white", className)}>{children}</section>;
}

function BackHeader({ children, onBack, actions }: { children: ReactNode; onBack: () => void; actions?: ReactNode }) {
  const ArrowLeft = useIcon("arrow-left");
  return <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-black/[0.10] px-4 py-2 sm:px-5"><div className="flex min-w-0 items-center gap-2"><Button aria-label="返回" iconOnly onClick={onBack} size="md" type="button" variant="secondary"><ArrowLeft /></Button>{children}</div>{actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}</header>;
}

function EmptyTableState({ description, onCreate, title }: { description: string; onCreate: () => void; title: string }) {
  return <div className="grid min-h-[280px] place-items-center px-4 py-10"><div className="flex max-w-[480px] flex-col items-center text-center"><Image alt="" height={92} src="/figma/traffic-rules-01/empty-rules.png" width={200} /><p className="mt-2 text-[14px] font-medium">{title}</p><p className="mt-1 text-[12px] leading-5 text-black/50">{description}</p><Button className="mt-3" onClick={onCreate} size="sm" type="button" variant="neutral">{title.includes("限额") ? "新增限额" : "新建规则"}</Button></div></div>;
}

function RulesTable({ rules, selected, onSelectedChange, onAction, onDetail, onReorder }: { rules: Rule[]; selected: Set<string>; onSelectedChange: (next: Set<string>) => void; onAction: (action: NonNullable<ConfirmAction>) => void; onDetail: (rule: Rule) => void; onReorder: (rules: Rule[]) => void }) {
  const More = useIcon("ellipsis");
  const [menuId, setMenuId] = useState<string | null>(null);
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
  return <div className="overflow-visible rounded-xl border border-black/[0.12] bg-white"><div className="sm:hidden"><div className="flex h-10 items-center gap-2 border-b border-black/[0.10] px-3 text-[12px] text-black/55"><Checkbox aria-label="选择全部规则" checked={allSelected} onCheckedChange={(checked) => onSelectedChange(checked ? new Set(rules.map((rule) => rule.id)) : new Set())} /><span>选择全部</span><span className="ml-auto tabular-nums">{rules.length} 条</span></div>{rules.map((rule) => <article className="relative space-y-3 border-b border-black/[0.10] p-3 last:border-b-0" key={rule.id}><div className="flex items-center gap-2"><Checkbox aria-label={`选择${rule.name}`} checked={selected.has(rule.id)} onCheckedChange={(checked) => { const next = new Set(selected); if (checked) next.add(rule.id); else next.delete(rule.id); onSelectedChange(next); }} /><span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#f1f3f9] text-[11px] font-medium tabular-nums">{rule.priority}</span><p className="min-w-0 flex-1 truncate text-[13px] font-medium">{rule.name}</p><Status enabled={rule.enabled} /></div><p className="flex min-w-0 items-center gap-1.5 pl-8 text-[12px]"><span className="max-w-[45%] truncate rounded-md bg-[#f1f3f9] px-2 py-0.5">{rule.matcher}</span><span className="text-black/30">→</span><span className="truncate">{rule.actions[0] || "继续路由"}</span></p><div className="flex items-center justify-end gap-3 text-[13px]"><button className="cursor-pointer hover:underline" onClick={() => onAction({ action: rule.enabled ? "disable" : "enable", ids: [rule.id], target: "rule" })} type="button">{rule.enabled ? "停用" : "启用"}</button><button className="cursor-pointer hover:underline" onClick={() => onDetail(rule)} type="button">详情</button><Button aria-label="更多规则操作" active={menuId === `mobile-${rule.id}`} iconOnly onClick={() => setMenuId((current) => current === `mobile-${rule.id}` ? null : `mobile-${rule.id}`)} size="sm" type="button" variant="ghost"><More /></Button></div>{menuId === `mobile-${rule.id}` ? <div className="absolute bottom-11 right-3 z-20 w-32 rounded-lg border border-black/[0.10] bg-white p-1 shadow-[0_10px_28px_rgba(0,0,0,.14)]"><button className="flex h-8 w-full items-center rounded-md px-2 text-left text-[12px] text-[#d92b16] hover:bg-[#fff0ed]" onClick={() => { setMenuId(null); onAction({ action: "delete", ids: [rule.id], target: "rule" }); }} type="button">删除规则</button></div> : null}</article>)}</div><div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[900px] table-fixed border-collapse text-left text-[12px] text-[#00030ad9]"><colgroup><col className="w-[58px]" /><col className="w-[66px]" /><col /><col className="w-[420px]" /><col className="w-[140px]" /><col className="w-[122px]" /></colgroup><thead className="text-[14px] text-[#00030a]"><tr className="h-9 border-b border-black/[0.12]"><th className="pl-9 pr-2 font-normal"><Checkbox aria-label="选择全部规则" checked={allSelected} onCheckedChange={(checked) => onSelectedChange(checked ? new Set(rules.map((rule) => rule.id)) : new Set())} /></th><th className="px-3 font-normal">优先级</th><th className="px-3 font-normal">规则名称</th><th className="px-3 font-normal">匹配条件与动作</th><th className="px-3 font-normal">状态</th><th className="px-3 font-normal">操作</th></tr></thead><tbody>{rules.map((rule) => <tr draggable onDragEnd={clearDragState} onDragOver={(event) => handleDragOver(event, rule.id)} onDragStart={(event) => handleDragStart(event, rule.id)} onDrop={(event) => { event.preventDefault(); reorder(rule.id, getPlacement(event)); }} className={cn("h-12 border-b border-black/[0.12] transition-colors hover:bg-black/[0.02] last:border-b-0", draggedId === rule.id && "opacity-50", dropTarget?.id === rule.id && dropTarget.placement === "before" && "rule-drag-before", dropTarget?.id === rule.id && dropTarget.placement === "after" && "rule-drag-after")} key={rule.id}><td className="px-2"><div className="flex items-center gap-2"><span aria-label="拖动调整规则优先级" className="grid size-4 cursor-grab grid-cols-2 content-center gap-[2px] px-[3px] text-black/30" role="img">{Array.from({ length: 6 }, (_, index) => <span className="size-[2px] rounded-full bg-current" key={index} />)}</span><Checkbox aria-label={`选择${rule.name}`} checked={selected.has(rule.id)} onCheckedChange={(checked) => { const next = new Set(selected); if (checked) next.add(rule.id); else next.delete(rule.id); onSelectedChange(next); }} /></div></td><td className="px-3 font-medium tabular-nums">{rule.priority}</td><td className="truncate px-3" title={rule.name}>{rule.name}</td><td className="px-3"><div className="flex min-w-0 items-center gap-1.5"><span className="max-w-[250px] truncate rounded-md bg-[#f1f3f9] px-2 py-0.5">{rule.matcher}</span><span className="text-black/30">→</span><span className="truncate">{rule.actions[0] || "继续路由"}</span></div></td><td className="px-3"><Status enabled={rule.enabled} /></td><td className="relative px-3"><div className="flex items-center gap-3 whitespace-nowrap text-[14px]"><button className="cursor-pointer outline-none hover:underline focus-visible:ring-1 focus-visible:ring-focus-ring" onClick={() => onAction({ action: rule.enabled ? "disable" : "enable", ids: [rule.id], target: "rule" })} type="button">{rule.enabled ? "停用" : "启用"}</button><button className="cursor-pointer outline-none hover:underline focus-visible:ring-1 focus-visible:ring-focus-ring" onClick={() => onDetail(rule)} type="button">详情</button><Button aria-label="更多规则操作" active={menuId === rule.id} iconOnly onClick={() => setMenuId((current) => current === rule.id ? null : rule.id)} size="sm" type="button" variant="ghost"><More /></Button></div>{menuId === rule.id ? <div className="absolute right-2 top-10 z-20 w-32 rounded-lg border border-black/[0.10] bg-white p-1 shadow-[0_10px_28px_rgba(0,0,0,.14)]"><button className="flex h-8 w-full items-center rounded-md px-2 text-left text-[12px] text-[#d92b16] hover:bg-[#fff0ed]" onClick={() => { setMenuId(null); onAction({ action: "delete", ids: [rule.id], target: "rule" }); }} type="button">删除规则</button></div> : null}</td></tr>)}</tbody></table></div></div>;
}

function ConfirmDialog({ action, onCancel, onConfirm }: { action: NonNullable<ConfirmAction>; onCancel: () => void; onConfirm: () => void }) {
  const X = useIcon("x");
  const dialogRef = useDialogFocus(true, onCancel);
  const noun = action.target === "rule" ? "规则" : "限额";
  const verb = action.action === "delete" ? "删除" : action.action === "enable" ? "启用" : "停用";
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#00040d]/60 p-4"><div aria-modal="true" className="relative w-full max-w-[400px] rounded-xl bg-white p-6 shadow-[0_24px_72px_rgba(0,0,0,.24)]" ref={dialogRef} role="dialog" tabIndex={-1}><Button aria-label="关闭" className="absolute right-3 top-3" iconOnly onClick={onCancel} size="sm" type="button" variant="ghost"><X /></Button><h2 className="pr-8 text-[18px] font-semibold leading-[26px]">{verb}所选{noun}</h2><p className="mt-1.5 text-[14px] leading-5 text-black/65">{action.action === "delete" ? `删除后将无法再使用所选${noun}，请确认是否继续。` : `所选${noun}将被${verb}，新的状态会立即用于后续请求。`}</p><div className="mt-6 flex justify-end gap-2"><Button onClick={onCancel} size="sm" type="button" variant="tertiary">取消</Button><Button onClick={onConfirm} size="sm" type="button" variant={action.action === "enable" ? "neutral" : "destructive"}>{verb}</Button></div></div></div>;
}

function RuleList({ rules, onRulesChange, onCreate, onOpen, onValidate }: { rules: Rule[]; onRulesChange: (rules: Rule[]) => void; onCreate: () => void; onOpen: (rule: Rule) => void; onValidate: () => void }) {
  const Search = useIcon("search");
  const Filter = useIcon("plus");
  const Check = useIcon("check");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set<string>());
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [filterOpen, setFilterOpen] = useState(false);
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
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <label className="relative w-full sm:w-72">
        <span className="sr-only">搜索规则</span>
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-black/45" />
        <Input className="pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="按规则名、规则 ID 或目标模型搜索" size="md" value={query} />
      </label>
      <div className="relative">
        <Button active={filterOpen} className="px-3" dashed leadingIcon={Filter} onClick={() => setFilterOpen((current) => !current)} size="md" type="button" variant="tertiary">筛选</Button>
        {filterOpen ? <div className="absolute left-0 top-11 z-20 w-40 rounded-lg border border-black/[0.10] bg-white p-1 shadow-[0_10px_28px_rgba(0,0,0,.14)]">{(["all", "enabled", "disabled"] as const).map((value) => <button className={cn("flex h-8 w-full items-center justify-between rounded-md px-2 text-left text-[12px] hover:bg-[#f1f3f9]", statusFilter === value && "font-medium")} key={value} onClick={() => { setStatusFilter(value); setFilterOpen(false); }} type="button"><span>{value === "all" ? "全部状态" : value === "enabled" ? "已启用" : "已停用"}</span>{statusFilter === value ? <Check className="size-3.5" /> : null}</button>)}</div> : null}
      </div>
      <span className="ml-auto text-[12px] tabular-nums">{visible.length} / 500 条</span>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {selected.size > 0 ? <>
          <Button onClick={() => setConfirm({ action: "delete", ids: [...selected], target: "rule" })} size="md" type="button" variant="tertiary">删除所选</Button>
          <Button onClick={() => setConfirm({ action: "disable", ids: [...selected], target: "rule" })} size="md" type="button" variant="tertiary">停用所选</Button>
          <Button onClick={() => setConfirm({ action: "enable", ids: [...selected], target: "rule" })} size="md" type="button" variant="tertiary">启用所选</Button>
        </> : <Button onClick={onValidate} size="md" type="button" variant="tertiary">验证规则</Button>}
        <Button onClick={onCreate} size="md" type="button" variant="neutral">新建规则</Button>
      </div>
    </div>
    {visible.length ? <RulesTable onAction={setConfirm} onDetail={onOpen} onReorder={applyReorder} onSelectedChange={setSelected} rules={visible} selected={selected} /> : <div className="rounded-xl border border-black/[0.12]"><div className="hidden h-9 grid-cols-[58px_66px_1fr_420px_140px_122px] border-b border-black/[0.12] text-[14px] sm:grid"><span /><span className="px-3 py-2">优先级</span><span className="px-3 py-2">规则名称</span><span className="px-3 py-2">匹配条件与动作</span><span className="px-3 py-2">状态</span><span className="px-3 py-2">操作</span></div><EmptyTableState description="所有请求都会继续按网关既有选路执行。" onCreate={onCreate} title={rules.length ? "没有找到符合条件的规则" : "还没有任何规则"} /></div>}
    {confirm ? <ConfirmDialog action={confirm} onCancel={() => setConfirm(null)} onConfirm={applyConfirm} /> : null}
  </>;
}


function Avatar() { return <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#e4e8f0] text-[10px]">AD</span>; }

function RuleHistory({ rule, onBack }: { rule: Rule; onBack: () => void }) {
  const Search = useIcon("search");
  const [query, setQuery] = useState("");
  const [restored, setRestored] = useState<string | null>(null);
  const records = [{ id: "v2", time: "9月3日 10:02:11", action: "修改", log: "更新请求路径与处置动作" }, { id: "v1", time: "9月2日 18:31:42", action: "新增", log: "创建规则并设为停用" }].filter((record) => `${record.action} ${record.log} ${rule.name}`.toLowerCase().includes(query.toLowerCase()));
  return <PageCard><BackHeader onBack={onBack}><strong className="truncate text-[14px]">{rule.name} 的修改记录</strong></BackHeader><div className="p-4 sm:p-5">{restored ? <div className="mb-3 rounded-lg bg-[#e4f7eb] px-3 py-2 text-[12px] text-[#08783e]">已恢复到 {restored} 版本</div> : null}<label className="relative block w-full sm:w-[448px]"><span className="sr-only">搜索修改记录</span><Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-black/45" /><Input className="pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="搜索" size="sm" value={query} /></label><div className="mt-5 overflow-hidden rounded-xl border border-black/[0.12]"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-[12px]"><thead><tr className="h-9 border-b border-black/[0.12]">{["时间", "用户", "操作", "对象", "日志", "状态", "操作"].map((heading, index) => <th className="px-3 text-[14px] font-normal" key={`${heading}-${index}`}>{heading}</th>)}</tr></thead><tbody>{records.map((record) => <tr className="h-12 border-b border-black/[0.10] last:border-0" key={record.id}><td className="px-3 tabular-nums">{record.time}</td><td className="px-3"><span className="flex items-center gap-2"><Avatar /><span><span className="block">admin</span><span className="block text-black/45">admin@zstack.io</span></span></span></td><td className="px-3">{record.action}</td><td className="px-3">{rule.name}</td><td className="px-3">{record.log}</td><td className="px-3"><Status enabled /></td><td className="px-3"><button className="cursor-pointer hover:underline" onClick={() => setRestored(record.id)} type="button">回到这一版</button></td></tr>)}</tbody></table></div><TableFooter total={records.length} /></div></div></PageCard>;
}

function limitSentence(limit: GlobalLimit, compact = false) {
  const condition = limit.conditions[0];
  const conditionValue = condition?.value ?? "";
  const visibleValue = compact && conditionValue.length > 24 ? `${conditionValue.slice(0, 12)}...${conditionValue.slice(-6)}` : conditionValue;
  const windows = limit.windows.map((windowItem) => `每${windowItem.unit} ${windowItem.count} 次`).join("、");
  const action = limit.action === "reject" ? "超限时立即拒绝" : limit.action === "queue" ? "超限时进入队列" : "超限时返回固定答复";
  return `当 ${condition?.field || "所有请求"}${condition ? `${condition.operator} ${visibleValue}` : ""} 时 → 限速至 ${windows}、${action}`;
}

function LimitSummary({ limit, compact = false, showName = true }: { limit: GlobalLimit; compact?: boolean; showName?: boolean }) {
  return <div className="min-w-0">{showName ? <p className={cn("text-[14px] font-medium leading-5", !limit.name && "sr-only")}>{limit.name || "未命名限额"}</p> : null}<p className={cn("text-[14px] leading-5", showName && limit.name && "mt-1", compact ? "max-w-[660px]" : "max-w-none")}>{limitSentence(limit, compact)}</p><div className="mt-2 space-y-0.5 text-[12px] leading-4 text-black/45">{limit.windows.map((windowItem) => <p key={windowItem.id}>基线 {windowItem.unit}: 频次 {windowItem.count} / 突发 {windowItem.burst}</p>)}</div></div>;
}

function LimitsList({ limits, onCreate, onDelete, onOpen, onToggle }: { limits: GlobalLimit[]; onCreate: () => void; onDelete: (limit: GlobalLimit) => void; onOpen: (limit: GlobalLimit) => void; onToggle: (limit: GlobalLimit) => void }) {
  const Filter = useIcon("plus");
  const More = useIcon("ellipsis");
  const Check = useIcon("check");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [enabledOnly, setEnabledOnly] = useState(false);
  const visible = enabledOnly ? limits.filter((limit) => limit.enabled) : limits;
  return <>
    <div className="mb-5 flex items-center justify-between gap-2">
      <div className="relative">
        <Button active={filterOpen} dashed leadingIcon={Filter} onClick={() => setFilterOpen((current) => !current)} size="md" type="button" variant="tertiary">筛选</Button>
        {filterOpen ? <div className="absolute left-0 top-11 z-20 w-40 rounded-lg border border-black/[0.10] bg-white p-1 shadow-[0_10px_28px_rgba(0,0,0,.14)]"><button className="flex h-8 w-full items-center justify-between rounded-md px-2 text-left text-[12px] hover:bg-[#f1f3f9]" onClick={() => { setEnabledOnly(false); setFilterOpen(false); }} type="button">全部限额{!enabledOnly ? <Check className="size-3.5" /> : null}</button><button className="flex h-8 w-full items-center justify-between rounded-md px-2 text-left text-[12px] hover:bg-[#f1f3f9]" onClick={() => { setEnabledOnly(true); setFilterOpen(false); }} type="button">仅已生效{enabledOnly ? <Check className="size-3.5" /> : null}</button></div> : null}
      </div>
      <Button onClick={onCreate} size="md" type="button" variant="neutral">新增限额</Button>
    </div>
    <div className="overflow-hidden rounded-xl border border-black/[0.12]">
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] table-fixed text-left text-[14px]"><colgroup><col /><col className="w-[140px]" /><col className="w-[140px]" /><col className="w-[140px]" /></colgroup><thead><tr className="h-9 border-b border-black/[0.12]"><th className="px-3 font-normal">全局限额</th><th className="px-3 font-normal">来源</th><th className="px-3 font-normal">状态</th><th className="px-3 font-normal">操作</th></tr></thead><tbody>{visible.map((limit) => <tr className="border-b border-black/[0.10] align-middle transition-colors hover:bg-black/[0.02] last:border-0" key={limit.id}><td className="px-3 py-4"><LimitSummary compact limit={limit} /></td><td className="px-3 py-4">租户策略</td><td className="px-3 py-4"><Status enabled={limit.enabled} /></td><td className="relative px-3 py-4"><div className="flex items-center gap-3 whitespace-nowrap"><button className="cursor-pointer outline-none hover:underline focus-visible:ring-1 focus-visible:ring-focus-ring" onClick={() => onToggle(limit)} type="button">{limit.enabled ? "停用" : "启用"}</button><button className="cursor-pointer outline-none hover:underline focus-visible:ring-1 focus-visible:ring-focus-ring" onClick={() => onOpen(limit)} type="button">详情</button><Button aria-label="更多限额操作" active={activeMenu === limit.id} iconOnly onClick={() => setActiveMenu((current) => current === limit.id ? null : limit.id)} size="sm" type="button" variant="ghost"><More /></Button></div>{activeMenu === limit.id ? <div className="absolute right-3 top-12 z-20 w-32 rounded-lg border border-black/[0.10] bg-white p-1 shadow-[0_10px_28px_rgba(0,0,0,.14)]"><button className="flex h-8 w-full items-center rounded-md px-2 text-left text-[12px] text-[#d92b16] hover:bg-[#fff0ed]" onClick={() => { setActiveMenu(null); onDelete(limit); }} type="button">删除限额</button></div> : null}</td></tr>)}</tbody></table></div>
      {!visible.length ? <EmptyTableState description="创建限额后，可以按策略集、主体、能力或端点等真实计数维度限制请求。" onCreate={onCreate} title="还没有任何全局限额" /> : null}
    </div>
    {visible.length ? <TableFooter bordered={false} total={visible.length} /> : null}
  </>;
}

function LimitDetail({ limit, onBack, onDelete, onEdit, onHistory, onToggle }: { limit: GlobalLimit; onBack: () => void; onDelete: () => void; onEdit: () => void; onHistory: () => void; onToggle: () => void }) {
  return <LimitDetailView limit={limit} onBack={onBack} onDelete={onDelete} onEdit={onEdit} onHistory={onHistory} onToggle={onToggle} />;
}

function LimitHistory({ limit, onBack }: { limit: GlobalLimit; onBack: () => void }) {
  const Search = useIcon("search");
  const [query, setQuery] = useState("");
  const records = [{ id: "limit-v2", time: "9月3日 10:12:31", action: "修改", log: "更新基线分钟阈值" }, { id: "limit-v1", time: "9月3日 09:54:20", action: "新增", log: "创建全局限额" }].filter((record) => `${record.action} ${record.log}`.toLowerCase().includes(query.toLowerCase()));
  return <PageCard><BackHeader onBack={onBack}><strong className="truncate text-[14px]">{limit.name || "未命名限额"} 的修改记录</strong></BackHeader><div className="p-4 sm:p-5"><label className="relative block w-full sm:w-[448px]"><span className="sr-only">搜索修改记录</span><Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-black/45" /><Input className="pl-8" onChange={(event) => setQuery(event.target.value)} placeholder="搜索" size="sm" value={query} /></label><div className="mt-5 overflow-hidden rounded-xl border border-black/[0.12]"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[12px]"><thead><tr className="h-9 border-b border-black/[0.12]">{["时间", "用户", "操作", "日志", "状态"].map((heading) => <th className="px-3 text-[14px] font-normal" key={heading}>{heading}</th>)}</tr></thead><tbody>{records.map((record) => <tr className="h-12 border-b border-black/[0.10] last:border-0" key={record.id}><td className="px-3 tabular-nums">{record.time}</td><td className="px-3"><span className="flex items-center gap-2"><Avatar /><span>admin</span></span></td><td className="px-3">{record.action}</td><td className="px-3">{record.log}</td><td className="px-3"><Status enabled /></td></tr>)}</tbody></table></div><TableFooter total={records.length} /></div></div></PageCard>;
}

export type TrafficRulesProps = Omit<ComponentPropsWithoutRef<"div">, "children">;

function TrafficRulesContent({ className, ...props }: TrafficRulesProps) {
  const Menu = useIcon("menu");
  const [rules, setRules] = useState(initialRules);
  const [limits, setLimits] = useState(initialLimits);
  const [tab, setTab] = useState<Tab>("rules");
  const [page, setPage] = useState<Page>("list");
  const [activeRule, setActiveRule] = useState<Rule | null>(null);
  const [activeLimit, setActiveLimit] = useState<GlobalLimit | null>(null);
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const openRule = (rule: Rule) => { setActiveRule(rule); setPage("rule-detail"); };
  const openLimit = (limit: GlobalLimit) => { setActiveLimit(limit); setPage("limit-detail"); };
  const updateRule = (next: Rule) => { setRules((current) => current.map((rule) => rule.id === next.id ? next : rule)); setActiveRule(next); };
  const updateLimit = (next: GlobalLimit) => { setLimits((current) => current.map((limit) => limit.id === next.id ? next : limit)); setActiveLimit(next); };
  const applyConfirm = () => { if (!confirm) return; if (confirm.target === "rule") { if (confirm.action === "delete") { setRules((current) => current.filter((rule) => !confirm.ids.includes(rule.id))); setActiveRule(null); setPage("list"); } else { const enabled = confirm.action === "enable"; setRules((current) => current.map((rule) => confirm.ids.includes(rule.id) ? { ...rule, enabled } : rule)); if (activeRule) setActiveRule({ ...activeRule, enabled }); } } else if (confirm.action === "delete") { setLimits((current) => current.filter((limit) => !confirm.ids.includes(limit.id))); setActiveLimit(null); setPage("list"); } else { const enabled = confirm.action === "enable"; setLimits((current) => current.map((limit) => confirm.ids.includes(limit.id) ? { ...limit, enabled } : limit)); if (activeLimit && confirm.ids.includes(activeLimit.id)) setActiveLimit({ ...activeLimit, enabled }); } setConfirm(null); };
  if (page === "rule-detail" && activeRule) {
    return <div className={cn("h-full w-full", className)} {...props}>
      <RuleDetailView
        key={activeRule.id}
        rule={activeRule}
        onBack={() => setPage("list")}
        onEdit={() => setPage("rule-edit")}
        onHistory={() => setPage("rule-history")}
        onValidate={() => setPage("validate")}
        onToggle={() => setConfirm({ action: activeRule.enabled ? "disable" : "enable", ids: [activeRule.id], target: "rule" })}
        onDelete={() => setConfirm({ action: "delete", ids: [activeRule.id], target: "rule" })}
      />
      {confirm ? <ConfirmDialog action={confirm} onCancel={() => setConfirm(null)} onConfirm={applyConfirm} /> : null}
    </div>;
  }
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
  const breadcrumb = page === "list" ? "流量规则" : page === "validate" ? "流量规则 › 验证规则" : page.includes("history") ? `流量规则 › ${page.startsWith("limit") ? "全局限额" : "规则详情"} › 修改记录` : page.startsWith("limit") ? "流量规则 › 全局限额 › 限额详情" : "流量规则 › 规则详情";
  return <div className={cn("flex h-full min-h-[620px] w-full overflow-hidden bg-[#f1f3f9] text-[#00030a] selection:bg-[#0878ff]/20", className)} {...props}><AdminSidebar mobileOpen={mobileNav} onClose={() => setMobileNav(false)} /><main className="min-w-0 flex-1 overflow-auto px-3 pt-4 min-[760px]:pl-0 min-[760px]:pr-3 min-[760px]:pt-2.5"><div className="w-full"><div className="mb-2 flex min-h-[22px] items-center gap-2 text-[12px] text-black/45 sm:text-[14px]"><Button aria-label="打开导航" className="min-[760px]:hidden" iconOnly onClick={() => setMobileNav(true)} size="sm" type="button" variant="secondary"><Menu /></Button><span>路由策略</span><span>›</span><span className="truncate text-black/70">{breadcrumb}</span><h1 className="sr-only">{page.includes("history") ? "修改记录" : "流量规则"}</h1></div>{page === "rule-edit" && activeRule ? <RuleWorkflow initial={activeRule} onCancel={() => setPage("rule-detail")} onSave={(rule) => { updateRule(rule); setPage("rule-detail"); }} /> : null}{page === "rule-history" && activeRule ? <RuleHistory onBack={() => setPage("rule-detail")} rule={activeRule} /> : null}{page === "validate" ? <RuleValidation onBack={() => setPage("list")} /> : null}{page === "limit-detail" && activeLimit ? <LimitDetail limit={activeLimit} onBack={() => setPage("list")} onDelete={() => setConfirm({ action: "delete", ids: [activeLimit.id], target: "limit" })} onEdit={() => setPage("limit-edit")} onHistory={() => setPage("limit-history")} onToggle={() => setConfirm({ action: activeLimit.enabled ? "disable" : "enable", ids: [activeLimit.id], target: "limit" })} /> : null}{page === "limit-history" && activeLimit ? <LimitHistory limit={activeLimit} onBack={() => setPage("limit-detail")} /> : null}{page === "list" ? <PageCard className="px-4 pt-5 sm:px-5"><Tabs color="default" onValueChange={(value) => setTab(value as Tab)} value={tab} variant="pill"><TabsList><TabItem label="规则清单" value="rules" /><TabItem label="全局限额" value="limits" /></TabsList></Tabs><div className="mt-5">{tab === "rules" ? <RuleList onCreate={() => setCreateRuleOpen(true)} onOpen={openRule} onRulesChange={setRules} onValidate={() => setPage("validate")} rules={rules} /> : <LimitsList limits={limits} onCreate={() => setPage("limit-create")} onDelete={(limit) => setConfirm({ action: "delete", ids: [limit.id], target: "limit" })} onOpen={openLimit} onToggle={(limit) => setConfirm({ action: limit.enabled ? "disable" : "enable", ids: [limit.id], target: "limit" })} />}</div></PageCard> : null}</div></main>{createRuleOpen ? <RuleWorkflow onCancel={() => setCreateRuleOpen(false)} onSave={(rule) => { setRules((current) => [...current, { ...rule, priority: current.length + 1 }]); setCreateRuleOpen(false); }} /> : null}{confirm ? <ConfirmDialog action={confirm} onCancel={() => setConfirm(null)} onConfirm={applyConfirm} /> : null}</div>;
}

export function TrafficRules(props: TrafficRulesProps) {
  return <TrafficRulesContent {...props} />;
}
