import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ZlrListBlockDocClient } from "./ZlrListBlockDocClient";

export default async function ZlrListBlockDoc() {
  const code = await readFile(
    join(process.cwd(), "packages/blocks/src/application/zlrlist/zlrlist.tsx"),
    "utf8"
  );

  return <ZlrListBlockDocClient code={code} />;
}
