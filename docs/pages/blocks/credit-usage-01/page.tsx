import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CreditUsageBlockDocClient } from "./CreditUsageBlockDocClient";

export default async function CreditUsageBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/credit-usage-01/credit-usage.tsx",
    ),
    "utf8",
  );

  return <CreditUsageBlockDocClient code={code} />;
}
