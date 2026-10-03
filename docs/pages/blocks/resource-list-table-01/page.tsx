import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ResourceListTableBlockDocClient } from "./ResourceListTableBlockDocClient";

export default function ResourceListTableBlockDoc() {
  return <ResourceListTableBlockDocClient code={getBlockPreviewSource("resource-list-table-01")} />;
}
