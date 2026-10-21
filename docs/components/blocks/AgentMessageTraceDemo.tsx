"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import GithubMono from "@lobehub/icons/es/Github/components/Mono";
import NotionMono from "@lobehub/icons/es/Notion/components/Mono";
import FigmaColor from "@lobehub/icons/es/Figma/components/Color";
import GeminiColor from "@lobehub/icons/es/Gemini/components/Color";
import stripe from "@thesvg/icons/stripe";
import slack from "@thesvg/icons/slack";
import hubspot from "@thesvg/icons/hubspot";
import {
  AgentMessageTrace,
  agentMessageTraceDemoData,
  createAgentMessageTraceLiveDemoData,
  type AgentMessageTraceLiveLabels,
  type AgentMessageTraceSpan,
} from "@zeron/blocks/agent-message-trace-01";
import { Button } from "@zeron/ui/button";
import { Slider } from "@zeron/ui/slider";
import { Tabs, TabsList, TabItem } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";

const chineseLabels: AgentMessageTraceLiveLabels = {
  trace: "Trace",
  duration: "总耗时",
  cost: "费用",
  tokens: "Tokens",
  llmCalls: "模型调用",
  toolCalls: "工具调用",
  errors: "错误",
  live: "运行中",
  done: "已完成",
  failed: "失败",
  cancelled: "已取消",
  started: "开始于",
  slowest: "最慢调用",
  input: "输入",
  output: "输出",
  inputTokens: "输入 Tokens",
  outputTokens: "输出 Tokens",
  close: "关闭节点详情",
  spanDetails: "节点详情",
};

function TraceBrandIcon({ span }: { span: AgentMessageTraceSpan }) {
  const SearchIcon = useIcon("search");
  const GlobeIcon = useIcon("globe");
  const DatabaseIcon = useIcon("doc-table");
  if (span.provider === "Anthropic") return <ClaudeColor size={20} />;
  if (span.provider === "OpenAI") return <OpenAIMono size={20} />;
  if (span.provider === "GitHub") return <GithubMono size={20} />;
  if (span.provider === "Notion") return <NotionMono size={20} />;
  if (span.provider === "Figma") return <FigmaColor size={20} />;
  if (span.provider === "Google") return <GeminiColor size={20} />;
  if (span.provider === "Postgres")
    return <DatabaseIcon className="text-fg-info" size={17} />;
  if (span.provider === "Search")
    return <SearchIcon className="text-fg-success" size={17} />;
  if (span.provider === "Web")
    return <GlobeIcon className="text-fg-brand" size={17} />;
  const artwork =
    span.provider === "Stripe"
      ? stripe
      : span.provider === "Slack"
        ? slack
        : span.provider === "HubSpot"
          ? hubspot
          : undefined;
  // Static artwork from the already-installed icon library, never payload HTML.
  const svg =
    span.provider === "Stripe"
      ? stripe.variants.mono.replace("<svg ", '<svg fill="currentColor" ')
      : artwork?.svg;
  return svg ? (
    <span
      className="flex size-5 items-center justify-center [&_svg]:size-5"
      dangerouslySetInnerHTML={{
        __html: svg.replace(/<title>[\s\S]*?<\/title>/g, ""),
      }}
    />
  ) : null;
}

const renderSpanIcon = (span: AgentMessageTraceSpan) => (
  <TraceBrandIcon span={span} />
);

export function AgentMessageTraceDemo() {
  const locale = useLocale();
  const chinese = locale !== "en";
  const [variant, setVariant] = useState("live");
  const [time, setTime] = useState(82_000);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  const [expandedIds, setExpandedIds] = useState<readonly string[]>([
    "orchestrator",
    "researcher",
    "writer",
    "coder",
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const PlayIcon = useIcon(playing ? "pause" : "play");
  const ReplayIcon = useIcon("rotate-ccw");
  const EndIcon = useIcon("skip-forward");
  const data = useMemo(() => createAgentMessageTraceLiveDemoData(time), [time]);
  const playbackTime = useRef(time);

  useEffect(() => {
    playbackTime.current = time;
  }, [time]);

  useEffect(() => {
    if (!playing || variant !== "live") return;
    const startedAt = performance.now();
    const startTime = playbackTime.current;
    let frame = 0;
    let lastPublished = startedAt;
    const tick = (timestamp: number) => {
      const next = Math.min(82_000, startTime + (timestamp - startedAt) * 5);
      // Publish data at 20Hz; the block's shared motion clock draws every frame.
      // Tree construction and usage aggregation stay off the animation hot path.
      if (timestamp - lastPublished >= 50 || next >= 82_000) {
        playbackTime.current = next;
        setTime(next);
        lastPublished = timestamp;
      }
      if (next >= 82_000) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, variant, run]);

  const replay = () => {
    setTime(0);
    setSelectedId(null);
    setExpandedIds(["orchestrator", "researcher", "writer", "coder"]);
    setRun((value) => value + 1);
    setPlaying(true);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 bg-surface-base p-3 sm:p-6">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <Tabs
          color="default"
          value={variant}
          onValueChange={(value) => {
            setVariant(value);
            setPlaying(false);
          }}
        >
          <TabsList>
            <TabItem
              value="live"
              label={chinese ? "实时概览" : "Live overview"}
            />
            <TabItem
              value="inspector"
              label={chinese ? "调试详情" : "Span inspector"}
            />
          </TabsList>
        </Tabs>
        {variant === "live" && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={ReplayIcon}
              onClick={replay}
            >
              {chinese ? "重播" : "Replay"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={PlayIcon}
              onClick={() => {
                if (time >= 82_000) replay();
                else setPlaying((value) => !value);
              }}
            >
              {playing
                ? chinese
                  ? "暂停"
                  : "Pause"
                : chinese
                  ? "播放"
                  : "Play"}
            </Button>
            <Button
              aria-label={chinese ? "跳至完成" : "Skip to completion"}
              size="sm"
              variant="ghost"
              iconOnly
              onClick={() => {
                setTime(82_000);
                setPlaying(false);
              }}
            >
              <EndIcon size={16} />
            </Button>
          </div>
        )}
      </div>
      {variant === "live" ? (
        <>
          <div className="min-h-0 flex-1">
            <AgentMessageTrace
              key={run}
              variant="live"
              data={data}
              heading="Trace"
              headingIcon={<GeminiColor size={20} />}
              description="Launch the new pricing page by Friday"
              nowOffsetMs={time}
              locale={locale}
              liveLabels={chinese ? chineseLabels : undefined}
              renderSpanIcon={renderSpanIcon}
              expandedSpanIds={expandedIds}
              onExpandedSpanIdsChange={setExpandedIds}
              selectedSpanId={selectedId}
              onSelectedSpanIdChange={setSelectedId}
              className="h-full max-h-full w-full"
            />
          </div>
          <div className="flex shrink-0 items-center gap-4 px-1">
            <div className="min-w-0 flex-1">
              <Slider
                label={chinese ? "演示进度" : "Demo progress"}
                min={0}
                max={82_000}
                step={100}
                value={time}
                onChange={(value) => {
                  setPlaying(false);
                  setSelectedId(null);
                  setTime(typeof value === "number" ? value : value[0]);
                }}
                showValue={false}
              />
            </div>
            <span className="w-24 text-right text-label tabular-nums text-fg-subtle">
              {(time / 1000).toFixed(1)} / 82.0s
            </span>
          </div>
        </>
      ) : (
        <AgentMessageTrace
          className="h-full min-h-0 w-full rounded-xl"
          data={agentMessageTraceDemoData}
          nowOffsetMs={154_000}
          locale={locale}
        />
      )}
    </div>
  );
}
