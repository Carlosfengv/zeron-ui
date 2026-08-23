import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { InfiniteLogTableBlockDocClient } from "./InfiniteLogTableBlockDocClient";

export default async function InfiniteLogTableBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/infinite-log-table-01/infinite-log-table.tsx",
    ),
    "utf8",
  );
  return <InfiniteLogTableBlockDocClient code={code} />;
}
