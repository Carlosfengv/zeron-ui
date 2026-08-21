"use client";

import { Fragment, useState } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@zeron/ui/combobox";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const frameworks = ["Next.js", "SvelteKit", "Nuxt", "Remix", "Astro"];

type Framework = {
  label: string;
  value: string;
  category: "React" | "Independent";
};

const frameworkObjects: Framework[] = [
  { label: "Next.js", value: "next", category: "React" },
  { label: "Remix", value: "remix", category: "React" },
  { label: "SvelteKit", value: "sveltekit", category: "Independent" },
  { label: "Nuxt", value: "nuxt", category: "Independent" },
];

const frameworkGroups = [
  { label: "React", items: frameworkObjects.filter((item) => item.category === "React") },
  { label: "Independent", items: frameworkObjects.filter((item) => item.category === "Independent") },
];

const basicCode = `import {
  Combobox, ComboboxInput, ComboboxContent,
  ComboboxEmpty, ComboboxList, ComboboxItem,
} from "@zeron/ui/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt", "Remix", "Astro"];

<Combobox items={frameworks}>
  <ComboboxInput aria-label="Framework" placeholder="Select a framework" />
  <ComboboxContent>
    <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`;

const objectCode = `type Framework = { label: string; value: string };

<Combobox
  items={frameworks}
  value={value}
  onValueChange={setValue}
  itemToStringLabel={(item) => item.label}
  itemToStringValue={(item) => item.value}
  isItemEqualToValue={(item, selected) => item.value === selected.value}
>
  <ComboboxInput aria-label="Framework" showClear placeholder="Search frameworks" />
  <ComboboxContent>
    <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`;

const multipleCode = `const anchor = useComboboxAnchor();
const [value, setValue] = useState<string[]>(["Next.js"]);

<Combobox items={frameworks} multiple value={value} onValueChange={setValue}>
  <ComboboxChips ref={anchor}>
    <ComboboxValue>
      {(selected) => (
        <>
          {selected.map((item) => (
            <ComboboxChip key={item} removeAriaLabel={\`Remove \${item}\`}>
              {item}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput aria-label="Frameworks" placeholder="Add framework" />
        </>
      )}
    </ComboboxValue>
  </ComboboxChips>
  <ComboboxContent anchor={anchor}>...</ComboboxContent>
</Combobox>`;

const groupedCode = `import { Fragment } from "react";

<Combobox
  items={groups}
  itemToStringLabel={(item) => item.label}
  itemToStringValue={(item) => item.value}
>
  <ComboboxInput aria-label="Framework" placeholder="Search frameworks" />
  <ComboboxContent>
    <ComboboxList>
      {(group, groupIndex) => (
        <Fragment key={group.label}>
          {groupIndex > 0 && <ComboboxSeparator />}
          <ComboboxGroup items={group.items}>
            <ComboboxLabel>{group.label}</ComboboxLabel>
            <ComboboxCollection>
              {(item) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}
            </ComboboxCollection>
          </ComboboxGroup>
        </Fragment>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`;

const popupCode = `<Combobox items={frameworks}>
  <ComboboxTrigger aria-label="Choose a framework">
    <ComboboxValue placeholder="Select a framework" />
  </ComboboxTrigger>
  <ComboboxContent>
    <ComboboxInput
      aria-label="Search frameworks"
      className="mb-1"
      placeholder="Search frameworks"
      showTrigger={false}
    />
    <ComboboxList>...</ComboboxList>
  </ComboboxContent>
</Combobox>`;

const rootProps: PropDef[] = [
  { name: "items", type: "Value[] | Group<Value>[]", description: "Complete item collection used for rendering and filtering." },
  { name: "value / defaultValue", type: "Value | Value[] | null", description: "Controlled or initial selected value; arrays are used with multiple." },
  { name: "onValueChange", type: "(value, details) => void", description: "Called when selection changes." },
  { name: "multiple", type: "boolean", default: "false", description: "Enables multiple selection and array values." },
  { name: "inputValue / defaultInputValue", type: "string", description: "Controlled or initial search query." },
  { name: "onInputValueChange", type: "(query, details) => void", description: "Called when the query changes; use it to drive remote search." },
  { name: "open / defaultOpen", type: "boolean", description: "Controlled or initial popup state." },
  { name: "onOpenChange", type: "(open, details) => void", description: "Called when the popup state changes." },
  { name: "itemToStringLabel", type: "(item) => string", description: "Maps object values to display and search text." },
  { name: "itemToStringValue", type: "(item) => string", description: "Maps object values to the value submitted with a form." },
  { name: "filter / filteredItems", type: "function / Value[]", description: "Custom or externally controlled filtering." },
  { name: "size", type: '"xs" | "sm" | "md" | "lg" | "xl"', default: '"md"', description: "Outer input, trigger, icon, and chip-input size." },
  { name: "itemDensity", type: '"compact" | "regular" | "comfortable"', default: '"regular"', description: "Independent option density in the popup." },
  { name: "disabled / readOnly / required", type: "boolean", default: "false", description: "Interaction and form-validation states." },
];

const inputProps: PropDef[] = [
  { name: "showTrigger", type: "boolean", default: "true", description: "Shows the popup toggle inside the input group." },
  { name: "showClear", type: "boolean", default: "false", description: "Shows a clear action while the combobox has a value." },
  { name: "clearAriaLabel", type: "string", default: '"Clear selection"', description: "Accessible label for the clear action." },
  { name: "triggerAriaLabel", type: "string", default: '"Open options"', description: "Accessible label for the popup toggle." },
  { name: "variant", type: '"outline" | "secondary" | "ghost"', default: '"outline"', description: "Visual treatment of the input frame." },
  { name: "className", type: "string", description: "Classes applied to the visible InputGroup frame." },
  { name: "inputClassName", type: "string", description: "Classes applied to the native input element." },
];

const contentProps: PropDef[] = [
  { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: "Preferred popup placement." },
  { name: "align", type: '"start" | "center" | "end"', default: '"start"', description: "Popup alignment along its anchor." },
  { name: "sideOffset / alignOffset", type: "number", default: "6 / 0", description: "Distance from and offset along the anchor." },
  { name: "anchor", type: "Element | RefObject<Element>", description: "Custom anchor, required for the chips composition." },
  { name: "container", type: "HTMLElement | null", description: "Optional portal target override." },
];

const itemProps: PropDef[] = [
  { name: "value", type: "Value", description: "Unique primitive or object value represented by the option." },
  { name: "disabled", type: "boolean", default: "false", description: "Prevents this option from being selected." },
  { name: "icon", type: "IconComponent", description: "Optional project icon shown before the item content." },
  { name: "index", type: "number", description: "Explicit index for externally virtualized lists." },
];

function MultipleDemo() {
  const [value, setValue] = useState<string[]>(["Next.js"]);
  const anchor = useComboboxAnchor();

  return (
    <Combobox items={frameworks} multiple value={value} onValueChange={setValue}>
      <ComboboxChips ref={anchor} className="w-80 max-w-full">
        <ComboboxValue>
          {(selected: string[]) => (
            <>
              {selected.map((item) => (
                <ComboboxChip key={item} removeAriaLabel={`Remove ${item}`}>
                  {item}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                aria-label="Frameworks"
                placeholder={selected.length ? "" : "Add framework"}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export default function ComboboxDoc() {
  const t = useTranslations("combobox");
  const [basicValue, setBasicValue] = useState<string | null>(null);
  const [objectValue, setObjectValue] = useState<Framework | null>(null);
  const [popupValue, setPopupValue] = useState<string | null>(null);
  const localize = (props: PropDef[], prefix: string) =>
    props.map((prop, index) => ({ ...prop, description: t(`${prefix}${index}`) }));

  return (
    <DocPage
      title="Combobox"
      slug="combobox"
      description="Filterable single- or multi-select with typed object values, groups, chips, custom triggers, and controlled search."
    >
      <DocSection title="Playground">
        <VariantPlayground
          minHeightClass="min-h-[260px]"
          variants={[
            {
              value: "basic",
              label: "Basic",
              code: basicCode,
              preview: (
                <Combobox items={frameworks} value={basicValue} onValueChange={setBasicValue}>
                  <ComboboxInput className="w-72 max-w-full" aria-label="Framework" placeholder="Select a framework" />
                  <ComboboxContent>
                    <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
                    <ComboboxList>{(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList>
                  </ComboboxContent>
                </Combobox>
              ),
            },
            { value: "multiple", label: "Multiple", code: multipleCode, preview: <MultipleDemo /> },
            {
              value: "objects",
              label: "Object values",
              code: objectCode,
              preview: (
                <Combobox
                  items={frameworkObjects}
                  value={objectValue}
                  onValueChange={setObjectValue}
                  itemToStringLabel={(item) => item.label}
                  itemToStringValue={(item) => item.value}
                  isItemEqualToValue={(item, selected) => item.value === selected.value}
                >
                  <ComboboxInput className="w-72 max-w-full" showClear aria-label="Framework object" placeholder="Search frameworks" />
                  <ComboboxContent>
                    <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
                    <ComboboxList>{(item: Framework) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList>
                  </ComboboxContent>
                </Combobox>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Combobox items={frameworks} value={basicValue} onValueChange={setBasicValue}>
            <ComboboxInput className="w-72 max-w-full" aria-label="Basic framework" placeholder="Select a framework" />
            <ComboboxContent>
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxList>{(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("multiple")}>
        <ComponentPreview code={multipleCode}><MultipleDemo /></ComponentPreview>
      </DocSection>

      <DocSection title={t("objectValues")}>
        <ComponentPreview code={objectCode}>
          <Combobox
            items={frameworkObjects}
            value={objectValue}
            onValueChange={setObjectValue}
            itemToStringLabel={(item) => item.label}
            itemToStringValue={(item) => item.value}
            isItemEqualToValue={(item, selected) => item.value === selected.value}
          >
            <ComboboxInput className="w-72 max-w-full" showClear aria-label="Object framework" placeholder="Search frameworks" />
            <ComboboxContent>
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxList>{(item: Framework) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("groups")}>
        <ComponentPreview code={groupedCode}>
          <Combobox
            items={frameworkGroups}
            itemToStringLabel={(item: Framework) => item.label}
            itemToStringValue={(item: Framework) => item.value}
          >
            <ComboboxInput className="w-72 max-w-full" aria-label="Grouped frameworks" placeholder="Search frameworks" />
            <ComboboxContent>
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxList>
                {(group: (typeof frameworkGroups)[number], groupIndex: number) => (
                  <Fragment key={group.label}>
                    {groupIndex > 0 && <ComboboxSeparator />}
                    <ComboboxGroup items={group.items}>
                      <ComboboxLabel>{group.label}</ComboboxLabel>
                      <ComboboxCollection>
                        {(item: Framework) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}
                      </ComboboxCollection>
                    </ComboboxGroup>
                  </Fragment>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("popup")}>
        <ComponentPreview code={popupCode}>
          <Combobox items={frameworks} value={popupValue} onValueChange={setPopupValue}>
            <ComboboxTrigger aria-label="Choose a framework">
              <ComboboxValue placeholder="Select a framework" />
            </ComboboxTrigger>
            <ComboboxContent>
              <ComboboxInput className="mb-1" aria-label="Search popup frameworks" placeholder="Search frameworks" showTrigger={false} />
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxList>{(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — Combobox`}>
        <PropsTable props={localize(rootProps, "r")} />
      </DocSection>
      <DocSection title={`${t("apiReference")} — ComboboxInput`}>
        <PropsTable props={localize(inputProps, "i")} />
      </DocSection>
      <DocSection title={`${t("apiReference")} — ComboboxContent`}>
        <PropsTable props={localize(contentProps, "c")} />
      </DocSection>
      <DocSection title={`${t("apiReference")} — ComboboxItem`}>
        <PropsTable props={localize(itemProps, "o")} />
      </DocSection>
    </DocPage>
  );
}
