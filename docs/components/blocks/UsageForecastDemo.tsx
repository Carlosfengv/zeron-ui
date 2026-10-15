"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { UsageForecast, usageForecastDemoAccounts, usageForecastDemoNow, usageForecastZhLabels } from "@zeron/blocks/usage-forecast-01";
import { DemoSettingsMenu } from "./DemoSettingsMenu";

type DemoState = "ready" | "loading" | "empty" | "error";

export function UsageForecastDemo() {
  const zh = useLocale() !== "en";
  const [state, setState] = useState<DemoState>("ready");
  const accounts = useMemo(() => state === "empty" ? [] : usageForecastDemoAccounts.map((account) => ({ ...account,
    recentUsage: account.recentUsage?.map((day, index) => ({ ...day, label: zh ? ["周五", "周六", "周日", "周一", "周二", "周三", "今天"][index] : day.label })),
  })), [state, zh]);
  return <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8">
    <div className="m-auto w-full max-w-[1500px] space-y-3">
      <UsageForecast accounts={accounts} now={usageForecastDemoNow} state={state === "empty" ? "ready" : state}
        locale={zh ? "zh-CN" : "en-US"} timeZone="Asia/Shanghai" labels={zh ? usageForecastZhLabels : undefined}
        errorMessage={zh ? "暂时无法获取账户用量，请重试。" : "Account usage could not be loaded. Try again."} onRetry={() => setState("ready")} />
      <p className="text-center text-label text-fg-subtle">{zh ? "交互演示 · 固定示例数据，未连接真实账户" : "Interactive demo · Fixed example data, no live accounts connected"}</p>
      <DemoSettingsMenu<DemoState> value={state} onChange={setState} options={[
        { value: "ready", label: zh ? "正常数据" : "Ready" }, { value: "loading", label: zh ? "正在加载" : "Loading" },
        { value: "empty", label: zh ? "暂无账户" : "Empty" }, { value: "error", label: zh ? "加载失败" : "Error" },
      ]} />
    </div>
  </div>;
}
