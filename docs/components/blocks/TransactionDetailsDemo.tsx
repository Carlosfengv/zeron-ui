"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { TransactionDetails, transactionDetailsDemoData } from "@zeron/blocks/transaction-details-01";
import { Button } from "@zeron/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Switch } from "@zeron/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@zeron/ui/dialog";
import { useDataStateDemo, type DataStateDemoScenario } from "./DataStateDemoControls";
import { createTransactionDemoPdf } from "./transaction-demo-pdf";

const scenarios = ["ready", "loading", "initial-error", "refreshing", "refresh-error", "stale", "stale-refreshing", "empty"] as const;
const enScenarios = ["Ready", "Initial loading", "Initial failure", "Refreshing", "Refresh failed", "Stale", "Stale + refreshing", "Empty"];
const zhScenarios = ["正常", "首次加载", "首次失败", "后台刷新", "刷新失败", "数据过期", "过期并刷新", "确认无数据"];

export function TransactionDetailsDemo() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const demo = useDataStateDemo();
  const [closed, setClosed] = useState(false);
  const [fail, setFail] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const mounted = useRef(false);
  const viewGeneration = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function prepare() {
    const generation = viewGeneration.current;
    await new Promise<void>((resolve) => setTimeout(resolve, 400));
    if (!mounted.current || generation !== viewGeneration.current) return false;
    if (fail) throw new Error("Demo action failed");
    return true;
  }
  function close() { viewGeneration.current += 1; setClosed(true); }
  function pdfBlob() { return new Blob([createTransactionDemoPdf() as BlobPart], { type: "application/pdf" }); }
  async function download() {
    if (!await prepare()) return;
    const url = URL.createObjectURL(pdfBlob());
    const link = document.createElement("a");
    link.href = url; link.download = "INV-1430.pdf";
    document.body.append(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  }
  return <div className="flex w-full min-w-0 flex-col items-center gap-4 p-4">
    <div className="flex w-full max-w-md flex-wrap items-center gap-3">
      <Select size="sm" value={demo.scenario} onValueChange={(value) => demo.changeScenario(value as DataStateDemoScenario)}><SelectTrigger aria-label={zh ? "演示状态" : "Demo state"} /><SelectContent>{scenarios.map((value, index) => <SelectItem key={value} value={value} label={(zh ? zhScenarios : enScenarios)[index]}>{(zh ? zhScenarios : enScenarios)[index]}</SelectItem>)}</SelectContent></Select>
      <Switch checked={fail} onCheckedChange={setFail} label={zh ? "模拟操作失败" : "Simulate action failure"} />
      <p className="w-full text-label text-fg-subtle">{zh ? "示例数据 · 下载为有效的示例 PDF，分享仅展示示例摘要" : "Example data · downloads a valid demo PDF; sharing shows an example summary"}</p>
    </div>
    {closed ? <Button variant="secondary" onClick={() => setClosed(false)}>{zh ? "重新打开交易详情" : "Reopen transaction details"}</Button> : <TransactionDetails
      transactionId={transactionDetailsDemoData.id} data={demo.empty || (demo.failed && !demo.retainData) ? null : transactionDetailsDemoData}
      state={demo.loading ? "loading" : demo.failed ? "error" : demo.empty ? "empty" : demo.stale ? "stale" : "ready"}
      refreshing={demo.refreshing} locale={locale} timeZone="America/New_York" actions={{
        onDownloadReceipt: download, onShare: async () => { if (await prepare()) setSharing(true); }, onClose: close, onRetry: demo.recover,
        onDownloadAttachment: download, onOpenAttachment: async () => { if (await prepare()) setPreview(URL.createObjectURL(pdfBlob())); },
      }} />}
    <Dialog open={preview !== null} onOpenChange={(open) => { if (!open) setPreview(null); }}><DialogContent><DialogHeader><DialogTitle>INV-1430.pdf</DialogTitle><DialogDescription>{zh ? "示例发票，不代表真实付款凭证。" : "Example invoice, not proof of payment."}</DialogDescription></DialogHeader>{preview && <iframe title="INV-1430.pdf" src={preview} className="h-96 w-full rounded-lg border-hairline border-border" />}</DialogContent></Dialog>
    <Dialog open={sharing} onOpenChange={setSharing}><DialogContent><DialogHeader><DialogTitle>{zh ? "示例交易摘要" : "Example transaction summary"}</DialogTitle><DialogDescription>{zh ? "此演示未连接交易分享服务。" : "This demo is not connected to a transaction sharing service."}</DialogDescription></DialogHeader><p className="text-body text-fg-default">INV-1430 · USD 23,000.00 · Lily Hayes</p><Button variant="secondary" onClick={() => setSharing(false)}>{zh ? "完成" : "Done"}</Button></DialogContent></Dialog>
  </div>;
}
