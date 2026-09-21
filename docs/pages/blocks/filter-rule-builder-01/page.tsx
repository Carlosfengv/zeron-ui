import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { FilterRuleBuilderBlockDocClient } from "./FilterRuleBuilderBlockDocClient";

export default async function FilterRuleBuilderBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/filter-rule-builder-01/filter-rule-builder.tsx"
    ),
    "utf8"
  );

  return <FilterRuleBuilderBlockDocClient code={code} />;
}
