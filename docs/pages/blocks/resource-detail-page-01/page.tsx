import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ResourceDetailPageBlockDocClient } from "./ResourceDetailPageBlockDocClient";

export default async function ResourceDetailPageBlockDoc() {
  const [componentCode, dataCode] = await Promise.all([
    readFile(
      join(
        process.cwd(),
        "packages/blocks/src/application/resource-detail-page-01/resource-detail-page.tsx"
      ),
      "utf8"
    ),
    readFile(
      join(
        process.cwd(),
        "packages/blocks/src/application/resource-detail-page-01/resource-detail-page-data.ts"
      ),
      "utf8"
    ),
  ]);

  return (
    <ResourceDetailPageBlockDocClient code={`${componentCode}\n\n${dataCode}`} />
  );
}
