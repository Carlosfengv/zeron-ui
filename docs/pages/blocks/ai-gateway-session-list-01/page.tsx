import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AiGatewaySessionListBlockDocClient } from "./AiGatewaySessionListBlockDocClient";

export default async function AiGatewaySessionListBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list.tsx",
    ),
    "utf8",
  );

  return <AiGatewaySessionListBlockDocClient code={code} />;
}
