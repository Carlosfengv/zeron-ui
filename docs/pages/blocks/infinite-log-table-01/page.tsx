import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { InfiniteLogTableBlockDocClient } from "./InfiniteLogTableBlockDocClient";

export default function InfiniteLogTableBlockDoc() {
  return <InfiniteLogTableBlockDocClient code={getBlockPreviewSource("infinite-log-table-01")} />;
}
