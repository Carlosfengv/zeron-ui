import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url).pathname;
const require = createRequire(join(root, "packages/cli/package.json"));
const execute = promisify(execFile);

// Exercise the pinned installation engine, not a hand-written approximation
// of its CSS output. The full consumer matrix separately installs dependencies.
describe("consumer theme CSS after actual Registry installation", () => {
  it.each([undefined, "1.25rem"])("compiles the base layer and preserves native/host radius (%s)", async (radius) => {
    const cwd = await mkdtemp(join(tmpdir(), "zeron-theme-test-"));
    try {
      await symlink(join(root, "node_modules"), join(cwd, "node_modules"), "dir");
      await writeFile(join(cwd, "package.json"), JSON.stringify({
        name: "theme-test", private: true,
        dependencies: { next: "15.5.24", react: "19.2.0", tailwindcss: "^4.1.18" },
      }));
      await writeFile(join(cwd, "tsconfig.json"), JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./*"] } } }));
      await writeFile(join(cwd, "components.json"), JSON.stringify({
        style: "new-york", rsc: true, tsx: true,
        tailwind: { config: "", css: "globals.css", baseColor: "neutral", cssVariables: true, prefix: "" },
        aliases: { components: "@/components", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks", utils: "@/lib/utils" },
      }));
      await writeFile(join(cwd, "globals.css"), [
        '@import "tailwindcss" source(none);',
        '@source inline("rounded-lg rounded-xl bg-primary-action text-fg-default h-control-md");',
        radius ? `@theme { --radius-lg: ${radius}; }` : "",
      ].join("\n"));
      const theme = JSON.parse(await readFile(join(root, "public/r/surfaces.json"), "utf8"));
      // Dependencies are already installed locally; avoid package-manager writes
      // through the shared node_modules link during this focused compiler test.
      theme.dependencies = [];
      await writeFile(join(cwd, "surfaces.json"), JSON.stringify(theme));
      for (let install = 0; install < 2; install++) {
        await execute(process.execPath, [require.resolve("shadcn"), "add", join(cwd, "surfaces.json"), "--cwd", cwd, "--yes"], { timeout: 30_000 });
        const source = await readFile(join(cwd, "globals.css"), "utf8");
        expect(source.match(/@apply border-border outline-ring\/50/g)).toHaveLength(1);
        expect(source.match(/@import "tw-animate-css"/g)).toHaveLength(1);
        const compiled = await postcss([tailwind()]).process(source, { from: join(cwd, "globals.css") });
        expect(compiled.css).not.toContain("@apply");
        expect(compiled.css).toContain(".rounded-lg");
        expect(compiled.css).toContain(`--radius-lg: ${radius ?? "0.5rem"}`);
        expect(compiled.css).toContain(".bg-primary-action");
        const css = postcss.parse(compiled.css);
        const body = css.nodes.flatMap((node) => node.nodes ?? []).find((node) => node.selector === "body");
        expect(body?.toString()).toContain("background-color: var(--surface-base)");
        expect(body?.toString()).toContain("color: var(--fg-default)");
        expect(compiled.css).toContain("var(--focus-ring)");
      }
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }, 60_000);
});
