"use client";

import { useIcon } from "@/lib/icon-context";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "./components";

<InputGroup>
  <InputGroupAddon>
    <InputGroupText>@</InputGroupText>
  </InputGroupAddon>
  <InputGroupInput placeholder="username" />
</InputGroup>`;

const addonsCode = `<InputGroup>
  <InputGroupAddon>
    <InputGroupText>https://</InputGroupText>
  </InputGroupAddon>
  <InputGroupInput placeholder="example" />
  <InputGroupAddon align="inline-end">
    <InputGroupText>.com</InputGroupText>
  </InputGroupAddon>
</InputGroup>`;

const actionsCode = `import { useIcons } from "@/lib/icon-context";

const { search: Search, x: X } = useIcons();

<InputGroup>
  <InputGroupAddon>
    <Search />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search projects..." />
  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs" aria-label="Clear">
      <X />
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>`;

const textareaCode = `<InputGroup>
  <InputGroupAddon align="block-start">
    <InputGroupText>Description</InputGroupText>
  </InputGroupAddon>
  <InputGroupTextarea placeholder="Tell us about your project..." />
  <InputGroupAddon align="block-end">
    <InputGroupText>0 / 500</InputGroupText>
  </InputGroupAddon>
</InputGroup>`;

const statesCode = `<InputGroup>
  <InputGroupInput value="Disabled value" disabled readOnly />
</InputGroup>

<InputGroup>
  <InputGroupInput
    defaultValue="invalid-value"
    aria-invalid="true"
    aria-describedby="group-error"
  />
</InputGroup>
<p id="group-error">Enter a valid value.</p>`;

const groupProps: PropDef[] = [
  {
    name: "children",
    type: "ReactNode",
    description: "InputGroupInput, InputGroupTextarea, addon, and action content.",
  },
];

const addonProps: PropDef[] = [
  {
    name: "align",
    type: '"inline-start" | "inline-end" | "block-start" | "block-end"',
    default: '"inline-start"',
    description: "Places the addon before, after, above, or below the control.",
  },
];

const buttonProps: PropDef[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "icon-xs" | "icon-sm"',
    default: '"xs"',
    description: "Compact size suited to an input group.",
  },
  {
    name: "variant",
    type: '"primary" | "destructive" | "secondary" | "tertiary" | "ghost"',
    default: '"ghost"',
    description: "Visual treatment inherited from Button.",
  },
];

const controlProps: PropDef[] = [
  {
    name: "variant",
    type: '"outline" | "secondary" | "ghost"',
    default: '"outline"',
    description: "Input variant; its surface is made transparent inside the group.",
  },
  {
    name: "size",
    type: '"sm" | "default" | "lg" | "xl"',
    default: '"default"',
    description: "Height and typography inherited from Input.",
  },
];

const textareaProps: PropDef[] = [
  {
    name: "placeholder",
    type: "string",
    description: "Native textarea placeholder.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables textarea interaction.",
  },
];

export default function InputGroupDoc() {
  const t = useTranslations("inputGroup");
  const localize = (props: PropDef[], prefix: string) => props.map((prop, index) => ({ ...prop, description: t(`${prefix}${index}`) }));
  const Search = useIcon("search");
  const X = useIcon("x");

  return (
    <DocPage
      title="InputGroup"
      slug="input-group"
      description="Composable input surface with inline or stacked addons, compact actions, text inputs, textareas, and validation states."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <div className="w-80 max-w-full">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>@</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="username" aria-label="Username" />
            </InputGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("inlineAddons")}>
        <ComponentPreview code={addonsCode}>
          <div className="w-80 max-w-full">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>https://</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="example" aria-label="Domain" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>.com</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("withActions")}>
        <ComponentPreview code={actionsCode}>
          <div className="w-80 max-w-full">
            <InputGroup>
              <InputGroupAddon>
                <Search size={16} strokeWidth={1.5} />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search projects..." aria-label="Search projects" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="Clear search">
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("textarea")}>
        <ComponentPreview code={textareaCode}>
          <div className="w-80 max-w-full">
            <InputGroup>
              <InputGroupAddon align="block-start">
                <InputGroupText>Description</InputGroupText>
              </InputGroupAddon>
              <InputGroupTextarea
                placeholder="Tell us about your project..."
                aria-label="Project description"
              />
              <InputGroupAddon align="block-end">
                <InputGroupText>0 / 500</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("states")}>
        <ComponentPreview code={statesCode}>
          <div className="flex w-80 max-w-full flex-col gap-3">
            <InputGroup>
              <InputGroupInput
                value="Disabled value"
                disabled
                readOnly
                aria-label="Disabled value"
              />
            </InputGroup>
            <div className="flex flex-col gap-1.5">
              <InputGroup>
                <InputGroupInput
                  defaultValue="invalid-value"
                  aria-invalid="true"
                  aria-describedby="input-group-error"
                  aria-label="Invalid value"
                />
              </InputGroup>
              <p id="input-group-error" className="px-1 text-label text-fg-danger">
                Enter a valid value.
              </p>
            </div>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Focus behavior">
        <p className="max-w-3xl text-body leading-5 text-fg-muted">
          The group ring follows its Input or Textarea only when that editing control matches <code>:focus-visible</code>. Internal buttons keep their own keyboard focus ring and never light the entire group.
        </p>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">InputGroup</h3>
            <PropsTable props={localize(groupProps, "g")} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">InputGroupAddon</h3>
            <PropsTable props={localize(addonProps, "a")} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">InputGroupButton</h3>
            <PropsTable props={localize(buttonProps, "b")} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">InputGroupInput</h3>
            <PropsTable props={localize(controlProps, "c")} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">InputGroupTextarea</h3>
            <PropsTable props={localize(textareaProps, "t")} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
