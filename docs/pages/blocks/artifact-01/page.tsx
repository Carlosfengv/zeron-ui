import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ArtifactBlockDocClient } from "./ArtifactBlockDocClient";

export default function ArtifactBlockDoc() {
  return <ArtifactBlockDocClient code={getBlockPreviewSource("artifact-01")} />;
}
