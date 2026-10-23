import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { CreditTopUpBlockDocClient } from "./CreditTopUpBlockDocClient";

export default function CreditTopUpBlockDoc() {
  return <CreditTopUpBlockDocClient code={getBlockPreviewSource("credit-top-up-01")} />;
}
