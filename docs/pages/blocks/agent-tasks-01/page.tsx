import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AgentTasksBlockDocClient } from "./AgentTasksBlockDocClient";

export default function AgentTasksBlockDoc() {
  return <AgentTasksBlockDocClient code={getBlockPreviewSource("agent-tasks-01")} />;
}
