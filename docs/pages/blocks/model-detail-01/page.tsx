import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ModelDetailBlockDocClient } from "./ModelDetailBlockDocClient";

export default function ModelDetailBlockDoc() {
  return <ModelDetailBlockDocClient code={getBlockPreviewSource("model-detail-01")} />;
}
