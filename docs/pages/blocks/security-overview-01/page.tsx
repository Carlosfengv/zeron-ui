import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { SecurityOverviewBlockDocClient } from "./SecurityOverviewBlockDocClient";

export default function SecurityOverviewBlockDoc() {
  return <SecurityOverviewBlockDocClient code={getBlockPreviewSource("security-overview-01")} />;
}
