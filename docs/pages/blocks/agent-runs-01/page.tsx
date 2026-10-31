import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AgentRunsBlockDocClient } from "./AgentRunsBlockDocClient";

export default function AgentRunsBlockDoc() {
  return (
    <AgentRunsBlockDocClient code={getBlockPreviewSource("agent-runs-01")} />
  );
}
