import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ResourceCatalogBlockDocClient } from "./ResourceCatalogBlockDocClient";

export default function ResourceCatalogBlockDoc() {
  return <ResourceCatalogBlockDocClient code={getBlockPreviewSource("resource-catalog-01")} />;
}
