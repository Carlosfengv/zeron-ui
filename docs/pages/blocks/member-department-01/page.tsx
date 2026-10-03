import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { MemberDepartmentBlockDocClient } from "./MemberDepartmentBlockDocClient";

export default function MemberDepartmentBlockDoc() {
  return <MemberDepartmentBlockDocClient code={getBlockPreviewSource("member-department-01")} />;
}
