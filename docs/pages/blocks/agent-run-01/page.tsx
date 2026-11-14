import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AgentRunBlockDocClient } from "./AgentRunBlockDocClient";

export default function AgentRunBlockDocPage() {
  return <AgentRunBlockDocClient code={getBlockPreviewSource("agent-run-01")} />;
}
