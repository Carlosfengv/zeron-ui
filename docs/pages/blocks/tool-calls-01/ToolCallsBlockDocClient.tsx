"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ToolCallsDemo } from "@docs/components/blocks/ToolCallsDemo";
import { CodeBlock } from "@zeron/ui/code-block";

const example = `import { ToolCalls } from "@/components/blocks/tool-calls-01";
import { ChatThread, ChatUserMessage, ChatAssistantMessage }
  from "@/components/blocks/chat-thread-01";

// The host supplies call snapshots and commits execution decisions.
<ChatThread composer={composer}>
  <ChatUserMessage id="question" text="Check the search tests." />
  <ChatAssistantMessage id="answer" streaming={busy}>
    <ToolCalls items={calls}
      onApproval={(call, decision) => submitDecision(call.id, decision)}
      onRetry={(call) => retryTool(call.id)} />
  </ChatAssistantMessage>
</ChatThread>`;

export function ToolCallsBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("toolCallsBlock");
  return <BlockDetailPage slug="tool-calls-01" title={t("title")} description={t("description")} code={code} preview={<ToolCallsDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("usage")}><CodeBlock file={{ name: "tool-calls-example.tsx", contents: example }} /></BlockDetailSection>
    <BlockDetailSection title={t("api")}><PropsTable props={[
      { name: "ToolCalls.items", type: "readonly ToolCall[]", description: t("itemsProp") },
      { name: "summary / defaultOpen", type: "string / boolean", default: "false", description: t("summaryProp") },
      { name: "expandedIds / defaultExpandedIds / onExpandedChange", type: "readonly string[] / readonly string[] / (ids: string[]) => void", description: t("expandedProp") },
      { name: "onApproval / onRetry", type: "(call, decision) => void | Promise<void> / (call) => void | Promise<void>", description: t("actionsProp") },
      { name: "labels / locale", type: "Partial<ToolCallsLabels> / string", description: t("labelsProp") },
      { name: "ToolCallsThread.prompt / parts", type: "string / readonly ToolCallsPart[]", description: t("threadProp") },
      { name: "composer / userMessageProps / assistantMessageProps / toolCallsProps", type: "ReactNode / ChatUserMessageProps / ChatAssistantMessageProps / ToolCallsProps", description: t("identityProp") },
    ]} /></BlockDetailSection>
    <BlockDetailSection title={t("demo")}><p className="text-body text-fg-muted">{t("demoBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
