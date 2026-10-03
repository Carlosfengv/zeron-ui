import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { TrafficRulesBlockDocClient } from "./TrafficRulesBlockDocClient";

export default function TrafficRulesBlockDoc() {
  return <TrafficRulesBlockDocClient code={getBlockPreviewSource("traffic-rules-01")} />;
}
