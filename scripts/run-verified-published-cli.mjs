import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolveVerifiedCli } from "./published-consumer-runtime.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const inventory = JSON.parse(await readFile(process.argv[2], "utf8"));
    const binary = await resolveVerifiedCli(inventory);
    const child = spawn(process.execPath, [binary, ...process.argv.slice(3)], { stdio: "inherit", env: process.env });
    child.on("error", () => { console.error("VERIFIED_CLI_EXECUTION_FAILED"); process.exitCode = 1; });
    child.on("close", code => { process.exitCode = code === null ? 1 : code; });
  } catch (error) {
    console.error(error.code ?? "VERIFIED_CLI_VALIDATION_FAILED");
    process.exitCode = 1;
  }
}
