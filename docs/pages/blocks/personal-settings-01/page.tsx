import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { PersonalSettingsBlockDocClient } from "./PersonalSettingsBlockDocClient";

export default function PersonalSettingsBlockDoc() {
  return <PersonalSettingsBlockDocClient code={getBlockPreviewSource("personal-settings-01")} />;
}
