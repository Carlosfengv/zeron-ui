import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { StorageUsageBlockDocClient } from "./StorageUsageBlockDocClient";

export default function StorageUsageBlockDoc() {
  return <StorageUsageBlockDocClient code={getBlockPreviewSource("storage-usage-01")} />;
}
