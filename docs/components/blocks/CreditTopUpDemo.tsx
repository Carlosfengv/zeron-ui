"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { CreditTopUp, createCreditTopUpDemoData, creditTopUpZhLabels } from "@zeron/blocks/credit-top-up-01";
import { DemoSettingsMenu } from "./DemoSettingsMenu";

type DemoState = "ready" | "loading" | "empty" | "error" | "checkout-error";

export function CreditTopUpDemo() {
  const zh = useLocale() !== "en";
  const [state, setState] = useState<DemoState>("ready");
  const [packageId, setPackageId] = useState("standard");
  const [feedback, setFeedback] = useState("");
  const [demoVersion, setDemoVersion] = useState(0);
  const data = useMemo(() => {
    const demo = createCreditTopUpDemoData(zh);
    return state === "empty" ? { ...demo, usage: [], packages: [], averageDailyUsage: 0 } : demo;
  }, [zh, state]);
  return <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8">
    <div className="m-auto w-full max-w-6xl space-y-4">
      <CreditTopUp key={demoVersion} data={data} locale={zh ? "zh-CN" : "en-US"} labels={zh ? creditTopUpZhLabels : undefined} packageId={packageId}
        onPackageChange={id => { setPackageId(id); setFeedback(""); }} state={state === "loading" || state === "error" ? state : "ready"} onRetry={() => setState("ready")}
        onCancel={() => { setPackageId("standard"); setDemoVersion(version => version + 1); setFeedback(zh ? "已取消本次选择。" : "Selection cancelled."); }}
        onConfirm={async selected => {
          if (state === "checkout-error") throw new Error("Demo checkout error");
          setFeedback(zh ? `已选择 ${selected.credits.toLocaleString("zh-CN")} 额度套餐。此为交互演示，未扣款或变更余额。` : `Selected ${selected.credits.toLocaleString("en-US")} credits. Demo only; no payment or balance change.`);
        }} />
      <p role="status" aria-live="polite" className="text-center text-label text-fg-muted">{feedback || (zh ? "示例数据 · 2026 年 10 月 22 日快照 · 充值需由宿主接入" : "Sample data · October 22, 2026 snapshot · Connect checkout in your app")}</p>
      <DemoSettingsMenu<DemoState> value={state} onChange={value => { setState(value); setDemoVersion(version => version + 1); setFeedback(""); }} options={[
        { value: "ready", label: zh ? "正常数据" : "Ready" }, { value: "loading", label: zh ? "正在加载" : "Loading" },
        { value: "empty", label: zh ? "暂无数据" : "Empty" }, { value: "error", label: zh ? "加载失败" : "Error" },
        { value: "checkout-error", label: zh ? "提交失败" : "Checkout error" },
      ]} />
    </div>
  </div>;
}
