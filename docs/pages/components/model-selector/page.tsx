"use client";

import { useTranslations } from "next-intl";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ModelSelectorExample } from "./example";

const code = `import { useState } from "react";
import { ModelSelector, type ModelSelectorValue } from "@/components/ui/model-selector";

const [value, setValue] = useState<ModelSelectorValue>({
  modelId: "reasoning", extendedThinking: false, webSearch: false,
});
<ModelSelector models={models} value={value} onValueChange={setValue} />;`;

export default function ModelSelectorDoc() {
  const t = useTranslations("model-selector");
  return <DocPage title="ModelSelector" slug="model-selector" description={t("description")}>
    <DocSection title={t("basic")}><ComponentPreview code={code} minHeightClass="min-h-[480px]" align="top" coverSource><ModelSelectorExample /></ComponentPreview></DocSection>
    <DocSection title={t("composer")}><ComponentPreview code={`<InputMessage layout="compact" value={draft} onValueChange={setDraft}
  leftSlot={<ModelSelector models={models} value={value} onValueChange={setValue} />} />`} minHeightClass="min-h-96" padding="responsive"><ModelSelectorExample composer /></ComponentPreview></DocSection>
    <DocSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></DocSection>
    <DocSection title={t("api")}><PropsTable props={[
      { name: "models", type: "readonly ModelSelectorModel[]", description: t("modelsProp") },
      { name: "value / onValueChange", type: "ModelSelectorValue / (value) => void", description: t("valueProp") },
      { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", default: "false", description: t("openProp") },
      { name: "disabled", type: "boolean", default: "false", description: t("disabledProp") },
      { name: "labels / locale / currency", type: "Partial<ModelSelectorLabels> / string / string", description: t("labelsProp") },
      { name: "side / align / className", type: "PopoverSide / PopoverAlign / string", description: t("placementProp") },
    ]} /></DocSection>
  </DocPage>;
}
