import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { MonitoringAlertListBlockDocClient } from "./MonitoringAlertListBlockDocClient";

export default function MonitoringAlertListBlockDoc() {
  return <MonitoringAlertListBlockDocClient code={getBlockPreviewSource("monitoring-alert-list-01")} />;
}
