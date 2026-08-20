import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { FileManagerBlockDocClient } from "./FileManagerBlockDocClient";

export default async function FileManagerBlockDoc() {
  const code = await readFile(
    join(process.cwd(), "packages/blocks/src/application/file-manager-01/file-manager.tsx"),
    "utf8"
  );

  return <FileManagerBlockDocClient code={code} />;
}
