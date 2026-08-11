"use client";

import { useState } from "react";
import {
  RadioGroup,
  RadioGroupItem,
  RadioItem,
} from "@/components/ui/radio-group";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import { RadioGroup, RadioGroupItem } from "./components/radio-group";
import { useState } from "react";

function Example() {
  const [value, setValue] = useState("email");

  return (
    <RadioGroup value={value} onValueChange={setValue} name="notifications">
      <label className="flex items-center gap-2.5">
        <RadioGroupItem value="email" />
        <span>Email</span>
      </label>
      <label className="flex items-center gap-2.5">
        <RadioGroupItem value="push" />
        <span>Push notification</span>
      </label>
      <label className="flex items-center gap-2.5">
        <RadioGroupItem value="none" />
        <span>Nothing</span>
      </label>
    </RadioGroup>
  );
}`;

const enhancedCode = `const options = ["Option A", "Option B", "Option C"];
const [selected, setSelected] = useState(0);

<RadioGroup selectedIndex={selected}>
  {options.map((label, index) => (
    <RadioItem
      key={label}
      index={index}
      label={label}
      selected={selected === index}
      onSelect={() => setSelected(index)}
    />
  ))}
</RadioGroup>`;

const groupProps = (t: ReturnType<typeof useTranslations>): PropDef[] => [
  {
    name: "value",
    type: "string",
    description: t("value"),
  },
  {
    name: "defaultValue",
    type: "string",
    description: t("defaultValue"),
  },
  {
    name: "onValueChange",
    type: "(value: string) => void",
    description: t("onValueChange"),
  },
  {
    name: "name",
    type: "string",
    description: t("name"),
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: t("disabledGroup"),
  },
  {
    name: "selectedIndex",
    type: "number",
    description: t("selectedIndex"),
  },
];

const groupItemProps = (t: ReturnType<typeof useTranslations>): PropDef[] => [
  {
    name: "value",
    type: "string",
    description: t("itemValue"),
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: t("itemDisabled"),
  },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: t("required"),
  },
  {
    name: "readOnly",
    type: "boolean",
    default: "false",
    description: t("readOnly"),
  },
];

const enhancedItemProps = (t: ReturnType<typeof useTranslations>): PropDef[] => [
  { name: "label", type: "string", description: t("label") },
  { name: "index", type: "number", description: t("index") },
  { name: "selected", type: "boolean", description: t("selected") },
  { name: "onSelect", type: "() => void", description: t("onSelect") },
  { name: "value", type: "string", description: t("enhancedValue") },
];

export default function RadioGroupDoc() {
  const t = useTranslations("radioGroup");
  const [value, setValue] = useState("email");
  const options = ["Option A", "Option B", "Option C"];
  const [selected, setSelected] = useState(0);

  return (
    <DocPage
      description="Composable radio controls with standard form behavior and an enhanced proximity-hover row variant."
      slug="radio-group"
      title="RadioGroup"
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <RadioGroup
            name="notification-preview"
            onValueChange={setValue}
            value={value}
          >
            {[
              ["email", "Email"],
              ["push", "Push notification"],
              ["none", "Nothing"],
            ].map(([optionValue, label]) => (
              <label
                className="flex cursor-pointer items-center gap-2.5 text-body-sm"
                key={optionValue}
              >
                <RadioGroupItem value={optionValue} />
                <span>{label}</span>
              </label>
            ))}
          </RadioGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("enhancedRows")}>
        <ComponentPreview code={enhancedCode}>
          <RadioGroup selectedIndex={selected}>
            {options.map((label, index) => (
              <RadioItem
                index={index}
                key={label}
                label={label}
                onSelect={() => setSelected(index)}
                selected={selected === index}
              />
            ))}
          </RadioGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — RadioGroup`}>
        <PropsTable props={groupProps(t)} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — RadioGroupItem`}>
        <PropsTable props={groupItemProps(t)} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — RadioItem`}>
        <PropsTable props={enhancedItemProps(t)} />
      </DocSection>
    </DocPage>
  );
}
