"use client";

import { useState } from "react";
import { Switch } from "@zeron/ui/switch";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import { Switch } from "./components";
import { useState } from "react";

const [checked, setChecked] = useState(false);

<Switch
  label="Notifications"
  checked={checked}
  onToggle={() => setChecked((prev) => !prev)}
/>`;

const disabledCode = `<Switch
  label="Disabled option"
  checked={false}
  onToggle={() => {}}
  disabled
/>`;

export default function SwitchDoc() {
  const [checked, setChecked] = useState(false);
  const t = useTranslations("switch");
  const switchProps: PropDef[] = [
    { name: "label", type: "string", description: t("label") },
    { name: "checked", type: "boolean", description: t("checked") },
    { name: "onToggle", type: "() => void", description: t("onToggle") },
    { name: "disabled", type: "boolean", default: "false", description: t("disabledProp") },
  ];

  return (
    <DocPage
      title="Switch"
      slug="switch"
      description="Toggle switch with animated thumb and label."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Switch
            label="Notifications"
            checked={checked}
            onToggle={() => setChecked((prev) => !prev)}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("disabled")}>
        <ComponentPreview code={disabledCode}>
          <Switch
            label="Disabled option"
            checked={false}
            onToggle={() => {}}
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
