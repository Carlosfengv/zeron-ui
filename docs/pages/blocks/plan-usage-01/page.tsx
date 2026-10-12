import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { PlanUsageBlockDocClient } from "./PlanUsageBlockDocClient";

export default function PlanUsageBlockDoc() {
  return <PlanUsageBlockDocClient code={getBlockPreviewSource("plan-usage-01")} />;
}
