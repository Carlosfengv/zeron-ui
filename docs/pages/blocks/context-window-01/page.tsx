import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ContextWindowBlockDocClient } from "./ContextWindowBlockDocClient";

export default function ContextWindowBlockDoc() {
  return <ContextWindowBlockDocClient code={getBlockPreviewSource("context-window-01")} />;
}
