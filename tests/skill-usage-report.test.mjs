import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { generateUsageReport, renderUsageReport } from "../.agents/skills/zeron-page-builder/scripts/usage-report.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = path.join(root, ".agents/skills/zeron-page-builder/scripts/usage-report.mjs");
const temporary = [];
const execute = promisify(execFile);
afterEach(async () => { await Promise.all(temporary.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

async function fixture({ dependencies = true } = {}) {
  const cwd = await mkdtemp(path.join(tmpdir(), "zeron-usage-report-"));
  temporary.push(cwd);
  async function put(file, content) {
    await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
    await writeFile(path.join(cwd, file), content);
  }
  await put("package.json", '{"type":"module"}');
  if (dependencies) await symlink(path.join(root, "node_modules"), path.join(cwd, "node_modules"), "dir");
  await put("tsconfig.json", JSON.stringify({ compilerOptions: { jsx: "preserve", module: "esnext", moduleResolution: "bundler", paths: { "@/*": ["./src/*"] } } }));
  await put("src/ui/button.tsx", "export const Button = () => <button/>; export const Unused = () => <i/>;");
  await put("src/barrel.ts", 'export { Button as Action, Unused } from "./ui/button";');
  await put("src/wrapper.tsx", 'import {Button} from "./ui/button"; export const BusinessAction = () => <Button/>;');
  await put("src/Page.tsx", `import {Action as Save, Unused} from "@/barrel";
import * as UI from "./ui/button";
import {BusinessAction} from "./wrapper";
export const Page = () => <div><Save/><UI.Button></UI.Button><Save/><BusinessAction/></div>;`);
  const adapter = pathToFileURL(path.join(root, "packages/lint/index.mjs")).href;
  await put("eslint.design.config.mjs", `import parser from "@typescript-eslint/parser";
import {createZeronConfig} from ${JSON.stringify(adapter)};
export default [{ignores:["src/ignored.tsx"]},{files:["**/*.tsx"], languageOptions:{parser}},
...createZeronConfig({files:["**/*.tsx"],componentFiles:[],componentImports:["^@/","^\\\\./"]}),
{rules:{"shadcn/no-unknown-classes":"off"}}];`);
  const options = { cwd, files: ["src/Page.tsx"], uiRoots: ["src/ui"], eslintConfig: "eslint.design.config.mjs" };
  return { cwd, put, options };
}

describe("skill component and style reporting", () => {
  it("counts real JSX through aliases, namespaces and re-exports without unused imports or wrapper internals", async () => {
    const { options } = await fixture();
    const report = await generateUsageReport(options);
    expect(report.inventory.status).toBe("passed");
    expect(report.counts.componentKinds).toBe(2);
    expect(report.counts.jsxUses).toBe(4);
    expect(report.counts.byCategory.ui).toEqual({ kinds: 1, jsxUses: 3 });
    expect(report.counts.byCategory.project).toEqual({ kinds: 1, jsxUses: 1 });
    expect(report.inventory.components.find((item) => item.name === "Button").uses.map((item) => item.localName)).toEqual(["Save", "UI.Button", "Save"]);
    expect(report.inventory.components.some((item) => item.name === "Unused")).toBe(false);
    expect(report.lint.status).toBe("passed");
    expect(report.lint.coverage[0].rules["shadcn/no-inline-styles"]).toEqual([0]);
  });

  it("leaves copied components project-owned until a verified root is supplied", async () => {
    const { options } = await fixture();
    const report = await generateUsageReport({ ...options, uiRoots: [] });
    expect(report.counts.byCategory.ui.kinds).toBe(0);
    expect(report.counts.byCategory.project.kinds).toBe(2);
  });

  it("separates private helpers from exported library components", async () => {
    const { options, put } = await fixture();
    await put("src/ui/button.tsx", "const Label = () => <span/>; export const Button = () => <button><Label/></button>;");
    const report = await generateUsageReport({ ...options, files: ["src/ui/button.tsx"] });
    expect(report.counts.byCategory.ui).toEqual({ kinds: 0, jsxUses: 0 });
    expect(report.counts.byCategory.internal).toEqual({ kinds: 1, jsxUses: 1 });
    expect(report.inventory.components[0]).toMatchObject({ name: "Label", category: "internal", sourceCategory: "ui" });
  });

  it("detects design violations and compares identities when totals remain equal", async () => {
    const { options, put } = await fixture();
    const original = 'export const Page = () => <><div className="bg-blue-500"/><div className="p-[13px]"/></>;';
    await put("src/Page.tsx", original);
    const before = await generateUsageReport(options);
    expect(before.lint.status).toBe("failed");
    expect(before.counts.findings).toBe(2);
    await put("before.json", JSON.stringify(before));
    await put("src/Page.tsx", original.replace("p-[13px]", "rounded-[13px]"));
    const after = await generateUsageReport({ ...options, baseline: "before.json" });
    expect(after.counts.findings).toBe(2);
    // Both findings share an edited source line, so attribution is conservatively new.
    expect(after.comparison).toMatchObject({ status: "compared", new: 2, existing: 0, resolved: 2 });
    await put("src/Page.tsx", "\n\n" + original);
    const moved = await generateUsageReport({ ...options, baseline: "before.json" });
    expect(moved.comparison).toMatchObject({ status: "compared", new: 0, existing: 2, resolved: 0 });
  });

  it("marks unavailable dependencies and ignored/CSS coverage unchecked", async () => {
    const missing = await fixture({ dependencies: false });
    const noTools = await generateUsageReport(missing.options);
    expect(noTools.inventory.status).toBe("unchecked");
    expect(noTools.lint.status).toBe("unchecked");
    expect(noTools.counts.lintCheckedFiles).toBe(0);
    const present = await fixture();
    await present.put("src/ignored.tsx", "export const Page = () => <Missing/>;");
    await present.put("src/styles.css", "/* var(--fake) */\n.box {color: var(--fg-default);}");
    const report = await generateUsageReport({ ...present.options, files: ["src/ignored.tsx", "src/styles.css"] });
    expect(report.lint.status).toBe("unchecked");
    expect(report.counts.unresolvedComponents).toBe(1);
    expect(report.counts.lintCheckedFiles).toBe(0);
    expect(report.tokenReferences).toEqual([{ file: "src/styles.css", line: 2, token: "--fg-default" }]);
    expect(renderUsageReport(report)).toContain("未检查文件：src/ignored.tsx、src/styles.css");
  });

  it("does not attribute new-file findings without a baseline or changes to enabled policies", async () => {
    const { options, put } = await fixture();
    await put("before.json", JSON.stringify(await generateUsageReport(options)));
    await put("src/Added.tsx", 'export const Added = () => <div className="bg-blue-500"/>;');
    const expanded = await generateUsageReport({ ...options, files: [...options.files, "src/Added.tsx"], baseline: "before.json" });
    expect(expanded.comparison.status).toBe("unchecked");
    const config = await readFile(path.join(options.cwd, options.eslintConfig), "utf8");
    await put("eslint.changed.config.mjs", config.replace('"shadcn/no-unknown-classes":"off"', '"shadcn/no-unknown-classes":"off", "shadcn/no-raw-colors":"off"'));
    expect((await generateUsageReport({ ...options, eslintConfig: "eslint.changed.config.mjs", baseline: "before.json" })).comparison.status).toBe("unchecked");
  });

  it("marks component value aliases and parser errors unresolved", async () => {
    const { options, put } = await fixture();
    await put("src/Page.tsx", 'import {Button} from "./ui/button"; const Alias = Button; export const Page = () => <Alias/>;');
    const alias = await generateUsageReport(options);
    expect(alias.inventory.status).toBe("unchecked");
    expect(alias.counts.unresolvedComponents).toBe(1);
    await put("src/Page.tsx", "export const Page = () => <div");
    const broken = await generateUsageReport(options);
    expect(broken.inventory.status).toBe("unchecked");
    expect(broken.lint.status).toBe("failed");
    expect(broken.counts.lintCheckedFiles).toBe(0);
  });

  it("writes a readable CLI report and refuses missing scope or overwriting source inputs", async () => {
    const { cwd, options } = await fixture();
    const args = [script, "--cwd", cwd, "--file", "src/Page.tsx", "--ui-root", "src/ui", "--output", "reports/usage"];
    const result = JSON.parse((await execute(process.execPath, args)).stdout);
    expect(result.counts.jsxUses).toBe(4);
    expect(JSON.parse(await readFile(path.join(cwd, "reports/usage.json"), "utf8")).lint.status).toBe("unchecked");
    const markdown = await readFile(path.join(cwd, "reports/usage.md"), "utf8");
    expect(markdown).toContain("Button ×3");
    expect(markdown).not.toContain("src/ui/button.tsx");
    expect(markdown).toContain("未检查完整");
    expect(JSON.parse(await readFile(path.join(cwd, "reports/usage.json"), "utf8")).inventory.components[0].source).toBe("src/ui/button.tsx");
    await execute(process.execPath, args);
    await expect(generateUsageReport({ ...options, files: [] })).rejects.toThrow("in-scope");
    await expect(generateUsageReport({ ...options, files: ["../outside.tsx"] })).rejects.toThrow("inside");
    await expect(generateUsageReport({ ...options, files: ["src/Missing.tsx"] })).rejects.toThrow();
    await expect(execute(process.execPath, [script, "--cwd", cwd, "--file", "reports/usage.md", "--output", "reports/usage"])).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining("overwrite an input") });
    await expect(execute(process.execPath, [script, "--cwd", cwd, "--file", "src/Page.tsx", "--output", "tsconfig"])).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining("unrelated output") });
  });
});
