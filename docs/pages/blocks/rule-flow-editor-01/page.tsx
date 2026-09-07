import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { RuleFlowEditorBlockDocClient } from "./RuleFlowEditorBlockDocClient";

export default async function RuleFlowEditorBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/rule-flow-editor-01/rule-flow-editor.tsx",
    ),
    "utf8",
  );

  return <RuleFlowEditorBlockDocClient code={code} />;
}
