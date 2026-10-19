"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { UsageBudgetForecast, usageBudgetForecastDemoData, usageBudgetForecastZhLabels } from "@zeron/blocks/usage-forecast-02";
import { DemoSettingsMenu } from "./DemoSettingsMenu";

type DemoState = "ready" | "loading" | "empty" | "error";

export function UsageBudgetForecastDemo() {
  const zh = useLocale() !== "en";
  const [state, setState] = useState<DemoState>("ready");
  const data = useMemo(() => ({ ...usageBudgetForecastDemoData, plan: zh ? "Scale 套餐" : "Scale plan", metrics: state === "empty" ? [] : usageBudgetForecastDemoData.metrics.map(metric => ({ ...metric, label: zh ? ({ api: "API 调用", storage: "存储", seats: "席位" }[metric.id] ?? metric.label) : metric.label, unit: zh && metric.id === "seats" ? "席位" : metric.unit })) }), [state, zh]);
  return <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8">
    <div className="m-auto w-full max-w-6xl space-y-4">
      <UsageBudgetForecast data={data} locale={zh ? "zh-CN" : "en-US"} labels={zh ? usageBudgetForecastZhLabels : undefined} state={state === "empty" ? "ready" : state} onRetry={() => setState("ready")} />
      <p className="text-center text-label text-fg-subtle">{zh ? "固定示例 · 2026 年 9 月 22 日快照 · 告警设置仅在本地演示" : "Sample data · September 22, 2026 snapshot · Alert preferences are local to this demo"}</p>
      <DemoSettingsMenu<DemoState> value={state} onChange={setState} options={[
        { value: "ready", label: zh ? "正常数据" : "Ready" }, { value: "loading", label: zh ? "正在加载" : "Loading" },
        { value: "empty", label: zh ? "暂无指标" : "Empty" }, { value: "error", label: zh ? "加载失败" : "Error" },
      ]} />
    </div>
  </div>;
}
