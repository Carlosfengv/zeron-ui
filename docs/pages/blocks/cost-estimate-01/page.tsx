import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { CostEstimateBlockDocClient } from "./CostEstimateBlockDocClient";
export default function CostEstimateBlockDoc() { return <CostEstimateBlockDocClient code={getBlockPreviewSource("cost-estimate-01")} />; }
