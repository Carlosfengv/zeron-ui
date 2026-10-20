import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ChatThreadBlockDocClient } from "./ChatThreadBlockDocClient";

export default function ChatThreadBlockDoc() {
  return (
    <ChatThreadBlockDocClient code={getBlockPreviewSource("chat-thread-01")} />
  );
}
