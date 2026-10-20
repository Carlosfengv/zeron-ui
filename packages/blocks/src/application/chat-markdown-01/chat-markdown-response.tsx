"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { ChatMessage, ChatMessageCopy, type ChatMessageCopyProps } from "@zeron/ui/chat-message";
import { Markdown, type MarkdownProps } from "@zeron/ui/markdown";
import { cn } from "@zeron/ui/system/utils";

export interface ChatMarkdownResponseProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Accumulated response text. The host owns generation and cancellation. */
  text: string;
  streaming?: boolean;
  streamingLabel?: string;
  /** Optional identity, for example ChatMessageAuthor. */
  author?: ReactNode;
  /** Overrides the default copy action; null hides actions. Hidden while streaming. */
  actions?: ReactNode;
  copyLabels?: ChatMessageCopyProps["labels"];
  codeVariant?: MarkdownProps["codeVariant"];
  codeMessages?: MarkdownProps["codeMessages"];
  footnoteLabel?: string;
  footnoteBackLabel?: string;
  components?: MarkdownProps["components"];
}

/** One readable assistant response; the host owns its scroll container. */
export function ChatMarkdownResponse({
  text,
  streaming = false,
  streamingLabel,
  author,
  actions,
  copyLabels,
  codeVariant,
  codeMessages,
  footnoteLabel,
  footnoteBackLabel,
  components,
  className,
  ...props
}: ChatMarkdownResponseProps) {
  const showActions = !streaming && text.trim().length > 0;
  const responseActions = actions === undefined ? <ChatMessageCopy text={text} labels={copyLabels} /> : actions;
  return (
    <article {...props} data-slot="chat-markdown-response" aria-busy={streaming} className={cn("mx-auto w-full min-w-0 max-w-3xl", className)}>
      <ChatMessage
        from="assistant"
        header={author}
        actionsVisibility="always"
        actions={showActions ? responseActions : undefined}
      >
        <Markdown
          text={text}
          streaming={streaming}
          streamingLabel={streamingLabel}
          codeVariant={codeVariant}
          codeMessages={codeMessages}
          footnoteLabel={footnoteLabel}
          footnoteBackLabel={footnoteBackLabel}
          components={components}
        />
      </ChatMessage>
    </article>
  );
}
