"use client";

import { Badge, badgeColors, type BadgeColor } from "@zeron/ui/badge";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const solidCode = `import { Badge } from "./components";

<Badge color="violet">Fiction</Badge>
<Badge color="amber">Science</Badge>
<Badge color="green">Philosophy</Badge>
<Badge color="blue">History</Badge>
<Badge color="rose">Poetry</Badge>`;

const dotCode = `import { Badge } from "./components";

<Badge variant="dot" color="violet">Fiction</Badge>
<Badge variant="dot" color="amber">Science</Badge>
<Badge variant="dot" color="green">Philosophy</Badge>
<Badge variant="dot" color="blue">History</Badge>
<Badge variant="dot" color="rose">Poetry</Badge>`;

const sizesCode = `import { Badge } from "./components";

<Badge size="sm" color="blue">Small</Badge>
<Badge size="md" color="blue">Medium</Badge>
<Badge size="lg" color="blue">Large</Badge>`;

const statusCode = `import { Badge } from "./components";

<Badge status="warning">Attention needed</Badge>
<Badge status="danger">Sync failed</Badge>`;

const allColors = Object.keys(badgeColors) as BadgeColor[];

const colorsCode = `import { Badge } from "./components";

{/* All available categorical colors */}
<Badge color="gray">Gray</Badge>
<Badge color="red">Red</Badge>
<Badge color="blue">Blue</Badge>
<Badge color="green">Green</Badge>
{/* ... and more */}`;

export default function BadgeDoc() {
  const t = useTranslations("badge");
  const badgeProps: PropDef[] = [
    { name: "variant", type: '"solid" | "dot"', default: '"solid"', description: t("variant") },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: t("size") },
    { name: "color", type: "BadgeColor", default: '"gray"', description: t("color") },
    { name: "status", type: '"danger" | "warning"', description: t("statusDescription") },
  ];
  return (
    <DocPage
      title="Badge"
      slug="badge"
      description={t("description")}
    >
      <DocSection title={t("solid")}>
        <ComponentPreview code={solidCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="violet">Fiction</Badge>
            <Badge color="amber">Science</Badge>
            <Badge color="green">Philosophy</Badge>
            <Badge color="blue">History</Badge>
            <Badge color="rose">Poetry</Badge>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("dot")}>
        <ComponentPreview code={dotCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="dot" color="violet">Fiction</Badge>
            <Badge variant="dot" color="amber">Science</Badge>
            <Badge variant="dot" color="green">Philosophy</Badge>
            <Badge variant="dot" color="blue">History</Badge>
            <Badge variant="dot" color="rose">Poetry</Badge>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("sizes")}>
        <ComponentPreview code={sizesCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm" color="blue">Small</Badge>
            <Badge size="md" color="blue">Medium</Badge>
            <Badge size="lg" color="blue">Large</Badge>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("colors")}>
        <ComponentPreview code={colorsCode}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {allColors.map((c) => (
                <Badge key={c} color={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {allColors.map((c) => (
                <Badge key={c} variant="dot" color={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("status")}>
        <ComponentPreview code={statusCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge status="warning">Attention needed</Badge>
            <Badge status="danger">Sync failed</Badge>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={badgeProps} />
      </DocSection>
    </DocPage>
  );
}
