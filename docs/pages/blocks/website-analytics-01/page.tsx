import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { WebsiteAnalyticsBlockDocClient } from "./WebsiteAnalyticsBlockDocClient";

export default function WebsiteAnalyticsBlockDoc() {
  return <WebsiteAnalyticsBlockDocClient code={getBlockPreviewSource("website-analytics-01")} />;
}
