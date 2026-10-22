"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ModelSelector, modelSelectorZhLabels, type ModelSelectorModel, type ModelSelectorValue } from "@zeron/ui/model-selector";
import { InputMessage } from "@zeron/ui/input-message";

export function ModelSelectorExample({ composer = false }: { composer?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("model-selector");
  const zh = locale.startsWith("zh");
  const [value, setValue] = useState<ModelSelectorValue>({ modelId: "reasoning", extendedThinking: false, webSearch: false });
  const [draft, setDraft] = useState("");
  const models: ModelSelectorModel[] = [
    { id: "reasoning", name: zh ? "推理模型" : "Reasoning", icon: "R", description: zh ? "处理复杂任务" : "Complex tasks", ratings: { speed: 3, quality: 5, cost: 4 } },
    { id: "fast", name: zh ? "快速模型" : "Fast", icon: "F", description: zh ? "日常任务" : "Everyday tasks", ratings: { speed: 5, quality: 3, cost: 1 } },
    { id: "auto", name: "Auto", icon: "✦", description: zh ? "按任务自动选择" : "Choose per task" },
  ];
  const selector = <ModelSelector models={models} value={value} onValueChange={setValue} labels={zh ? modelSelectorZhLabels : undefined} defaultOpen={!composer} />;
  return <div className="w-full min-w-0 max-w-lg">{composer
    ? <InputMessage layout="compact" value={draft} onValueChange={setDraft} placeholder={t("placeholder")} leftSlot={selector} />
    : selector}</div>;
}
