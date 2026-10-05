"use client";

import { useEffect, useRef, useState } from "react";
import { createSecurityOverviewDemoData, SecurityOverview, type SecurityOverviewRange, type SecurityOverviewScanState, type SecurityOverviewState } from "@zeron/blocks/security-overview-01";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Switch } from "@zeron/ui/switch";
import { ToastStack, type ToastData } from "@zeron/ui/toast";

export function SecurityOverviewDemo() {
  const [range, setRange] = useState<SecurityOverviewRange>("30d");
  const [afterScan, setAfterScan] = useState(false);
  const [scan, setScan] = useState<SecurityOverviewScanState>({ status: "idle" });
  const [state, setState] = useState<SecurityOverviewState>("ready");
  const [failScan, setFailScan] = useState(false);
  const [closed, setClosed] = useState(false);
  const [exportState, setExportState] = useState<"idle" | "pending" | "error">("idle");
  const [dialog, setDialog] = useState<{ kind: "findings" | "assets"; id?: string } | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const running = useRef(false);
  const exporting = useRef(false);
  const mounted = useRef(true);
  const data = createSecurityOverviewDemoData(range, afterScan);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; timers.current.forEach(clearTimeout); running.current = false; };
  }, []);

  function later(callback: () => void, delay: number) {
    timers.current.push(setTimeout(() => { if (mounted.current) callback(); }, delay));
  }

  function runScan() {
    if (running.current) return;
    running.current = true;
    setScan({ status: "starting" });
    const jobId = `demo-${afterScan ? 3 : 2}`;
    [4, 9, 15, 24, 26].forEach((completed, index) => later(() => setScan({ status: "running", jobId, completed, total: 26 }), 350 + index * 500));
    later(() => {
      if (failScan) { setScan({ status: "failed", jobId, message: "示例扫描失败，请关闭失败模拟后重试。" }); running.current = false; return; }
      setScan({ status: "refreshing", jobId });
      later(() => {
        const newFindingCount = afterScan ? 0 : 1;
        setAfterScan(true);
        setState("ready");
        setScan({ status: "succeeded", jobId, snapshotId: "northwind-scan-2", newFindingCount });
        setToasts([{ id: jobId, title: `扫描完成 · 新增 ${newFindingCount} 项高风险`, status: "success", createdAt: Date.now(), duration: 5000 }]);
        running.current = false;
      }, 450);
    }, 2850);
  }

  function exportReport(context: { snapshotId: string; range: SecurityOverviewRange }) {
    if (exporting.current) return;
    exporting.current = true;
    setExportState("pending");
    // Capture the clicked snapshot before any later range/scan update.
    const snapshot = createSecurityOverviewDemoData(context.range, afterScan);
    later(() => {
      let url: string | undefined;
      try {
        if (snapshot.id !== context.snapshotId) throw new Error("Snapshot mismatch");
        url = URL.createObjectURL(new Blob([JSON.stringify({ demonstration: true, snapshot }, null, 2)], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url; link.download = `security-overview-example-${context.range}.json`;
        document.body.append(link); link.click(); link.remove();
        setExportState("idle");
      } catch { setExportState("error"); }
      finally { if (url) URL.revokeObjectURL(url); exporting.current = false; }
    }, 400);
  }

  const selectedFinding = dialog?.id ? data.findings?.find((item) => item.id === dialog.id) : null;
  const selectedAsset = dialog?.id ? data.assets?.find((item) => item.id === dialog.id) : null;
  const severityLabels = { critical: "严重", high: "高风险", medium: "中风险", low: "低风险" };
  return <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8">
    <div className="m-auto w-full max-w-xl space-y-4">
      {closed ? <div className="flex justify-center py-12"><Button variant="secondary" onClick={() => setClosed(false)}>重新打开安全概览</Button></div> : <SecurityOverview scopeId="northwind" data={data} range={range} onRangeChange={setRange} state={state} scan={scan} exportState={exportState}
        labels={{ export: "导出示例数据" }} actions={{ onRunScan: runScan, onExport: exportReport, onClose: () => setClosed(true), onRetry: () => setState("ready"), onViewAll: (kind) => setDialog({ kind }), onOpenFinding: (id) => setDialog({ kind: "findings", id }), onOpenAsset: (id) => setDialog({ kind: "assets", id }) }} />}
      <div className="flex flex-wrap items-center justify-center gap-3"><Select size="sm" value={state} onValueChange={(next) => setState(next as SecurityOverviewState)}><SelectTrigger aria-label="演示数据状态" /><SelectContent>{[{ value: "ready", label: "正常数据" }, { value: "loading", label: "加载中" }, { value: "stale", label: "过期快照" }, { value: "error", label: "加载失败" }].map((option) => <SelectItem key={option.value} value={option.value} label={option.label}>{option.label}</SelectItem>)}</SelectContent></Select><Switch label="模拟扫描失败" checked={failScan} onCheckedChange={setFailScan} disabled={running.current} /></div>
      <p className="text-center text-label text-fg-subtle">交互演示 · 示例数据，未连接真实安全扫描服务</p>
      <ToastStack toasts={toasts} placement="static" portal={false} onDismiss={(id) => setToasts((current) => current.filter((item) => item.id !== id))} closeLabel="关闭通知" />
    </div>
    <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null); }}><DialogContent><DialogHeader><DialogTitle>{selectedFinding?.title ?? selectedAsset?.name ?? (dialog?.kind === "findings" ? "全部风险项" : "全部受影响资产")}</DialogTitle><DialogDescription>示例数据 · 当前快照，未连接真实服务</DialogDescription></DialogHeader>
      <div className="max-h-96 space-y-3 overflow-auto">
        {dialog?.kind === "findings" ? (selectedFinding ? [selectedFinding] : data.findings ?? []).map((item) => <div key={item.id} className="space-y-1 rounded-lg border-hairline border-border p-3"><p className="break-words text-body font-medium text-fg-default">{item.title}</p><p className="break-all text-label text-fg-muted">{item.assetName} · {severityLabels[item.severity]} · 评分 {item.score ?? "—"}</p></div>) : (selectedAsset ? [selectedAsset] : data.assets ?? []).map((item) => <div key={item.id} className="space-y-2 rounded-lg border-hairline border-border p-3"><p className="break-all text-body font-medium text-fg-default">{item.name}</p><div className="flex flex-wrap gap-2">{Object.entries(item.findings).map(([severity, count]) => <Badge key={severity} size="sm">{severityLabels[severity as keyof typeof severityLabels]} {count}</Badge>)}</div></div>)}
      </div>
    </DialogContent></Dialog>
  </div>;
}
