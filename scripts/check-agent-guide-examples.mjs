import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { parse } from "yaml";
import { generateAgentGuideLoaders } from "./generate-agent-guide-loaders.mjs";
import { readOwnedFile, serialize, sha256 } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
if (process.argv.slice(2).length) throw new Error("Usage: pnpm agents:guides:examples:check");
const output = path.join(root, "output/agent-access");
await mkdir(output, { recursive: true });
// Compile inside the project so workspace exports and installed types resolve.
const temporary = await mkdtemp(path.join(output, "guide-examples-"));
try {
  const examples = [];
  for (const key of await generateAgentGuideLoaders({ check: true })) {
    const text = (await readOwnedFile(root, `docs/agent-guides/${key}`)).toString("utf8");
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    const meta = frontmatter ? parse(frontmatter[1]) : null;
    if (meta?.typecheck_examples !== true) continue;
    const snippets = [...text.matchAll(/^```tsx\s*\r?\n([\s\S]*?)^```\s*$/gm)];
    if (!snippets.length) throw new Error(`Guide opts into example checks but has no TSX: ${key}`);
    for (const [index, snippet] of snippets.entries()) {
      const file = path.join(temporary, `${key.replaceAll("/", "-")}-${index + 1}.tsx`);
      await writeFile(file, snippet[1]);
      examples.push({ guide: key, example: index + 1, sha256: sha256(snippet[1]), file });
    }
  }
  const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  // Preserve project ambient declarations (for example SVG imports) when checking isolated snippets.
  const roots = [...examples.map((example) => example.file), ...parsed.fileNames.filter((file) => file.endsWith(".d.ts"))];
  const program = ts.createProgram(roots, { ...parsed.options, incremental: false, noEmit: true });
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  const report = { schemaVersion: 1, scope: "workspace-types-only", status: diagnostics.length ? "failed" : "passed",
    guides: new Set(examples.map((example) => example.guide)).size,
    examples: examples.map(({ file: _file, ...example }) => example),
    diagnostics: diagnostics.map((diagnostic) => ({ file: diagnostic.file ? path.relative(root, diagnostic.file.fileName) : null,
      line: diagnostic.file && diagnostic.start !== undefined ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1 : null,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n") })) };
  const evidence = path.join(output, "guide-examples.json");
  await writeFile(evidence, serialize(report));
  console.log(`Agent guide examples: ${report.guides} guides, ${examples.length} TSX examples, ${report.status}\nEvidence: ${evidence}`);
  if (diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: (name) => name, getCurrentDirectory: () => root, getNewLine: () => "\n" }));
    process.exitCode = 1;
  }
} finally { await rm(temporary, { recursive: true, force: true }); }
