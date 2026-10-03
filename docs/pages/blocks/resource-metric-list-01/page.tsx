import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ResourceMetricListBlockDocClient } from "./ResourceMetricListBlockDocClient";

export default function ResourceMetricListBlockDoc() {
  return <ResourceMetricListBlockDocClient code={getBlockPreviewSource("resource-metric-list-01")} />;
}
