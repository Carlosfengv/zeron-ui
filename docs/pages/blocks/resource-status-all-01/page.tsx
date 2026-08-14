import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ResourceStatusAllBlockDocClient } from "./ResourceStatusAllBlockDocClient";

export default async function ResourceStatusAllBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/resource-status-all-01/resource-status-all.tsx"
    ),
    "utf8"
  );

  return <ResourceStatusAllBlockDocClient code={code} />;
}
