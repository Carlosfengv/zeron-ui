"use client";

import { useEffect, useRef, useState } from "react";
import { IntegrationMonitors, createIntegrationMonitorsDemoData, createMonitorDemoChecks, integrationMonitorsCsv, integrationMonitorsDemoEpoch, type IntegrationMonitorsQuery, type IntegrationMonitorsSnapshot, type IntegrationMonitorItem, type IntegrationMonitorsState } from "@zeron/blocks/integration-monitors-01";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { Field, FieldLabel } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { DemoSettingsMenu } from "./DemoSettingsMenu";
import { ToastStack, type ToastData } from "@zeron/ui/toast";

const initialQuery: IntegrationMonitorsQuery = { category: "all", integrationId: "all", lifecycle: "all", search: "", pageIndex: 0, pageSize: 3 };
type DemoDialog = { kind: "details" | "assets" | "edit" | "configure" | "remove"; id: string } | { kind: "manage" };
const resultTone = { passed: "success", failed: "danger", warning: "warning", unknown: "neutral" } as const;
const resultLabel = { passed: "通过", failed: "失败", warning: "警告", unknown: "未知" };

/** Local, explicit fixture actions; production requests belong to the host. */
export function IntegrationMonitorsDemo() {
  const [data, setData] = useState(createIntegrationMonitorsDemoData);
  const [query, setQuery] = useState(initialQuery);
  const [state, setState] = useState<IntegrationMonitorsState | "empty" | "initial-error" | "unknown">("ready");
  const [fail, setFail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(integrationMonitorsDemoEpoch + 180_000);
  const [dialog, setDialog] = useState<DemoDialog | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const mounted = useRef(false);
  const current = useRef(data);
  current.current = data;
  const revision = useRef(1);
  const toastId = useRef(0);
  const timers = useRef(new Map<ReturnType<typeof setTimeout>, (error: Error) => void>());
  useEffect(() => {
    mounted.current = true;
    const clock = setInterval(() => setNow((value) => value + 60_000), 60_000);
    const params = new URLSearchParams(window.location.search);
    setQuery((value) => ({ ...value, search: params.get("q") ?? "", category: ["all", "failing", "compliant", "inactive"].includes(params.get("category") ?? "") ? params.get("category") as IntegrationMonitorsQuery["category"] : "all", integrationId: params.get("integration") ?? "all", lifecycle: ["all", "active", "paused", "needs-setup"].includes(params.get("status") ?? "") ? params.get("status") as IntegrationMonitorsQuery["lifecycle"] : "all", pageIndex: Math.max(0, Number(params.get("page") ?? 1) - 1) }));
    const id = params.get("monitor");
    if (id && current.current.items.some((item) => item.id === id)) setDialog({ kind: "details", id });
    return () => { mounted.current = false; clearInterval(clock); for (const [timer, reject] of timers.current) { clearTimeout(timer); reject(new Error("Demo unmounted")); } timers.current.clear(); };
  }, []);

  async function prepare() {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { timers.current.delete(timer); resolve(); }, 400);
      timers.current.set(timer, reject);
    });
    if (!mounted.current) throw new Error("Demo unmounted");
    if (fail) throw new Error("Simulated action failure");
  }
  function update(change: (value: IntegrationMonitorsSnapshot) => IntegrationMonitorsSnapshot) {
    const snapshotId = `integrations-${++revision.current}`;
    setData((value) => ({ ...change(value), snapshotId, updatedAt: now }));
  }
  function notify(title: string) {
    const id = ++toastId.current;
    setToasts((value) => [...value, { id, title, status: "success" }]);
    const timer = setTimeout(() => { timers.current.delete(timer); if (mounted.current) setToasts((value) => value.filter((entry) => entry.id !== id)); }, 3500);
    timers.current.set(timer, () => {});
  }
  function open(kind: Exclude<DemoDialog["kind"], "manage">, id: string) {
    const item = current.current.items.find((entry) => entry.id === id);
    if (!item) return;
    setName(item.name); setDescription(item.description); setDialogError(""); setDialog({ kind, id });
  }
  async function changeItem(id: string, change: (item: IntegrationMonitorItem) => IntegrationMonitorItem, title: string, checkedAt?: number) {
    await prepare();
    if (!current.current.items.some((item) => item.id === id)) return;
    update((value) => ({ ...value, items: value.items.map((item) => item.id === id ? change(item) : item), ...(checkedAt !== undefined ? { lastCheckedAt: checkedAt } : {}) }));
    notify(title);
  }
  async function connect(id: string) {
    await prepare();
    const integration = current.current.integrations.find((entry) => entry.id === id);
    if (!integration || current.current.items.some((item) => item.integrationId === id)) return;
    const item: IntegrationMonitorItem = { id, integrationId: id, name: integration.name, description: integration.description, logoSrc: integration.logoSrc, lifecycle: "needs-setup", assetCount: 0, checks: [], shareUrl: `/block-demo/integration-monitors-01?monitor=${encodeURIComponent(id)}` };
    update((value) => ({ ...value, items: [item, ...value.items] }));
    setQuery(initialQuery); setState("ready"); notify(`${integration.name} 已添加，请完成配置`);
  }
  async function share(id?: string) {
    await prepare();
    const url = new URL("/block-demo/integration-monitors-01", window.location.origin);
    url.searchParams.set("q", query.search); url.searchParams.set("category", query.category); url.searchParams.set("integration", query.integrationId); url.searchParams.set("status", query.lifecycle); url.searchParams.set("page", String(query.pageIndex + 1));
    if (id) url.searchParams.set("monitor", id);
    await navigator.clipboard.writeText(url.href);
  }
  const item = dialog && "id" in dialog ? data.items.find((entry) => entry.id === dialog.id) : undefined;
  async function saveDialog() {
    if (!dialog || !("id" in dialog) || saving) return;
    if (dialog.kind !== "remove" && !name.trim()) { setDialogError("请输入监控名称"); return; }
    setSaving(true); setDialogError("");
    try {
      await prepare();
      const id = dialog.id;
      if (!current.current.items.some((entry) => entry.id === id)) { setDialog(null); return; }
      if (dialog.kind === "remove") {
        update((value) => ({ ...value, items: value.items.filter((entry) => entry.id !== id) })); notify("监控已移除，可重新添加");
      } else {
        update((value) => ({ ...value, items: value.items.map((entry) => entry.id !== id ? entry : { ...entry, name: name.trim(), description: description.trim(), ...(dialog.kind === "configure" ? { lifecycle: "active" as const, checks: createMonitorDemoChecks(id, 12, 0, now), assetCount: 6 } : {}) }), ...(dialog.kind === "configure" ? { lastCheckedAt: now } : {}) }));
        notify(dialog.kind === "configure" ? "配置已保存，示例检查已通过" : "监控已更新");
      }
      setDialog(null);
    } catch { if (mounted.current) setDialogError("操作失败，请重试"); }
    finally { if (mounted.current) setSaving(false); }
  }
  const dialogTitle = dialog?.kind === "manage" ? "管理集成" : dialog?.kind === "details" ? "监控详情" : dialog?.kind === "assets" ? "关联资产" : dialog?.kind === "configure" ? "完成配置" : dialog?.kind === "remove" ? "移除监控" : "编辑监控";
  const editing = dialog?.kind === "edit" || dialog?.kind === "configure";
  return <div className="flex w-full min-w-0 flex-col items-center gap-4 p-4">
    <DemoSettingsMenu<typeof state> value={state} onChange={(value) => {
        if (value === "empty") update((snapshot) => ({ ...snapshot, items: [], lastCheckedAt: null }));
        if (value === "unknown") update((snapshot) => ({ ...snapshot, items: snapshot.items.map((entry, index) => index === 0 ? { ...entry, checks: null, assetCount: null } : entry) }));
        setState(value);
      }} options={[{ value: "ready", label: "正常" }, { value: "loading", label: "首次加载" }, { value: "stale", label: "数据过期" }, { value: "error", label: "刷新失败" }, { value: "initial-error", label: "首次失败" }, { value: "empty", label: "无数据" }, { value: "unknown", label: "未知检查" }]}
      toggles={[{ id: "action-failure", label: "模拟操作失败", checked: fail, onChange: setFail }]}
      actions={[{ label: "重置示例", onSelect: () => window.location.assign(window.location.pathname) }]}
      description="交互演示 · 示例数据，未连接真实集成服务。检查操作生成通过的示例结果。" />
    <IntegrationMonitors scopeId={data.scopeId} data={state === "initial-error" ? null : data} state={state === "initial-error" ? "error" : state === "empty" || state === "unknown" ? "ready" : state} query={query} onQueryChange={setQuery} now={now} refreshing={refreshing} actions={{
      onConnect: connect,
      onOpenDetails: (id) => open("details", id), onOpenAssets: (id) => open("assets", id),
      onConfigure: (id) => open("configure", id), onEdit: (id) => open("edit", id), onRemove: (id) => open("remove", id),
      onPause: (id) => changeItem(id, (entry) => ({ ...entry, lifecycle: "paused" }), "监控已暂停"),
      onResume: (id) => changeItem(id, (entry) => ({ ...entry, lifecycle: "active" }), "监控已恢复"),
      onCheck: (id) => changeItem(id, (entry) => ({ ...entry, checks: createMonitorDemoChecks(id, entry.checks?.length || 12, 0, now) }), "检查已完成", now),
      onCheckAll: async () => { setRefreshing(true); try { await prepare(); if (!current.current.items.some((entry) => entry.lifecycle === "active")) return; update((value) => ({ ...value, lastCheckedAt: now, items: value.items.map((entry) => entry.lifecycle === "active" ? { ...entry, checks: createMonitorDemoChecks(entry.id, entry.checks?.length || 12, 0, now) } : entry) })); notify("运行中的监控已检查"); } finally { if (mounted.current) setRefreshing(false); } },
      onExport: async (context) => { await prepare(); const url = URL.createObjectURL(new Blob([integrationMonitorsCsv(context.items)], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "integration-monitors.csv"; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify(`已导出 ${context.items.length} 条匹配结果`); },
      onShare: (_context, id) => share(id),
      onMute: async (duration) => { await prepare(); update((value) => ({ ...value, mutedUntil: duration === null ? null : now + duration })); notify(duration === null ? "静音已取消" : "示例通知已静音一小时"); },
      onManageIntegrations: () => { setDialogError(""); setDialog({ kind: "manage" }); },
      onRetry: async () => { await prepare(); setState("ready"); },
    }} />
    <ToastStack placement="static" portal={false} toasts={toasts} closeLabel="关闭提示" onDismiss={(id) => setToasts((value) => value.filter((entry) => entry.id !== id))} />
    <Dialog open={dialog !== null} onOpenChange={(value) => { if (!value && !saving) setDialog(null); }}><DialogContent size="lg"><DialogHeader><DialogTitle>{dialogTitle}{item ? ` · ${item.name}` : ""}</DialogTitle><DialogDescription>{dialog?.kind === "remove" ? "移除后将停止此集成的监控。可以从添加监控中重新连接。" : "此窗口展示本地示例数据；生产使用时由宿主接入配置和集成服务。"}</DialogDescription></DialogHeader>
      {editing && <form id="integration-monitor-form" className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveDialog(); }}><Field><FieldLabel>监控名称</FieldLabel><Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} disabled={saving} /></Field><Field><FieldLabel>描述</FieldLabel><Input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} disabled={saving} /></Field>{dialog?.kind === "configure" && <p className="text-body text-fg-muted">保存后启用 12 项示例检查，并关联 6 个示例资产。</p>}</form>}
      {dialog?.kind === "details" && item && <div className="space-y-3"><p className="text-body text-fg-muted">{item.description}</p><p className="text-body text-fg-default">{item.lifecycle === "active" ? "运行中" : item.lifecycle === "paused" ? "已暂停 · 以下为历史结果" : "待配置"} · {item.assetCount ?? "—"} 个资产</p><ul className="max-h-80 space-y-2 overflow-y-auto">{item.checks?.map((check) => <li key={check.id}><InlineNotice variant="emphasized" tone={resultTone[check.result]} ><InlineNoticeContent>{`${check.name} · ${resultLabel[check.result]}`}</InlineNoticeContent></InlineNotice></li>)}</ul>{!item.checks?.length && <p className="text-body text-fg-muted">{item.checks === null ? "检查数据未知" : item.lifecycle === "needs-setup" ? "尚未配置检查项" : "暂无检查项"}</p>}</div>}
      {dialog?.kind === "assets" && item && <div className="max-h-80 space-y-2 overflow-y-auto"><p className="text-body text-fg-muted">{item.assetCount ?? "—"} 个示例资产</p>{Array.from({ length: item.assetCount ?? 0 }, (_, index) => <p key={index} className="text-body text-fg-default">{item.name} · 示例资产 {index + 1}</p>)}</div>}
      {dialog?.kind === "manage" && <ul className="max-h-80 space-y-3 overflow-y-auto">{data.integrations.map((integration) => { const connected = data.items.find((entry) => entry.integrationId === integration.id); return <li key={integration.id} className="flex flex-wrap items-center justify-between gap-2"><span className="text-body text-fg-default">{integration.name}</span>{connected ? <Button size="sm" variant="secondary" disabled={saving} onClick={() => open(connected.lifecycle === "needs-setup" ? "configure" : "edit", connected.id)}>{connected.lifecycle === "needs-setup" ? "配置" : "编辑"}</Button> : <Button size="sm" variant="secondary" loading={saving} onClick={async () => { if (saving) return; setSaving(true); setDialogError(""); try { await connect(integration.id); } catch { if (mounted.current) setDialogError("操作失败，请重试"); } finally { if (mounted.current) setSaving(false); } }}>连接</Button>}</li>; })}</ul>}
      {dialogError && <InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent>{dialogError}</InlineNoticeContent></InlineNotice>}
      <DialogFooter><Button variant="secondary" disabled={saving} onClick={() => setDialog(null)}>{editing || dialog?.kind === "remove" ? "取消" : "关闭"}</Button>{editing && <Button type="submit" form="integration-monitor-form" loading={saving}>保存</Button>}{dialog?.kind === "remove" && <Button variant="destructive" loading={saving} onClick={() => void saveDialog()}>确认移除</Button>}</DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
