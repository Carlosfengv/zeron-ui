import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ResourceMetricListBlockDocClient } from "./ResourceMetricListBlockDocClient";

export default async function ResourceMetricListBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/resource-metric-list-01/resource-metric-list.tsx"
    ),
    "utf8"
  );

  return <ResourceMetricListBlockDocClient code={code} />;
}
