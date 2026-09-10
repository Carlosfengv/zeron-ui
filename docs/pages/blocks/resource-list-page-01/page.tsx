import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ResourceListPageBlockDocClient } from "./ResourceListPageBlockDocClient";

export default async function ResourceListPageBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/resource-list-page-01/resource-list-page.tsx"
    ),
    "utf8"
  );

  return <ResourceListPageBlockDocClient code={code} />;
}
