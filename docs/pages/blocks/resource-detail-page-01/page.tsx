import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ResourceDetailPageBlockDocClient } from "./ResourceDetailPageBlockDocClient";

export default function ResourceDetailPageBlockDoc() {
  return <ResourceDetailPageBlockDocClient code={getBlockPreviewSource("resource-detail-page-01")} />;
}
