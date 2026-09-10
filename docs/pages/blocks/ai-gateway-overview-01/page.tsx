import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AiGatewayOverviewBlockDocClient } from "./AiGatewayOverviewBlockDocClient";

export default async function AiGatewayOverviewBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview.tsx",
    ),
    "utf8",
  );

  return <AiGatewayOverviewBlockDocClient code={code} />;
}
