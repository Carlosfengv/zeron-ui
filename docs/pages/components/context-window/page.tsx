"use client";

import { useTranslations } from "next-intl";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ContextWindowExample } from "./example";

const dataCode = `const data = {
  capacity: 32000, systemTokens: 2000, toolTokens: 1000,
  docs: [{ id: "guide", title: "AGENTS.md", tokens: 6200 }],
  memory: [], history: [{ id: "turns", title: "Conversation", tokens: 16000 }],
};`;
const detailedCode = `import { ContextWindow } from "@/components/ui/context-window";

${dataCode}

<ContextWindow data={data} onCompact={compactHistory} />
// The host supplies a new snapshot after compaction.`;
const compactCode = `import { ContextWindowCompact } from "@/components/ui/context-window";

${dataCode}

<ContextWindowCompact data={data} onCompact={compactHistory} />
// modelIcon supplies an optional provider icon.`;
const usageCode = `import { ContextWindowCompact, ContextWindowUsage } from "@/components/ui/context-window";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

<Popover>
  <PopoverTrigger render={<Button variant="secondary">
    <span className="sr-only">Context usage: </span>
    <ContextWindowUsage data={data} />
  </Button>} />
  <PopoverContent className="w-80">
    <ContextWindowCompact embedded data={data} onCompact={compactHistory} />
  </PopoverContent>
</Popover>`;

export default function ContextWindowDoc() {
  const t = useTranslations("context-window");
  return <DocPage title="ContextWindow" slug="context-window" description={t("description")}>
    <DocSection title={t("detailed")}><ComponentPreview code={detailedCode} padding="responsive"><ContextWindowExample /></ComponentPreview></DocSection>
    <DocSection title={t("compact")}><ComponentPreview code={compactCode} padding="responsive" coverSource><ContextWindowExample mode="compact" /></ComponentPreview></DocSection>
    <DocSection title={t("usage")}>
      <p className="mb-4 text-body text-fg-muted">{t("usageBody")}</p>
      <ComponentPreview code={usageCode} padding="responsive"><ContextWindowExample mode="popover" /></ComponentPreview>
    </DocSection>
    <DocSection title={t("data")}><p className="text-body text-fg-muted">{t("dataBody")}</p></DocSection>
    <DocSection title={t("compatibility")}><p className="text-body text-fg-muted">{t("compatibilityBody")}</p></DocSection>
    <DocSection title={t("api")}><PropsTable props={[
      { name: "data", type: "ContextWindowData", description: t("dataProp") },
      { name: "ContextWindow.tab / defaultTab / onTabChange", type: '"docs" | "memory" | "history" / (tab) => void', description: t("tabsProp") },
      { name: "onCompact / compacting", type: "() => void / boolean", description: t("compactProp") },
      { name: "loading / error / onRetry / notice", type: "boolean / string / () => void / string", description: t("statesProp") },
      { name: "ContextWindowCompact.embedded / modelIcon", type: "boolean / ReactNode", description: t("embeddedProp") },
      { name: "ContextWindow.live / onSettings / onClose / footerActions", type: "boolean / () => void / () => void / ReactNode", description: t("actionsProp") },
      { name: "title / labels / locale / className", type: "string / Partial<ContextWindowLabels> / Partial<ContextWindowCompactLabels> / string / string", description: t("labelsProp") },
      { name: "ContextWindowUsage", type: "ContextWindowUsageProps", description: t("usageProp") },
      { name: "getContextWindowUsage / allocateContextWindowCells", type: "(data) => usage | null / (totals, capacity, cellCount?, categories?) => ContextWindowCategory[]", description: t("helpersProp") },
    ]} /></DocSection>
  </DocPage>;
}
