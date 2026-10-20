"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Markdown } from "@zeron/ui/markdown";
import { Button } from "@zeron/ui/button";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";

const source = [
  "### Release checklist", "", "Supports **GFM**, links, and inline `code`.", "",
  "- [x] Reuse existing components", "- [ ] Publish the release", "",
  "| Surface | Status |", "| --- | --- |", "| Chat Thread | Ready |", "| Agent Trace | Ready |", "",
  "```ts", 'export const release = { status: "ready", checks: ["markdown", "tables", "code-blocks", "responsive-parent-width"] };', "```",
].join("\n");

const code = `import { Markdown } from "@/components/ui/markdown";

<Markdown text={response} streaming={isStreaming} streamingLabel="Generating response" />

// Lightweight code rendering for dense logs:
<Markdown text={response} codeVariant="plain" />`;

export default function MarkdownDoc() {
  const t = useTranslations("markdown");
  const [streaming, setStreaming] = useState(true);
  return (
    <DocPage title="Markdown" slug="markdown" description={t("description")}>
      <DocSection title={t("basic")}>
        <ComponentPreview code={code}>
          <div className="flex w-full min-w-0 flex-col items-start"><Markdown text={source} /></div>
        </ComponentPreview>
      </DocSection>
      <DocSection title={t("width")}>
        <p className="mb-3 text-body text-fg-muted">{t("widthBody")}</p>
        <ComponentPreview code={'<div className="flex w-full min-w-0 flex-col items-start">\n  <Markdown text={response} codeVariant="plain" />\n</div>'}>
          <div className="flex w-full min-w-0 flex-col items-start">
            <Markdown text={t.raw("widthSample") as string} codeVariant="plain" />
          </div>
        </ComponentPreview>
      </DocSection>
      <DocSection title={t("streaming")}>
        <ComponentPreview code={'<Markdown text={response} streaming={isStreaming} streamingLabel="Generating response" codeVariant="plain" />'}>
          <div className="w-full min-w-0 space-y-4">
            <Markdown text={t("sample")} streaming={streaming} streamingLabel={t("streamingLabel")} codeVariant="plain" />
            <Button variant="ghost" size="sm" onClick={() => setStreaming(!streaming)}>{streaming ? t("finish") : t("restart")}</Button>
          </div>
        </ComponentPreview>
      </DocSection>
      <DocSection title={t("behavior")}>
        <p className="text-body text-fg-muted">{t("behaviorBody")}</p>
      </DocSection>
      <DocSection title={t("api")}>
        <PropsTable props={[
          { name: "text", type: "string", description: t("textProp") },
          { name: "streaming", type: "boolean", default: "false", description: t("streamingProp") },
          { name: "streamingLabel", type: "string", default: '"Streaming response"', description: t("streamingLabelProp") },
          { name: "codeVariant", type: '"block" | "plain"', default: '"block"', description: t("codeProp") },
          { name: "codeMessages", type: 'CodeBlockProps["messages"]', description: t("codeMessagesProp") },
          { name: "footnoteLabel / footnoteBackLabel", type: "string", description: t("footnoteLabelsProp") },
          { name: "components", type: "MarkdownComponents", description: t("componentsProp") },
          { name: "className / HTML attributes", type: "HTMLAttributes<HTMLDivElement>", description: t("rootProp") },
        ]} />
      </DocSection>
    </DocPage>
  );
}
