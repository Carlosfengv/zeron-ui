import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ProviderCreateFormBlockDocClient } from "./ProviderCreateFormBlockDocClient";

export default function ProviderCreateFormBlockDoc() {
  return <ProviderCreateFormBlockDocClient code={getBlockPreviewSource("provider-create-form-01")} />;
}
