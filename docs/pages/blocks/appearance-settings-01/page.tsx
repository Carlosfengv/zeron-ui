import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AppearanceSettingsBlockDocClient } from "./AppearanceSettingsBlockDocClient";

export default function AppearanceSettingsBlockDoc() {
  return <AppearanceSettingsBlockDocClient code={getBlockPreviewSource("appearance-settings-01")} />;
}
