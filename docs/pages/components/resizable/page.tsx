"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@zeron/ui/resizable";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const basicCode = `import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@zeron/ui/resizable";

<ResizablePanelGroup orientation="horizontal" className="h-52">
  <ResizablePanel defaultSize="65%" minSize="16rem">
    <div className="h-full p-4">Primary content</div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize="35%" minSize="12rem">
    <div className="h-full p-4">Inspector</div>
  </ResizablePanel>
</ResizablePanelGroup>`;

export default function ResizableDoc() {
  const t = useTranslations("resizableDoc");
  const groupProps: PropDef[] = [
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: t("orientation") },
    { name: "defaultLayout", type: "Layout", description: t("defaultLayout") },
    { name: "onLayoutChanged", type: "(layout, meta) => void", description: t("layoutChanged") },
  ];
  const panelProps: PropDef[] = [
    { name: "defaultSize", type: "number | string", description: t("defaultSize") },
    { name: "minSize", type: "number | string", description: t("minSize") },
    { name: "maxSize", type: "number | string", description: t("maxSize") },
  ];
  const handleProps: PropDef[] = [
    { name: "withHandle", type: "boolean", default: "false", description: t("withHandle") },
    { name: "disableDoubleClick", type: "boolean", default: "false", description: t("doubleClick") },
  ];

  return (
    <DocPage title="Resizable" slug="resizable" description={t("description")}>
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode} padding="none" minHeightClass="min-h-0">
          <ResizablePanelGroup orientation="horizontal" className="h-52 rounded-xl border border-border bg-surface-floating">
            <ResizablePanel defaultSize="65%" minSize="16rem">
              <div className="flex h-full items-center p-4 text-body text-fg-default">{t("primary")}</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="35%" minSize="12rem">
              <div className="flex h-full items-center p-4 text-body text-fg-muted">{t("inspector")}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — ResizablePanelGroup`}>
        <PropsTable props={groupProps} />
      </DocSection>
      <DocSection title={`${t("apiReference")} — ResizablePanel`}>
        <PropsTable props={panelProps} />
      </DocSection>
      <DocSection title={`${t("apiReference")} — ResizableHandle`}>
        <PropsTable props={handleProps} />
      </DocSection>
    </DocPage>
  );
}
