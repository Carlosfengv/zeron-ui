import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { StorageUsageBlockDocClient } from "./StorageUsageBlockDocClient";

export default async function StorageUsageBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/storage-usage-01/storage-usage.tsx"), "utf8");
  return <StorageUsageBlockDocClient code={code} />;
}
