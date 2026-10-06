import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { SupportAnalyticsBlockDocClient } from "./SupportAnalyticsBlockDocClient";

export default function SupportAnalyticsBlockDoc() {
  return <SupportAnalyticsBlockDocClient code={getBlockPreviewSource("support-analytics-01")} />;
}
