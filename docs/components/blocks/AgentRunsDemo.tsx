"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  AgentRuns,
  agentRunsZhLabels,
  createAgentRunsDemoData,
} from "@zeron/blocks/agent-runs-01";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { DemoSettingsMenu } from "./DemoSettingsMenu";

type DemoState = "ready" | "loading" | "empty" | "error";
export function AgentRunsDemo() {
  const zh = useLocale() !== "en";
  const [state, setState] = useState<DemoState>("ready");
  const [opened, setOpened] = useState<string>();
  const [revision, setRevision] = useState(0);
  const data = useMemo(() => {
    const data = createAgentRunsDemoData(zh);
    return state === "empty" ? { ...data, runs: [] } : data;
  }, [zh, state]);
  return (
    <div className="h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <AgentRuns
          key={revision}
          data={data}
          locale={zh ? "zh-CN" : "en-US"}
          timeZone="Asia/Shanghai"
          labels={zh ? agentRunsZhLabels : undefined}
          defaultExpandedRunId="run-86"
          state={state === "empty" ? "ready" : state}
          onRetry={() => setState("ready")}
          onOpenSession={(run) => setOpened(run.id)}
        />
        {opened && (
          <InlineNotice variant="emphasized" tone="info">
            <InlineNoticeContent>
              {zh
                ? `已选择 ${opened}。宿主可在此回调中打开完整会话。`
                : `Selected ${opened}. The host can open the full session through this callback.`}
            </InlineNoticeContent>
          </InlineNotice>
        )}
        <p className="text-center text-label text-fg-subtle">
          {zh
            ? "示例数据与本地交互演示 · 模型名称和费用仅用于展示"
            : "Sample data and local interactions · Model names and costs are illustrative"}
        </p>
        <DemoSettingsMenu<DemoState>
          value={state}
          onChange={setState}
          options={[
            { value: "ready", label: zh ? "正常数据" : "Ready" },
            { value: "loading", label: zh ? "正在加载" : "Loading" },
            { value: "empty", label: zh ? "暂无运行" : "Empty" },
            { value: "error", label: zh ? "加载失败" : "Load error" },
          ]}
          actions={[
            {
              label: zh ? "重置演示" : "Reset demo",
              onSelect: () => {
                setState("ready");
                setOpened(undefined);
                setRevision((value) => value + 1);
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
