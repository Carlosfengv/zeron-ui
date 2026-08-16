import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const registry = JSON.parse(readFileSync(join(ROOT, "packages/ui/registry.json"), "utf-8"));
const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

function sourceFiles(relativeDir) {
  const files = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(path);
    }
  };
  visit(join(ROOT, relativeDir));
  return files;
}

describe("public import boundaries", () => {
  const consumers = [...sourceFiles("app"), ...sourceFiles("docs")];
  const packageSources = [
    ...sourceFiles("packages/ui/src"),
    ...sourceFiles("packages/blocks/src"),
    ...sourceFiles("packages/icons/src"),
  ];

  it("keeps Tailwind's explicit source scan aligned with the source layout", () => {
    const styles = readFileSync(join(ROOT, "app/globals.css"), "utf-8");

    expect(styles).toContain('@source "../app";');
    expect(styles).toContain('@source "../docs";');
    expect(styles).toContain('@source "../packages/ui/src";');
    expect(styles).toContain('@source "../packages/blocks/src";');
    expect(styles).not.toMatch(
      /@source "\.\.\/(?:components|hooks|lib|registry)";/,
    );
  });

  it("keeps application and docs code out of Registry implementation paths", () => {
    for (const file of consumers) {
      expect(readFileSync(file, "utf-8"), file).not.toContain("@/registry/default");
    }
  });

  it("does not consume flavored compatibility entries", () => {
    for (const file of consumers) {
      expect(readFileSync(file, "utf-8"), file).not.toContain("@/components/flavored");
    }
  });

  it("keeps package source independent from app, docs, and root aliases", () => {
    for (const file of packageSources) {
      const source = readFileSync(file, "utf-8");
      expect(source, file).not.toMatch(/from ["']@\/(?:app|docs|components|hooks|lib)/);
      expect(source, file).not.toMatch(/from ["'](?:@docs|@\/app)/);
    }
  });

  it("consumes UI only through public workspace exports", () => {
    for (const file of consumers) {
      expect(readFileSync(file, "utf-8"), file).not.toContain("packages/ui/src/");
    }
  });

  it("keeps licensed HugeIcons packages behind the optional Registry item", () => {
    const rootDependencies = Object.keys(packageJson.dependencies ?? {});
    const appProviders = readFileSync(join(ROOT, "app/app-providers.tsx"), "utf-8");
    const proItem = registry.items.find((item) => item.name === "pro-icon-provider");

    expect(rootDependencies.some((dependency) => dependency.startsWith("@hugeicons-pro/"))).toBe(false);
    expect(appProviders).not.toContain("ProIconProvider");
    expect(proItem?.dependencies).toEqual([
      "@hugeicons-pro/core-stroke-standard",
      "@hugeicons-pro/core-bulk-rounded",
      "@hugeicons-pro/core-duotone-rounded",
    ]);
  });

  it("exposes every Registry UI item through components/ui", () => {
    for (const item of registry.items.filter((entry) => entry.type === "registry:ui")) {
      const moduleFile = join(ROOT, "packages/ui/src/components", `${item.name}.tsx`);
      const moduleIndex = join(ROOT, "packages/ui/src/components", item.name, "index.ts");
      expect(existsSync(moduleFile) || existsSync(moduleIndex), item.name).toBe(true);
    }
  });

  it("exposes every Registry lib and hook through its public namespace", () => {
    for (const item of registry.items.filter((entry) => entry.type === "registry:lib")) {
      const files = (item.files ?? []).filter((file) => file.type === "registry:lib");
      expect(files.length, item.name).toBeGreaterThan(0);
      for (const file of files) {
        expect(
          file.path.startsWith("packages/ui/src/system/") ||
            file.path.startsWith("packages/ui/src/tokens/"),
          file.path
        ).toBe(true);
      }
    }
    for (const item of registry.items.filter((entry) => entry.type === "registry:hook")) {
      const ts = join(ROOT, "packages/ui/src/hooks", `${item.name}.ts`);
      const tsx = join(ROOT, "packages/ui/src/hooks", `${item.name}.tsx`);
      expect(existsSync(ts) || existsSync(tsx), item.name).toBe(true);
    }
  });
});
