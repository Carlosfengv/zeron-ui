import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { UsageTimelineBlockDocClient } from "./UsageTimelineBlockDocClient";

export default function UsageTimelineBlockDoc() {
  return <UsageTimelineBlockDocClient code={getBlockPreviewSource("usage-timeline-01")} />;
}
