import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { InspectionReportListBlockDocClient } from "./InspectionReportListBlockDocClient";

export default async function InspectionReportListBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/inspection-report-list-01/inspection-report-list.tsx"), "utf8");
  return <InspectionReportListBlockDocClient code={code} />;
}
