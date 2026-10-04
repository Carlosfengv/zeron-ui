import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { browserOrigin } from "../scripts/agent-example-browser.mjs";
import { startExamplePreview } from "../scripts/agent-example-preview.mjs";
import { parsePublishedExampleArgs, testPublishedExamples } from "../scripts/test-published-examples.mjs";
import { runLoggedConsumerCommand, runPublishedExampleConsumer } from "../scripts/published-consumer-matrix.mjs";
let parent, count = 0;
beforeAll(async () => { parent = await mkdtemp(path.join(tmpdir(), "zeron-example-execution-test-")); });
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });

async function fakePreview({ announced = true, status = 200, exit = false } = {}) {
  const directory = path.join(parent, String(++count)); await mkdir(directory);
  const bin = path.join(directory, "pnpm");
  await writeFile(bin, `#!${process.execPath}\nconst { createServer }=require('node:http');
    const port=Number(process.argv[process.argv.indexOf('--port')+1]);
    if(${exit}) process.exit(9);
    const server=createServer((req,res)=>res.writeHead(${status}).end('preview fixture'));
    server.listen(port,'127.0.0.1',()=>{ ${announced} && console.log('\\x1b[1mLocal\\x1b[22m: \\x1b[36mhttp://127.0.0.1:'+port+'/\\x1b[39m'); });
  `); await chmod(bin, 0o700);
  return { directory, env: { PATH: directory }, log: path.join(directory, "preview.json") };
}
describe("owned preview process lifecycle", () => {
  it("recognizes colored readiness, checks the owned live server and closes it idempotently", async () => {
    const fake = await fakePreview();
    const preview = await startExamplePreview(fake.directory, { framework: "vite", packageManager: "pnpm" }, fake.env, fake.log, { timeoutMs: 3000 });
    expect((await fetch(preview.origin)).status).toBe(200); preview.assertAlive();
    await preview.stop(); await preview.stop();
    expect(() => preview.assertAlive()).toThrow(/PREVIEW_EXITED/);
    await expect(fetch(preview.origin)).rejects.toThrow();
    const log = JSON.parse(await readFile(fake.log, "utf8"));
    expect(log.origin).toBe(preview.origin); expect(log.stdout).toContain("Local"); expect(log.code).toBeNull();
  });
  it.each([{ announced: false }, { status: 403 }])("does not accept a server without both owned readiness and HTTP success: %j", async options => {
    const fake = await fakePreview(options);
    await expect(startExamplePreview(fake.directory, { framework: "vite", packageManager: "pnpm" }, fake.env, fake.log, { timeoutMs: 400 })).rejects.toMatchObject({ code: "PREVIEW_READINESS_TIMEOUT" });
    const log = JSON.parse(await readFile(fake.log, "utf8"));
    expect(log.code).toBe("PREVIEW_READINESS_TIMEOUT"); await expect(fetch(log.origin)).rejects.toThrow();
  });
  it("preserves a startup exit and rejects an unknown profile before spawning", async () => {
    const fake = await fakePreview({ exit: true });
    await expect(startExamplePreview(fake.directory, { framework: "next", packageManager: "pnpm" }, fake.env, fake.log, { timeoutMs: 3000 })).rejects.toMatchObject({ code: "PREVIEW_EXITED" });
    expect(JSON.parse(await readFile(fake.log, "utf8")).exitCode).toBe(9);
    await expect(startExamplePreview(fake.directory, { framework: "other", packageManager: "pnpm" }, fake.env, fake.log)).rejects.toMatchObject({ code: "PREVIEW_CONFIG" });
  });
});
describe("formal example entrance cannot accept fake success", () => {
  it("retains actual process output on nonzero exits and timeout before rejecting the gate", async () => {
    const logs = path.join(parent, "command-logs"); await mkdir(logs);
    await expect(runLoggedConsumerCommand(process.execPath, ["-e", "process.stdout.write('before-failure');process.stderr.write('error-output');process.exitCode=7"],
      { step: "nonzero", logs })).rejects.toMatchObject({ code: "COMMAND_EXIT", exitCode: 7 });
    expect(JSON.parse(await readFile(path.join(logs, "nonzero.json"), "utf8"))).toMatchObject({ stdout: "before-failure", stderr: "error-output", exitCode: 7 });
    await expect(runLoggedConsumerCommand(process.execPath, ["-e", "console.log('before-timeout');setInterval(()=>{},1000)"],
      { step: "timeout", logs, timeoutMs: 300 })).rejects.toMatchObject({ code: "COMMAND_TIMEOUT" });
    expect(JSON.parse(await readFile(path.join(logs, "timeout.json"), "utf8"))).toMatchObject({ stdout: "before-timeout\n", code: "COMMAND_TIMEOUT", exitCode: null });
  });
  it("shares strict input/output parsing but has no skip, mock, injected report or profile options", () => {
    const args = ["--input", path.join(parent, "input.json"), "--output", path.join(parent, "new-output")];
    expect(parsePublishedExampleArgs([...args, "--publish-evidence"]).publishEvidence).toBe(true);
    for (const flag of ["--framework", "--package-manager", "--skip-browser", "--fixture", "--verification", "--writer", "--pass"]) {
      expect(() => parsePublishedExampleArgs([...args, flag, "fixture"])).toThrow();
    }
    expect(() => parsePublishedExampleArgs([...args, "--publish-evidence", "--publish-evidence"])).toThrow();
  });
  it("rejects external targets and undeclared consumer profiles", async () => {
    expect(browserOrigin("http://127.0.0.1:4187")).toBe("http://127.0.0.1:4187");
    for (const value of ["https://example.com", "http://localhost:4187", "http://127.0.0.1:4187/", "http://127.0.0.1:4187?x=1", "http://user:password@127.0.0.1:4187"]) expect(() => browserOrigin(value)).toThrow();
    expect(() => runPublishedExampleConsumer({}, { framework: "vite", packageManager: "pnpm" }, { declarations: { examples: [{ profiles: [{ framework: "next", packageManager: "pnpm" }] }] } }, {}, parent)).toThrow(/SOURCE_PROFILE_UNDECLARED/);
  });
  it("leaves a safe failure and no success file on unsupported actual runtime", async () => {
    if (Number(process.versions.node.split(".")[0]) === 22 && process.platform === "linux") return;
    const output = path.join(parent, "runtime-refused");
    await expect(testPublishedExamples(["--input", path.join(parent, "missing-input"), "--output", output])).rejects.toMatchObject({ code: "EXAMPLE_RUNTIME_REQUIRED" });
    const failure = JSON.parse(await readFile(path.join(output, "failure.json"), "utf8"));
    expect(failure).toMatchObject({ status: "failed", phase: "input", code: "EXAMPLE_RUNTIME_REQUIRED", completedProfiles: [] });
    for (const file of ["examples-verification.json", "local-verification.json"]) await expect(readFile(path.join(output, file))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(testPublishedExamples(["--input", path.join(parent, "missing-input"), "--output", output])).rejects.toThrow();
  });
});
