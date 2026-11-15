"use client";

import { useLocale, useTranslations } from "next-intl";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ContextMapExample } from "./example";

const basicCode = `import { ContextMap, type ContextBlock } from "@/components/ui/context-map";
// Optional file icons: npx zeron-ui add file-type
import { FileType } from "@/components/ui/file-type";

const blocks: ContextBlock[] = [
  { id: "system", label: "System prompt", kind: "system", tokens: 6200 },
  {
    id: "file", label: "payment.ts", kind: "file", tokens: 17600, detail: "Payment integration",
    icon: <FileType fileName="payment.ts" size="mini" aria-hidden="true" />,
  },
  { id: "chat", label: "Chat", kind: "chat", tokens: 42900 },
];

export function Example() {
  return <ContextMap blocks={blocks} limit={200000} model="Claude Opus" compaction={null} />;
}`;

const comparisonCode = `import { ContextMap, type ContextBlock } from "@/components/ui/context-map";

const system: ContextBlock = { id: "system", label: "System prompt", kind: "system", tokens: 6200 };
const chat: ContextBlock = { id: "chat", label: "Chat", kind: "chat", tokens: 42900 };
const summary: ContextBlock = { id: "summary", label: "Summary", kind: "summary", tokens: 8600 };

export function Comparison() {
  return <ContextMap
    blocks={[system, summary]}
    limit={200000}
    compaction={{ before: [system, chat], summarized: ["chat"], summary: "summary" }}
  />;
}`;

export default function ContextMapDoc() {
  const t = useTranslations("context-map");
  const chinese = useLocale().startsWith("zh");
  return (
    <DocPage title="Context Map" slug="context-map" description={t("description")}>
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode} coverSource padding="responsive">
          <ContextMapExample chinese={chinese} />
        </ComponentPreview>
      </DocSection>
      <DocSection title={t("comparison")}>
        <p className="text-body text-fg-muted">{t("comparisonBody")}</p>
        <ComponentPreview code={comparisonCode} padding="responsive">
          <ContextMapExample chinese={chinese} compare />
        </ComponentPreview>
      </DocSection>
      <DocSection title={t("api")}>
        <PropsTable props={[
          { name: "blocks", type: "readonly ContextBlock[]", description: t("blocksProp") },
          { name: "limit", type: "number", description: t("limitProp") },
          { name: "model / modelIcon", type: "string / ReactNode", description: t("modelProp") },
          { name: "agents / agent / onAgentChange", type: "readonly ContextAgent[] / string / (id: string) => void", description: t("agentsProp") },
          { name: "compaction", type: "ContextCompaction | null", description: t("compactionProp") },
          { name: "view / onViewChange", type: '"before" | "after" / (view: ContextMapView) => void', default: '"after"', description: t("viewProp") },
          { name: "status", type: "string", description: t("statusProp") },
          { name: "onSelect", type: "(block: ContextBlock | null) => void", description: t("selectProp") },
          { name: "title / labels / locale / className", type: "string / Partial<ContextMapLabels> / string / string", description: t("labelsProp") },
        ]} />
      </DocSection>
    </DocPage>
  );
}
