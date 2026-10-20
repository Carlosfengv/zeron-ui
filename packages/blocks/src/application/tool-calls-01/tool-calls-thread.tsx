"use client";

import { useId } from "react";
import { ChatThread, ChatUserMessage, ChatAssistantMessage, ChatMarkdown } from "@zeron/blocks/chat-thread-01";
import { ToolCalls } from "./tool-calls";
import type { ToolCallsThreadProps } from "./tool-calls-types";

export function ToolCallsThread({ prompt, parts, userMessageProps, assistantMessageProps, toolCallsProps, ...threadProps }: ToolCallsThreadProps) {
  const id = useId();
  const busy = parts.some((part) => part.kind === "text" ? part.streaming : part.items.some((call) => ["queued", "running", "approval-required"].includes(call.status)));
  const text = parts.filter((part) => part.kind === "text").map((part) => part.text).join("\n\n");
  return <ChatThread {...threadProps} busy={busy}>
    <ChatUserMessage {...userMessageProps} id={`${id}-user`} text={prompt} />
    <ChatAssistantMessage {...assistantMessageProps} id={`${id}-assistant`} text={text} streaming={busy} last>
      <div className="flex min-w-0 flex-col gap-4">
        {parts.map((part) => part.kind === "text"
          ? <ChatMarkdown key={part.id} text={part.text} streaming={part.streaming} />
          : <ToolCalls key={part.id} locale={threadProps.locale} {...toolCallsProps} items={part.items} summary={part.summary} defaultOpen={part.defaultOpen} defaultExpandedIds={part.defaultExpandedIds} />)}
      </div>
    </ChatAssistantMessage>
  </ChatThread>;
}
