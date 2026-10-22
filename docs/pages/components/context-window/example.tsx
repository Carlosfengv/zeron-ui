"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  ContextWindow, ContextWindowCompact, ContextWindowUsage,
  contextWindowZhLabels, contextWindowCompactZhLabels, type ContextWindowData,
} from "@zeron/ui/context-window";
import { Button } from "@zeron/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@zeron/ui/popover";

export function ContextWindowExample({ mode = "detailed" }: { mode?: "detailed" | "compact" | "popover" }) {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [data, setData] = useState<ContextWindowData>(() => ({
    capacity: 32000, systemTokens: 2000, toolTokens: 1000,
    docs: [{ id: "guide", title: "AGENTS.md", tokens: 6200 }],
    memory: [{ id: "preferences", title: zh ? "项目偏好" : "Project preferences", tokens: 800 }],
    history: [
      { id: "instructions", title: zh ? "固定指令" : "Pinned instructions", tokens: 2000, pinned: true },
      { id: "conversation", title: zh ? "当前对话" : "Current conversation", tokens: 16000 },
    ],
    cache: { hitRate: 0.75, saved: 0.12, cachedTokens: 21000, newTokens: 7000 },
    session: { model: zh ? "推理模型" : "Reasoning model", turn: 12, name: zh ? "组件设计" : "Component design" },
  }));
  const [notice, setNotice] = useState("");
  function compact() {
    setData((current) => ({ ...current, history: current.history.map((item) => item.pinned ? item : { ...item, tokens: Math.floor(item.tokens / 2) }) }));
    setNotice(zh ? "本地演示：已压缩对话，固定内容保持不变。" : "Local demo: conversation compacted; pinned content preserved.");
  }
  const panel = <ContextWindowCompact data={data} locale={locale} labels={zh ? contextWindowCompactZhLabels : undefined}
    embedded={mode === "popover"} onCompact={compact} notice={notice} />;
  if (mode === "popover") return <Popover>
    <PopoverTrigger render={<Button variant="secondary" size="sm"><span className="sr-only">{zh ? "上下文用量：" : "Context usage: "}</span><ContextWindowUsage data={data} locale={locale} /></Button>} />
    <PopoverContent className="w-80" align="start">{panel}</PopoverContent>
  </Popover>;
  return <div className={mode === "detailed" ? "w-full min-w-0 max-w-3xl" : "w-full min-w-0 max-w-md"}>
    {mode === "detailed" ? <ContextWindow data={data} locale={locale} labels={zh ? contextWindowZhLabels : undefined} onCompact={compact} notice={notice} /> : panel}
  </div>;
}
