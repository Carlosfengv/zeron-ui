import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isSupportedNodeVersion, runCli } from "../src/cli.js";
import {
  resolveInstalledRegistryAliases,
  resolveRegistryAliases,
} from "../src/resolve-registry-aliases.js";
import { buildInstallPlan } from "../src/install-plan.js";

function outputBuffer() {
  let value = "";
  return {
    stream: { write: (chunk) => { value += chunk; } },
    value: () => value,
  };
}

async function projectFixture({ components = true, packageJson = {} } = {}) {
  const cwd = await mkdtemp(path.join(tmpdir(), "zeron-ui-test-"));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify(packageJson)}\n`);
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
  assert.equal(output.value(), "0.2.0-beta.11\n");
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
    fetchImpl: async () => ({ ok: true, json: async () => ({ name: "button" }) }),
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

test("leaves non-source registry assets untouched during alias resolution", () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>';
  assert.equal(resolveRegistryAliases(svg, { ui: "@/components/ui" }, "assets/platform.svg"), svg);
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

test("normalizes shadcn's known relative token fallback only", () => {
  const output = resolveRegistryAliases([
    'import { controlHeight } from "../tokens/control-size";',
    'import { pickerControlHeight } from "../../tokens/control-size";',
    'import { local } from "./local";',
  ].join("\n"), { lib: "@/lib" });

  assert.match(output, /from "@\/lib\/tokens\/control-size"/);
  assert.doesNotMatch(output, /\.\.\/\.\.\/tokens\/control-size/);
  assert.match(output, /from "\.\/local"/);
});

test("resolves only module literals without reprinting unrelated TypeScript", () => {
  const source = [
    "// Keep this comment and formatting exactly as written.",
    "export const identity = <T>(value: T): T => value;",
    'export { identity as helper } from "@lib/identity";',
    'const lazy = import("@hooks/use-touch-primary");',
  ].join("\n");

  const output = resolveRegistryAliases(source, {
    lib: "@/lib",
    hooks: "@/hooks",
  }, "business.ts");

  assert.equal(output, [
    "// Keep this comment and formatting exactly as written.",
    "export const identity = <T>(value: T): T => value;",
    'export { identity as helper } from "@/lib/identity";',
    'const lazy = import("@/hooks/use-touch-primary");',
  ].join("\n"));
});

test("never rewrites files outside the explicit install plan", async () => {
  const cwd = await projectFixture();
  await writeFile(path.join(cwd, "components.json"), JSON.stringify({ aliases: { ui: "@/components/ui" } }));
  const businessFile = path.join(cwd, "business.ts");
  const targetFile = path.join(cwd, "components.ts");
  const businessSource = "export const identity = <T>(value: T): T => value;\n";
  await writeFile(businessFile, businessSource);
  await writeFile(targetFile, 'import { Button } from "@ui/button";\n');

  await resolveInstalledRegistryAliases(cwd, [targetFile]);

  assert.equal(await readFile(businessFile, "utf8"), businessSource);
  assert.match(await readFile(targetFile, "utf8"), /from "@\/components\/ui\/button"/);
});

test("materializes only a missing file that is explicitly in the install plan", async () => {
  const cwd = await projectFixture();
  await writeFile(path.join(cwd, "components.json"), JSON.stringify({ aliases: { lib: "@/lib" } }));
  const target = path.join(cwd, "lib", "compose-refs.ts");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.dirname(target), { recursive: true });
  await resolveInstalledRegistryAliases(cwd, [{ targetPath: target, expectedContent: "export const compose = true;\n" }]);
  assert.equal(await readFile(target, "utf8"), "export const compose = true;\n");
});

test("builds a recursive plan and rejects changed targets before installation", async () => {
  const cwd = await projectFixture();
  await writeFile(path.join(cwd, "components.json"), JSON.stringify({
    aliases: { ui: "@/components/ui", components: "@/components", lib: "@/lib", hooks: "@/hooks" },
  }));
  const registry = new Map([
    ["button", {
      name: "button",
      registryDependencies: ["utils"],
      files: [{ path: "button.tsx", target: "components/ui/button.tsx", content: 'import { cn } from "@lib/utils";\n' }],
    }],
    ["utils", {
      name: "utils",
      files: [{ path: "utils.ts", target: "lib/utils.ts", content: "export const cn = () => {};\n" }],
    }],
  ]);
  const fetchImpl = async (url) => ({
    ok: true,
    json: async () => registry.get(new URL(url).pathname.split("/").at(-1).replace(".json", "")),
  });

  const plan = await buildInstallPlan({ cwd, names: ["button"], baseUrl: "http://localhost:3000/r", fetchImpl });
  assert.deepEqual(plan.resolvedItems, ["utils", "button"]);
  assert.deepEqual(plan.files.map((file) => path.relative(cwd, file.targetPath)), ["lib/utils.ts", "components/ui/button.tsx"]);

  await writeFile(path.join(cwd, "components", "ui", "button.tsx"), "export const changed = true;\n").catch(async () => {
    // The fixture does not pre-create component directories.
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.join(cwd, "components", "ui"), { recursive: true });
    await writeFile(path.join(cwd, "components", "ui", "button.tsx"), "export const changed = true;\n");
  });
  await assert.rejects(
    buildInstallPlan({ cwd, names: ["button"], baseUrl: "http://localhost:3000/r", fetchImpl }),
    /Install conflict: components\/ui\/button.tsx/,
  );
});

test("keeps the blocks directory when mapping a planned block file", async () => {
  const cwd = await projectFixture();
  await writeFile(path.join(cwd, "components.json"), JSON.stringify({
    aliases: { components: "@/components", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" },
  }));
  const plan = await buildInstallPlan({
    cwd,
    names: ["example-block"],
    baseUrl: "http://localhost:3000/r",
    fetchImpl: async () => ({ ok: true, json: async () => ({
      name: "example-block",
      files: [{ path: "example.tsx", target: "components/blocks/example-block/example.tsx", content: "export {};\n" }],
    }) }),
  });
  assert.deepEqual(plan.files.map((file) => path.relative(cwd, file.targetPath)), ["components/blocks/example-block/example.tsx"]);
});

test("requires components.json before add", async () => {
  const cwd = await projectFixture({ components: false });
  await assert.rejects(
    runCli(["add", "button", "--cwd", cwd]),
    /run "npx zeron-ui init" first/,
  );
});

test("rejects --path before Registry access or file writes", async () => {
  const cwd = await projectFixture();
  let fetched = false;
  await assert.rejects(
    runCli(["add", "button", "--path", "src/elsewhere", "--cwd", cwd], {
      fetchImpl: async () => {
        fetched = true;
        return { ok: true, json: async () => ({ name: "button" }) };
      },
    }),
    /--path is temporarily unsupported/,
  );
  assert.equal(fetched, false);
});

test("dry-run returns the install plan without invoking shadcn", async () => {
  const cwd = await projectFixture();
  const output = outputBuffer();
  const status = await runCli(["add", "popover", "--dry-run", "--cwd", cwd], {
    fetchImpl: async () => ({ ok: true, json: async () => ({ name: "popover" }) }),
    stdout: output.stream,
    runShadcnImpl: (nextArgs) => {
      throw new Error(`dry-run unexpectedly invoked shadcn: ${nextArgs.join(" ")}`);
    },
  });

  assert.equal(status, 0);
  assert.match(output.value(), /"requestedItems"/);
  assert.match(output.value(), /"popover"/);
});

test("rejects a missing configured CSS target before the installer writes a theme", async () => {
  const cwd = await projectFixture();
  await writeFile(path.join(cwd, "components.json"), JSON.stringify({
    tailwind: { css: "app/globals.css" },
    aliases: { ui: "@/components/ui", components: "@/components", lib: "@/lib", hooks: "@/hooks" },
  }));
  let invoked = false;
  await assert.rejects(runCli(["add", "button", "--cwd", cwd], {
    fetchImpl: async () => ({ ok: true, json: async () => ({ name: "surfaces", type: "registry:theme" }) }),
    runShadcnImpl: () => { invoked = true; return 0; },
  }), /Theme installation needs the configured CSS file/);
  assert.equal(invoked, false);
});

test("rejects a Next-only Registry item before invoking the installer", async () => {
  const cwd = await projectFixture({ packageJson: { dependencies: { react: "^19.2.0" } } });
  let invoked = false;
  await assert.rejects(runCli(["add", "login-01", "--cwd", cwd], {
    fetchImpl: async () => ({ ok: true, json: async () => ({ name: "login-01", meta: { zeron: { framework: "next", react: "^19.0.0" } } }) }),
    runShadcnImpl: () => { invoked = true; return 0; },
  }), /requires Next.js/);
  assert.equal(invoked, false);
});

test("doctor --check distinguishes a project without an installation record", async () => {
  const cwd = await projectFixture();
  const output = outputBuffer();
  const status = await runCli(["doctor", "--check", "--cwd", cwd], {
    stdout: output.stream,
    fetchImpl: async () => ({ ok: true, json: async () => ({ items: [] }) }),
  });
  assert.equal(status, 1);
  assert.match(output.value(), /\? installation record/);
});
