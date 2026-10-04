import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

/** Compile the shared TS contract without executing component or application modules. */
export async function loadAgentSchema() {
  const temporary = await mkdtemp(path.join(tmpdir(), "zeron-agent-schema-"));
  try {
    const outfile = path.join(temporary, "schema.mjs");
    await build({ entryPoints: [fileURLToPath(new URL("../lib/agent-catalog/schema.ts", import.meta.url))],
      outfile, bundle: true, platform: "node", format: "esm", logLevel: "silent" });
    return await import(pathToFileURL(outfile).href);
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
