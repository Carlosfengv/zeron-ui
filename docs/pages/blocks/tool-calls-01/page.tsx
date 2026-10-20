import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ToolCallsBlockDocClient } from "./ToolCallsBlockDocClient";

export default function ToolCallsBlockDoc() {
  return <ToolCallsBlockDocClient code={getBlockPreviewSource("tool-calls-01")} />;
}
