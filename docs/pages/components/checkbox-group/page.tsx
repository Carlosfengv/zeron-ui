"use client";

import { useState } from "react";
import { CheckboxGroup, CheckboxItem } from "@zeron/ui/checkbox-group";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import { CheckboxGroup, CheckboxItem } from "./components";
import { useState } from "react";

const items = ["Apples", "Bananas", "Cherries", "Dates"];
const [checked, setChecked] = useState<Set<number>>(new Set([0]));

<CheckboxGroup checkedIndices={checked}>
  {items.map((label, i) => (
    <CheckboxItem
      key={label}
      index={i}
      label={label}
      checked={checked.has(i)}
      onToggle={() => {
        setChecked((prev) => {
          const next = new Set(prev);
          if (next.has(i)) next.delete(i);
          else next.add(i);
          return next;
        });
      }}
    />
  ))}
</CheckboxGroup>`;

export default function CheckboxGroupDoc() {
  const t = useTranslations("checkboxGroup");
  const items = ["Apples", "Bananas", "Cherries", "Dates"];
  const [checked, setChecked] = useState<Set<number>>(new Set([0]));
  const groupProps: PropDef[] = [
    { name: "checkedIndices", type: "Set<number>", description: t("checkedIndices") },
    { name: "children", type: "ReactNode", description: t("groupChildren") },
  ];
  const itemProps: PropDef[] = [
    { name: "label", type: "string", description: t("label") },
    { name: "index", type: "number", description: t("index") },
    { name: "checked", type: "boolean", description: t("checked") },
    { name: "icon", type: "IconComponent", description: t("icon") },
    { name: "onToggle", type: "() => void", description: t("onToggle") },
    { name: "trailing", type: "ReactNode", description: t("trailing") },
  ];

  return (
    <DocPage
      title="CheckboxGroup"
      slug="checkbox-group"
      description="Checkbox group with merged backgrounds for contiguous selections."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <CheckboxGroup checkedIndices={checked}>
            {items.map((label, i) => (
              <CheckboxItem
                key={label}
                index={i}
                label={label}
                checked={checked.has(i)}
                onToggle={() => {
                  setChecked((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  });
                }}
              />
            ))}
          </CheckboxGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — CheckboxGroup`}>
        <PropsTable props={groupProps} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — CheckboxItem`}>
        <PropsTable props={itemProps} />
      </DocSection>
    </DocPage>
  );
}
