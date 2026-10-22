"use client";

import { useEffect, useState } from "react";
import { ChatMessage, ChatMessageCopy } from "@zeron/ui/chat-message";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { MessagePartsExample } from "./message-parts-example";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";
import { Link } from "@/app/_i18n/navigation";

function MessageActions({ text }: { text: string }) {
  const t = useTranslations("chatMessage");
  return <ChatMessageCopy text={text} labels={{ copy: t("copy"), copied: t("copied"), copyFailed: t("copyFailed") }} />;
}

const conversationCode = `// Standalone messages: no thread Provider, scrolling or history management.
import { ChatMessage, ChatMessageCopy } from "@/components/ui/chat-message";

<ChatMessage from="user" time="Wednesday 6:06 PM" actions={<ChatMessageCopy text="What does good design mean?" />}>
  What does good design mean?
</ChatMessage>
<ChatMessage from="assistant" actions={<ChatMessageCopy text="Good design makes a task feel effortless." />}>
  Good design makes a task feel effortless.
</ChatMessage>`;

const partsCode = `import { ChatMessage, ChatMessageAction, ChatMessageAttachments,
  ChatMessageBranchSwitch, ChatMessageCopy, ChatMessageEditor, ChatMessageAuthor, ChatMessageMeta } from "@/components/ui/chat-message";
import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";

// The host owns text, version contents, persistence and editor visibility.
<ChatMessage from="user" actionsVisibility="always"
  attachments={<ChatMessageAttachments files={attachments} />}
  actions={<>
    <ChatMessageCopy text={text} />
    <ChatMessageAction label="Edit" onClick={() => setEditing(true)}><EditIcon /></ChatMessageAction>
    <ChatMessageBranchSwitch branch={{ index, count: versions.length, onChange: setIndex }} />
  </>}>
  {text}
</ChatMessage>

{editing && <ChatMessageEditor text={text} onSave={saveMessage} onCancel={() => setEditing(false)} />}

<ChatMessage from="assistant" actionsVisibility="always"
  header={<ChatMessageAuthor model="Sonnet 5.5" logo={<ClaudeColor size={16} />} provider="Anthropic" />}
  actions={<ChatMessageCopy text={reply} />}
  meta={<ChatMessageMeta metrics={metrics} />}>
  {reply}
</ChatMessage>`;

const statusCode = `import { ChatMessage } from "@zeron/ui/chat-message";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";

<ChatMessage from="assistant">
  {partialReply}
  <div className="mt-3">
    <InlineNotice role="alert" variant="emphasized" tone="danger">
      <InlineNoticeContent>{error}</InlineNoticeContent>
    </InlineNotice>
  </div>
</ChatMessage>`;

const rolesCode = `import { ChatMessage } from "@/components/ui/chat-message";

<div className="flex flex-col gap-2">
  <ChatMessage from="user">Right-aligned accent bubble.</ChatMessage>
  <ChatMessage from="assistant">Left-aligned, no background.</ChatMessage>
</div>`;

const attachmentsCode = `import { ChatMessage } from "@/components/ui/chat-message";

// \`files\` is a standard File[] — e.g. straight from InputMessage's onSend.
<ChatMessage from="user" files={files}>
  Can you use this as my new avatar?
</ChatMessage>`;

const chatMessageProps: PropDef[] = [
  { name: "from", type: '"user" | "assistant"', description: "Who sent the message. `user` renders a right-aligned accent bubble; `assistant` renders left-aligned plain text with no background. Also sets the entrance transform-origin." },
  { name: "children", type: "ReactNode", description: "Message body. For the user it renders inside the bubble; for the assistant it renders as plain text. When omitted (attachment-only message) the body is dropped and only the thumbnails show." },
  { name: "time", type: "ReactNode", description: "Timestamp shown before the actions in the hover-revealed meta row. User-message only — ignored on assistant replies. Caller pre-formats it, e.g. \"Wednesday 6:08 PM\"." },
  { name: "actions", type: "ReactNode", description: "Icon-only action buttons (copy, edit, regenerate, …) shown next to the timestamp in the hover-revealed meta row. The row's height is always reserved, so revealing it never shifts the layout." },
  { name: "files", type: "File[]", description: "Optional attachments rendered as square thumbnails above the bubble. Images use object-cover; PDFs render their first page via pdfjs." },
  { name: "thumbnailSize", type: "number", default: "64", description: "Side length (in pixels) of each attachment thumbnail." },
  { name: "className", type: "string", description: "Merged onto the outer motion wrapper. Useful for tweaking max-width or spacing." },
  { name: "attachments", type: "ReactNode", description: "Custom attachment content, including persisted remote files." },
  { name: "actionsVisibility", type: '"auto" | "always"', default: '"auto"', description: "Keep the latest reply actions visible." },
  { name: "meta", type: "ReactNode", description: "Additional metadata beside actions, with shared spacing, wrapping and visibility." },
  { name: "header", type: "ReactNode", description: "Persistent identity above the message content, composed with ChatMessageAuthor." },
];

export default function ChatMessageDoc() {
  const t = useTranslations("chatMessage");
  const localizedProps = chatMessageProps.map((prop, index) => ({ ...prop, description: t(`p${index}`) }));
  // A real File so the attachments demo renders an actual thumbnail. Fetched
  // from the public profile image at mount and wrapped as a File.
  const [sampleFiles, setSampleFiles] = useState<File[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/sample-avatar.png")
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        setSampleFiles([
          new File([blob], "sample-avatar.png", { type: blob.type || "image/png" }),
        ]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DocPage
      title="ChatMessage"
      slug="chat-message"
      description={t("description")}
    >
      <DocSection title={t("boundary")}>
        <p className="text-body text-fg-muted">{t("boundaryBody")}</p>
        <Link href="/docs/components/chat-thread" className="mt-3 inline-block text-body text-fg-default underline underline-offset-4">{t("threadLink")}</Link>
      </DocSection>
      <DocSection title="Playground">
        <VariantPlayground
          minHeightClass="min-h-[180px]"
          variants={[
            {
              value: "conversation",
              label: t("conversation"),
              code: conversationCode,
              preview: <div className="w-full max-w-xl flex flex-col gap-2"><ChatMessage from="user" time="Wednesday 6:06 PM" actions={<MessageActions text={"What does good design actually mean?"} />}>What does good design actually mean?</ChatMessage><ChatMessage from="assistant" actions={<MessageActions text={"Good design is mostly invisible — you notice it when it is missing."} />}>Good design is mostly invisible — you notice it when it is missing.</ChatMessage></div>,
            },
            {
              value: "roles",
              label: t("roles"),
              code: rolesCode,
              preview: <div className="w-full max-w-xl flex flex-col gap-2"><ChatMessage from="user">Right-aligned accent bubble.</ChatMessage><ChatMessage from="assistant">Left-aligned, no background.</ChatMessage></div>,
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("conversation")}>
        <ComponentPreview code={conversationCode} minHeightClass="min-h-[220px]">
          <div className="w-full max-w-xl flex flex-col gap-2">
            <ChatMessage
              from="user"
              time="Wednesday 6:06 PM"
              actions={<MessageActions text={"What does “good design” actually mean? Everyone says it, no one defines it."} />}
            >
              What does &ldquo;good design&rdquo; actually mean? Everyone says
              it, no one defines it.
            </ChatMessage>
            <ChatMessage
              from="assistant"
              actions={<MessageActions text={"Good design is mostly invisible — you only notice it when it’s missing. It’s less about how something looks and more about how effortlessly it lets you do what you came to do."} />}
            >
              Good design is mostly invisible — you only notice it when it&apos;s
              missing. It&apos;s less about how something looks and more about
              how effortlessly it lets you do what you came to do.
            </ChatMessage>
            <ChatMessage
              from="user"
              time="Wednesday 6:07 PM"
              actions={<MessageActions text={"So function over form?"} />}
            >
              So function over form?
            </ChatMessage>
            <ChatMessage
              from="assistant"
              actions={<MessageActions text={"Not quite. Form is part of function — something that feels good to use is, in a real sense, working better. The split between the two is mostly a myth."} />}
            >
              Not quite. Form is part of function — something that feels good to
              use is, in a real sense, working better. The split between the two
              is mostly a myth.
            </ChatMessage>
            <ChatMessage
              from="user"
              time="Wednesday 6:08 PM"
              actions={<MessageActions text={"That reframes it completely."} />}
            >
              That reframes it completely.
            </ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("roles")}>
        <ComponentPreview code={rolesCode} minHeightClass="min-h-[160px]">
          <div className="w-full max-w-xl flex flex-col gap-2">
            <ChatMessage from="user">Right-aligned accent bubble.</ChatMessage>
            <ChatMessage from="assistant">Left-aligned, no background.</ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("attachments")}>
        <ComponentPreview code={attachmentsCode} minHeightClass="min-h-[200px]">
          <div className="w-full max-w-xl flex flex-col gap-2">
            <ChatMessage from="user" files={sampleFiles}>
              Can you use this as my new avatar?
            </ChatMessage>
            <ChatMessage from="assistant">
              Looks great — it&apos;ll crop cleanly into the circle.
            </ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("parts")}>
        <p className="mb-3 text-body text-fg-muted">{t("partsBody")}</p>
        <ComponentPreview code={partsCode}><MessagePartsExample /></ComponentPreview>
      </DocSection>

      <DocSection title={t("statuses")}>
        <p className="mb-3 text-body text-fg-muted">{t("statusesBody")}</p>
        <ComponentPreview code={statusCode}>
          <div className="flex w-full max-w-xl flex-col gap-4">
            <ChatMessage from="assistant">
              {t("sampleReply")}
              <div className="mt-3">
                <InlineNotice role="alert" variant="emphasized" tone="danger">
                  <InlineNoticeContent>{t("sampleError")}</InlineNoticeContent>
                </InlineNotice>
              </div>
            </ChatMessage>
            <ChatMessage from="assistant">
              <InlineNotice><InlineNoticeContent>{t("sampleStopped")}</InlineNoticeContent></InlineNotice>
            </ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={localizedProps} />
        <h3 className="mb-2 mt-6 text-body font-semibold">{t("partsApi")}</h3>
        <PropsTable props={[
          { name: "ChatMessageAction", type: "label / children / onClick / pressed? / disabled?", description: t("actionProp") },
          { name: "ChatMessageCopy", type: "text / disabled? / labels?", description: t("copyProp") },
          { name: "ChatMessageAttachments", type: 'files: readonly (ChatMessageFile | File)[] / thumbnailSize? / align?: "start" | "end" / label?', description: t("filesProp") },
          { name: "ChatMessageMeta", type: "model? / metrics? / locale? / labels?", description: t("metaProp") },
          { name: "ChatMessageAuthor", type: "model? / logo? / provider?", description: t("authorProp") },
          { name: "ChatMessageEditor", type: "text / onSave: (text) => void | Promise<void> / onCancel / disabled? / labels?", description: t("editorProp") },
          { name: "ChatMessageBranchSwitch", type: "branch: ChatMessageBranch / disabled? / labels?", description: t("branchProp") },
        ]} />
      </DocSection>
      <DocSection title={t("conversationUtilities")}>
        <p className="mb-3 text-body text-fg-muted">{t("conversationUtilitiesBody")}</p>
        <PropsTable props={[
          { name: "ChatScrollToLatest", type: "onClick / locale? / label? / disabled? / className?", description: t("latestProp") },
        ]} />
      </DocSection>
    </DocPage>
  );
}
