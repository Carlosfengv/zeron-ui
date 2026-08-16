"use client";

import { useEffect, useState } from "react";
import { ChatMessage } from "@zeron/ui/chat-message";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useIcon } from "@zeron/icons/context";
import { cn } from "@zeron/ui/system/utils";
import { useTranslations } from "next-intl";

// Icon-only action buttons for the hover-revealed meta row. Assistant replies
// get copy + regenerate; user messages get copy + edit. Illustrative only —
// the buttons carry no behaviour in the docs demo.
function MessageActions({ from }: { from: "user" | "assistant" }) {
  const t = useTranslations("chatMessage");
  const CopyIcon = useIcon("copy");
  const SecondIcon = useIcon(from === "user" ? "pencil" : "rotate-ccw");
  const btn = cn(
    "inline-flex size-6 items-center justify-center text-fg-muted/60 hover:text-fg-default hover:bg-hover transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
    "rounded-lg"
  );
  return (
    <>
      <button type="button" aria-label={t("copy")} className={btn}>
        <CopyIcon size={13} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label={from === "user" ? t("edit") : t("regenerate")}
        className={btn}
      >
        <SecondIcon size={13} strokeWidth={1.5} />
      </button>
    </>
  );
}

const conversationCode = `import { ChatMessage } from "./components";
import { useIcon } from "@zeron/icons/context";

const Copy = useIcon("copy");
const RotateCcw = useIcon("rotate-ccw");

// Timestamp + icon buttons are revealed on hover; their height is always
// reserved, so the gap between bubbles never shifts. The timestamp is a
// user-message affordance — assistant replies show their actions alone.
const actions = (
  <>
    <button aria-label="Copy"><Copy size={13} strokeWidth={1.5} /></button>
    <button aria-label="Regenerate"><RotateCcw size={13} strokeWidth={1.5} /></button>
  </>
);

<div className="flex flex-col gap-2">
  <ChatMessage from="user" time="Wednesday 6:06 PM" actions={actions}>
    What does "good design" actually mean? Everyone says it, no one defines it.
  </ChatMessage>
  <ChatMessage from="assistant" actions={actions}>
    Good design is mostly invisible — you only notice it when it's missing. It's less about how something looks and more about how effortlessly it lets you do what you came to do.
  </ChatMessage>
  <ChatMessage from="user" time="Wednesday 6:07 PM" actions={actions}>
    So function over form?
  </ChatMessage>
  <ChatMessage from="assistant" actions={actions}>
    Not quite. Form is part of function — something that feels good to use is, in a real sense, working better. The split between the two is mostly a myth.
  </ChatMessage>
  <ChatMessage from="user" time="Wednesday 6:08 PM" actions={actions}>
    That reframes it completely.
  </ChatMessage>
</div>`;

const rolesCode = `import { ChatMessage } from "./components";

<div className="flex flex-col gap-2">
  <ChatMessage from="user">Right-aligned accent bubble.</ChatMessage>
  <ChatMessage from="assistant">Left-aligned, no background.</ChatMessage>
</div>`;

const attachmentsCode = `import { ChatMessage } from "./components";

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
      description="A single chat transcript entry with baked-in entrance and layout motion. Right-aligned accent bubble for the user, left-aligned plain text for the assistant, with optional file attachments and a hover-revealed meta row."
    >
      <DocSection title="Playground">
        <VariantPlayground
          minHeightClass="min-h-[180px]"
          variants={[
            {
              value: "conversation",
              label: "Conversation",
              code: conversationCode,
              preview: <div className="w-full max-w-xl flex flex-col gap-2"><ChatMessage from="user" time="Wednesday 6:06 PM" actions={<MessageActions from="user" />}>What does good design actually mean?</ChatMessage><ChatMessage from="assistant" actions={<MessageActions from="assistant" />}>Good design is mostly invisible — you notice it when it is missing.</ChatMessage></div>,
            },
            {
              value: "roles",
              label: "Roles",
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
              actions={<MessageActions from="user" />}
            >
              What does &ldquo;good design&rdquo; actually mean? Everyone says
              it, no one defines it.
            </ChatMessage>
            <ChatMessage
              from="assistant"
              actions={<MessageActions from="assistant" />}
            >
              Good design is mostly invisible — you only notice it when it&apos;s
              missing. It&apos;s less about how something looks and more about
              how effortlessly it lets you do what you came to do.
            </ChatMessage>
            <ChatMessage
              from="user"
              time="Wednesday 6:07 PM"
              actions={<MessageActions from="user" />}
            >
              So function over form?
            </ChatMessage>
            <ChatMessage
              from="assistant"
              actions={<MessageActions from="assistant" />}
            >
              Not quite. Form is part of function — something that feels good to
              use is, in a real sense, working better. The split between the two
              is mostly a myth.
            </ChatMessage>
            <ChatMessage
              from="user"
              time="Wednesday 6:08 PM"
              actions={<MessageActions from="user" />}
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

      <DocSection title={t("apiReference")}>
        <PropsTable props={localizedProps} />
      </DocSection>
    </DocPage>
  );
}
