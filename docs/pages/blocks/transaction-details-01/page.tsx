import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { TransactionDetailsBlockDocClient } from "./TransactionDetailsBlockDocClient";

export default function TransactionDetailsBlockDoc() {
  return <TransactionDetailsBlockDocClient code={getBlockPreviewSource("transaction-details-01")} />;
}
