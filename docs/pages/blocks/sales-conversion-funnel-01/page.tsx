import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { SalesConversionFunnelBlockDocClient } from "./SalesConversionFunnelBlockDocClient";

export default function SalesConversionFunnelBlockDoc() {
  return <SalesConversionFunnelBlockDocClient code={getBlockPreviewSource("sales-conversion-funnel-01")} />;
}
