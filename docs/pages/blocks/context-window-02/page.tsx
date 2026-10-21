import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ContextWindowCompactBlockDocClient } from "./ContextWindowCompactBlockDocClient";

export default function ContextWindowCompactBlockDoc() {
  return <ContextWindowCompactBlockDocClient code={getBlockPreviewSource("context-window-02")} />;
}
