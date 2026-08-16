"use client";

import { Field, FieldDescription, FieldLabel } from "@zeron/ui/field";
import { Textarea } from "@zeron/ui/textarea";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const basicCode = `import { Field, FieldDescription, FieldLabel, Textarea } from "./components";

<Field name="description">
  <FieldLabel>Description</FieldLabel>
  <Textarea placeholder="Describe where this provider is used" />
  <FieldDescription>Up to 240 characters.</FieldDescription>
</Field>`;

const variantsCode = `import { Textarea } from "./components";

<Textarea variant="outline" placeholder="Outline" />
<Textarea variant="secondary" placeholder="Secondary" />
<Textarea variant="ghost" placeholder="Ghost" />`;

const sizesCode = `import { Textarea } from "./components";

<Textarea density="compact" rows={2} placeholder="Compact" />
<Textarea density="regular" rows={3} placeholder="Regular" />
<Textarea density="comfortable" rows={4} placeholder="Comfortable" />`;

export default function TextareaDoc() {
  const t = useTranslations("textarea");
  const textareaProps: PropDef[] = [
    { name: "variant", type: '"outline" | "secondary" | "ghost"', default: '"outline"', description: t("variantProp") },
    { name: "density", type: '"compact" | "regular" | "comfortable"', default: '"regular"', description: t("sizeProp") },
    { name: "rows", type: "number", description: "Native minimum visible row count." },
    { name: "disabled", type: "boolean", default: "false", description: t("disabledProp") },
    { name: "aria-invalid", type: 'boolean | "true" | "false"', default: "false", description: t("ariaInvalidProp") },
  ];

  return (
    <DocPage
      title="Textarea"
      slug="textarea"
      description="Multi-line text input with semantic variants, density options, native rows, resizing, and field validation support."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <div className="w-96 max-w-full">
            <Field name="description">
              <FieldLabel>{t("descriptionLabel")}</FieldLabel>
              <Textarea placeholder={t("descriptionPlaceholder")} />
              <FieldDescription>{t("descriptionHelp")}</FieldDescription>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("variants")}>
        <ComponentPreview code={variantsCode}>
          <div className="grid w-full max-w-3xl gap-3 md:grid-cols-3">
            <Textarea variant="outline" placeholder={t("outline")} aria-label={t("outline")} />
            <Textarea variant="secondary" placeholder={t("secondary")} aria-label={t("secondary")} />
            <Textarea variant="ghost" placeholder={t("ghost")} aria-label={t("ghost")} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("sizes")}>
        <ComponentPreview code={sizesCode}>
          <div className="grid w-full max-w-2xl gap-3 md:grid-cols-2">
            <Textarea density="compact" rows={2} placeholder={t("defaultSize")} aria-label={t("defaultSize")} />
            <Textarea density="regular" rows={3} placeholder={t("largeSize")} aria-label={t("largeSize")} />
            <Textarea density="comfortable" rows={4} placeholder="Comfortable" aria-label="Comfortable textarea" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={textareaProps} />
      </DocSection>
    </DocPage>
  );
}
