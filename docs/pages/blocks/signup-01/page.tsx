import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Signup01BlockDocClient } from "./Signup01BlockDocClient";

export default async function Signup01BlockDoc() {
  const code = await readFile(
    join(process.cwd(), "packages/blocks/src/application/signup-01/signup-01.tsx"),
    "utf8"
  );

  return <Signup01BlockDocClient code={code} />;
}
