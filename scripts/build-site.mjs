import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function siteBuildCommands({ mode = "development", release } = {}) {
  if (!["development", "release"].includes(mode) || (mode === "release" && !release) || (mode === "development" && release)) {
    throw new Error("Choose development or release with an explicit AGENT_RELEASE_RECORD");
  }
  return [...(mode === "development" ? [["skills:build"]] : []), ["code-engine:check"], ["docs:routes:check"], ["docs:sources:check"], ["agents:guides:check"],
    ["agents:build", "--mode", mode, ...(mode === "release" ? ["--release", release] : [])], ["exec", "next", "build"]];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 2) throw new Error("Use AGENT_CATALOG_MODE and AGENT_RELEASE_RECORD to configure the site build");
  const root = fileURLToPath(new URL("..", import.meta.url));
  for (const args of siteBuildCommands({ mode: process.env.AGENT_CATALOG_MODE ?? "development", release: process.env.AGENT_RELEASE_RECORD })) {
    execFileSync("pnpm", args, { cwd: root, stdio: "inherit",
      env: { ...process.env, PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}` } });
  }
}
