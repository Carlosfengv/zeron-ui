import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function runShadcn(args, { cwd = process.cwd(), spawn = spawnSync } = {}) {
  const entry = fileURLToPath(import.meta.resolve("shadcn"));
  const result = spawn(process.execPath, [entry, ...args], {
    cwd,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}
