import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ClusterEnvironmentDetailBlockDocClient } from "./ClusterEnvironmentDetailBlockDocClient";

export default function ClusterEnvironmentDetailBlockDoc() {
  return <ClusterEnvironmentDetailBlockDocClient code={getBlockPreviewSource("cluster-environment-detail-01")} />;
}
