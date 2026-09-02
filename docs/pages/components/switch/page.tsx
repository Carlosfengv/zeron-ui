"use client";

import { useState } from "react";
import { Switch } from "@zeron/ui/switch";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { AnatomySection } from "@docs/components/content/AnatomyDiagram";
import { useTranslations } from "next-intl";

const basicCode = `import { Switch } from "./components";
import { useState } from "react";

const [checked, setChecked] = useState(false);

<Switch
  label="Notifications"
  checked={checked}
  onCheckedChange={setChecked}
/>`;

const disabledCode = `<Switch
  label="Disabled option"
  defaultChecked={false}
  disabled
/>`;

export default function SwitchDoc() {
  const [checked, setChecked] = useState(false);
  const t = useTranslations("switch");
  const switchProps: PropDef[] = [
    { name: "label", type: "React.ReactNode", description: t("label") },
    { name: "checked", type: "boolean", description: t("checked") },
    { name: "defaultChecked", type: "boolean", default: "false", description: t("defaultChecked") },
    { name: "onCheckedChange", type: "(checked: boolean) => void", description: t("onCheckedChange") },
    { name: "name", type: "string", description: t("name") },
    { name: "disabled", type: "boolean", default: "false", description: t("disabledProp") },
  ];

  return (
    <DocPage
      title="Switch"
      slug="switch"
      description="Toggle switch with animated thumb and label."
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "notifications",
              label: "Notifications",
              code: basicCode,
              preview: <Switch label="Notifications" defaultChecked />,
            },
            {
              value: "read-only",
              label: "Read-only",
              code: `<Switch label="Automatic updates" defaultChecked readOnly />`,
              preview: <Switch label="Automatic updates" defaultChecked readOnly />,
            },
            {
              value: "disabled",
              label: "Disabled",
              code: disabledCode,
              preview: <Switch label="Disabled option" defaultChecked disabled />,
            },
          ]}
        />
      </DocSection>

      <AnatomySection
        boundaryTarget='[data-slot="switch"]'
        code={basicCode}
        component="Switch"
        items={[
          { label: { en: "Switch control", zh: "开关控件" }, target: '[data-slot="switch-control"]', side: "top" },
          { label: { en: "Thumb", zh: "滑块" }, target: '[data-slot="switch-thumb"]', side: "bottom" },
          { label: { en: "Label", zh: "文本标签" }, target: '[data-slot="switch-label"]', side: "top" },
        ]}
      >
        <Switch label="Notifications" defaultChecked />
      </AnatomySection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Switch
            label="Notifications"
            checked={checked}
            onCheckedChange={setChecked}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("disabled")}>
        <ComponentPreview code={disabledCode}>
          <Switch
            label="Disabled option"
            defaultChecked={false}
            disabled
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={switchProps} />
      </DocSection>
    </DocPage>
  );
}
