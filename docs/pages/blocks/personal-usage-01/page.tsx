import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { PersonalUsageBlockDocClient } from "./PersonalUsageBlockDocClient";

export default function PersonalUsageBlockDoc() {
  return <PersonalUsageBlockDocClient code={getBlockPreviewSource("personal-usage-01")} />;
}
