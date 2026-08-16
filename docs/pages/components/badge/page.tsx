"use client";

import { Badge, badgeColors, type BadgeColor } from "@zeron/ui/badge";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const solidCode = `import { Badge } from "./components";

<Badge color="violet">Fiction</Badge>
<Badge color="amber">Science</Badge>
<Badge color="green">Philosophy</Badge>
<Badge color="blue">History</Badge>
<Badge color="rose">Poetry</Badge>`;

const strongCode = `import { Badge } from "./components";

<Badge variant="strong" color="violet">Fiction</Badge>
<Badge variant="strong" color="amber">Science</Badge>
<Badge variant="strong" color="green">Philosophy</Badge>
<Badge variant="strong" color="blue">History</Badge>
<Badge variant="strong" color="rose">Poetry</Badge>`;

const customColorCode = `import { Badge } from "./components";

<Badge
  variant="strong"
  color={{ base: "var(--brand)", onStrong: "var(--fg-on-brand)" }}
>
  Brand variable
</Badge>

<Badge
  variant="strong"
  color={{ base: "#6D28D9", onStrong: "#FFFFFF" }}
>
  Custom color
</Badge>`;

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

<Badge status="neutral">Queued</Badge>
<Badge status="info">In review</Badge>
<Badge status="success">Ready</Badge>
<Badge status="warning">Attention needed</Badge>
<Badge status="danger">Sync failed</Badge>`;

const announcedStatusCode = `<Badge status="warning" role="status">
  Credentials expire in 3 days
</Badge>`;

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
    { name: "variant", type: '"solid" | "strong" | "dot"', default: '"solid"', description: t("variant") },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: t("size") },
    { name: "color", type: "BadgeColorInput", default: '"gray"', description: t("color") },
    { name: "status", type: '"danger" | "warning" | "success" | "info" | "neutral"', description: t("statusDescription") },
    { name: "role", type: '"status" | ...', description: t("roleDescription") },
  ];
  return (
    <DocPage
      title="Badge"
      slug="badge"
      description={t("description")}
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "solid",
              label: "Solid",
              code: `<Badge color="violet">Fiction</Badge>`,
              preview: <Badge color="violet">Fiction</Badge>,
            },
            {
              value: "strong",
              label: "Strong",
              code: `<Badge variant="strong" color="violet">Fiction</Badge>`,
              preview: <Badge variant="strong" color="violet">Fiction</Badge>,
            },
            {
              value: "dot",
              label: "Dot",
              code: `<Badge variant="dot" color="violet">Fiction</Badge>`,
              preview: <Badge variant="dot" color="violet">Fiction</Badge>,
            },
            {
              value: "status",
              label: "Status",
              code: `<Badge status="warning">Attention needed</Badge>`,
              preview: <Badge status="warning">Attention needed</Badge>,
            },
          ]}
        />
      </DocSection>

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

      <DocSection title={t("strong")}>
        <ComponentPreview code={strongCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="strong" color="violet">Fiction</Badge>
            <Badge variant="strong" color="amber">Science</Badge>
            <Badge variant="strong" color="green">Philosophy</Badge>
            <Badge variant="strong" color="blue">History</Badge>
            <Badge variant="strong" color="rose">Poetry</Badge>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("customColors")}>
        <ComponentPreview code={customColorCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="strong"
              color={{ base: "var(--brand)", onStrong: "var(--fg-on-brand)" }}
            >
              Brand variable
            </Badge>
            <Badge
              variant="strong"
              color={{ base: "#6D28D9", onStrong: "#FFFFFF" }}
            >
              Custom color
            </Badge>
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
            <div className="flex flex-wrap items-center gap-2">
              {allColors.map((c) => (
                <Badge key={c} variant="strong" color={c}>
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
            <Badge status="neutral">Queued</Badge>
            <Badge status="info">In review</Badge>
            <Badge status="success">Ready</Badge>
            <Badge status="warning">Attention needed</Badge>
            <Badge status="danger">Sync failed</Badge>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("accessibility")}>
        <div className="flex flex-col gap-3">
          <p className="max-w-2xl text-body leading-6 text-fg-muted">
            {t("accessibilityDescription")}
          </p>
          <ComponentPreview code={announcedStatusCode}>
            <Badge status="warning" role="status">
              Credentials expire in 3 days
            </Badge>
          </ComponentPreview>
        </div>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={badgeProps} />
      </DocSection>
    </DocPage>
  );
}
