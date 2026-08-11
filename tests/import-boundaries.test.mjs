import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf-8"));

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
  const consumers = [...sourceFiles("app"), ...sourceFiles("src/docs")];

  it("keeps Tailwind's explicit source scan aligned with the source layout", () => {
    const styles = readFileSync(join(ROOT, "app/globals.css"), "utf-8");

    expect(styles).toContain('@source "../app";');
    expect(styles).toContain('@source "../src";');
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

  it("exposes every Registry UI item through components/ui", () => {
    for (const item of registry.items.filter((entry) => entry.type === "registry:ui")) {
      const moduleFile = join(ROOT, "src/components/ui", `${item.name}.tsx`);
      const moduleIndex = join(ROOT, "src/components/ui", item.name, "index.ts");
      expect(existsSync(moduleFile) || existsSync(moduleIndex), item.name).toBe(true);
    }
  });

  it("exposes every Registry lib and hook through its public namespace", () => {
    for (const item of registry.items.filter((entry) => entry.type === "registry:lib")) {
      const ts = join(ROOT, "src/system", `${item.name}.ts`);
      const tsx = join(ROOT, "src/system", `${item.name}.tsx`);
      expect(existsSync(ts) || existsSync(tsx), item.name).toBe(true);
    }
    for (const item of registry.items.filter((entry) => entry.type === "registry:hook")) {
      const ts = join(ROOT, "src/system/hooks", `${item.name}.ts`);
      const tsx = join(ROOT, "src/system/hooks", `${item.name}.tsx`);
      expect(existsSync(ts) || existsSync(tsx), item.name).toBe(true);
    }
  });
});
