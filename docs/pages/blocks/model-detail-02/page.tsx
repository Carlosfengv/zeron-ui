import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ModelDetail02BlockDocClient } from "./ModelDetail02BlockDocClient";

export default function ModelDetail02BlockDoc() {
  return <ModelDetail02BlockDocClient code={getBlockPreviewSource("model-detail-02")} />;
}
