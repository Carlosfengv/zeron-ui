import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ClusterEnvironmentListBlockDocClient } from "./ClusterEnvironmentListBlockDocClient";

export default function ClusterEnvironmentListBlockDoc() {
  return <ClusterEnvironmentListBlockDocClient code={getBlockPreviewSource("cluster-environment-list-01")} />;
}
