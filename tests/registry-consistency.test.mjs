/** Registry source and generated-artifact consistency checks. */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BASE_URL } from "../packages/registry/scripts/postbuild.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const uiRegistry = JSON.parse(readFileSync(join(ROOT, "packages/ui/registry.json"), "utf-8"));
const blocksRegistry = JSON.parse(readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf-8"));
const registry = { items: [...uiRegistry.items, ...blocksRegistry.items] };
const itemNames = new Set(registry.items.map((item) => item.name));
const SHADCN_DEFAULT_DEPS = new Set(["utils"]);

describe("package Registry sources", () => {
  it("ships files that exist on disk", () => {
    for (const item of registry.items) {
      for (const file of item.files ?? []) {
        expect(existsSync(join(ROOT, file.path)), `${item.name}: missing ${file.path}`).toBe(true);
      }
    }
  });

  it("does not retain legacy registry/base component sources", () => {
    const filePaths = registry.items.flatMap((item) =>
      (item.files ?? []).map((file) => file.path)
    );
    expect(filePaths.some((path) => path.startsWith("registry/base/"))).toBe(false);
  });

  it("uses packages/ui/src/components as the canonical source for every UI file", () => {
    const uiFiles = uiRegistry.items.flatMap((item) =>
      (item.files ?? []).filter((file) => file.type === "registry:ui")
    );
    for (const file of uiFiles) {
      expect(file.path.startsWith("packages/ui/src/components/"), file.path).toBe(true);
      expect(file.target, `${file.path}: target`).toBe(
        `components/ui/${file.path.slice("packages/ui/src/components/".length)}`
      );
    }
  });

  it("does not retain the legacy Registry source tree", () => {
    expect(existsSync(join(ROOT, "registry/default"))).toBe(false);
  });

  it("uses public lib and hooks paths as canonical Registry sources", () => {
    const sourceRules = {
      "registry:lib": {
        source: "packages/ui/src/system/",
        target: "lib/",
      },
      "registry:hook": {
        source: "packages/ui/src/hooks/",
        target: "hooks/",
      },
    };
    const runtimeFiles = uiRegistry.items.flatMap((item) =>
      (item.files ?? []).filter((file) => file.type in sourceRules)
    );
    for (const file of runtimeFiles) {
      const rule = sourceRules[file.type];
      expect(file.path.startsWith(rule.source), file.path).toBe(true);
      expect(file.target, `${file.path}: target`).toBe(
        `${rule.target}${file.path.slice(rule.source.length)}`
      );
    }
  });

  it("references only registry items or known shadcn defaults", () => {
    for (const item of registry.items) {
      for (const dep of item.registryDependencies ?? []) {
        expect(itemNames.has(dep) || SHADCN_DEFAULT_DEPS.has(dep), `${item.name}: unknown dependency ${dep}`).toBe(true);
      }
    }
  });

  it("derives every local dependency from the catalog", () => {
    for (const item of registry.items) {
      for (const dep of item.registryDependencies ?? []) {
        if (!SHADCN_DEFAULT_DEPS.has(dep)) expect(itemNames.has(dep), `${item.name}: ${dep}`).toBe(true);
      }
    }
  });

  it("does not publish the removed font-weight helper", () => {
    expect(itemNames.has("font-weight")).toBe(false);
    for (const item of registry.items) {
      expect(item.registryDependencies ?? [], item.name).not.toContain("font-weight");
    }
  });

  it("keeps Blocks in their own source catalog and installs them through aliases", () => {
    const blocks = blocksRegistry.items.filter((item) => item.type === "registry:block");
    expect(blocks.map((item) => item.name)).toEqual(expect.arrayContaining([
      "top-nav-app-shell-01",
      "zaiops-operations-01",
    ]));
    for (const item of blocks) {
      for (const file of item.files ?? []) {
        expect(file.path.startsWith("packages/blocks/src/"), file.path).toBe(true);
        expect(file.target.startsWith("components/blocks/"), file.target).toBe(true);
      }
    }
  });
});

describe("docs pages", () => {
  it("has a docs page for every listed component and system entry", async () => {
    const { aiAgentList, componentList, layoutList, systemList } = await import("../docs/lib/components.ts");
    for (const entry of [...componentList, ...aiAgentList, ...layoutList, ...systemList]) {
      expect(existsSync(join(ROOT, "docs/pages/components", entry.slug, "page.tsx")), entry.slug).toBe(true);
    }
  });

  it("does not have orphaned docs pages", async () => {
    const { aiAgentList, componentList, layoutList, systemList } = await import("../docs/lib/components.ts");
    const listed = new Set([...componentList, ...aiAgentList, ...layoutList, ...systemList].map((entry) => entry.slug));
    const pages = readdirSync(join(ROOT, "docs/pages/components"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(ROOT, "docs/pages/components", entry.name, "page.tsx")));
    for (const page of pages) expect(listed.has(page.name), page.name).toBe(true);
  });
});

describe("committed build output", () => {
  const outDir = join(ROOT, "public/r");

  function* outputFiles(dir, prefix = "") {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) yield* outputFiles(join(dir, entry.name), `${prefix}${entry.name}/`);
      else if (entry.name.endsWith(".json")) yield `${prefix}${entry.name}`;
    }
  }

  it("contains every referenced local registry dependency", () => {
    for (const rel of outputFiles(outDir)) {
      const data = JSON.parse(readFileSync(join(outDir, rel), "utf-8"));
      for (const item of Array.isArray(data.items) ? data.items : [data]) {
        for (const dep of item.registryDependencies ?? []) {
          if (!dep.startsWith(BASE_URL)) continue;
          expect(existsSync(join(outDir, dep.slice(BASE_URL.length + 1))), `${rel}: ${dep}`).toBe(true);
        }
      }
    }
  });

  it("does not leak workspace-only imports into installable source", () => {
    for (const rel of outputFiles(outDir)) {
      const data = JSON.parse(readFileSync(join(outDir, rel), "utf-8"));
      for (const item of Array.isArray(data.items) ? data.items : [data]) {
        for (const file of item.files ?? []) {
          expect(file.content ?? "", `${rel}: ${file.path}`).not.toMatch(/from ["'](?:@zeron\/|#(?:components|hooks|system|tokens)\/|@\/)/);
        }
      }
    }
  });

  it("does not retain the removed font-weight artifact", () => {
    expect(existsSync(join(outDir, "font-weight.json"))).toBe(false);
  });

  it("declares the Tailwind animation package injected by the theme installer", () => {
    const theme = JSON.parse(readFileSync(join(outDir, "surfaces.json"), "utf-8"));
    expect(theme.dependencies).toContain("tw-animate-css");
  });

  it("does not retain nested registry artifact directories", () => {
    const nested = readdirSync(outDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    expect(nested).toEqual([]);
  });
});
