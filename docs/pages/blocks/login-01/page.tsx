import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Login01BlockDocClient } from "./Login01BlockDocClient";

export default async function Login01BlockDoc() {
  const code = await readFile(
    join(process.cwd(), "packages/blocks/src/application/login-01/login-01.tsx"),
    "utf8"
  );

  return <Login01BlockDocClient code={code} />;
}
