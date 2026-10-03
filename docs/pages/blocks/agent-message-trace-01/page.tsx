import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AgentMessageTraceBlockDocClient } from "./AgentMessageTraceBlockDocClient";

export default function AgentMessageTraceBlockDoc() {
  return <AgentMessageTraceBlockDocClient code={getBlockPreviewSource("agent-message-trace-01")} />;
}
