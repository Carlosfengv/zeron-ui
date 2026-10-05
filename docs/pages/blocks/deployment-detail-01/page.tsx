import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { DeploymentDetailBlockDocClient } from "./DeploymentDetailBlockDocClient";

export default function DeploymentDetailBlockDoc() {
  return <DeploymentDetailBlockDocClient code={getBlockPreviewSource("deployment-detail-01")} />;
}
