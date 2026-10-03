import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { CreditUsageBlockDocClient } from "./CreditUsageBlockDocClient";

export default function CreditUsageBlockDoc() {
  return <CreditUsageBlockDocClient code={getBlockPreviewSource("credit-usage-01")} />;
}
