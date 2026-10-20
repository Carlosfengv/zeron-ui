import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { GroupedDataTableBlockDocClient } from "./GroupedDataTableBlockDocClient";

export default function GroupedDataTableBlockDoc() {
  return <GroupedDataTableBlockDocClient code={getBlockPreviewSource("grouped-data-table-01")} />;
}
