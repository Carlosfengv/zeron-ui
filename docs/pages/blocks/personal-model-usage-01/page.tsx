import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PersonalModelUsageBlockDocClient } from "./PersonalModelUsageBlockDocClient";

export default async function PersonalModelUsageBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/personal-model-usage-01/personal-model-usage.tsx"), "utf8");
  return <PersonalModelUsageBlockDocClient code={code} />;
}
