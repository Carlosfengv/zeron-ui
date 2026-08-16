"use client";

import { useState } from "react";
import { Checkbox } from "@zeron/ui/checkbox";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import { Checkbox } from "./components/checkbox";
import { useState } from "react";

function Example() {
  const [checked, setChecked] = useState(true);

  return (
    <label className="flex items-center gap-2.5">
      <Checkbox
        checked={checked}
        onCheckedChange={setChecked}
      />
      <span>Remember this device</span>
    </label>
  );
}`;

const statesCode = `<div className="flex items-center gap-5">
  <Checkbox aria-label="Unchecked" />
  <Checkbox aria-label="Checked" defaultChecked />
  <Checkbox aria-label="Partially selected" checked="indeterminate" />
  <Checkbox aria-label="Disabled" disabled />
</div>`;

export default function CheckboxDoc() {
  const t = useTranslations("checkbox");
  const [checked, setChecked] = useState(true);
  const checkboxProps: PropDef[] = [
    { name: "checked", type: 'boolean | "indeterminate"', description: t("checked") },
    { name: "defaultChecked", type: "boolean", default: "false", description: t("defaultChecked") },
    { name: "indeterminate", type: "boolean", default: "false", description: t("indeterminate") },
    { name: "onCheckedChange", type: "(checked: boolean) => void", description: t("onCheckedChange") },
    { name: "disabled", type: "boolean", default: "false", description: t("disabled") },
    { name: "name", type: "string", description: t("name") },
  ];

  return (
    <DocPage
      description="Compact checkbox with checked, mixed, disabled, validation, and form states."
      slug="checkbox"
      title="Checkbox"
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "checked",
              label: "Checked",
              code: basicCode,
              preview: (
                <label className="flex cursor-pointer items-center gap-2.5 text-body">
                  <Checkbox defaultChecked />
                  <span>Remember this device</span>
                </label>
              ),
            },
            {
              value: "mixed",
              label: "Indeterminate",
              code: `<Checkbox checked="indeterminate" aria-label="Partially selected" />`,
              preview: <Checkbox checked="indeterminate" aria-label="Partially selected" />,
            },
            {
              value: "disabled",
              label: "Disabled",
              code: `<Checkbox defaultChecked disabled aria-label="Disabled" />`,
              preview: <Checkbox defaultChecked disabled aria-label="Disabled" />,
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <label className="flex cursor-pointer items-center gap-2.5 text-body">
            <Checkbox checked={checked} onCheckedChange={setChecked} />
            <span>Remember this device</span>
          </label>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("states")}>
        <ComponentPreview code={statesCode}>
          <div className="flex flex-wrap items-center gap-5">
            <Checkbox aria-label="Unchecked" />
            <Checkbox aria-label="Checked" defaultChecked />
            <Checkbox
              aria-label="Partially selected"
              checked="indeterminate"
            />
            <Checkbox aria-label="Disabled" disabled />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={checkboxProps} />
      </DocSection>
    </DocPage>
  );
}
