import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { writeFile } from "node:fs/promises";
import { stripVTControlCharacters } from "node:util";
import { ConsumerExecutionError, fixtureManagers } from "./published-consumer-runtime.mjs";
import { serialize } from "./agent-utils.mjs";

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

export function examplePreviewInvocation(profile, port) {
  if (!["next", "vite"].includes(profile.framework) || !Object.hasOwn(fixtureManagers, profile.packageManager)
    || !Number.isInteger(port) || port < 1024 || port > 65535) throw new ConsumerExecutionError("PREVIEW_CONFIG", "preview");
  const tool = profile.framework === "next" ? ["next", "start", "--hostname", "127.0.0.1", "--port", String(port)]
    : ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"];
  return { file: profile.packageManager, args: ["exec", ...(profile.packageManager === "npm" ? ["--"] : []), ...tool] };
}

/** Only the process launched by this call is stopped; existing preview processes are untouched. */
export async function startExamplePreview(consumer, profile, env, logFile, { timeoutMs = 30000 } = {}) {
  examplePreviewInvocation(profile, 4187);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw new ConsumerExecutionError("PREVIEW_CONFIG", "preview");
  const port = await availablePort(), origin = `http://127.0.0.1:${port}`;
  const { args } = examplePreviewInvocation(profile, port);
  const child = spawn(profile.packageManager, args, { cwd: consumer, env, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] });
  const stdout = [], stderr = [];
  let closed = false, exitCode = null, failed = null, bytes = 0, announced = false;
  const kill = signal => {
    try { if (child.pid && !closed) { if (process.platform === "win32") child.kill(signal); else process.kill(-child.pid, signal); } }
    catch { /* Wait for close; never target another process. */ }
  };
  const close = new Promise(resolve => child.once("close", code => { closed = true; exitCode = code; resolve(); }));
  child.once("error", () => { failed = "PREVIEW_START_FAILED"; });
  const collect = (chunks, chunk) => {
    bytes += chunk.length;
    if (bytes > 4 * 1024 * 1024) { failed = "PREVIEW_OUTPUT_BUDGET"; kill("SIGKILL"); return; }
    chunks.push(Buffer.from(chunk));
    announced = /Ready in|Local:\s+http:\/\/127\.0\.0\.1:/.test(stripVTControlCharacters(Buffer.concat(stdout).toString("utf8")));
  };
  child.stdout.on("data", chunk => collect(stdout, chunk)); child.stderr.on("data", chunk => collect(stderr, chunk));
  let stopped;
  const stop = () => stopped ??= (async () => {
    kill("SIGTERM"); const timer = setTimeout(() => kill("SIGKILL"), 2000);
    try { await close; }
    finally { clearTimeout(timer); await writeFile(logFile, serialize({ file: profile.packageManager, args, stdout: Buffer.concat(stdout).toString("utf8"),
      stderr: Buffer.concat(stderr).toString("utf8"), exitCode, code: failed, origin }), { flag: "wx", mode: 0o600 }); }
  })();
  try {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (closed || failed) throw new ConsumerExecutionError(failed ?? "PREVIEW_EXITED", "preview");
      if (announced) {
        try {
          const response = await fetch(origin, { signal: AbortSignal.timeout(Math.min(1000, Math.max(1, deadline - Date.now()))), redirect: "error" });
          // Consume no response body; a successful application response plus the owned process's readiness is sufficient here.
          await response.body?.cancel();
          if (response.ok && !closed && !failed) return { origin, stop, assertAlive: () => {
            if (closed || failed) throw new ConsumerExecutionError(failed ?? "PREVIEW_EXITED", "preview");
          } };
        } catch { /* Retry the bounded readiness request, never restart the process. */ }
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    failed = "PREVIEW_READINESS_TIMEOUT";
    throw new ConsumerExecutionError(failed, "preview");
  } catch (error) { await stop(); throw error; }
}
