import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ModelRouterBlockDocClient } from "./ModelRouterBlockDocClient";

export default function ModelRouterBlockDoc() {
  return <ModelRouterBlockDocClient code={getBlockPreviewSource("model-router-01")} />;
}
