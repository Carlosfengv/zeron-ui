import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { RuleFlowEditorBlockDocClient } from "./RuleFlowEditorBlockDocClient";

export default function RuleFlowEditorBlockDoc() {
  return <RuleFlowEditorBlockDocClient code={getBlockPreviewSource("rule-flow-editor-01")} />;
}
