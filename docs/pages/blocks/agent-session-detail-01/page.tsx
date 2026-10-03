import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AgentSessionDetailBlockDocClient } from "./AgentSessionDetailBlockDocClient";

export default function AgentSessionDetailBlockDoc() {
  return <AgentSessionDetailBlockDocClient code={getBlockPreviewSource("agent-session-detail-01")} />;
}
