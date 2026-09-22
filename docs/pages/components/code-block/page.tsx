"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@zeron/ui/button";
import {
  CodeBlock,
  CodeConflict,
  CodeDiff,
  CodePatch,
  CodeView,
  type SelectedLineRange,
} from "@zeron/ui/code-block";
import { CodeEditProvider } from "@zeron/ui/code-block/edit";
import { CodeStream } from "@zeron/ui/code-block/stream";
import { CodeWorkerProvider } from "@zeron/ui/code-block/worker";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";

const file = {
  name: "status-card.tsx",
  lang: "tsx" as const,
  contents: `type Status = "healthy" | "degraded";

export function StatusCard({ status }: { status: Status }) {
  return <span data-status={status}>{status}</span>;
}`,
};

const oldFileLines = Array.from(
  { length: 28 },
  (_, index) => `export const value${index + 1} = ${index + 1};`
);
const newFileLines = [...oldFileLines];
oldFileLines[13] = 'export const status = "healthy";';
newFileLines[13] = 'export const status = "degraded";';

const oldFile = {
  name: "status.ts",
  lang: "typescript" as const,
  contents: `${oldFileLines.join("\n")}\n`,
};

const newFile = {
  name: "status.ts",
  lang: "typescript" as const,
  contents: `${newFileLines.join("\n")}\n`,
};

const patch = `diff --git a/status.ts b/status.ts
index 8cab1d0..6e5d0ff 100644
--- a/status.ts
+++ b/status.ts
@@ -1 +1,2 @@
-export const status = "healthy";
+export const status = "degraded";
+export const retryAfter = 30;
`;

const conflictFile = {
  name: "config.ts",
  lang: "typescript" as const,
  contents: `export const endpoint =
${"<".repeat(7)} current
  "https://api.internal";
${"=".repeat(7)}
  "https://api.example.com";
${">".repeat(7)} incoming
`,
};

const codeViewItems = Array.from({ length: 24 }, (_, index) => ({
  id: `module-${index + 1}`,
  type: "file" as const,
  file: {
    name: `module-${index + 1}.ts`,
    lang: "typescript" as const,
    contents: Array.from(
      { length: 18 },
      (__, line) => `export const value${line + 1} = ${index * 18 + line + 1};`
    ).join("\n"),
  },
}));

const exampleCode = `import { CodeBlock } from "@zeron/ui/code-block";

<CodeBlock
  file={{
    name: "status.ts",
    lang: "typescript",
    contents: 'export const status = "healthy";',
  }}
/>`;

function createSource() {
  const chunks = [
    "export async function loadStatus() {\n",
    "  const response = await fetch(\"/api/status\");\n",
    "  return response.json();\n",
    "}\n",
  ];
  return new ReadableStream<string>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

function getProps(t: ReturnType<typeof useTranslations>): PropDef[] {
  return [
    { name: "file", type: "CodeFile", description: t("fileDescription") },
    { name: "options", type: "FileOptions", description: t("optionsDescription") },
    { name: "appearance", type: '"zeron" | "engine"', default: '"zeron"', description: t("appearanceDescription") },
    { name: "themeMode", type: '"light" | "dark" | "system" | "inherit"', default: '"inherit"', description: t("themeDescription") },
    { name: "toolbar", type: "boolean", default: "true", description: t("toolbarDescription") },
    { name: "messages", type: "Partial<CodeBlockMessages>", description: t("messagesDescription") },
    { name: "edit", type: "boolean", default: "false", description: t("editDescription") },
    { name: "lineAnnotations", type: "LineAnnotation[]", description: t("annotationDescription") },
    { name: "selectedLines", type: "SelectedLineRange | null", description: t("selectionDescription") },
  ];
}

export default function CodeBlockDoc() {
  const t = useTranslations("codeBlock");
  const [editing, setEditing] = useState(false);
  const [selectedLines, setSelectedLines] = useState<SelectedLineRange | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const highlighterOptions = useMemo(
    () => ({ langs: ["typescript", "tsx"] as ("typescript" | "tsx")[] }),
    []
  );
  const messages = {
    copy: t("copy"),
    copied: t("copied"),
    copyFailed: t("copyFailed"),
    wrap: t("wrap"),
    scroll: t("scroll"),
  };
  const conflictMessages = {
    acceptCurrent: t("acceptCurrent"),
    acceptIncoming: t("acceptIncoming"),
    acceptBoth: t("acceptBoth"),
    currentChange: t("currentChange"),
    incomingChange: t("incomingChange"),
  };

  return (
    <DocPage title="CodeBlock" slug="code-block" description={t("description")}>
      <CodeWorkerProvider poolSize={2} highlighterOptions={highlighterOptions}>
        <CodeEditProvider>
          <DocSection title={t("singleFile")}>
            <ComponentPreview code={exampleCode} inspectable={false} padding="responsive">
              <div className="grid w-full min-w-0 gap-2">
                <CodeBlock<string>
                  file={file}
                  messages={messages}
                  lineAnnotations={[{ lineNumber: 3, metadata: t("annotationExample") }]}
                  renderAnnotation={(annotation) => (
                    <div className="border-l-2 border-accent px-3 py-1 text-xs text-fg-muted">
                      {annotation.metadata}
                    </div>
                  )}
                  selectedLines={selectedLines}
                  options={{
                    enableLineSelection: true,
                    onLineSelected: setSelectedLines,
                    onTokenClick: ({ tokenText }) => setSelectedToken(tokenText),
                  }}
                />
                <p className="text-xs text-fg-muted" data-testid="code-interaction-status">
                  {selectedLines == null
                    ? t("interactionHint")
                    : t("selectedLine", { line: selectedLines.start })}
                  {selectedToken == null ? null : ` · ${t("selectedToken", { token: selectedToken })}`}
                </p>
              </div>
            </ComponentPreview>
          </DocSection>

          <DocSection title={t("diffAndPatch")}>
            <div className="grid gap-4">
              <CodeDiff
                oldFile={oldFile}
                newFile={newFile}
                options={{
                  collapsedContextThreshold: 2,
                  diffStyle: "split",
                  hunkSeparators: "line-info",
                }}
              />
              <CodePatch patch={patch} options={{ diffStyle: "unified" }} />
            </div>
          </DocSection>

          <DocSection title={t("conflict")}>
            <CodeConflict file={conflictFile} messages={conflictMessages} />
          </DocSection>

          <DocSection title={t("streaming")}>
            <CodeStream
              source={createSource}
              options={{ lang: "typescript" }}
            />
          </DocSection>

          <DocSection title={t("virtualizedFiles")}>
            <CodeView
              items={codeViewItems}
              className="h-96 overflow-auto rounded-xl border border-border bg-surface-floating"
            />
          </DocSection>

          <DocSection title={t("editing")}>
            <div className="grid gap-3">
              <div>
                <Button size="sm" variant="secondary" onClick={() => setEditing((value) => !value)}>
                  {editing ? t("finishEditing") : t("startEditing")}
                </Button>
              </div>
              <CodeBlock
                file={file}
                messages={messages}
                edit={editing}
                editStateKey="docs-code-block"
                onEditComplete={() => "reject"}
              />
            </div>
          </DocSection>
        </CodeEditProvider>
      </CodeWorkerProvider>

      <DocSection title={t("apiReference")}>
        <PropsTable props={getProps(t)} />
      </DocSection>
    </DocPage>
  );
}
