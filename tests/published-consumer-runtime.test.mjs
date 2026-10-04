import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { assertConsumerManager, cliPackageInventory, consumerEntry, consumerEnvironment, fileInventory,
  fixtureManagers, materializeConsumer, resolveVerifiedCli, runConsumerCommand } from "../scripts/published-consumer-runtime.mjs";
import { prepareVerifiedCli, publishedCliInvocation } from "../scripts/published-consumer-matrix.mjs";
import { serialize } from "../scripts/agent-utils.mjs";
import { createInstallationOutput } from "../scripts/check-published-installation-input.mjs";

let parent;
let counter = 0;
const fresh = async name => {
  const directory = path.join(parent, `${name}-${counter++}`);
  await mkdir(directory);
  return directory;
};
beforeAll(async () => { parent = await mkdtemp(path.join(tmpdir(), "zeron-consumer-runtime-test-")); });
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });

async function referenceFixture() {
  const owner = await fresh("owner");
  const directory = path.join(owner, "node_modules/zeron-ui");
  const binDirectory = path.join(owner, "node_modules/.bin");
  await mkdir(path.join(directory, "src"), { recursive: true });
  await mkdir(binDirectory);
  await writeFile(path.join(directory, "package.json"), serialize({ name: "zeron-ui", version: "1.2.3", bin: { "zeron-ui": "src/index.js" } }));
  await writeFile(path.join(directory, "src/index.js"), "// Explicit non-executable fixture, not published installation evidence.\n");
  await symlink(path.join(directory, "src/index.js"), path.join(binDirectory, "zeron-ui"));
  const reference = await cliPackageInventory(directory, "1.2.3");
  return { owner, directory, binDirectory, inventory: { ...reference, nodeVersion: process.versions.node, allowedRoot: owner } };
}

describe("isolated published consumer execution", () => {
  it("does not inherit credentials, Node injection or global package settings", async () => {
    const directory = await fresh("env");
    const env = await consumerEnvironment(directory, { PATH: "/usr/bin", BLOB_READ_WRITE_TOKEN: "fixture-secret",
      VERCEL_OIDC_TOKEN: "fixture-secret", npm_config_userconfig: "/unsafe", NPM_TOKEN: "fixture-secret",
      NODE_OPTIONS: "--require /unsafe", NODE_PATH: "/unsafe", ZERON_UI_REGISTRY_URL: "https://unsafe.invalid", LANG: "en_US.UTF-8" });
    for (const name of ["BLOB_READ_WRITE_TOKEN", "VERCEL_OIDC_TOKEN", "NPM_TOKEN", "NODE_OPTIONS", "NODE_PATH", "ZERON_UI_REGISTRY_URL"]) expect(env).not.toHaveProperty(name);
    expect(env.npm_config_userconfig).toBe(path.join(directory, "user.npmrc"));
    expect(env.npm_config_registry).toBe("https://registry.npmjs.org/");
    expect(await readFile(env.npm_config_userconfig, "utf8")).toBe("");
    await expect(consumerEnvironment(directory)).rejects.toMatchObject({ code: "EEXIST" });
  });

  it("preserves a real nonzero exit and bounded outputs for the caller's gate", async () => {
    const result = await runConsumerCommand(process.execPath, ["-e", "process.stdout.write('out'); process.stderr.write('err'); process.exitCode=7"], {
      cwd: parent, env: process.env, step: "negative",
    });
    expect(result).toEqual({ stdout: "out", stderr: "err", exitCode: 7 });
  });

  it("rejects command startup, output overflow, invalid budgets and log failures", async () => {
    await expect(runConsumerCommand(path.join(parent, "missing"), [], { step: "start" })).rejects.toMatchObject({ code: "COMMAND_START_FAILED" });
    await expect(runConsumerCommand(process.execPath, ["-e", "process.stdout.write('abcdefgh')"], { step: "overflow", maxBytes: 2 })).rejects.toMatchObject({ code: "COMMAND_OUTPUT_BUDGET" });
    expect(() => runConsumerCommand(process.execPath, [], { timeoutMs: 0 })).toThrow(/COMMAND_BUDGET/);
    await expect(runConsumerCommand(process.execPath, ["-e", ""], { step: "log", log: () => { throw new Error("private log writer failed"); } })).rejects.toMatchObject({ code: "COMMAND_LOG_FAILED" });
  });

  it("kills descendants on timeout before they can write after the gate fails", async () => {
    const marker = path.join(parent, "escaped-process");
    const grandchild = `setTimeout(()=>require('node:fs').writeFileSync(${JSON.stringify(marker)},'escaped'),1400);`;
    let log;
    await expect(runConsumerCommand(process.execPath, ["-e", `const c=require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'inherit'}); console.log('spawned',c.pid); setInterval(()=>{},1000);`], {
      step: "descendant", timeoutMs: 600, log: result => { log = result; },
    })).rejects.toMatchObject({ code: "COMMAND_TIMEOUT" });
    expect(log.stdout).toContain("spawned");
    await delay(1100);
    await expect(readFile(marker)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("hashes consumer files while rejecting links and enforcing inventory limits", async () => {
    const directory = await fresh("inventory");
    await writeFile(path.join(directory, "business.ts"), "business");
    await mkdir(path.join(directory, "node_modules"));
    await writeFile(path.join(directory, "node_modules/ignored"), "dependency");
    expect((await fileInventory(directory)).map(file => file.path)).toEqual(["business.ts"]);
    await expect(fileInventory(directory, { maxTotalBytes: 2 })).rejects.toMatchObject({ code: "INVENTORY_BUDGET" });
    await writeFile(path.join(directory, "second.ts"), "second");
    await expect(fileInventory(directory, { maxFiles: 1 })).rejects.toMatchObject({ code: "INVENTORY_BUDGET" });
    await symlink(path.join(directory, "business.ts"), path.join(directory, "link.ts"));
    await expect(fileInventory(directory)).rejects.toMatchObject({ code: "NON_REGULAR_CONSUMER_FILE" });
  });

  it("rejects output inside a candidate through either its path or a directory alias", async () => {
    const candidate = await fresh("candidate");
    const output = path.join(candidate, "evidence");
    await expect(createInstallationOutput(output, { excludeDirectories: [candidate] })).rejects.toThrow(/outside artifact candidates/);
    const alias = path.join(parent, "candidate-alias");
    await symlink(candidate, alias);
    await expect(createInstallationOutput(path.join(alias, "evidence"), { excludeDirectories: [candidate] })).rejects.toThrow(/outside artifact candidates/);
    await expect(readFile(output)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("resolves the same raw package bytes after canonical JSON changes property order", async () => {
    const fixture = await referenceFixture();
    const inventory = JSON.parse(serialize(fixture.inventory));
    expect(await resolveVerifiedCli(inventory, { searchPath: fixture.binDirectory })).toBe(await realpath(path.join(fixture.directory, "src/index.js")));
  });

  it("rejects changed own-package bytes even when package name and version match", async () => {
    const fixture = await referenceFixture();
    await writeFile(path.join(fixture.directory, "src/index.js"), "// substituted\n");
    await expect(resolveVerifiedCli(fixture.inventory, { searchPath: fixture.binDirectory })).rejects.toMatchObject({ code: "CLI_SOURCE_BYTES_MISMATCH" });
  });

  it("locates the verified package beside a pnpm shell shim without executing the shim", async () => {
    const fixture = await referenceFixture();
    await unlink(path.join(fixture.binDirectory, "zeron-ui"));
    await writeFile(path.join(fixture.binDirectory, "zeron-ui"), "#!/bin/sh\nexit 99 # This shim must never run\n");
    expect(await resolveVerifiedCli(fixture.inventory, { searchPath: fixture.binDirectory })).toBe(await realpath(path.join(fixture.directory, "src/index.js")));
    await writeFile(path.join(fixture.directory, "src/index.js"), "// changed package\n");
    await expect(resolveVerifiedCli(fixture.inventory, { searchPath: fixture.binDirectory })).rejects.toMatchObject({ code: "CLI_SOURCE_BYTES_MISMATCH" });
  });

  it("rejects an outside-cache executable, wrong Node version and missing binary", async () => {
    const fixture = await referenceFixture();
    await expect(resolveVerifiedCli({ ...fixture.inventory, allowedRoot: await fresh("other-owner") }, { searchPath: fixture.binDirectory })).rejects.toMatchObject({ code: "CLI_OUTSIDE_ISOLATED_CACHE" });
    await expect(resolveVerifiedCli({ ...fixture.inventory, nodeVersion: "0.0.0" }, { searchPath: fixture.binDirectory })).rejects.toMatchObject({ code: "CLI_NODE_VERSION" });
    await expect(resolveVerifiedCli(fixture.inventory, { searchPath: await fresh("no-bin") })).rejects.toMatchObject({ code: "CLI_BIN_NOT_FOUND" });
  });

  it("rejects package identity, unsafe bin paths and undeclared bundled package contents", async () => {
    const fixture = await referenceFixture();
    for (const metadata of [
      { name: "other", version: "1.2.3", bin: "src/index.js" },
      { name: "zeron-ui", version: "1.2.4", bin: "src/index.js" },
      { name: "zeron-ui", version: "1.2.3", bin: "../index.js" },
      { name: "zeron-ui", version: "1.2.3", bin: "src/index.js", bundledDependencies: ["unverified"] },
    ]) {
      await writeFile(path.join(fixture.directory, "package.json"), serialize(metadata));
      await expect(cliPackageInventory(fixture.directory, "1.2.3")).rejects.toMatchObject({ code: "CLI_PACKAGE_IDENTITY" });
    }
  });

  it("rejects bad reference SRI before installing or executing any package", async () => {
    const directory = path.join(parent, "bad-reference");
    await expect(prepareVerifiedCli({ tarball: Buffer.from("explicit fixture"), cli: { distIntegrity: "sha512-wrong" } }, directory)).rejects.toMatchObject({ code: "REFERENCE_CLI_INTEGRITY" });
    await expect(readFile(path.join(directory, "package.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("uses explicit npm exec/pnpm dlx of the exact version before the verified launcher", () => {
    const inventory = path.join(parent, "inventory.json");
    const npm = publishedCliInvocation("npm", "1.2.3", inventory, ["--version"]);
    expect(npm.args.slice(0, 5)).toEqual(["exec", "--yes", "--package=zeron-ui@1.2.3", "--", "node"]);
    const pnpm = publishedCliInvocation("pnpm", "1.2.3", inventory, ["--version"]);
    expect(pnpm.args.slice(0, 3)).toEqual(["--package=zeron-ui@1.2.3", "dlx", "node"]);
    expect(npm.args.at(-2)).toBe(inventory);
    expect(pnpm.args.at(-2)).toBe(inventory);
    for (const [manager, version] of [["yarn", "1.2.3"], ["npm", "latest"], ["pnpm", "1.2.3; echo injected"]]) {
      expect(() => publishedCliInvocation(manager, version, inventory, [])).toThrow(/CLI_INVOCATION_CONFIG/);
    }
  });

  it("materializes every fixed profile without repository aliases or the other manager's lockfile", async () => {
    for (const framework of ["next", "vite"]) for (const manager of ["npm", "pnpm"]) {
      const directory = path.join(parent, `materialized-${framework}-${manager}`);
      const identity = await materializeConsumer(framework, manager, directory);
      expect((await assertConsumerManager(directory, manager)).path).toBe(manager === "npm" ? "package-lock.json" : "pnpm-lock.yaml");
      expect(identity).toMatch(/^[a-f0-9]{64}$/);
      const names = (await fileInventory(directory)).map(file => file.path);
      expect(names).toContain("business.ts");
      expect(await readFile(path.join(directory, "pnpm-workspace.yaml"), "utf8")).toBe('packages:\n  - "."\n');
      expect(names).toContain(manager === "npm" ? "package-lock.json" : "pnpm-lock.yaml");
      expect(names).not.toContain(manager === "npm" ? "pnpm-lock.yaml" : "package-lock.json");
      expect(names.some(name => name.endsWith(".txt"))).toBe(false);
      const packageJson = JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"));
      expect(JSON.stringify(packageJson)).not.toContain("workspace:");
      expect(packageJson.packageManager).toBe(`${manager}@${fixtureManagers[manager]}`);
      expect(packageJson.scripts.types).toContain("tsc");
      if (framework === "next") {
        const { default: config } = await import(pathToFileURL(path.join(directory, "next.config.mjs")).href);
        expect(await realpath(config.outputFileTracingRoot)).toBe(await realpath(directory));
      }
    }
  });
  it("rejects manager switches, a missing expected lock and mixed lockfiles", async () => {
    const directory = path.join(parent, "manager-boundary");
    await materializeConsumer("vite", "npm", directory);
    const filename = path.join(directory, "package.json");
    const metadata = JSON.parse(await readFile(filename, "utf8"));
    for (const value of [undefined, "pnpm@10.12.4", "npm@0.0.0"]) {
      await writeFile(filename, serialize({ ...metadata, packageManager: value }));
      await expect(assertConsumerManager(directory, "npm")).rejects.toMatchObject({ code: "CONSUMER_MANAGER_DECLARATION" });
    }
    await writeFile(filename, serialize(metadata));
    await writeFile(path.join(directory, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
    await expect(assertConsumerManager(directory, "npm")).rejects.toMatchObject({ code: "INSTALL_LOCKFILE_MANAGER" });
    await rm(path.join(directory, "pnpm-lock.yaml"));
    await rm(path.join(directory, "package-lock.json"));
    await expect(assertConsumerManager(directory, "npm")).rejects.toMatchObject({ code: "INSTALL_LOCKFILE_MANAGER" });
  });

  it("requires a build entry for every requested item and rejects Next-only Vite entries", () => {
    expect(consumerEntry("next", ["button", "login-01"])).toContain("Login01");
    expect(consumerEntry("vite", ["button", "card"])).toContain("@/src/components/ui/card");
    for (const [framework, names] of [["vite", ["login-01"]], ["next", ["missing"]], ["next", []]]) {
      expect(() => consumerEntry(framework, names)).toThrow(/REPRESENTATIVE_ENTRY_MISSING/);
    }
  });
});
