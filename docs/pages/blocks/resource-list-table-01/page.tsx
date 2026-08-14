import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ResourceListTableBlockDocClient } from "./ResourceListTableBlockDocClient";

export default async function ResourceListTableBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/resource-list-table-01/resource-list-table.tsx"
    ),
    "utf8"
  );

  return <ResourceListTableBlockDocClient code={code} />;
}
