"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ResourceCost, resourceCostDemoItems, resourceCostEnLabels, type ResourceCostRow } from "@zeron/blocks/resource-cost-01";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DemoSettingsMenu } from "./DemoSettingsMenu";

type DemoState = "ready" | "loading" | "empty" | "error";
const initialExpansion = { training: true, "h100-pool": true };

export function ResourceCostDemo() {
  const locale = useLocale(); const zh = locale !== "en";
  const [state, setState] = useState<DemoState>("ready");
  const [selected, setSelected] = useState<ResourceCostRow | null>(null);
  const [message, setMessage] = useState("");
  const downloads = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => { const pending = downloads.current; return () => { for (const [url, timer] of pending) { clearTimeout(timer); URL.revokeObjectURL(url); } }; }, []);

  function exportRows(rows: readonly ResourceCostRow[]) {
    const snapshot = { demonstration: true, currency: "CNY", period: "month", resources: rows };
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "atlas-compute-resources.json";
    document.body.append(link); link.click(); link.remove();
    downloads.current.set(url, setTimeout(() => { URL.revokeObjectURL(url); downloads.current.delete(url); }, 1000));
    setMessage(zh ? "已导出完整资源清单与月度成本。" : "Exported the complete resource tree and monthly costs.");
  }

  const money = new Intl.NumberFormat(zh ? "zh-CN" : "en", { style: "currency", currency: "CNY" });
  return <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8"><div className="m-auto w-full max-w-7xl space-y-3">
    <ResourceCost items={state === "empty" ? [] : resourceCostDemoItems} state={state === "empty" ? "ready" : state}
      title={zh ? "算力资源清单" : "Compute Resource Inventory"} description={zh ? "Atlas AI · 华东 1 · 月度资源规划" : "Atlas AI · East China 1 · Monthly resource plan"}
      summaryLabel="Atlas AI" defaultExpanded={initialExpansion} locale={zh ? "zh-CN" : "en"} labels={zh ? undefined : resourceCostEnLabels}
      onExport={exportRows} onInspect={setSelected} onRetry={() => setState("ready")} />
    <p role="status" className="text-center text-label text-fg-subtle">{message || (zh ? "交互演示 · 示例价格，未连接云平台计费服务" : "Interactive demo · Sample prices, no cloud billing service connected")}</p>
    <DemoSettingsMenu<DemoState> value={state} onChange={setState} options={[{ value: "ready", label: zh ? "正常资源" : "Ready" }, { value: "loading", label: zh ? "正在加载" : "Loading" }, { value: "empty", label: zh ? "暂无资源" : "Empty" }, { value: "error", label: zh ? "加载失败" : "Error" }]} />
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent>
      <DialogHeader><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>{selected?.code}</DialogDescription></DialogHeader>
      {selected && <dl className="space-y-3 text-body">
        <div className="flex justify-between gap-4"><dt className="text-fg-muted">{zh ? "月度成本" : "Monthly cost"}</dt><dd className="font-medium tabular-nums">{money.format(selected.totalCost)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-fg-muted">{zh ? "资源项" : "Resources"}</dt><dd>{selected.leafCount}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-fg-muted">{zh ? "交付周期" : "Ready in"}</dt><dd>{selected.readyInDays} {zh ? "天" : "days"}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-fg-muted">{zh ? "风险资源" : "At risk"}</dt><dd>{selected.riskCount}</dd></div>
      </dl>}
    </DialogContent></Dialog>
  </div></div>;
}
