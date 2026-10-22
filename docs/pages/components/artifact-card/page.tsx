"use client";

import { useTranslations } from "next-intl";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ArtifactCardExample } from "./example";

const code = `import { ArtifactCard } from "@/components/ui/artifact-card";

<ArtifactCard resources={[
  { id: "page", name: "pricing.html", kind: "code", description: "HTML · 2.4 KB" },
]} onOpen={(resource) => openContent(resource.id)} />
// No generated content or revision history is needed to render a card.`;

export default function ArtifactCardDoc() {
  const t = useTranslations("artifact-card");
  return <DocPage title="ArtifactCard" slug="artifact-card" description={t("description")}>
    <DocSection title={t("basic")}><ComponentPreview code={code} padding="responsive" coverSource><ArtifactCardExample /></ComponentPreview></DocSection>
    <DocSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></DocSection>
    <DocSection title={t("api")}><PropsTable props={[
      { name: "resources", type: "readonly TResource[]", description: t("itemsProp") },
      { name: "onOpen", type: "(resource: TResource) => void", description: t("openProp") },
      { name: "getDescription / getReviewStatus", type: "(resource) => ReactNode / (resource) => ArtifactCardReviewStatus | undefined", description: t("adaptersProp") },
      { name: "title / locale / labels / className", type: "string / string / Partial<ArtifactCardLabels> / string", description: t("labelsProp") },
    ]} /></DocSection>
  </DocPage>;
}
