import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isSupportedNodeVersion, runCli } from "../src/cli.js";
import { resolveRegistryAliases } from "../src/resolve-registry-aliases.js";

function outputBuffer() {
  let value = "";
  return {
    stream: { write: (chunk) => { value += chunk; } },
    value: () => value,
  };
}

async function projectFixture({ components = true } = {}) {
  const cwd = await mkdtemp(path.join(tmpdir(), "zeron-ui-test-"));
  await writeFile(path.join(cwd, "package.json"), "{}\n");
  if (components) await writeFile(path.join(cwd, "components.json"), "{}\n");
  return cwd;
}

test("prints help", async () => {
  const output = outputBuffer();
  assert.equal(await runCli(["--help"], { stdout: output.stream }), 0);
  assert.match(output.value(), /zeron-ui add/);
});

test("prints the package version without a command", async () => {
  const output = outputBuffer();
  assert.equal(await runCli(["--version"], { stdout: output.stream }), 0);
  assert.equal(output.value(), "0.2.0-beta.7\n");
});

test("checks the supported Node range", () => {
  assert.equal(isSupportedNodeVersion("20.18.0"), true);
  assert.equal(isSupportedNodeVersion("22.14.0"), true);
  assert.equal(isSupportedNodeVersion("20.17.9"), false);
  assert.equal(isSupportedNodeVersion("18.20.0"), false);
});

test("lists the live catalog shape", async () => {
  const output = outputBuffer();
  const status = await runCli(["list"], {
    stdout: output.stream,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ items: [{ name: "button", title: "Button" }] }),
    }),
  });

  assert.equal(status, 0);
  assert.match(output.value(), /button — Button/);
});

test("maps add to the pinned shadcn command", async () => {
  const cwd = await projectFixture();
  let invocation;
  const status = await runCli(["add", "button", "--cwd", cwd, "--yes"], {
    runShadcnImpl: (args, options) => {
      invocation = { args, options };
      return 0;
    },
  });

  assert.equal(status, 0);
  assert.deepEqual(invocation.args, [
    "add",
    "https://zeron-ui.vercel.app/r/button.json",
    "--cwd",
    cwd,
    "--yes",
  ]);
});

test("resolves Registry import placeholders against the consumer aliases", () => {
  const source = [
    'import { Button } from "@ui/button";',
    'type Lazy = import("@hooks/use-touch-primary").Result;',
  ].join("\n");
  const output = resolveRegistryAliases(source, {
    ui: "#components/ui",
    lib: "#lib",
    hooks: "#hooks",
  });

  assert.match(output, /from "#components\/ui\/button"/);
  assert.match(output, /import\("#hooks\/use-touch-primary"\)/);
});

test("normalizes shadcn's nested hash aliases", () => {
  const output = resolveRegistryAliases([
    'import { cn } from "#components/lib/utils";',
    'import { useTouchPrimary } from "#components/hooks/use-touch-primary";',
  ].join("\n"), {
    components: "#components",
    lib: "#lib",
    hooks: "#hooks",
  });

  assert.match(output, /from "#lib\/utils"/);
  assert.match(output, /from "#hooks\/use-touch-primary"/);
});

test("requires components.json before add", async () => {
  const cwd = await projectFixture({ components: false });
  await assert.rejects(
    runCli(["add", "button", "--cwd", cwd]),
    /run "npx zeron-ui init" first/,
  );
});

test("dry-run delegates to view without writing", async () => {
  const cwd = await projectFixture();
  const output = outputBuffer();
  let args;
  const status = await runCli(["add", "popover", "--dry-run", "--cwd", cwd], {
    stdout: output.stream,
    runShadcnImpl: (nextArgs) => {
      args = nextArgs;
      return 0;
    },
  });

  assert.equal(status, 0);
  assert.equal(args[0], "view");
  assert.match(output.value(), /Preview only/);
});
