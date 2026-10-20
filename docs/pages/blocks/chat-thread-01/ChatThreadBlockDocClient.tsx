"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ChatThreadDemo } from "@docs/components/blocks/ChatThreadDemo";
import { CodeBlock } from "@zeron/ui/code-block";

const example = `"use client";
import { useRef, useState } from "react";
import { ChatThread, ChatUserMessage, ChatAssistantMessage, ChatMarkdown }
  from "@/components/blocks/chat-thread-01";
import { InputMessage } from "@/components/ui/input-message";

export function Conversation() {
  const editor = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  return <div className="h-[640px]">
    <ChatThread composerRef={editor} composer={
      <InputMessage value={draft} onValueChange={setDraft}
        textareaRef={editor} layout="compact"
        onSend={(text) => {
          setMessages((items) => [...items, { id: crypto.randomUUID(), text }]);
          setDraft("");
        }} />
    }>
      {messages.map((message, index) =>
        <ChatUserMessage key={message.id} id={message.id}
          text={message.text} pin={index === messages.length - 1} />)}
    </ChatThread>
  </div>;
}
// Render server replies with ChatAssistantMessage and ChatMarkdown.
// Your host owns requests, streaming text, versions and persistence.\n`;

export function ChatThreadBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("chatThreadBlock");
  const rootProps = [
    { name: "children", type: "ReactNode", description: t("apiMessages") },
    {
      name: "composer / empty",
      type: "ReactNode",
      description: t("apiComposer"),
    },
    {
      name: "busy",
      type: "boolean",
      default: "false",
      description: t("apiBusy"),
    },
    {
      name: "hasOlder / loadingOlder / onLoadOlder",
      type: "boolean / boolean / () => void | Promise<void>",
      description: t("apiOlder"),
    },
    {
      name: "onRestore",
      type: "(id, { code }) => void | { undo? } | Promise<…>",
      description: t("apiRestore"),
    },
    {
      name: "bookmarkedIds / onBookmarkChange / bookmarkLabels",
      type: "readonly string[] / (messageId, bookmarked) => void / Partial<MessageNavigationBookmarkLabels>",
      description: t("apiBookmarks"),
    },
    {
      name: "composerRef",
      type: "RefObject<HTMLTextAreaElement | null>",
      description: t("apiFocus"),
    },
    {
      name: "labels / locale",
      type: "Partial<ChatThreadLabels> / string",
      description: t("apiLabels"),
    },
  ];
  return (
    <BlockDetailPage
      slug="chat-thread-01"
      title={t("title")}
      description={t("description")}
      code={code}
      preview={<ChatThreadDemo />}
    >
      <BlockDetailSection title={t("composition")}>
        <p className="text-body text-fg-muted">{t("compositionBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("usage")}>
        <p className="mb-3 text-body text-fg-muted">{t("usageBody")}</p>
        <CodeBlock file={{ name: "conversation.tsx", contents: example }} />
      </BlockDetailSection>
      <BlockDetailSection title={t("api")}>
        <PropsTable props={rootProps} />
        <p className="mt-4 text-body text-fg-muted">{t("messagesBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("history")}>
        <p className="text-body text-fg-muted">{t("historyBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("restore")}>
        <p className="text-body text-fg-muted">{t("restoreBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("keyboard")}>
        <p className="text-body text-fg-muted">{t("keyboardBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("demo")}>
        <p className="text-body text-fg-muted">{t("demoBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
