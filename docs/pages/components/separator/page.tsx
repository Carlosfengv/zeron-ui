"use client";

import { Separator } from "@zeron/ui/separator";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const horizontalCode = `import { Separator } from "@zeron/ui/separator";

<Separator />`;

const verticalCode = `<div className="flex h-20 items-center">
  <span>Overview</span>
  <Separator orientation="vertical" />
  <span>Activity</span>
</div>`;

const contextCode = `<div className="w-full max-w-md">
  <section className="px-3 py-2">
    <h3>Environment</h3>
    <p>Production cluster</p>
  </section>
  <Separator />
  <section className="px-3 py-2">
    <h3>Status</h3>
    <p>All systems operational</p>
  </section>
</div>`;

export default function SeparatorDoc() {
  const t = useTranslations("separator");
  const separatorProps: PropDef[] = [
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      default: '"horizontal"',
      description: t("orientationProp"),
    },
    {
      name: "className",
      type: "string",
      description: t("classNameProp"),
    },
  ];

  return (
    <DocPage
      title="Separator"
      slug="separator"
      description="Accessible horizontal and vertical rules with a semantic border color and layout-safe gutter."
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "horizontal",
              label: t("horizontal"),
              code: horizontalCode,
              preview: (
                <div className="w-full max-w-md">
                  <Separator />
                </div>
              ),
            },
            {
              value: "vertical",
              label: t("vertical"),
              code: verticalCode,
              preview: (
                <div className="flex h-20 items-center text-body text-fg-default">
                  <span className="px-3">Overview</span>
                  <Separator orientation="vertical" />
                  <span className="px-3">Activity</span>
                </div>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={horizontalCode}>
          <div className="w-full max-w-xl">
            <Separator />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("orientations")}>
        <ComponentPreview code={verticalCode}>
          <div className="flex h-24 items-center text-body text-fg-default">
            <span className="px-4">Overview</span>
            <Separator orientation="vertical" />
            <span className="px-4">Activity</span>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("inContext")}>
        <ComponentPreview code={contextCode}>
          <div className="w-full max-w-md rounded-xl bg-surface-floating shadow-raised">
            <section className="px-3 py-2">
              <h3 className="text-body font-medium text-fg-default">Environment</h3>
              <p className="text-body text-fg-muted">Production cluster</p>
            </section>
            <Separator />
            <section className="px-3 py-2">
              <h3 className="text-body font-medium text-fg-default">Status</h3>
              <p className="text-body text-fg-muted">All systems operational</p>
            </section>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={separatorProps} />
      </DocSection>
    </DocPage>
  );
}
