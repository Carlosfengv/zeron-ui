"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { SupportAnalytics, createSupportAnalyticsDemoData, createSupportAnalyticsDemoRecords, supportAnalyticsEnglishLabels, supportAnalyticsLabels, type SupportAnalyticsActionContext, type SupportAnalyticsQuery, type SupportAnalyticsView, type SupportTicket } from "@zeron/blocks/support-analytics-01";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemTitle } from "@zeron/ui/info-item";
import { ToastStack, type ToastData } from "@zeron/ui/toast";
import { DataStateDemoControls, useDataStateDemo } from "./DataStateDemoControls";

export function SupportAnalyticsDemo() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const labels = zh ? supportAnalyticsLabels : supportAnalyticsEnglishLabels;
  const demo = useDataStateDemo();
  const [query, setQuery] = useState<SupportAnalyticsQuery>({ range: "this-week", channel: "all" });
  const [view, setView] = useState<SupportAnalyticsView>("all");
  const [resolvedTicketIds, setResolvedTicketIds] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const [fail, setFail] = useState(false);
  const [detail, setDetail] = useState<SupportTicket | null>(null);
  const [queue, setQueue] = useState<{ tickets: SupportTicket[]; context: SupportAnalyticsActionContext } | null>(null);
  const [queuePage, setQueuePage] = useState(0);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const generation = useRef(0);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; generation.current += 1; }; }, []);
  useEffect(() => {
    const timers = toasts.map((item) => setTimeout(
      () => setToasts((items) => items.filter((toast) => toast.id !== item.id)),
      Math.max(0, (item.createdAt ?? Date.now()) + (item.duration ?? 4000) - Date.now()),
    ));
    return () => timers.forEach(clearTimeout);
  }, [toasts]);
  const options = useMemo(() => ({ resolvedTicketIds, revision: revision + demo.revision, empty: demo.empty }), [resolvedTicketIds, revision, demo.revision, demo.empty]);
  const data = useMemo(() => createSupportAnalyticsDemoData(query, options), [query, options]);
  const records = useMemo(() => createSupportAnalyticsDemoRecords(query, options), [query, options]);
  function changeQuery(next: SupportAnalyticsQuery) { generation.current += 1; demo.changeScenario("ready"); setQuery(next); }
  async function prepare() {
    const request = generation.current;
    await new Promise<void>((resolve) => setTimeout(resolve, 450));
    if (!mounted.current || request !== generation.current) return false;
    if (fail) throw new Error("Demo action failed");
    return true;
  }
  function feedback(title: string) { setToasts((previous) => [...previous.slice(-2), { id: `${Date.now()}-${previous.length}`, title, status: "success", duration: 4000, createdAt: Date.now() }]); }
  function exportSnapshot(context: SupportAnalyticsActionContext) {
    const snapshot = data;
    const blob = new Blob([JSON.stringify({ demonstration: true, context, snapshot }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "support-analytics-demo.json";
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback(zh ? "已导出示例快照" : "Example snapshot exported");
  }
  return <div className="flex w-full min-w-0 flex-col items-center gap-4 p-4">
    <DataStateDemoControls value={demo.scenario} onChange={(value) => { generation.current += 1; demo.changeScenario(value); }} failNextRefresh={demo.failNextRefresh} onFailNextRefreshChange={demo.setFailNextRefresh} toggles={[{ id: "ticket-action-failure", label: zh ? "模拟工单操作失败" : "Simulate ticket action failure", checked: fail, onChange: setFail }]} />
    <SupportAnalytics scopeId="support-demo" data={demo.failed && !demo.retainData ? null : data} {...query} view={view} onViewChange={setView}
      onRangeChange={(range) => changeQuery({ ...query, range })} onChannelChange={(channel) => changeQuery({ ...query, channel })}
      state={demo.loading ? "loading" : demo.failed ? "error" : demo.stale ? "stale" : "ready"} refreshing={demo.refreshing} retainDataOnError={demo.retainData} labels={labels} locale={locale} timeZone="Asia/Shanghai" now={data.updatedAt + 30000}
      actions={{
        onRetry: demo.recover, onRefresh: async () => { const request = generation.current; await demo.refresh(); if (mounted.current && request === generation.current) setRevision((value) => value + 1); }, onExport: exportSnapshot,
        onOpenQueue: (context) => { setQueuePage(0); setQueue({ context, tickets: records.filter((ticket) => context.view === "all" || ticket.status === context.view) }); },
        onOpenTicket: ({ ticketId }) => { setDetail(records.find((ticket) => ticket.id === ticketId) ?? null); },
        onResolveTicket: async ({ ticketId }) => {
          if (!await prepare()) return;
          setResolvedTicketIds((ids) => ids.includes(ticketId) ? ids : [...ids, ticketId]); setRevision((value) => value + 1);
          const ticket = records.find((record) => record.id === ticketId);
          feedback(`${ticket?.number ?? ticketId} ${zh ? "已标记为已解决" : "marked as resolved"}`);
        },
      }} />
    <p className="w-full max-w-xl text-label text-fg-subtle">{zh ? "固定示例数据 · 统计来自完整示例工单集合；操作、队列与导出不连接真实客服系统。" : "Fixed example data · aggregates use the complete demo ticket set; actions, queue and exports are simulated."}</p>
    <ToastStack toasts={toasts} placement="static" portal={false} onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))} closeLabel={zh ? "关闭通知" : "Dismiss notification"} />
    <Dialog open={detail !== null} onOpenChange={(open) => { if (!open) setDetail(null); }}><DialogContent><DialogHeader><DialogTitle>{detail?.number} · {labels.details}</DialogTitle><DialogDescription>{zh ? "示例工单详情" : "Example ticket details"}</DialogDescription></DialogHeader>{detail && <InfoItem><InfoItemContent><InfoItemTitle>{detail.customer}</InfoItemTitle><InfoItemDescription>{detail.subject}</InfoItemDescription><div className="flex flex-wrap items-center gap-2"><Badge status={detail.status === "resolved" ? "success" : "warning"}>{labels[detail.status]}</Badge><span className="text-label text-fg-muted">{labels[detail.channel]} · {labels[detail.priority]}</span></div></InfoItemContent></InfoItem>}</DialogContent></Dialog>
    <Dialog open={queue !== null} onOpenChange={(open) => { if (!open) setQueue(null); }}><DialogContent><DialogHeader><DialogTitle>{labels.queue}</DialogTitle><DialogDescription>{queue ? `${labels[queue.context.range]} · ${labels[queue.context.channel]} · ${labels[queue.context.view]} · ${queue.tickets.length}` : ""}</DialogDescription></DialogHeader><div className="max-h-96 overflow-auto">{queue?.tickets.slice(queuePage * 20, (queuePage + 1) * 20).map((ticket) => <InfoItem key={ticket.id}><InfoItemContent><InfoItemTitle>{ticket.customer} · {ticket.number}</InfoItemTitle><InfoItemDescription>{ticket.subject} · {labels[ticket.status]}</InfoItemDescription></InfoItemContent><Button size="sm" variant="secondary" onClick={() => { setQueue(null); setDetail(ticket); }}>{labels.details}</Button></InfoItem>)}</div><div className="flex items-center justify-between gap-2"><Button variant="secondary" size="sm" disabled={queuePage === 0} onClick={() => setQueuePage((value) => value - 1)}>{zh ? "上一页" : "Previous"}</Button><span className="text-label text-fg-subtle">{queuePage + 1} / {Math.max(1, Math.ceil((queue?.tickets.length ?? 0) / 20))}</span><Button variant="secondary" size="sm" disabled={(queuePage + 1) * 20 >= (queue?.tickets.length ?? 0)} onClick={() => setQueuePage((value) => value + 1)}>{zh ? "下一页" : "Next"}</Button></div></DialogContent></Dialog>
  </div>;
}
