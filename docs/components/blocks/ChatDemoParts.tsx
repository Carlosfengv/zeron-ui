"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChatMarkdown } from "@zeron/ui/chat-thread";
import { ModelSelector, modelSelectorZhLabels, type ModelSelectorProps } from "@zeron/ui/model-selector";
import { ContextWindowUsage } from "@zeron/ui/context-window";
import { ContextWindowCompact, createContextWindowCompactDemoData, contextWindowCompactZhLabels } from "@zeron/blocks/context-window-02";
import { Button } from "@zeron/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@zeron/ui/popover";
import { ThinkingIndicator } from "@zeron/ui/thinking-indicator";
import { ThinkingSteps, ThinkingStepsHeader, ThinkingStepsContent, ThinkingStep, ThinkingStepDetails } from "@zeron/ui/thinking-steps";
import { useIcon } from "@zeron/ui/system/icon-context";

export function ChatDemoModelControls({ locale, onAttach, ...modelProps }: Pick<ModelSelectorProps, "models" | "value" | "onValueChange"> & { locale: string; onAttach: () => void }) {
  const Plus = useIcon("plus");
  return <>
    <Button variant="ghost" size="sm" iconOnly aria-label={locale.startsWith("zh") ? "添加附件" : "Add files"} onClick={onAttach}><Plus /></Button>
    <div className="min-w-0 flex-1"><ModelSelector {...modelProps} labels={locale.startsWith("zh") ? modelSelectorZhLabels : undefined} locale={locale} className="max-w-full" /></div>
  </>;
}

export function ChatDemoContextControl({ locale, open, onOpenChange, notice, onCompact }: {
  locale: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  notice?: string;
  onCompact?: () => void;
}) {
  const zh = locale.startsWith("zh");
  const context = useMemo(() => createContextWindowCompactDemoData(), []);
  const [localNotice, setLocalNotice] = useState("");
  return <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger render={<Button variant="ghost" size="sm"><span className="sr-only">{zh ? "上下文用量：" : "Context usage: "}</span><ContextWindowUsage data={context} locale={locale} /></Button>} />
    <PopoverContent align="end" side="top" className="w-80">
      <ContextWindowCompact embedded data={context} labels={zh ? contextWindowCompactZhLabels : undefined} locale={locale} notice={notice ?? localNotice}
        onCompact={onCompact ?? (() => setLocalNotice(zh ? "本地演示：已模拟压缩历史。" : "Local demo: history compaction simulated."))} />
    </PopoverContent>
  </Popover>;
}

export function ChatDemoResponseContent({ locale, text, streaming, thinking, reasoning, children }: {
  locale: string;
  text: string;
  streaming?: boolean;
  thinking?: boolean;
  reasoning?: { description: string; label: string; summary: string; files: string[] };
  children?: ReactNode;
}) {
  if (thinking) return <ThinkingIndicator showIcon={false} />;
  return <>
    {reasoning && <ThinkingSteps defaultOpen={false} className="w-full">
      <ThinkingStepsHeader>{locale.startsWith("zh") ? "思考了 6 秒" : "Thought for 6s"}</ThinkingStepsHeader>
      <ThinkingStepsContent><ThinkingStep label={reasoning.label} description={reasoning.description}>
        <ThinkingStepDetails summary={reasoning.summary} details={reasoning.files} />
      </ThinkingStep></ThinkingStepsContent>
    </ThinkingSteps>}
    <ChatMarkdown text={text} streaming={streaming} />
    {children}
  </>;
}
