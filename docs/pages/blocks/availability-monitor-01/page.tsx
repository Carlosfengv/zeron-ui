import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AvailabilityMonitorBlockDocClient } from "./AvailabilityMonitorBlockDocClient";

export default function AvailabilityMonitorBlockDoc() {
  return <AvailabilityMonitorBlockDocClient code={getBlockPreviewSource("availability-monitor-01")} />;
}
