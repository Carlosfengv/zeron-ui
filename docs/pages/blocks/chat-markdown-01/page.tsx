import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ChatMarkdownBlockDocClient } from "./ChatMarkdownBlockDocClient";

export default function ChatMarkdownBlockDoc() {
  return <ChatMarkdownBlockDocClient code={getBlockPreviewSource("chat-markdown-01")} />;
}
