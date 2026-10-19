"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ModelSelector, createModelSelectorDemoModels, modelSelectorDemoValue, modelSelectorZhLabels } from "@zeron/blocks/model-selector-01";
import { InputMessage } from "@zeron/ui/input-message";

export function ModelSelectorDemo() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [value, setValue] = useState(modelSelectorDemoValue);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(true);
  const models = useMemo(() => createModelSelectorDemoModels(locale), [locale]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-auto bg-surface-base p-4 sm:p-8">
      <div className="mx-auto w-full max-w-lg shrink-0 pt-8">
        <InputMessage
          value={message}
          onValueChange={setMessage}
          placeholder={zh ? "尽管提问…" : "Ask anything…"}
          sendLabel={zh ? "发送消息" : "Send message"}
          textareaProps={{ "aria-label": zh ? "消息" : "Message" }}
          leftSlot={<ModelSelector models={models} value={value} onValueChange={setValue} labels={zh ? modelSelectorZhLabels : undefined} locale={locale} open={open} onOpenChange={setOpen} />}
          onSend={(text) => {
            setOpen(false);
            setNotice(zh ? `本地演示：已使用 ${models.find((model) => model.id === value.modelId)?.name} 提交「${text}」` : `Local demo: submitted “${text}” with ${models.find((model) => model.id === value.modelId)?.name}`);
            setMessage("");
          }}
        />
        {notice && <p role="status" className="mt-4 px-2 text-label text-fg-muted">{notice}</p>}
      </div>
    </div>
  );
}
