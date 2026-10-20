"use client";

import { useTranslations } from "next-intl";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { MessageNavigationExample } from "./example";

const code = `import { useState } from "react";
import { MessageNavigation } from "@/components/ui/message-navigation";

const items = [
  { id: "first", label: "Why does typing lag?", description: "Debounce search requests while keeping input updates instant." },
  { id: "second", label: "Can you add a test?", description: "Use fake timers to verify the delay." },
];

export function Example() {
  const [activeId, setActiveId] = useState("first");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  return <MessageNavigation
    items={items.map((item) => ({ ...item, bookmarked: bookmarkedIds.includes(item.id) }))}
    activeId={activeId}
    onBookmarkChange={(id, bookmarked) => setBookmarkedIds((current) => bookmarked
      ? [...new Set([...current, id])] : current.filter((item) => item !== id))}
    align="right" // Use align="left" for a rail on the left.
    onSelect={(id) => { setActiveId(id); /* Scroll the host transcript to this ID. */ }} />;
}`;

export default function MessageNavigationDoc() {
  const t = useTranslations("messageNavigation");
  return (
    <DocPage title="MessageNavigation" slug="message-navigation" description={t("description")}>
      <DocSection title={t("basic")}>
        <p className="mb-3 text-body text-fg-muted">{t("intro")}</p>
        <ComponentPreview code={code} coverSource>
          <div className="grid w-full gap-8 sm:grid-cols-2">
            <MessageNavigationExample side="left" />
            <MessageNavigationExample side="right" />
          </div>
        </ComponentPreview>
      </DocSection>
      <DocSection title={t("behavior")}>
        <p className="text-body text-fg-muted">{t("behaviorBody")}</p>
        <p className="mt-3 text-body text-fg-muted">{t("bookmarkMarkers")}</p>
      </DocSection>
      <DocSection title={t("api")}>
        <PropsTable props={[
          { name: "items", type: "readonly MessageNavigationItem[]", description: t("itemsProp") },
          { name: "activeId / onSelect", type: "string | null / (id: string) => void", description: t("selectionProp") },
          { name: "onBookmarkChange / bookmarkLabels / bookmarkIcon", type: "(id, bookmarked) => void / Partial<MessageNavigationBookmarkLabels> / IconComponent", description: t("bookmarkProp") },
          { name: "label / getItemLabel", type: "string / (item, index) => string", description: t("labelsProp") },
          { name: "align", type: '"left" | "right"', default: '"right"', description: t("alignProp") },
          { name: "previewSide", type: '"left" | "right"', default: '"left"', description: t("sideProp") },
          { name: "className", type: "string", description: t("layoutProp") },
        ]} />
      </DocSection>
    </DocPage>
  );
}
