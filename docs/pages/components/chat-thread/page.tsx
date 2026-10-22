"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/app/_i18n/navigation";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ChatThreadExample, ChatThreadHistoryExample } from "./example";

const code = `"use client";
import { useRef, useState } from "react";
import { ChatThread, ChatUserMessage, ChatAssistantMessage, ChatMarkdown } from "@/components/ui/chat-thread";
import { InputMessage } from "@/components/ui/input-message";

export function Conversation() {
  const editor = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  return <div className="h-96 min-h-0">
    <ChatThread composerRef={editor} composer={
      <InputMessage layout="compact" textareaRef={editor} value={draft} onValueChange={setDraft}
        onSend={(text) => { setMessages((items) => [...items, { id: crypto.randomUUID(), text }]); setDraft(""); }} />
    }>
      {messages.map((message, index) => <ChatUserMessage key={message.id} id={message.id}
        text={message.text} pin={index === messages.length - 1} />)}
    </ChatThread>
  </div>;
}
// Use registered thread entries here; standalone ChatMessage does not register an ID.
// Render host replies with ChatAssistantMessage and ChatMarkdown.
// The interactive preview simulates streaming locally. Mount one Toaster at app level.`;

export default function ChatThreadDoc() {
  const t = useTranslations("chat-thread");
  return <DocPage title="ChatThread" slug="chat-thread" description={t("description")}>
    <DocSection title={t("boundary")}>
      <p className="text-body text-fg-muted">{t("boundaryBody")}</p>
      <Link href="/docs/components/chat-message" className="mt-3 inline-block text-body text-fg-default underline underline-offset-4">{t("messageLink")}</Link>
    </DocSection>
    <DocSection title={t("usage")}>
      <p className="mb-4 text-body text-fg-muted">{t("usageBody")}</p>
      <ComponentPreview code={code} padding="none" coverSource><ChatThreadExample /></ComponentPreview>
    </DocSection>
    <DocSection title={t("messages")}><p className="text-body text-fg-muted">{t("messagesBody")}</p></DocSection>
    <DocSection title={t("history")}><p className="text-body text-fg-muted">{t("historyBody")}</p></DocSection>
    <DocSection title={t("restore")}>
      <p className="mb-4 text-body text-fg-muted">{t("restoreBody")}</p>
      <ComponentPreview code={'<ChatThread hasOlder={hasOlder} onLoadOlder={loadOlder} onRestore={restore}\n  composerRef={editor} composer={composer}>\n  <ChatUserMessage id="question" text={text} checkpoint={{ id: "question", files: paths }} />\n</ChatThread>'} padding="none"><ChatThreadHistoryExample /></ComponentPreview>
    </DocSection>
    <DocSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></DocSection>
    <DocSection title={t("keyboard")}><p className="text-body text-fg-muted">{t("keyboardBody")}</p></DocSection>
    <DocSection title={t("aliases")}>
      <p className="mb-4 text-body text-fg-muted">{t("aliasesBody")}</p>
      <PropsTable props={[
        { name: "ChatAction", type: "ChatMessageAction", description: t("aliasAction") },
        { name: "ChatCopy", type: "ChatMessageCopy", description: t("aliasCopy") },
        { name: "ChatBranchSwitch", type: "ChatMessageBranchSwitch", description: t("aliasBranch") },
        { name: "ChatAttachments", type: "ChatMessageAttachments", description: t("aliasAttachments") },
        { name: "ChatEditor", type: "ChatMessageEditor", description: t("aliasEditor") },
        { name: "ChatFile / ChatBranch / ChatResponseMetrics", type: "ChatMessageFile / ChatMessageBranch / ChatMessageMetrics", description: t("aliasTypes") },
      ]} />
    </DocSection>
    <DocSection title={t("compatibility")}><p className="text-body text-fg-muted">{t("compatibilityBody")}</p></DocSection>
    <DocSection title={t("api")}><PropsTable props={[
      { name: "children", type: "ReactNode", description: t("apiMessages") },
      { name: "composer / empty", type: "ReactNode", description: t("apiComposer") },
      { name: "busy", type: "boolean", description: t("apiBusy") },
      { name: "hasOlder / loadingOlder / onLoadOlder", type: "boolean / boolean / () => void | Promise<void>", description: t("apiOlder") },
      { name: "onRestore", type: "(id, { code }) => void | ChatRestoreResult | Promise<void | ChatRestoreResult>", description: t("apiRestore") },
      { name: "composerRef", type: "RefObject<HTMLTextAreaElement | null>", description: t("apiFocus") },
      { name: "bookmarkedIds / onBookmarkChange / bookmarkLabels", type: "readonly string[] / (id, bookmarked) => void / Partial<MessageNavigationBookmarkLabels>", description: t("apiBookmarks") },
      { name: "labels / locale", type: "Partial<ChatThreadLabels> / string", description: t("apiLabels") },
    ]} /></DocSection>
  </DocPage>;
}
