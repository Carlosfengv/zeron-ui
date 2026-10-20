"use client";

import { Markdown } from "@zeron/ui/markdown";
import { useThread } from "./chat-thread-context";

/** Thread-local labels around the standalone Markdown component. */
export function ChatMarkdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  const { labels } = useThread();
  return <Markdown text={text} streaming={streaming} streamingLabel={labels.streaming} />;
}
