import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ChatWorkspaceBlockDocClient } from "./ChatWorkspaceBlockDocClient";

export default function ChatWorkspaceBlockDoc() {
  return <ChatWorkspaceBlockDocClient code={getBlockPreviewSource("chat-workspace-01")} />;
}
