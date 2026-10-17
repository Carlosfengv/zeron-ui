import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { LocalModelsBlockDocClient } from "./LocalModelsBlockDocClient";
export default function LocalModelsBlockDoc() {
  return <LocalModelsBlockDocClient code={getBlockPreviewSource("local-models-01")} />;
}
