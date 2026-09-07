import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MemberDepartmentBlockDocClient } from "./MemberDepartmentBlockDocClient";

export default async function MemberDepartmentBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/member-department-01/member-department.tsx"
    ),
    "utf8"
  );

  return <MemberDepartmentBlockDocClient code={code} />;
}
