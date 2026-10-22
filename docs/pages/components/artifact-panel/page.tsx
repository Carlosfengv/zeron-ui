"use client";
import { useTranslations } from "next-intl";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ArtifactPanelExample } from "./example";

const code = `"use client";
import { ArtifactPanel, type ArtifactPanelProps } from "@/components/ui/artifact-panel";

export function ResourcePreview(props: ArtifactPanelProps) {
  return <div className="h-96 min-h-0"><ArtifactPanel {...props} /></div>;
}
// Supply resources, selection and callbacks from the host.
// Update the matching id/version after each successful review.`;

export default function ArtifactPanelDoc() {
  const t = useTranslations("artifact-panel");
  return <DocPage title="ArtifactPanel" slug="artifact-panel" description={t("description")}>
    <DocSection title={t("basic")}><p className="mb-4 text-body text-fg-muted">{t("basicBody")}</p><ComponentPreview code={code} padding="none" coverSource><ArtifactPanelExample /></ComponentPreview></DocSection>
    <DocSection title={t("failures")}><p className="mb-4 text-body text-fg-muted">{t("failuresBody")}</p><ComponentPreview code={'<ArtifactPanel resources={resources} onReview={reviewExactVersion} />'} padding="none"><ArtifactPanelExample failFirstReview /></ComponentPreview></DocSection>
    <DocSection title={t("data")}><p className="text-body text-fg-muted">{t("dataBody")}</p></DocSection>
    <DocSection title={t("ownership")}><p className="text-body text-fg-muted">{t("ownershipBody")}</p></DocSection>
    <DocSection title={t("rendering")}><p className="text-body text-fg-muted">{t("renderingBody")}</p></DocSection>
    <DocSection title={t("compatibility")}><p className="text-body text-fg-muted">{t("compatibilityBody")}</p></DocSection>
    <DocSection title={t("api")}><PropsTable props={[
      { name: "resources", type: "readonly ArtifactResource[]", description: t("resourcesProp") },
      { name: "activeId / defaultActiveId / onActiveIdChange", type: "string | null / string / (id) => void", description: t("activeProp") },
      { name: "onClose / onCloseMany", type: "(resource) => void / (resources) => void", description: t("closeProp") },
      { name: "addAction", type: "ReactNode", description: t("addProp") },
      { name: "onReview", type: '(resource, "accept" | "reject") => void | Promise<void>', description: t("reviewProp") },
      { name: "onReference / onRetry / renderPreview", type: "callbacks", description: t("extendProp") },
      { name: "labels / locale / className", type: "Partial<ArtifactLabels> / string / string", description: t("labelsProp") },
    ]} /></DocSection>
  </DocPage>;
}
