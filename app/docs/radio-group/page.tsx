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

const groupProps: PropDef[] = [
  {
    name: "value",
    type: "string",
    description: "Controlled value of the selected RadioGroupItem.",
  },
  {
    name: "defaultValue",
    type: "string",
    description: "Initial value for an uncontrolled group.",
  },
  {
    name: "onValueChange",
    type: "(value: string) => void",
    description: "Called when the selected value changes.",
  },
  {
    name: "name",
    type: "string",
    description: "Shared field name used when the group is submitted in a form.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables every radio in the group.",
  },
  {
    name: "selectedIndex",
    type: "number",
    description: "Compatibility API for enhanced RadioItem rows.",
  },
];

const groupItemProps: PropDef[] = [
  {
    name: "value",
    type: "string",
    description: "Unique value represented by the radio control.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Prevents the item from being selected.",
  },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "Marks the control as required for form validation.",
  },
  {
    name: "readOnly",
    type: "boolean",
    default: "false",
    description: "Keeps the current value while preventing selection changes.",
  },
];

const enhancedItemProps: PropDef[] = [
  { name: "label", type: "string", description: "Text label for the enhanced row." },
  { name: "index", type: "number", description: "Position within the enhanced group." },
  { name: "selected", type: "boolean", description: "Whether the row is selected." },
  { name: "onSelect", type: "() => void", description: "Called when the row is selected." },
  { name: "value", type: "string", description: "Optional value for controlled value mode." },
];

export default function RadioGroupDoc() {
  const [value, setValue] = useState("email");
  const options = ["Option A", "Option B", "Option C"];
  const [selected, setSelected] = useState(0);

  return (
    <DocPage
      description="Composable radio controls with standard form behavior and an enhanced proximity-hover row variant."
      slug="radio-group"
      title="RadioGroup"
    >
      <DocSection title="Basic">
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

      <DocSection title="Enhanced rows">
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

      <DocSection title="API Reference — RadioGroup">
        <PropsTable props={groupProps} />
      </DocSection>

      <DocSection title="API Reference — RadioGroupItem">
        <PropsTable props={groupItemProps} />
      </DocSection>

      <DocSection title="API Reference — RadioItem">
        <PropsTable props={enhancedItemProps} />
      </DocSection>
    </DocPage>
  );
}
