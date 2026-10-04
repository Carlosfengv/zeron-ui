import { snapshots } from "@/lib/agent-catalog/runtime";
import { configuredOrigins, createAgentMcpHandler } from "@/lib/mcp/handler";

export const runtime = "nodejs";
export const maxDuration = 15;
const handler = createAgentMcpHandler(snapshots, { allowedOrigins: configuredOrigins(),
  log: (event) => console.info(JSON.stringify({ event: "zeron_mcp", ...event })) });
export { handler as GET, handler as POST, handler as DELETE, handler as OPTIONS };
