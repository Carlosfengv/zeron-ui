"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { UsageTimeline, usageTimelineDemoNow, usageTimelineDemoProviders, usageTimelineZhLabels } from "@zeron/blocks/usage-timeline-01";
import { DemoSettingsMenu } from "./DemoSettingsMenu";

type DemoState = "ready" | "loading" | "empty" | "error";

export function UsageTimelineDemo() {
  const zh = useLocale() !== "en";
  const [state, setState] = useState<DemoState>("ready");
  return <div className="h-full min-h-0 overflow-auto bg-surface-base p-4 sm:p-8">
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <UsageTimeline providers={state === "empty" ? [] : usageTimelineDemoProviders} now={usageTimelineDemoNow}
        timeZone="Asia/Shanghai" locale={zh ? "zh-CN" : "en-US"} labels={zh ? usageTimelineZhLabels : undefined}
        state={state === "empty" ? "ready" : state} onRetry={() => setState("ready")} />
      <p className="text-center text-label text-fg-subtle">{zh ? "交互演示 · 固定示例数据，未连接真实账户" : "Interactive demo · Fixed example data, no live accounts connected"}</p>
      <DemoSettingsMenu<DemoState> value={state} onChange={setState} options={[
        { value: "ready", label: zh ? "正常数据" : "Ready" }, { value: "loading", label: zh ? "正在加载" : "Loading" },
        { value: "empty", label: zh ? "暂无账户" : "Empty" }, { value: "error", label: zh ? "加载失败" : "Error" },
      ]} />
    </div>
  </div>;
}
