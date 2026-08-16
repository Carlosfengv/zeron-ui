import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ResourceCatalogBlockDocClient } from "./ResourceCatalogBlockDocClient";

export default async function ResourceCatalogBlockDoc() {
  const code = await readFile(
    join(process.cwd(), "packages/blocks/src/application/resource-catalog-01/resource-catalog.tsx"),
    "utf8"
  );

  return <ResourceCatalogBlockDocClient code={code} />;
}
