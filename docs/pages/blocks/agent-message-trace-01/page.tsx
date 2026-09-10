import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AgentMessageTraceBlockDocClient } from "./AgentMessageTraceBlockDocClient";

export default async function AgentMessageTraceBlockDoc() {
  const code = await readFile(
    join(process.cwd(), "packages/blocks/src/application/agent-message-trace-01/agent-message-trace-workspace.tsx"),
    "utf8"
  );

  return <AgentMessageTraceBlockDocClient code={code} />;
}
