import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ResourceSettingsBlockDocClient } from "./ResourceSettingsBlockDocClient";

export default function ResourceSettingsBlockDoc() {
  return <ResourceSettingsBlockDocClient code={getBlockPreviewSource("resource-settings-01")} />;
}
