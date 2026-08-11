"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";

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

const checkboxProps: PropDef[] = [
  {
    name: "checked",
    type: 'boolean | "indeterminate"',
    description: "Controlled checked state. Use indeterminate for a mixed selection.",
  },
  {
    name: "defaultChecked",
    type: "boolean",
    default: "false",
    description: "Initial state when the checkbox is uncontrolled.",
  },
  {
    name: "indeterminate",
    type: "boolean",
    default: "false",
    description: "Alternative prop for showing a mixed selection state.",
  },
  {
    name: "onCheckedChange",
    type: "(checked: boolean) => void",
    description: "Called when the user changes the checked state.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Prevents interaction and applies the disabled treatment.",
  },
  {
    name: "name",
    type: "string",
    description: "Field name used for form submission.",
  },
];

export default function CheckboxDoc() {
  const [checked, setChecked] = useState(true);

  return (
    <DocPage
      description="Compact checkbox with checked, mixed, disabled, validation, and form states."
      slug="checkbox"
      title="Checkbox"
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <label className="flex cursor-pointer items-center gap-2.5 text-body-sm">
            <Checkbox checked={checked} onCheckedChange={setChecked} />
            <span>Remember this device</span>
          </label>
        </ComponentPreview>
      </DocSection>

      <DocSection title="States">
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

      <DocSection title="API Reference">
        <PropsTable props={checkboxProps} />
      </DocSection>
    </DocPage>
  );
}
