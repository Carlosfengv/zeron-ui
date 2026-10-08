import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const groups = {
  "radar-chart": ["radar-chart.tsx", "radar-grid.tsx", "radar-axis.tsx", "radar-labels.tsx", "radar-area.tsx"],
  "ring-chart": ["ring-chart.tsx", "ring.tsx", "ring-center.tsx"],
  "line-chart": ["line-chart.tsx", "line.tsx", "line-chart-loading.tsx", "line-series-terminal-marker.tsx"],
  "bar-chart": ["bar-chart.tsx", "bar.tsx", "bar-squares.tsx", "bar-depth.tsx", "bar-chart-loading.tsx", "bar-x-axis.tsx", "bar-y-axis.tsx"],
  "pie-chart": ["pie-chart.tsx", "pie-slice.tsx", "pie-center.tsx", "pie-center-shell.tsx", "chart-stat-flow.tsx"],
  "live-line-chart": ["live-line-chart.tsx", "live-line.tsx", "live-x-axis.tsx", "live-y-axis.tsx"],
  "heatmap-chart": ["heatmap/heatmap-chart.tsx", "heatmap/heatmap-cells.tsx", "heatmap/heatmap-legend.tsx", "heatmap/heatmap-tooltip.tsx", "heatmap/heatmap-separator.tsx", "heatmap/heatmap-chart-loading.tsx", "heatmap/heatmap-x-axis.tsx", "heatmap/heatmap-y-axis.tsx"],
};
const check = process.argv.includes("--check");
const configPath = "packages/ui/tsconfig.json";
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, "packages/ui");
const program = ts.createProgram(options.fileNames, options.options);
const checker = program.getTypeChecker();
for (const [slug, files] of Object.entries(groups)) {
  const rows = [];
  for (const file of files) {
    const path = join("packages/ui/src/components/charts", file);
    const source = program.getSourceFile(path);
    if (!source) throw new Error("Missing API source: " + path);
    const defaults = new Map();
    function collectDefaults(node) {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const values = new Map();
        for (const parameter of node.parameters) {
          if (!ts.isObjectBindingPattern(parameter.name)) continue;
          for (const element of parameter.name.elements) {
            if (element.initializer) values.set((element.propertyName ?? element.name).getText(source), element.initializer.getText(source));
          }
        }
        defaults.set(node.name.text, values);
      }
      ts.forEachChild(node, collectDefaults);
    }
    collectDefaults(source);
    for (const node of source.statements) {
      if (!node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) || !node.name?.text.endsWith("Props")) continue;
      const properties = checker.getTypeAtLocation(node).getProperties();
      for (const symbol of properties) {
        const property = symbol.declarations?.find(ts.isPropertySignature);
        if (!property) continue;
        const doc = (property.jsDoc ?? []).map(comment => typeof comment.comment === "string" ? comment.comment : "").join(" ");
        const defaultMatch = doc.match(/Default:\s*([^\n]+)/i);
        rows.push({
          name: node.name.text.replace(/Props$/, "") + "." + symbol.name,
          type: property.type?.getText().replace(/\s+/g, " ") ?? "unknown",
          default: defaultMatch?.[1].replace(/\.$/, "").replace(/\*\//g, "").trim() ?? (defaults.get(node.name.text.replace(/Props$/, ""))?.get(symbol.name) ?? (property.questionToken ? "—" : "required")),
          description: doc || (property.questionToken ? "Optional composition API." : "Required composition API."),
        });
      }
    }
  }
  const path = join("docs/pages/components", slug, "api.json");
  const output = JSON.stringify(rows, null, 2) + "\n";
  if (check) {
    if (readFileSync(path, "utf8") !== output) throw new Error(path + " is stale");
  } else writeFileSync(path, output);
  console.log(slug + ": " + rows.length + " API fields");
}
