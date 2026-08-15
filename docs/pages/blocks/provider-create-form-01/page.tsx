import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ProviderCreateFormBlockDocClient } from "./ProviderCreateFormBlockDocClient";

export default async function ProviderCreateFormBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/provider-create-form-01/provider-create-form.tsx"
    ),
    "utf8"
  );

  return <ProviderCreateFormBlockDocClient code={code} />;
}
