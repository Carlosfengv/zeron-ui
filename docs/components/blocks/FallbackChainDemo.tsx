"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import AwsMono from "@lobehub/icons/es/Aws/components/Mono";
import AzureColor from "@lobehub/icons/es/Azure/components/Color";
import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import GeminiColor from "@lobehub/icons/es/Gemini/components/Color";
import GrokMono from "@lobehub/icons/es/Grok/components/Mono";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import VertexColor from "@lobehub/icons/es/VertexAI/components/Color";
import hubspot from "@thesvg/icons/hubspot";
import slack from "@thesvg/icons/slack";
import { FallbackChain, fallbackChainChineseLabels, type FallbackAttempt } from "@zeron/blocks/fallback-chain-01";
import { Button } from "@zeron/ui/button";
import { useIcon } from "@zeron/ui/system/icon-context";
import { PreviewToolbarPortal } from "@docs/components/content/PreviewToolbar";

const startOffset = 2_400;
const roundLength = 14_000;
const timeoutMs = 5_000;
const initialAttempts = [
  { id: "claude", model: "Claude Opus 5.5", provider: "AWS Bedrock", region: "us-east-1", icon: <ClaudeColor />, providerIcon: <AwsMono />, durationMs: 1600, pricing: "$5 / $25" },
  { id: "gpt", model: "GPT-6", provider: "Azure OpenAI", region: "Sweden Central", icon: <OpenAIMono />, providerIcon: <AzureColor />, durationMs: timeoutMs, pricing: "$1.25 / $10" },
  { id: "gemini", model: "Gemini 3.8 Pro", provider: "Google Vertex", region: "europe-west4", icon: <GeminiColor />, providerIcon: <VertexColor />, durationMs: 1900, pricing: "$1.25 / $5" },
  { id: "grok", model: "Grok 4", provider: "xAI", region: "us-west", icon: <GrokMono />, durationMs: timeoutMs, pricing: "$3 / $15" },
];
const answeredAt = initialAttempts.slice(0, 3).reduce((total, { durationMs }) => total + durationMs, 0);

function demoAttempts(time: number, allFailed: boolean, chinese: boolean): FallbackAttempt[] {
  let start = 0;
  return initialAttempts.map(({ durationMs, pricing, ...attempt }, index) => {
    const details = [{ label: chinese ? "每百万 Token 价格" : "Price per 1M tokens", value: pricing }];
    const item = { ...attempt, timeoutMs, details };
    const elapsed = time - start;
    start += durationMs;
    if (allFailed || (index < 2 && elapsed >= durationMs)) {
      const reason = index === 0 ? (chinese ? "触发限流 · 429" : "Rate limited · 429") : (chinese ? "请求超时" : "Timed out");
      return { ...item, status: "failed", reason, durationMs: allFailed && index > 1 ? timeoutMs : durationMs, costUsd: index === 0 ? 0 : 0.0006 };
    }
    if (index === 2 && elapsed >= durationMs) {
      return { ...item, status: "answered", durationMs, costUsd: 0.0021, outputTokens: 412 };
    }
    if (index === 3 && elapsed >= 0) return { ...item, status: "skipped" };
    if (elapsed >= 0) {
      return { ...item, status: "trying", durationMs: elapsed, costUsd: index === 0 ? 0 : Math.max(0.00001, elapsed * 0.00000012) };
    }
    return { ...item, status: "waiting" };
  });
}

export function FallbackChainDemo({ catalog = false }: { catalog?: boolean }) {
  const locale = useLocale();
  const chinese = locale === "zh-CN";
  const ReplayIcon = useIcon("rotate-ccw");
  const [time, setTime] = useState(startOffset);
  const [mode, setMode] = useState({ offset: startOffset, failed: false });

  useEffect(() => {
    if (catalog || mode.failed) return;
    const start = performance.now() - mode.offset;
    const timer = window.setInterval(() => setTime((performance.now() - start) % roundLength), 100);
    return () => window.clearInterval(timer);
  }, [catalog, mode]);

  function replay() {
    setTime(0);
    setMode({ offset: 0, failed: false });
  }

  return <div className="flex h-full min-h-0 w-full overflow-auto bg-surface-base p-3 sm:p-6">
    {!catalog && <PreviewToolbarPortal>
      <Button variant="ghost" size="sm" leadingIcon={ReplayIcon} onClick={replay}>
        {chinese ? "重新播放" : "Replay"}
      </Button>
      <Button variant="ghost" size="sm" aria-pressed={mode.failed}
        onClick={() => mode.failed ? replay() : setMode({ offset: 0, failed: true })}>
        {chinese ? "全部失败示例" : "All-failed example"}
      </Button>
    </PreviewToolbarPortal>}
    <div className="m-auto w-full max-w-3xl">
      <FallbackChain
        title={chinese ? "总结客服工单" : "Summarize support ticket"}
        route="openrouter/auto"
        attempts={demoAttempts(catalog ? answeredAt : time, mode.failed, chinese)}
        labels={chinese ? fallbackChainChineseLabels : undefined}
        locale={locale}
        onRetry={catalog ? undefined : replay}
        request={{
          name: chinese ? "HubSpot · 工单 #4821" : "HubSpot · Ticket #4821",
          icon: <span dangerouslySetInnerHTML={{ __html: hubspot.svg }} />,
          text: chinese ? "为值班工程师总结此次故障、影响范围以及客户已经尝试的操作。"
            : "Summarize the incident, its impact, and the steps the customer already tried.",
          details: [
            { label: chinese ? "输入" : "Input", value: "1,284 tokens" },
            { label: chinese ? "路由策略" : "Routing", value: chinese ? "费用最低优先，每次 5 秒" : "Lowest cost first, 5s per model" },
          ],
        }}
        response={{
          name: "Slack · #support-escalations",
          icon: <span dangerouslySetInnerHTML={{ __html: slack.svg }} />,
          text: chinese ? "14:02 起，约 40 家商户的欧洲银行卡付款失败。客户已清除缓存并重试，日志显示故障出现在新的 3-D Secure 验证步骤。"
            : "EU card payments began failing at 14:02 for about 40 merchants. Logs point to the new 3-D Secure step. Clearing the cache and retrying did not resolve it.",
        }}
      />
    </div>
  </div>;
}
