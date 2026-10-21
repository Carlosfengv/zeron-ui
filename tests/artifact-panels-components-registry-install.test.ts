import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blockCatalog } from "@zeron/blocks/catalog";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const nameOf = (name: string) => name.split("/").at(-1)!.replace(/\.json$/, "");
function closure(name: string, items = new Map<string, ReturnType<typeof read>>()) {
  if (items.has(name)) return items;
  const item = read(`public/r/${name}.json`); items.set(name, item);
  for (const dependency of item.registryDependencies ?? []) closure(nameOf(dependency), items);
  return items;
}

describe("Artifact panel component distribution", () => {
  it.each(["artifact-panel", "artifact-preview-panel"])("installs %s without a workspace, conversation or demo dependency", (name) => {
    const exports = read("packages/ui/package.json").exports;
    expect(exports[`./${name}`]).toBe(`./src/components/${name}.tsx`);
    expect(exports[`./${name}/labels`]).toBe(`./src/components/${name}/labels.ts`);
    const items = closure(name);
    expect(items.get(name).type).toBe("registry:ui");
    expect(items.has(name === "artifact-panel" ? "artifact-preview-panel" : "artifact-panel")).toBe(false);
    expect(items.get(name).registryDependencies.map(nameOf)).toContain("artifact-content-renderer");
    expect(items.get("artifact-content-renderer").type).toBe("registry:lib");
    expect(items.get("artifact-content-renderer").files[0].target).toBe("components/ui/artifact-content-renderer.tsx");
    for (const excluded of ["chat-thread", "chat-workspace-01", "artifact-01", "artifact-card", "resizable", "input-message"]) expect(items.has(excluded)).toBe(false);
    const types = items.get(name).files.find((file: { target: string }) => file.target.endsWith("/types.ts")).content;
    expect(types).not.toContain("ChatWorkspaceProps");
    expect(types).not.toContain("ArtifactWorkspaceProps");
    for (const item of items.values()) {
      expect(item.type).not.toBe("registry:block");
      for (const file of item.files ?? []) {
        expect(file.target).not.toContain("components/blocks/");
        expect(file.content).not.toContain("@zeron/blocks");
        expect(file.content).not.toContain("#components/");
        expect(file.content).not.toContain("createArtifactDemoDocuments");
        expect(file.content).not.toContain("createChatWorkspaceDemoResources");
      }
    }
    expect(checkRegistry([...items.values()])).toEqual([]);
  });

  it("installs one shared renderer when both panels arrive through the existing artifact block", () => {
    const items = closure("artifact-01");
    const renderers = [...items.values()].flatMap((item) => item.files ?? []).filter((file) => file.target === "components/ui/artifact-content-renderer.tsx");
    expect(renderers).toHaveLength(1);
    expect(items.get("artifact-content-renderer").registryDependencies.map(nameOf)).toEqual(expect.arrayContaining(["code-block", "markdown"]));
    for (const name of ["artifact-panel", "artifact-preview-panel"]) {
      const adapter = items.get(name).files.find((file: { target: string }) => /\/(code-preview|content)\.tsx$/.test(file.target));
      expect(adapter.content).toContain('from "../artifact-content-renderer"');
    }
    const exports = read("packages/ui/package.json").exports;
    expect(exports["./artifact-panel/code-preview"]).toBe("./src/components/artifact-panel/code-preview.tsx");
    expect(exports["./artifact-preview-panel/content"]).toBe("./src/components/artifact-preview-panel/content.tsx");
    expect(exports["./artifact-content-renderer"]).toBeUndefined();
  });

  it("preserves the resource panel's installed adapters and shared helper paths", () => {
    const items = closure("chat-workspace-01");
    const block = items.get("chat-workspace-01");
    expect(block.registryDependencies.map(nameOf)).toContain("artifact-panel");
    for (const file of ["artifact-panel.tsx", "artifact-tabs.tsx", "artifact-code-preview.tsx", "artifact-preview.tsx", "artifact-utils.ts", "artifact-labels.ts", "chat-workspace-types.ts"]) {
      expect(block.files.some((item: { target: string }) => item.target === `components/blocks/chat-workspace-01/${file}`)).toBe(true);
    }
    expect(block.files.some((item: { content: string }) => item.content.includes('from "@ui/artifact-panel"'))).toBe(true);
    expect(blockCatalog.find((item) => item.name === "chat-workspace-01")?.dependencies).toEqual(block.registryDependencies.map(nameOf));
    expect(checkRegistry([...items.values()])).toEqual([]);
  });

  it("preserves the generated preview's installed adapters and original block composition", () => {
    const items = closure("artifact-01");
    const block = items.get("artifact-01");
    expect(block.registryDependencies.map(nameOf)).toEqual(["chat-workspace-01", "artifact-preview-panel"]);
    expect(items.has("artifact-panel")).toBe(true);
    for (const file of ["artifact-preview-panel.tsx", "artifact-content.tsx", "artifact-labels.ts", "artifact-types.ts", "artifact-workspace.tsx", "artifact-demo-data.ts"]) {
      expect(block.files.some((item: { target: string }) => item.target === `components/blocks/artifact-01/${file}`)).toBe(true);
    }
    expect(block.files.some((item: { content: string }) => item.content.includes('from "@ui/artifact-preview-panel"'))).toBe(true);
    expect(blockCatalog.find((item) => item.name === "artifact-01")?.dependencies).toEqual(block.registryDependencies.map(nameOf));
    expect(checkRegistry([...items.values()])).toEqual([]);
  });
});
