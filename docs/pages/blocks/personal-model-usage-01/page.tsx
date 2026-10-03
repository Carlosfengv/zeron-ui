import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { PersonalModelUsageBlockDocClient } from "./PersonalModelUsageBlockDocClient";

export default function PersonalModelUsageBlockDoc() {
  return <PersonalModelUsageBlockDocClient code={getBlockPreviewSource("personal-model-usage-01")} />;
}
