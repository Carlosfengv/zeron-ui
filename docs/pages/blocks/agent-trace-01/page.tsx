import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AgentTraceBlockDocClient } from "./AgentTraceBlockDocClient";

export default function AgentTraceBlockDoc() {
  return <AgentTraceBlockDocClient code={getBlockPreviewSource("agent-trace-01")} />;
}
