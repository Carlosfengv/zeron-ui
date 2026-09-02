"use client";

import { useState } from "react";
import {
  RadioGroup,
  RadioGroupItem,
  RadioItem,
} from "@zeron/ui/radio-group";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { AnatomySection } from "@docs/components/content/AnatomyDiagram";
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
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "form",
              label: "Form controls",
              code: basicCode,
              preview: <RadioGroup defaultValue="email" name="playground-notifications"><label className="flex cursor-pointer items-center gap-2.5 text-body"><RadioGroupItem value="email" /><span>Email</span></label><label className="flex cursor-pointer items-center gap-2.5 text-body"><RadioGroupItem value="push" /><span>Push notification</span></label></RadioGroup>,
            },
            {
              value: "enhanced",
              label: "Enhanced rows",
              code: enhancedCode,
              preview: <RadioGroup selectedIndex={0}><RadioItem index={0} label="Option A" selected onSelect={() => {}} /><RadioItem index={1} label="Option B" selected={false} onSelect={() => {}} /></RadioGroup>,
            },
          ]}
        />
      </DocSection>

      <AnatomySection
        boundaryTarget='[data-anatomy="radio-option"]'
        code={basicCode}
        component="RadioGroup"
        items={[
          { label: { en: "Group", zh: "单选组" }, target: '[data-slot="radio-group"]', side: "bottom" },
          { label: { en: "Radio control", zh: "单选控件" }, target: '[data-slot="radio-group-item"]', side: "top" },
          { label: { en: "Option label", zh: "选项标签" }, target: '[data-anatomy="radio-label"]', side: "top" },
        ]}
      >
        <RadioGroup defaultValue="email" name="anatomy-notifications">
          <label data-anatomy="radio-option" className="flex items-center gap-2.5 px-2 py-1.5">
            <RadioGroupItem value="email" />
            <span data-anatomy="radio-label">Email</span>
          </label>
        </RadioGroup>
      </AnatomySection>

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
                className="flex cursor-pointer items-center gap-2.5 text-body"
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
