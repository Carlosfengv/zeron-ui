"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ContextWindowCompact, createContextWindowCompactDemoData, contextWindowCompactZhLabels } from "@zeron/blocks/context-window-02";

export function ContextWindowCompactDemo() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [data, setData] = useState(createContextWindowCompactDemoData);
  const [compacting, setCompacting] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function compact() {
    if (timer.current) return;
    setCompacting(true);
    setNotice("");
    timer.current = setTimeout(() => {
      setData((current) => ({ ...current, history: current.history.map((item) => item.pinned ? item : { ...item, tokens: Math.round(item.tokens * 0.25) }) }));
      timer.current = null;
      setCompacting(false);
      setNotice(zh ? "对话已压缩，已固定内容完整保留。" : "Conversation compacted; pinned content preserved.");
    }, 700);
  }

  return <div className="flex h-full min-h-0 w-full flex-col overflow-auto bg-surface-base p-4 sm:p-8">
    <div className="m-auto w-full max-w-md shrink-0 space-y-4">
      <ContextWindowCompact data={data} locale={locale} labels={zh ? contextWindowCompactZhLabels : undefined}
        onCompact={compact} compacting={compacting} notice={notice} />
      <p className="px-2 text-center text-label text-fg-subtle">{zh ? "本地演示数据 · 展开文件或压缩对话" : "Local demo · expand files or compact the conversation"}</p>
    </div>
  </div>;
}
