import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { SectionedDataTableBlockDocClient } from "./SectionedDataTableBlockDocClient";

export default function SectionedDataTableBlockDoc() {
  return <SectionedDataTableBlockDocClient code={getBlockPreviewSource("grouped-data-table-02")} />;
}
