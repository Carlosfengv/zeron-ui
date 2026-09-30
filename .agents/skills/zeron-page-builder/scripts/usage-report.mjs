import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile, lstat, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const portable = (value) => value.split(path.sep).join("/");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const codeFile = (file) => /\.[cm]?[jt]sx?$/.test(file) && !file.endsWith(".d.ts");
const designRules = ["shadcn/no-restyle", "shadcn/no-raw-colors", "shadcn/no-arbitrary-values", "shadcn/no-unknown-classes", "shadcn/no-inline-styles", "shadcn/require-static-classes", "no-restricted-syntax"];
const enabled = (rule) => rule && ![0, "off"].includes(Array.isArray(rule) ? rule[0] : rule);
const inside = (file, root) => file === root || file.startsWith(`${root}/`);

// Input paths are explicit: do not infer task scope from an entire dirty tree.
export async function generateUsageReport({ cwd, files, eslintConfig, baseline, tsconfig, uiRoots = [], blockRoots = [] }) {
  cwd = path.resolve(cwd);
  if (!files?.length) throw new Error("Specify at least one in-scope file.");
  const relative = (file) => portable(path.relative(cwd, path.resolve(cwd, file)));
  const scope = [...new Set(files.map(relative))].sort();
  if (scope.some((file) => file === ".." || file.startsWith("../") || path.isAbsolute(file))) throw new Error("Scope files must be inside the target project.");
  const texts = new Map(await Promise.all(scope.map(async (file) => [file, await readFile(path.join(cwd, file), "utf8")])));
  const report = {
    formatVersion: 1,
    scope: { files: scope, hashes: Object.fromEntries([...texts].map(([file, text]) => [file, hash(text)])) },
    inventory: { status: "unchecked", parserVersion: null, components: [], unknowns: [] },
    tokenReferences: [],
    lint: { status: "unchecked", config: eslintConfig ? relative(eslintConfig) : null, version: null, coverage: [], findings: [], error: null },
    comparison: { status: "unchecked", new: null, existing: null, resolved: null, reason: "No pre-change report supplied." },
    manualReview: "unchecked: public APIs, component alternatives, wrappers, token semantics, CSS, allowed customization, layout and browser states require review.",
  };
  for (const [file, text] of texts) {
    if (!/\.(css|scss|sass|less)$/.test(file)) continue;
    // Lexical references only, not validation of CSS syntax or token intent.
    const stripped = text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
    for (const match of stripped.matchAll(/var\(\s*(--[\w-]+)/g)) report.tokenReferences.push({ file, line: stripped.slice(0, match.index).split("\n").length, token: match[1] });
  }
  const require = createRequire(path.join(cwd, "package.json"));
  let ts;
  try { ts = require("typescript"); }
  catch { report.inventory.unknowns.push({ file: null, line: null, reason: "Target project has no available TypeScript parser; perform component inventory manually." }); }
  if (ts) {
    report.inventory.parserVersion = ts.version;
    let options = { allowJs: true, jsx: ts.JsxEmit.Preserve, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, noEmit: true };
    const configPath = tsconfig ? path.resolve(cwd, tsconfig) : ts.findConfigFile(cwd, ts.sys.fileExists);
    if (configPath) {
      const config = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsed = ts.parseJsonConfigFileContent(config.config ?? {}, ts.sys, path.dirname(configPath));
      options = { ...options, ...parsed.options };
      for (const error of [config.error, ...parsed.errors].filter(Boolean)) report.inventory.unknowns.push({ file: relative(configPath), line: null, reason: ts.flattenDiagnosticMessageText(error.messageText, " ") });
    }
    const program = ts.createProgram(scope.filter(codeFile).map((file) => path.join(cwd, file)), options);
    const checker = program.getTypeChecker();
    for (const file of scope.filter((file) => !codeFile(file) && !/\.(css|scss|sass|less)$/.test(file))) report.inventory.unknowns.push({ file, line: null, reason: "File type is outside the component/style inventory; review manually." });
    const components = new Map();
    const configuredUI = uiRoots.map(relative);
    const configuredBlocks = blockRoots.map(relative);
    function classify(source) {
      if (configuredBlocks.some((root) => inside(source, root)) || inside(source, "packages/blocks/src/application") || /(?:^|\/)node_modules\/@zeron\/blocks\//.test(source)) return "block";
      if (configuredUI.some((root) => inside(source, root)) || inside(source, "packages/ui/src/components") || /(?:^|\/)node_modules\/@zeron\/ui\//.test(source)) return "ui";
      return source.includes("node_modules/") ? "external" : "project";
    }
    for (const file of scope.filter(codeFile)) {
      const ast = program.getSourceFile(path.join(cwd, file));
      if (!ast) { report.inventory.unknowns.push({ file, line: null, reason: "Source was not parsed." }); continue; }
      const location = (node) => ({ file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 });
      for (const error of ast.parseDiagnostics) report.inventory.unknowns.push({ file, line: ast.getLineAndCharacterOfPosition(error.start ?? 0).line + 1, reason: ts.flattenDiagnosticMessageText(error.messageText, " ") });
      function visit(node) {
        if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
          for (const match of node.text.matchAll(/var\(\s*(--[\w-]+)/g)) report.tokenReferences.push({ ...location(node), token: match[1] });
        }
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const name = node.tagName.getText(ast);
          if (!/^[a-z][\w-]*$/.test(name)) {
            let symbol = checker.getSymbolAtLocation(node.tagName);
            if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
            const declarations = symbol?.getDeclarations() ?? [];
            const declaration = declarations.find((item) => !ts.isImportSpecifier(item) && !ts.isImportClause(item) && !ts.isNamespaceImport(item));
            // Value aliases and dynamic member factories require manual tracing.
            const dynamicAlias = declaration && ts.isVariableDeclaration(declaration) && declaration.initializer && (ts.isIdentifier(declaration.initializer) || ts.isPropertyAccessExpression(declaration.initializer) || ts.isElementAccessExpression(declaration.initializer));
            if (!declaration || dynamicAlias) report.inventory.unknowns.push({ ...location(node), name, reason: "Unresolved component or value alias; trace its source manually." });
            else {
              const source = relative(declaration.getSourceFile().fileName);
              const exportedName = symbol.getName();
              const sourceCategory = classify(source);
              const moduleSymbol = checker.getSymbolAtLocation(declaration.getSourceFile());
              const exported = moduleSymbol && checker.getExportsOfModule(moduleSymbol).some((item) => (item.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(item) : item) === symbol);
              const category = ["block", "ui"].includes(sourceCategory) && !exported ? "internal" : sourceCategory;
              const key = `${source}:${exportedName}:${exported ? "export" : declaration.pos}`;
              if (!components.has(key)) components.set(key, { name: exportedName, source, category, sourceCategory, provenance: "Source classification only; release/hash verification remains manual.", uses: [] });
              components.get(key).uses.push({ ...location(node), localName: name });
            }
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
    report.inventory.components = [...components.values()].sort((a, b) => `${a.source}:${a.name}`.localeCompare(`${b.source}:${b.name}`));
    report.inventory.status = report.inventory.unknowns.length ? "unchecked" : "passed";
  }
  if (eslintConfig) {
    try {
      const { ESLint } = require("eslint");
      report.lint.version = ESLint.version;
      const eslint = new ESLint({ cwd, overrideConfigFile: path.resolve(cwd, eslintConfig) });
      for (const file of scope) {
        const config = await eslint.calculateConfigForFile(path.join(cwd, file));
        const rules = Object.fromEntries(designRules.map((id) => [id, config?.rules?.[id] ?? "off"]));
        const active = Object.keys(rules).filter((id) => enabled(rules[id]));
        const ignored = await eslint.isPathIgnored(path.join(cwd, file));
        const coverage = { file, status: ignored || !active.length ? "unchecked" : "checked", rules, reason: ignored ? "Ignored or outside ESLint configuration." : !active.length ? "No supported design rules enabled." : null };
        report.lint.coverage.push(coverage);
        if (ignored) continue;
        const [result] = await eslint.lintFiles([path.join(cwd, file)]);
        for (const message of result.messages) report.lint.findings.push({ file, line: message.line ?? null, column: message.column ?? null, ruleId: message.ruleId, severity: message.severity, fatal: Boolean(message.fatal), message: message.message, sourceLine: (texts.get(file).split("\n")[message.line - 1] ?? "").trim() });
        if (result.fatalErrorCount) { coverage.status = "unchecked"; coverage.reason = "Parser/configuration failure."; }
      }
      report.lint.status = report.lint.findings.some((item) => item.severity === 2) ? "failed" : report.lint.coverage.some((item) => item.status === "unchecked") ? "unchecked" : "passed";
    } catch (error) { report.lint.error = error.message; report.lint.status = "unchecked"; }
  }
  if (baseline) {
    const beforeText = await readFile(path.resolve(cwd, baseline), "utf8");
    const before = JSON.parse(beforeText);
    const comparable = before?.formatVersion === 1 && Array.isArray(before.lint?.findings) && Array.isArray(before.lint?.coverage) && !before.lint.error && !report.lint.error && before.lint.config === report.lint.config && before.lint.version === report.lint.version && scope.every((file) => {
      const old = before.lint.coverage?.find((item) => item.file === file);
      const current = report.lint.coverage.find((item) => item.file === file);
      return old?.status === "checked" && current?.status === "checked" && JSON.stringify(old.rules) === JSON.stringify(current.rules);
    });
    if (comparable) {
      const key = (finding) => JSON.stringify([finding.file, finding.ruleId, finding.severity, finding.message, finding.sourceLine]);
      const remaining = new Map();
      for (const finding of before.lint.findings.filter((item) => scope.includes(item.file))) remaining.set(key(finding), (remaining.get(key(finding)) ?? 0) + 1);
      let existing = 0;
      for (const finding of report.lint.findings) {
        const id = key(finding);
        finding.attribution = remaining.get(id) ? "existing" : "new";
        if (remaining.get(id)) { existing++; remaining.set(id, remaining.get(id) - 1); }
      }
      report.comparison = { status: "compared", baselineHash: hash(beforeText), new: report.lint.findings.length - existing, existing, resolved: [...remaining.values()].reduce((a, b) => a + b, 0), reason: "Diagnostic multiset matched by file/rule/message/source line; changed lines count as new. Human review is still required." };
    } else report.comparison.reason = "Missing baseline coverage or changed lint version/rules/config; attribution is unverified.";
  }
  report.counts = {
    files: scope.length,
    componentKinds: report.inventory.components.length,
    jsxUses: report.inventory.components.reduce((sum, item) => sum + item.uses.length, 0),
    unresolvedComponents: report.inventory.unknowns.filter((item) => item.name).length,
    explicitTokenKinds: new Set(report.tokenReferences.map((item) => item.token)).size,
    lintCheckedFiles: report.lint.coverage.filter((item) => item.status === "checked").length,
    findings: report.lint.findings.length,
    errors: report.lint.findings.filter((item) => item.severity === 2).length,
    warnings: report.lint.findings.filter((item) => item.severity === 1).length,
    byCategory: Object.fromEntries(["block", "ui", "internal", "project", "external"].map((category) => {
      const items = report.inventory.components.filter((item) => item.category === category);
      return [category, { kinds: items.length, jsxUses: items.reduce((sum, item) => sum + item.uses.length, 0) }];
    })),
    byRule: Object.fromEntries([...new Set(report.lint.findings.map((item) => item.ruleId ?? "parser"))].sort().map((id) => [id, report.lint.findings.filter((item) => (item.ruleId ?? "parser") === id).length])),
  };
  return report;
}

const cell = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ").replaceAll("`", "'");
export function renderUsageReport(report) {
  const table = (headers, rows) => [headers, headers.map(() => "---"), ...rows].map((row) => `| ${row.map(cell).join(" | ")} |`).join("\n");
  const status = { passed: "通过", failed: "未通过", unchecked: "未检查完整" };
  const categories = { block: "Block", ui: "UI", internal: "内部辅助", project: "业务组件", external: "第三方" };
  const ruleLabels = { "shadcn/no-restyle": "组件样式覆盖", "shadcn/no-raw-colors": "原始颜色", "shadcn/no-arbitrary-values": "任意样式值", "shadcn/no-unknown-classes": "未知类名", "shadcn/no-inline-styles": "内联样式", "shadcn/require-static-classes": "动态类名", "no-restricted-syntax": "额外项目约束" };
  const disabled = [...new Set(report.lint.coverage.flatMap((item) => Object.keys(item.rules).filter((id) => !enabled(item.rules[id]))))];
  const unchecked = report.lint.coverage.filter((item) => item.status === "unchecked");
  const issues = [
    ...report.lint.findings.map((item) => [`${item.file}:${item.line ?? "?"}`, `${ruleLabels[item.ruleId] ?? item.ruleId ?? "解析失败"}：${item.message}`, item.attribution === "new" ? "新增" : item.attribution === "existing" ? "原有" : "归属未确认"]),
    ...report.inventory.unknowns.map((item) => [`${item.file ?? "项目"}:${item.line ?? "?"}`, item.name ? `组件 ${item.name} 的来源待确认` : item.reason, "未检查"]),
  ];
  return [
    "# 组件与样式报告",
    "## 统计",
    `范围：${report.counts.files} 个文件；识别 ${report.counts.componentKinds} 种组件、${report.counts.jsxUses} 次代码使用。静态检查：${status[report.lint.status]}（覆盖 ${report.counts.lintCheckedFiles}/${report.counts.files} 个文件），${report.counts.errors} 个错误、${report.counts.warnings} 个警告。`,
    "## 组件",
    report.inventory.components.length ? table(["分类", "种类 / 使用次数", "使用组件"], Object.entries(report.counts.byCategory).filter(([, counts]) => counts.kinds).map(([category, counts]) => [categories[category], `${counts.kinds} / ${counts.jsxUses}`, category === "internal" ? "辅助实现，明细见 JSON" : report.inventory.components.filter((item) => item.category === category).map((item) => `${item.name}${item.uses.length > 1 ? ` ×${item.uses.length}` : ""}`).join("、")])) : `未识别到组件。组件统计：${status[report.inventory.status]}。`,
    "## 问题与说明",
    issues.length ? table(["位置", "问题", "归属"], issues.slice(0, 10)) : report.lint.status === "passed" ? "静态检查未发现问题。" : "检查不完整，暂不能判断是否存在规范问题。",
    issues.length > 10 ? `共 ${issues.length} 条问题与待确认项，此处展示前 10 条；其余见 JSON。` : "",
    report.lint.error ? `检查未完成：${report.lint.error}` : "",
    unchecked.length ? `未检查文件：${unchecked.slice(0, 5).map((item) => item.file).join("、")}${unchecked.length > 5 ? ` 等 ${unchecked.length} 个` : ""}。` : "",
    disabled.length ? `未启用检查：${disabled.map((id) => ruleLabels[id]).join("、")}。` : "",
    report.comparison.status === "compared" ? `与基线比较：新增 ${report.comparison.new}、原有 ${report.comparison.existing}、已消除 ${report.comparison.resolved} 条诊断。` : report.lint.findings.length ? "没有可比基线，问题归属未确认。" : "",
    "组件选择、合理定制与样式变量语义需人工确认；请在交付时补充必要说明。完整来源、位置与检查明细见同名 JSON。次数按代码统计，Block/UI 种类不等于 Registry 条目数。",
  ].filter(Boolean).join("\n\n") + "\n";
}

async function main() {
  const options = { files: [], uiRoots: [], blockRoots: [] };
  const flags = { "--cwd": "cwd", "--file": "files", "--eslint-config": "eslintConfig", "--baseline": "baseline", "--tsconfig": "tsconfig", "--ui-root": "uiRoots", "--block-root": "blockRoots", "--output": "output" };
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: node usage-report.mjs --cwd <project> --file <path> [--file <path> ...] --output <prefix> [--eslint-config <path>] [--baseline <before.json>] [--tsconfig <path>] [--ui-root <verified directory>] [--block-root <verified directory>]\nUses the target project's TypeScript and optional ESLint; installs nothing. Writes <prefix>.json and <prefix>.md. Missing checks remain unchecked. Exit 0 means report generation succeeded, not compliance.");
    return;
  }
  for (let index = 0; index < args.length; index += 2) {
    const key = flags[args[index]];
    const value = args[index + 1];
    if (!key || !value || value.startsWith("--")) throw new Error(`Invalid argument: ${args[index]}. Use --help.`);
    if (Array.isArray(options[key])) options[key].push(value);
    else options[key] = value;
  }
  if (!options.cwd || !options.output) throw new Error("--cwd and --output are required.");
  const output = path.resolve(options.cwd, options.output);
  const protectedPaths = [...options.files, options.baseline, options.eslintConfig, options.tsconfig].filter(Boolean).map((file) => path.resolve(options.cwd, file));
  if ([`${output}.json`, `${output}.md`].some((file) => protectedPaths.includes(file))) throw new Error("Report output must not overwrite an input file.");
  // Refresh our own reports, but do not replace unrelated project content.
  for (const extension of ["json", "md"]) {
    const target = `${output}.${extension}`;
    try {
      const stat = await lstat(target);
      if (!stat.isFile()) throw new Error(`Report output is not a regular file: ${target}`);
      const text = await readFile(target, "utf8");
      const ownReport = extension === "md" ? ["# Component and style usage report\n", "# 组件与样式报告\n"].some((title) => text.startsWith(title)) : (() => {
        try { const value = JSON.parse(text); return value.formatVersion === 1 && value.scope && value.inventory && value.lint && value.counts; }
        catch { return false; }
      })();
      if (!ownReport) throw new Error(`Refusing to overwrite unrelated output: ${target}`);
    } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  const report = await generateUsageReport(options);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(`${output}.json`, JSON.stringify(report, null, 2) + "\n");
  await writeFile(`${output}.md`, renderUsageReport(report));
  console.log(JSON.stringify({ output, inventory: report.inventory.status, lint: report.lint.status, counts: report.counts }));
}

if (process.argv[1] && await realpath(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
