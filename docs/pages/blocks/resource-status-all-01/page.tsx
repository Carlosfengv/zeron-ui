import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ResourceStatusAllBlockDocClient } from "./ResourceStatusAllBlockDocClient";

export default function ResourceStatusAllBlockDoc() {
  return <ResourceStatusAllBlockDocClient code={getBlockPreviewSource("resource-status-all-01")} />;
}
