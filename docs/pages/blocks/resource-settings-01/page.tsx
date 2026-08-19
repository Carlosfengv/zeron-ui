import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ResourceSettingsBlockDocClient } from "./ResourceSettingsBlockDocClient";

export default async function ResourceSettingsBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/resource-settings-01/resource-settings.tsx"), "utf8");
  return <ResourceSettingsBlockDocClient code={code} />;
}
