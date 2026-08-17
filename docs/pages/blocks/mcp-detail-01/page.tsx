import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { McpDetailBlockDocClient } from "./McpDetailBlockDocClient";

export default async function McpDetailBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/mcp-detail-01/mcp-detail.tsx"), "utf8");
  return <McpDetailBlockDocClient code={code} />;
}
