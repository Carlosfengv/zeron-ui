import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ResourceCostBlockDocClient } from "./ResourceCostBlockDocClient";

export default function ResourceCostBlockDoc() {
  return <ResourceCostBlockDocClient code={getBlockPreviewSource("resource-cost-01")} />;
}
