import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AgentSessionDetailBlockDocClient } from "./AgentSessionDetailBlockDocClient";

export default async function AgentSessionDetailBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/agent-session-detail-01/agent-session-detail.tsx"), "utf8");
  return <AgentSessionDetailBlockDocClient code={code} />;
}
