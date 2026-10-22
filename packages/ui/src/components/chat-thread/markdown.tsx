"use client";

import { Markdown } from "#components/markdown";
import { useThread } from "./context";

/** Thread-local labels around the standalone Markdown component. */
export function ChatMarkdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  const { labels } = useThread();
  return <Markdown text={text} streaming={streaming} streamingLabel={labels.streaming} />;
}
