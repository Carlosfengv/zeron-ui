/** Compile the installed public module when a component has no bespoke demo.
 * This exercises its exported dependency graph; behavior belongs in UI tests. */
export function consumerImportExample(snapshot, component, framework) {
  const item = JSON.parse(snapshot.get(`${component}.json`) ?? "null");
  if (!item || !["next", "vite"].includes(framework)) throw new Error(`Missing consumer entry: ${component}`);
  const files = (item.files ?? []).filter(file => /\.[cm]?tsx?$/.test(file.target ?? ""));
  const entry = files.find(file => /\/index\.[cm]?tsx?$/.test(file.target)) ?? files[0];
  if (!entry || !/^(components|lib|hooks)\/[\w./-]+$/.test(entry.target) || entry.target.split("/").includes("..")) {
    throw new Error(`No safe TypeScript consumer entry: ${component}`);
  }
  const modulePath = `@/${framework === "vite" ? "src/" : ""}${entry.target.replace(/\.[cm]?tsx?$/, "")}`;
  const imports = `import * as installed from ${JSON.stringify(modulePath)};`;
  return framework === "next"
    ? `"use client";\n${imports}\nexport default function Page() { return <pre>{Object.keys(installed).join(", ")}</pre>; }\n`
    : `import { createRoot } from "react-dom/client";\nimport "./index.css";\n${imports}\ncreateRoot(document.getElementById("root")!).render(<pre>{Object.keys(installed).join(", ")}</pre>);\n`;
}
