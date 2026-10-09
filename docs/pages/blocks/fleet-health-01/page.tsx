import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { FleetHealthBlockDocClient } from "./FleetHealthBlockDocClient";

export default function FleetHealthBlockDoc() {
  return <FleetHealthBlockDocClient code={getBlockPreviewSource("fleet-health-01")} />;
}
