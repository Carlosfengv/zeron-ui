import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { InspectionReportListBlockDocClient } from "./InspectionReportListBlockDocClient";

export default function InspectionReportListBlockDoc() {
  return <InspectionReportListBlockDocClient code={getBlockPreviewSource("inspection-report-list-01")} />;
}
