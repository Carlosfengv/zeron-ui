import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PersonalSettingsBlockDocClient } from "./PersonalSettingsBlockDocClient";

export default async function PersonalSettingsBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/personal-settings-01/personal-settings.tsx"), "utf8");
  return <PersonalSettingsBlockDocClient code={code} />;
}
