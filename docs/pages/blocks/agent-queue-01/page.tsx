import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AgentQueueBlockDocClient } from "./AgentQueueBlockDocClient";

export default function AgentQueueBlockDoc() {
  return <AgentQueueBlockDocClient code={getBlockPreviewSource("agent-queue-01")} />;
}
