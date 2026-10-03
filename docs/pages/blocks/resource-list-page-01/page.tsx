import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ResourceListPageBlockDocClient } from "./ResourceListPageBlockDocClient";

export default function ResourceListPageBlockDoc() {
  return <ResourceListPageBlockDocClient code={getBlockPreviewSource("resource-list-page-01")} />;
}
