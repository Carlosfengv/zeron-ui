import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ModelSelectorBlockDocClient } from "./ModelSelectorBlockDocClient";

export default function ModelSelectorBlockDoc() {
  return <ModelSelectorBlockDocClient code={getBlockPreviewSource("model-selector-01")} />;
}
