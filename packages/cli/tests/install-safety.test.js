import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
import { runCli } from "../src/cli.js";
import { buildInstallPlan } from "../src/install-plan.js";
import { resolveInstalledRegistryAliases } from "../src/resolve-registry-aliases.js";

const exec = promisify(execFile);
const cli = fileURLToPath(new URL("../src/index.js", import.meta.url));
const officialToken = JSON.parse(await readFile(new URL("../../../public/r/tailwind-merge-tokens.json", import.meta.url), "utf8"));
const aliases = { components: "@/components", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks", utils: "@/lib/utils" };
const simpleItem = (name = "example") => ({ name, type: "registry:lib", files: [{ path: `${name}.ts`, target: `lib/${name}.ts`, type: "registry:lib", content: `export const ${name} = true;\n` }] });
const response = (item) => async () => ({ ok: true, json: async () => item });

async function fixture(t, { version = "4.1.18", tsx = true } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "zeron-install-safety-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cwd = path.join(root, "consumer");
  for (const directory of ["app", "node_modules/react", "node_modules/tailwindcss"]) await mkdir(path.join(cwd, directory), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "install-safety-fixture", private: true, dependencies: { react: "19.2.0", next: "15.5.9" }, devDependencies: { tailwindcss: "^4.0.0" } }));
  await writeFile(path.join(cwd, "node_modules/react/package.json"), JSON.stringify({ name: "react", version: "19.2.0" }));
  await writeFile(path.join(cwd, "node_modules/tailwindcss/package.json"), JSON.stringify({ name: "tailwindcss", version }));
  await writeFile(path.join(cwd, "components.json"), JSON.stringify({ style: "new-york", iconLibrary: "none", rsc: true, tsx, aliases, tailwind: { config: "", css: "app/globals.css", baseColor: "", cssVariables: true, prefix: "" } }));
  await writeFile(path.join(cwd, "tsconfig.json"), JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./*"] }, jsx: "preserve" } }));
  await writeFile(path.join(cwd, "app/page.tsx"), "export default function Page() { return null; }\n");
  await writeFile(path.join(cwd, "app/globals.css"), '@import "tailwindcss";\n');
  return { root, cwd };
}

async function localRegistry(t, itemForRequest) {
  const requests = [];
  const server = createServer((request, result) => {
    requests.push(request.url);
    const item = itemForRequest(request.url, requests);
    if (!item) return result.writeHead(404).end();
    result.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(item));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { baseUrl: `http://127.0.0.1:${server.address().port}/r`, requests };
}

function invoke(cwd, baseUrl, name, flags = []) {
  return exec(process.execPath, [cli, "add", name, "--yes", "--cwd", cwd, "--registry", baseUrl, ...flags], {
    timeout: 30000,
    env: { ...process.env, CI: "true", HTTP_PROXY: "", HTTPS_PROXY: "", ALL_PROXY: "", http_proxy: "", https_proxy: "", all_proxy: "" },
  });
}

test("real pinned installer supports repeated and incremental installs without overwriting shared files", { timeout: 60000 }, async (t) => {
  const { cwd } = await fixture(t);
  const dependent = { ...simpleItem("consumer"), registryDependencies: ["tailwind-merge-tokens"] };
  const { baseUrl, requests } = await localRegistry(t, (url) => url.endsWith("/tailwind-merge-tokens.json") ? officialToken : dependent);
  await invoke(cwd, baseUrl, "tailwind-merge-tokens");
  const target = path.join(cwd, "lib/tailwind-merge-tokens.ts");
  const original = await readFile(target, "utf8");
  assert.notEqual(original, officialToken.files[0].content, "the fixture must exercise the real installer's source transform");
  await invoke(cwd, baseUrl, "tailwind-merge-tokens");
  await invoke(cwd, baseUrl, "consumer");
  assert.equal(await readFile(target, "utf8"), original);
  assert.match(await readFile(path.join(cwd, "lib/consumer.ts"), "utf8"), /consumer = true/);
  assert.equal(requests.length, 4, "only preflight reads the external Registry");
  const state = JSON.parse(await readFile(path.join(cwd, ".zeron/install-state.json"), "utf8"));
  assert.match(state.installations.at(-1).fileHashes["lib/tailwind-merge-tokens.ts"].installedHash, /^[a-f0-9]{64}$/);

  await writeFile(target, `${original}\n// user customization\n`);
  await assert.rejects(invoke(cwd, baseUrl, "consumer"), (error) => {
    assert.match(error.stderr, /Install conflict/);
    return true;
  });
  assert.equal(await readFile(target, "utf8"), `${original}\n// user customization\n`);
  await invoke(cwd, baseUrl, "consumer", ["--overwrite"]);
  assert.equal(await readFile(target, "utf8"), original);
});

test("real installer only sees frozen recursive Registry content, never a changed second response", { timeout: 30000 }, async (t) => {
  const { cwd } = await fixture(t);
  const requested = { ...simpleItem("example"), registryDependencies: ["tailwind-merge-tokens"] };
  const { baseUrl, requests } = await localRegistry(t, (url, seen) => {
    if (seen.filter((entry) => entry === url).length > 1) return simpleItem("unplanned");
    return url.endsWith("/example.json") ? requested : officialToken;
  });
  await invoke(cwd, baseUrl, "example");
  assert.deepEqual(requests, ["/r/example.json", "/r/tailwind-merge-tokens.json"]);
  await access(path.join(cwd, "lib/example.ts"));
  await access(path.join(cwd, "lib/tailwind-merge-tokens.ts"));
  await assert.rejects(access(path.join(cwd, "lib/unplanned.ts")), { code: "ENOENT" });
});

test("Registry source changes still conflict with a previously recorded, unmodified installation", async (t) => {
  const { cwd } = await fixture(t);
  const item = simpleItem();
  const options = { fetchImpl: response(item), runShadcnImpl: () => 0 };
  await runCli(["add", "example", "--cwd", cwd], options);
  item.files[0].content = "export const example = false;\n";
  await assert.rejects(runCli(["add", "example", "--cwd", cwd], options), /Install conflict/);
  assert.match(await readFile(path.join(cwd, "lib/example.ts"), "utf8"), /example = true/);
});

for (const target of ["lib", "app/globals.css", ".zeron", "package.json"]) {
  test(`rejects outward symlinks at ${target} before the installer runs`, async (t) => {
    const { root, cwd } = await fixture(t);
    const outside = path.join(root, "outside");
    await mkdir(outside);
    let source = outside;
    if (target.endsWith(".css") || target.endsWith(".json")) {
      source = path.join(outside, path.basename(target));
      await writeFile(source, await readFile(path.join(cwd, target)));
      await rm(path.join(cwd, target));
    }
    await symlink(source, path.join(cwd, target));
    let invoked = false;
    await assert.rejects(runCli(["add", "example", "--cwd", cwd], {
      fetchImpl: response(simpleItem()), runShadcnImpl: () => { invoked = true; return 0; },
    }), /escapes the project directory/);
    assert.equal(invoked, false);
  });
}

test("alias post-processing rejects a symlink changed after preflight", async (t) => {
  const { root, cwd } = await fixture(t);
  const outside = path.join(root, "outside");
  await mkdir(outside);
  await writeFile(path.join(outside, "example.ts"), 'export { x } from "@lib/x";\n');
  await symlink(outside, path.join(cwd, "lib"));
  await assert.rejects(resolveInstalledRegistryAliases(cwd, [path.join(cwd, "lib/example.ts")]), /symbolic link/);
  assert.equal(await readFile(path.join(outside, "example.ts"), "utf8"), 'export { x } from "@lib/x";\n');
});

test("in-project symlinks remain supported", async (t) => {
  const { cwd } = await fixture(t);
  await mkdir(path.join(cwd, "shared"));
  await symlink("shared", path.join(cwd, "lib"));
  const plan = await buildInstallPlan({ cwd, names: ["example"], baseUrl: "http://localhost/r", fetchImpl: response(simpleItem()) });
  assert.equal(plan.files.length, 1);
});

test("Tailwind compatibility uses the installed version, not a compatible manifest range", async (t) => {
  const { cwd } = await fixture(t, { version: "3.4.17" });
  let invoked = false;
  await assert.rejects(runCli(["add", "example", "--cwd", cwd], {
    fetchImpl: response({ ...simpleItem(), meta: { zeron: { tailwind: "^4.0.0" } } }),
    runShadcnImpl: () => { invoked = true; return 0; },
  }), /requires Tailwind CSS \^4\.0\.0; resolved 3\.4\.17/);
  assert.equal(invoked, false);
});

test("Tailwind compatibility rejects missing installs and unsupported metadata", async (t) => {
  const { cwd } = await fixture(t);
  const runShadcnImpl = () => { throw new Error("must not invoke installer"); };
  await assert.rejects(runCli(["add", "example", "--cwd", cwd], {
    fetchImpl: response({ ...simpleItem(), meta: { zeron: { tailwind: "^4.2.0" } } }), runShadcnImpl,
  }), /requires Tailwind CSS/);
  await rm(path.join(cwd, "node_modules/tailwindcss"), { recursive: true });
  await assert.rejects(runCli(["add", "example", "--cwd", cwd], {
    fetchImpl: response({ ...simpleItem(), meta: { zeron: { tailwind: "^4.0.0" } } }), runShadcnImpl,
  }), /Cannot resolve the installed Tailwind CSS version/);
});

test("init --dry-run is rejected before invoking the initialization engine", async (t) => {
  const { cwd } = await fixture(t);
  const before = await readFile(path.join(cwd, "components.json"), "utf8");
  await assert.rejects(runCli(["init", "--dry-run", "--cwd", cwd], {
    runShadcnImpl: () => { throw new Error("must not invoke installer"); },
  }), /init does not support --dry-run; no files were written/);
  assert.equal(await readFile(path.join(cwd, "components.json"), "utf8"), before);
});

test("plan detects recursive Registry cycles", async (t) => {
  const { cwd } = await fixture(t);
  await assert.rejects(buildInstallPlan({ cwd, names: ["example"], baseUrl: "http://localhost/r", fetchImpl: response({ ...simpleItem(), registryDependencies: ["example"] }) }), /dependency cycle/);
});

test("snapshot cleanup runs when the installer fails", async (t) => {
  const { cwd } = await fixture(t);
  let snapshot;
  await assert.rejects(runCli(["add", "example", "--cwd", cwd], {
    fetchImpl: response(simpleItem()),
    runShadcnImpl: (args) => { snapshot = args[1]; throw new Error("fixture installer failure"); },
  }), /fixture installer failure/);
  await assert.rejects(access(snapshot), { code: "ENOENT" });
  await assert.rejects(access(path.join(cwd, ".zeron/install-state.json")), { code: "ENOENT" });
});

for (const name of ["../outside", "nested/name", "nested\\name", ".", ""]) {
  test(`rejects unsafe Registry item names: ${JSON.stringify(name)}`, async (t) => {
    const { cwd } = await fixture(t);
    await assert.rejects(buildInstallPlan({ cwd, names: ["example"], baseUrl: "http://localhost/r", fetchImpl: response({ ...simpleItem(), name }) }), /invalid component name/);
  });
}

test("rejects duplicate item names from distinct Registry URLs before execution", async (t) => {
  const { cwd } = await fixture(t);
  const item = { ...simpleItem(), registryDependencies: ["http://localhost/r/one.json", "http://localhost/r/two.json"] };
  await assert.rejects(buildInstallPlan({ cwd, names: ["example"], baseUrl: "http://localhost/r", fetchImpl: async (url) => ({
    ok: true, json: async () => url.endsWith("/example.json") ? item : simpleItem("shared"),
  }) }), /Ambiguous Registry item name shared from multiple URLs/);
});

test("snapshot preserves verified CSS and package requirements across the entire closure", async (t) => {
  const { cwd } = await fixture(t);
  const dependency = { name: "theme", type: "registry:theme", css: { "@layer utilities": { ".verified": { color: "var(--verified)" } } }, cssVars: { light: { verified: "red" } }, dependencies: ["verified-package@^1.0.0"], files: [] };
  let requested;
  await runCli(["add", "example", "--cwd", cwd], {
    fetchImpl: async (url) => ({ ok: true, json: async () => url.endsWith("/example.json") ? { ...simpleItem(), registryDependencies: ["theme"] } : dependency }),
    runShadcnImpl: async (args) => {
      requested = args[1];
      const root = JSON.parse(await readFile(requested, "utf8"));
      assert.equal(root.registryDependencies.length, 1);
      const snapshot = JSON.parse(await readFile(root.registryDependencies[0], "utf8"));
      assert.deepEqual(snapshot.css, dependency.css);
      assert.deepEqual(snapshot.cssVars, dependency.cssVars);
      assert.deepEqual(snapshot.dependencies, dependency.dependencies);
      assert.deepEqual(snapshot.registryDependencies, []);
      assert.equal(root.files[0].content, simpleItem().files[0].content);
      return 0;
    },
  });
  await assert.rejects(access(requested), { code: "ENOENT" });
});

test("real installer records and preserves the actual JavaScript output target", { timeout: 30000 }, async (t) => {
  const { cwd } = await fixture(t, { tsx: false });
  const item = simpleItem();
  item.files[0].content = "export const example: boolean = true;\n";
  const { baseUrl } = await localRegistry(t, () => item);
  await invoke(cwd, baseUrl, "example");
  const output = await readFile(path.join(cwd, "lib/example.js"), "utf8");
  assert.doesNotMatch(output, /: boolean/);
  await assert.rejects(access(path.join(cwd, "lib/example.ts")), { code: "ENOENT" });
  await invoke(cwd, baseUrl, "example");
  assert.equal(await readFile(path.join(cwd, "lib/example.js"), "utf8"), output);
});

test("real CLI rejects an outward target symlink without writing outside the temporary consumer", { timeout: 30000 }, async (t) => {
  const { root, cwd } = await fixture(t);
  const outside = path.join(root, "outside");
  await mkdir(outside);
  await symlink(outside, path.join(cwd, "lib"));
  const { baseUrl } = await localRegistry(t, () => simpleItem());
  await assert.rejects(invoke(cwd, baseUrl, "example"), (error) => {
    assert.match(error.stderr, /escapes the project directory through a symbolic link/);
    return true;
  });
  await assert.rejects(access(path.join(outside, "example.ts")), { code: "ENOENT" });
});

for (const extra of [{ envVars: { FIXTURE: "value" } }, { files: [{ path: ".env", target: "lib/.env", type: "registry:file", content: "FIXTURE=value\n" }] }, { files: [{ path: "page.tsx", target: "components/page.tsx", type: "registry:page", content: "export default null;\n" }] }]) {
  test("rejects payloads with unsupported implicit installer write targets", async (t) => {
    const { cwd } = await fixture(t);
    await assert.rejects(buildInstallPlan({ cwd, names: ["example"], baseUrl: "http://localhost/r", fetchImpl: response({ ...simpleItem(), ...extra }) }), /unsupported environment-file writes|Unsupported Registry target with installer-dependent placement/);
  });
}
