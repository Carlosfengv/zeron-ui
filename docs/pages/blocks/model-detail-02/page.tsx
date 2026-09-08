import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ModelDetail02BlockDocClient } from "./ModelDetail02BlockDocClient";

export default async function ModelDetail02BlockDoc() {
  const code = await readFile(
    join(process.cwd(), "packages/blocks/src/application/model-detail-02/model-detail-02.tsx"),
    "utf8",
  );
  return <ModelDetail02BlockDocClient code={code} />;
}
