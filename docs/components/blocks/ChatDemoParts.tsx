"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChatMarkdown } from "@zeron/blocks/chat-thread-01";
import { ModelSelector, modelSelectorZhLabels, type ModelSelectorProps } from "@zeron/blocks/model-selector-01";
import { ContextWindow, createContextWindowDemoData, contextWindowZhLabels } from "@zeron/blocks/context-window-01";
import { Button } from "@zeron/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@zeron/ui/popover";
import { PieChart, PieSlice } from "@zeron/ui/pie-chart";
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
  const context = useMemo(() => createContextWindowDemoData(), []);
  const used = context.systemTokens + context.toolTokens
    + [...context.docs, ...context.memory, ...context.history].reduce((sum, item) => sum + item.tokens, 0);
  const percentage = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(used / context.capacity);
  const slices = [
    { label: "used", value: used, color: "currentColor" },
    { label: "remaining", value: Math.max(0, context.capacity - used), color: "var(--border)" },
  ];
  const [localNotice, setLocalNotice] = useState("");
  return <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger render={<Button variant="ghost" size="sm" labelClassName="inline-flex items-center gap-1.5">
      <span className="sr-only">{zh ? "上下文用量：" : "Context usage: "}</span>
      <span aria-hidden="true" inert className="pointer-events-none inline-flex size-4 shrink-0">
        <PieChart data={slices} size={16} innerRadius={6} hoverOffset={0} hoveredIndex={null}>
          <PieSlice index={0} animate={false} showGlow={false} hoverEffect="none" />
          <PieSlice index={1} animate={false} showGlow={false} hoverEffect="none" />
        </PieChart>
      </span>
      <span>{percentage}</span>
    </Button>} />
    <PopoverContent align="end" side="top" className="w-xl max-w-[calc(100vw-2rem)]">
      <ContextWindow data={context} labels={zh ? contextWindowZhLabels : undefined} locale={locale} notice={notice ?? localNotice}
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
