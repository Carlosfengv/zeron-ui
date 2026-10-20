"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChatMessage,
  ChatMessageAction,
  ChatMessageAttachments,
  ChatMessageBranchSwitch,
  ChatMessageCopy,
  ChatMessageEditor,
  ChatMessageMeta,
  ChatMessageAuthor,
} from "@zeron/ui/chat-message";
import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import { useIcon } from "@zeron/ui/system/icon-context";

/** Deliberately independent of ChatThread: the application owns message versions. */
export function MessagePartsExample() {
  const locale = useLocale();
  const t = useTranslations("chatMessage");
  const [versions, setVersions] = useState([t("sampleMessage"), t("sampleRevision")]);
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const Edit = useIcon("pencil");
  const labels = {
    edit: t("edit"), cancel: t("cancel"), save: t("save"), saveFailed: t("saveFailed"),
    copy: t("copy"), copied: t("copied"), copyFailed: t("copyFailed"),
    previous: t("previous"), next: t("next"),
    version: (active: number, count: number) => t("version", { active, count }),
  };
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      {editing ? (
        <ChatMessageEditor
          text={versions[index]}
          labels={labels}
          onCancel={() => setEditing(false)}
          onSave={(text) => {
            setVersions([...versions, text]);
            setIndex(versions.length);
          }}
        />
      ) : (
        <ChatMessage
          from="user"
          actionsVisibility="always"
          attachments={<ChatMessageAttachments label={t("attachments")} files={[{ id: "brief", name: "design-brief.md", size: 2304 }]} />}
          actions={<>
            <ChatMessageCopy text={versions[index]} labels={labels} />
            <ChatMessageAction label={labels.edit} onClick={() => setEditing(true)}><Edit /></ChatMessageAction>
            <ChatMessageBranchSwitch branch={{ index, count: versions.length, onChange: setIndex }} labels={labels} />
          </>}
        >
          {versions[index]}
        </ChatMessage>
      )}
      <ChatMessage from="assistant" actionsVisibility="always"
        header={<ChatMessageAuthor model="Sonnet 5.5" logo={<ClaudeColor size={16} />} provider="Anthropic" />}
        actions={<ChatMessageCopy text={t("sampleReply")} labels={labels} />}
        meta={<ChatMessageMeta locale={locale} metrics={{ ttftMs: 420, inputTokens: 1248, outputTokens: 286, durationMs: 6820 }} />}
      >{t("sampleReply")}</ChatMessage>
    </div>
  );
}
