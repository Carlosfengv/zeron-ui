"use client";

import { useId, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { PlanUsage, planUsageDemoData, type PlanUsageData, type PlanUsageInvoice,
  type PlanUsageLabels } from "@zeron/blocks/plan-usage-01";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { Field, FieldLabel } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";

const chineseLabels: PlanUsageLabels = {
  title: "套餐与用量", description: "查看已用额度、套餐费用和历史账单。", active: "使用中", canceled: "已预约取消",
  perMonth: "/ 月", renewal: (date, price) => `将于 ${date} 续费，下次扣款 ${price}。`,
  usage: "本周期用量", included: (total) => `/ ${total} 点套餐额度`, remaining: (credits, days) => `剩余 ${credits} 点 · ${days} 天后重置`,
  progress: (used, total) => `已使用 ${used} 点，共 ${total} 点套餐额度`, projected: (credits) => `预计使用 ${credits} 点`,
  alertAt: (percent) => `达到 ${percent} 时提醒`, depletion: (date, days) => `按当前用量，额度将在 ${date} 左右耗尽，比重置日期早 ${days} 天。`,
  enableExtraUsage: "开启额外用量", seePlans: "查看套餐", dailyUsage: "每日用量", today: (credits) => `今日已使用 ${credits} 点`,
  evenPace: (credits) => `均匀用量：每日 ${credits} 点`, projectionNote: "根据最近 7 天的用量预测。", emptyUsage: "本周期暂无用量。",
  limits: "限额设置", usageAlert: "用量提醒", usageAlertDescription: "达到该比例的套餐额度时通过邮件提醒我。",
  extraUsage: "额外用量", extraUsageDescription: "套餐额度耗尽后，允许智能体继续运行，直至月度限额。",
  extraUsageNote: (price) => `额外用量每 100 点收费 ${price}，计入下次账单。`, plans: "套餐", current: "当前", yourPlan: "当前套餐",
  downgrade: "降级", upgrade: "升级", payment: "付款方式", paymentCard: (brand, last4) => `${brand} · 尾号 ${last4}`,
  paymentDetails: (expires, holder) => `有效期 ${expires} · ${holder}`, noPayment: "尚未添加付款方式。", update: "更新",
  invoices: "历史账单", date: "日期", invoiceDescription: "说明", amount: "金额", status: "状态", paid: "已支付", refunded: "已退款",
  download: (id) => `下载账单 ${id}`, showOlder: (count) => `显示更早的 ${count} 条`, emptyInvoices: "暂无账单。",
  cancelPlan: "取消套餐", cancelDescription: (plan, date) => `你可以继续使用 ${plan} 至 ${date}，不会删除任何内容。`,
  cancelScheduled: (plan, date) => `${plan} 将于 ${date} 到期，不会删除任何内容。`,
};

type DemoAction = { kind: "plan"; planId: string } | { kind: "payment" } | { kind: "cancel" };

const demoPlanCredits: Record<string, number> = { free: 500, pro: 4000, max: 12000 };
const chinesePlanCopy: Record<string, { description: string; features: string[] }> = {
  free: { description: "适合小型项目中的智能体体验。", features: ["每月 500 点额度", "标准模型", "同时运行 1 个智能体"] },
  pro: { description: "适合日常使用智能体工作。", features: ["每月 4,000 点额度", "高级模型，包含 Nova 3", "最多 8 个智能体并行", "云端智能体"] },
  max: { description: "适合长时间运行和大型代码库。", features: ["每月 12,000 点额度", "高级模型，包含 Nova 3", "最多 16 个智能体并行", "云端智能体", "最长运行 4 小时", "提前体验新模型"] },
};

function downloadExampleInvoice(invoice: PlanUsageInvoice, currency: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ example: true, currency, ...invoice }, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `example-invoice-${invoice.id}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PlanUsageDemo() {
  const chinese = useLocale() === "zh-CN";
  const paymentInputId = useId();
  const [data, setData] = useState<PlanUsageData>(planUsageDemoData);
  const [action, setAction] = useState<DemoAction | null>(null);
  const [last4, setLast4] = useState("4242");
  const localizedData = useMemo(() => {
    if (!chinese) return data;
    const format = new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", timeZone: "UTC" });
    return {
      ...data,
      plans: data.plans.map((plan) => ({ ...plan, ...chinesePlanCopy[plan.id] })),
      invoices: data.invoices.map((invoice) => {
        const start = new Date(`${invoice.date}T00:00:00Z`);
        const end = new Date(start);
        end.setUTCMonth(end.getUTCMonth() + 1);
        return { ...invoice, description: `Pro，${format.format(start)} – ${format.format(end)}${invoice.id === "HX-2026-0008" ? "，含额外用量" : ""}` };
      }),
    };
  }, [chinese, data]);
  const selectedPlan = action?.kind === "plan" ? data.plans.find((plan) => plan.id === action.planId) : undefined;
  const dialogTitle = action?.kind === "payment" ? (chinese ? "更新示例付款方式" : "Update example payment method")
    : action?.kind === "cancel" ? (chinese ? "取消示例套餐" : "Cancel example plan")
    : (chinese ? `切换至 ${selectedPlan?.name ?? ""}` : `Switch to ${selectedPlan?.name ?? ""}`);

  function confirm() {
    if (action?.kind === "plan") {
      const includedCredits = demoPlanCredits[action.planId];
      setData((current) => ({ ...current, currentPlanId: action.planId, cancelAtPeriodEnd: false,
        cycle: { ...current.cycle, includedCredits,
          dailyAllowance: Math.round(includedCredits / current.cycle.dailyUsage.length),
          projection: action.planId === "pro" ? planUsageDemoData.cycle.projection : undefined } }));
    }
    if (action?.kind === "cancel") setData((current) => ({ ...current, cancelAtPeriodEnd: true }));
    if (action?.kind === "payment") setData((current) => ({ ...current,
      payment: { brand: "Visa", expires: "11/2028", holder: "Mia Chen", ...current.payment, last4 } }));
    setAction(null);
  }

  return (
    <div className="h-full min-h-0 overflow-auto bg-surface-base p-4 sm:p-10">
      <PlanUsage data={localizedData} locale={chinese ? "zh-CN" : "en-US"} labels={chinese ? chineseLabels : undefined}
        actions={{
          onAlertPercentChange: (alertPercent) => setData((current) => ({ ...current, limits: { ...current.limits, alertPercent } })),
          onExtraUsageChange: (extraUsageEnabled) => setData((current) => ({ ...current, limits: { ...current.limits, extraUsageEnabled } })),
          onSelectPlan: (planId) => setAction({ kind: "plan", planId }),
          onUpdatePayment: () => { setLast4(data.payment?.last4 ?? ""); setAction({ kind: "payment" }); },
          onDownloadInvoice: (invoice) => downloadExampleInvoice(invoice, data.currency),
          onCancelPlan: () => setAction({ kind: "cancel" }),
        }} />
      <p className="mx-auto mt-6 max-w-3xl text-center text-label text-fg-subtle">
        {chinese ? "交互演示 · 套餐和付款操作仅更新示例；账单下载为示例 JSON，未连接计费服务。"
          : "Interactive demo · Plan and payment changes update this example. Invoice downloads are example JSON; no billing service is connected."}
      </p>
      <Dialog open={action !== null} onOpenChange={(open) => { if (!open) setAction(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{chinese ? "确认后仅更新此演示中的状态，不会扣款或修改真实账户。"
              : "Confirmation updates this demo only. No charge is made and no real account is changed."}</DialogDescription>
          </DialogHeader>
          {action?.kind === "payment" && <Field><FieldLabel htmlFor={paymentInputId}>{chinese ? "卡片尾号（4 位数字）" : "Last four digits"}</FieldLabel>
            <Input id={paymentInputId} inputMode="numeric" maxLength={4} value={last4}
              onChange={(event) => setLast4(event.target.value.replace(/\D/g, ""))} /></Field>}
          <DialogFooter><Button variant="secondary" onClick={() => setAction(null)}>{chinese ? "返回" : "Back"}</Button>
            <Button variant={action?.kind === "cancel" ? "destructive" : "neutral"}
              disabled={action?.kind === "payment" && !/^\d{4}$/.test(last4)} onClick={confirm}>{chinese ? "确认示例操作" : "Confirm example change"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
