import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PersonalUsageBlockDocClient } from "./PersonalUsageBlockDocClient";

export default async function PersonalUsageBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/personal-usage-01/personal-usage.tsx"), "utf8");
  return <PersonalUsageBlockDocClient code={code} />;
}
