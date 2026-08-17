import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ModelDetailBlockDocClient } from "./ModelDetailBlockDocClient";

export default async function ModelDetailBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/model-detail-01/model-detail.tsx"), "utf8");
  return <ModelDetailBlockDocClient code={code} />;
}
