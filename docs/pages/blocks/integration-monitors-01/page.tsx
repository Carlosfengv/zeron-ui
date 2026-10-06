import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { IntegrationMonitorsBlockDocClient } from "./IntegrationMonitorsBlockDocClient";

export default function IntegrationMonitorsBlockDoc() {
  return <IntegrationMonitorsBlockDocClient code={getBlockPreviewSource("integration-monitors-01")} />;
}
