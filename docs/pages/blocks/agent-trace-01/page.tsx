import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AgentTraceBlockDocClient } from "./AgentTraceBlockDocClient";

export default async function AgentTraceBlockDoc() {
  const code = await readFile(
    join(process.cwd(), "packages/blocks/src/application/agent-trace-01/agent-trace.tsx"),
    "utf8"
  );

  return <AgentTraceBlockDocClient code={code} />;
}
