"use client";

import { useState } from "react";
import { useIcon, type IconComponent } from "@zeron/icons/context";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@zeron/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@zeron/ui/combobox";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { AgentGuide } from "@docs/components/content/AgentGuide";
import { AnatomySection } from "@docs/components/content/AnatomyDiagram";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const basicCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";
import { useState } from "react";

const [value, setValue] = useState("");

<Select value={value} onValueChange={setValue}>
  <SelectTrigger placeholder="Select a fruit…" />
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="cherry">Cherry</SelectItem>
    <SelectItem value="mango">Mango</SelectItem>
  </SelectContent>
</Select>`;

const variantsCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";

{/* Bordered (default) */}
<Select>
  <SelectTrigger variant="bordered" placeholder="Bordered" />
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>

{/* Borderless */}
<Select>
  <SelectTrigger variant="borderless" placeholder="Borderless" />
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>`;

const sizesCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";

<Select size="sm" itemDensity="compact">
  <SelectTrigger placeholder="Small" />
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>

<Select size="md" itemDensity="regular">
  <SelectTrigger placeholder="Medium" />
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>

<Select size="lg" itemDensity="comfortable">
  <SelectTrigger placeholder="Large" />
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>`;

const iconsCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";
import { useIcons } from "@zeron/icons/context";

const { sun: Sun, moon: Moon, monitor: Monitor } = useIcons();

const [theme, setTheme] = useState("system");
const themeIcons = { light: Sun, dark: Moon, system: Monitor };
const ThemeIcon = themeIcons[theme] ?? Monitor;

<Select value={theme} onValueChange={setTheme}>
  <SelectTrigger icon={ThemeIcon} placeholder="Theme" />
  <SelectContent>
    <SelectItem value="system" icon={Monitor}>System</SelectItem>
    <SelectItem value="light" icon={Sun}>Light</SelectItem>
    <SelectItem value="dark" icon={Moon}>Dark</SelectItem>
  </SelectContent>
</Select>`;

const groupsCode = `import { Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "./components";
import { useIcons } from "@zeron/icons/context";

const { mail: Mail, bell: Bell, shield: Shield, user: User } = useIcons();

<Select>
  <SelectTrigger placeholder="Settings…" />
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Account</SelectLabel>
      <SelectItem value="profile" icon={User}>Profile</SelectItem>
      <SelectItem value="email" icon={Mail}>Email</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Preferences</SelectLabel>
      <SelectItem value="notifications" icon={Bell}>Notifications</SelectItem>
      <SelectItem value="privacy" icon={Shield}>Privacy</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`;

const timezoneCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";
import { useIcon } from "@zeron/icons/context";

const Globe = useIcon("globe");

<Select value={timezone} onValueChange={setTimezone}>
  <SelectTrigger icon={Globe} placeholder="Select timezone…" />
  <SelectContent>
    <SelectItem value="utc-8">(UTC-8) Pacific Time</SelectItem>
    <SelectItem value="utc-7">(UTC-7) Mountain Time</SelectItem>
    <SelectItem value="utc-6">(UTC-6) Central Time</SelectItem>
    <SelectItem value="utc-5">(UTC-5) Eastern Time</SelectItem>
    <SelectItem value="utc-4">(UTC-4) Atlantic Time</SelectItem>
    <SelectItem value="utc-3">(UTC-3) Buenos Aires</SelectItem>
    <SelectItem value="utc-1">(UTC-1) Azores</SelectItem>
    <SelectItem value="utc+0">(UTC+0) London</SelectItem>
    <SelectItem value="utc+1">(UTC+1) Paris</SelectItem>
    <SelectItem value="utc+2">(UTC+2) Helsinki</SelectItem>
    <SelectItem value="utc+3">(UTC+3) Moscow</SelectItem>
    <SelectItem value="utc+5:30">(UTC+5:30) Mumbai</SelectItem>
    <SelectItem value="utc+8">(UTC+8) Singapore</SelectItem>
    <SelectItem value="utc+9">(UTC+9) Tokyo</SelectItem>
    <SelectItem value="utc+10">(UTC+10) Sydney</SelectItem>
    <SelectItem value="utc+12">(UTC+12) Auckland</SelectItem>
  </SelectContent>
</Select>`;

const searchableFrameworks = [
  "Next.js",
  "React Router",
  "Remix",
  "Gatsby",
  "Astro",
  "SvelteKit",
  "Nuxt",
  "SolidStart",
  "Qwik City",
  "Angular",
  "Vue",
  "Svelte",
  "SolidJS",
  "Preact",
  "Lit",
  "Ember.js",
  "RedwoodSDK",
  "TanStack Start",
];

const searchableCode = `import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@zeron/ui/combobox";

const frameworks = [
  "Next.js", "React Router", "Remix", "Gatsby", "Astro", "SvelteKit",
  "Nuxt", "SolidStart", "Qwik City", "Angular", "Vue", "Svelte",
  "SolidJS", "Preact", "Lit", "Ember.js", "RedwoodSDK", "TanStack Start",
];
const [framework, setFramework] = useState<string | null>(null);

<Combobox items={frameworks} value={framework} onValueChange={setFramework}>
  <ComboboxTrigger aria-label="Select a framework">
    <ComboboxValue placeholder="Select a framework…" />
  </ComboboxTrigger>
  <ComboboxContent>
    <ComboboxInput
      aria-label="Search frameworks"
      className="mb-1"
      placeholder="Search frameworks…"
      showTrigger={false}
    />
    <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
    <ComboboxList className="max-h-56">
      {(item) => (
        <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`;

const errorCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";

<Select value={role} onValueChange={setRole}>
  <SelectTrigger
    placeholder="Select a role…"
    error="Please select a role to continue."
  />
  <SelectContent>
    <SelectItem value="admin">Admin</SelectItem>
    <SelectItem value="editor">Editor</SelectItem>
    <SelectItem value="viewer">Viewer</SelectItem>
  </SelectContent>
</Select>`;

const disabledCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";

{/* Disabled trigger */}
<Select disabled>
  <SelectTrigger placeholder="Disabled" />
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
  </SelectContent>
</Select>

{/* Disabled individual items */}
<Select>
  <SelectTrigger placeholder="Some disabled…" />
  <SelectContent>
    <SelectItem value="a">Available</SelectItem>
    <SelectItem value="b" disabled>Unavailable</SelectItem>
    <SelectItem value="c">Available</SelectItem>
  </SelectContent>
</Select>`;

// ---------------------------------------------------------------------------
// Props definitions
// ---------------------------------------------------------------------------

const selectProps: PropDef[] = [
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg" | "xl"',
    default: '"md"',
    description: "Height, padding, text size, and icon size of the trigger.",
  },
  {
    name: "itemDensity",
    type: '"compact" | "regular" | "comfortable"',
    default: '"regular"',
    description: "Independent density of options in the popup.",
  },
  {
    name: "value",
    type: "string",
    description: "Controlled selected value.",
  },
  {
    name: "defaultValue",
    type: "string",
    description: "Uncontrolled default value.",
  },
  {
    name: "onValueChange",
    type: "(value: string) => void",
    description: "Called when the selected value changes.",
  },
  {
    name: "open",
    type: "boolean",
    description: "Controlled open state.",
  },
  {
    name: "defaultOpen",
    type: "boolean",
    default: "false",
    description: "Uncontrolled initial open state.",
  },
  {
    name: "onOpenChange",
    type: "(open: boolean) => void",
    description: "Called when the popup open state changes.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the entire select.",
  },
  {
    name: "name",
    type: "string",
    description: "Name for form submission.",
  },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "Marks the select as required in forms.",
  },
];

const triggerProps: PropDef[] = [
  {
    name: "variant",
    type: '"bordered" | "borderless"',
    default: '"bordered"',
    description: "Visual style of the trigger.",
  },
  {
    name: "icon",
    type: "IconComponent",
    description: "Optional icon displayed before the value.",
  },
  {
    name: "placeholder",
    type: "string",
    default: '"Select…"',
    description: "Text shown when no value is selected.",
  },
  {
    name: "error",
    type: "string",
    description: "Error message shown below the trigger.",
  },
  {
    name: "wrapperClassName",
    type: "string",
    description: "Additional classes for the trigger wrapper.",
  },
];

const itemProps: PropDef[] = [
  {
    name: "value",
    type: "string",
    description: "Unique value for this option.",
  },
  {
    name: "label",
    type: "ReactNode",
    description: "Label shown by the closed trigger; defaults to the item content.",
  },
  {
    name: "textValue",
    type: "string",
    description: "Plain-text label used for keyboard typeahead.",
  },
  {
    name: "icon",
    type: "IconComponent",
    description: "Optional icon displayed before the label.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables this individual item.",
  },
];

const contentProps: PropDef[] = [
  {
    name: "className",
    type: "string",
    description: "Additional classes for the menu container.",
  },
  {
    name: "side",
    type: '"top" | "right" | "bottom" | "left"',
    default: '"bottom"',
    description: "Preferred side of the trigger.",
  },
  {
    name: "align",
    type: '"start" | "center" | "end"',
    default: '"start"',
    description: "Popup alignment relative to the trigger.",
  },
  {
    name: "sideOffset",
    type: "number",
    default: "6",
    description: "Distance from the trigger along the selected side.",
  },
  {
    name: "alignOffset",
    type: "number",
    default: "0",
    description: "Alignment offset along the trigger edge.",
  },
];

// ---------------------------------------------------------------------------
// Doc Page
// ---------------------------------------------------------------------------

export default function SelectDoc() {
  const t = useTranslations("select");
  const localize = (props: PropDef[], prefix: string) =>
    props.map((prop, index) => ({ ...prop, description: t(`${prefix}${index}`) }));
  const Sun = useIcon("sun");
  const Moon = useIcon("moon");
  const Monitor = useIcon("monitor");
  const Mail = useIcon("mail");
  const Bell = useIcon("bell");
  const Shield = useIcon("shield");
  const Globe = useIcon("globe");
  const User = useIcon("user");

  const [basic, setBasic] = useState("");
  const [bordered, setBordered] = useState("");
  const [borderless, setBorderless] = useState("");
  const [theme, setTheme] = useState("system");
  const [timezone, setTimezone] = useState("");
  const [role, setRole] = useState("");
  const [framework, setFramework] = useState<string | null>(null);

  const themeIcons: Record<string, IconComponent> = { light: Sun, dark: Moon, system: Monitor };
  const ThemeIcon = themeIcons[theme] ?? Monitor;

  return (
    <DocPage
      title="Select"
      slug="select"
      description="Animated select menu with three sizes, proximity hover, bordered/borderless variants, optional leading icons, and a spring-animated popover."
    >
      <DocSection title="Playground">
        <VariantPlayground
          minHeightClass="min-h-[220px]"
          variants={[
            { value: "bordered", label: "Bordered", code: basicCode, preview: <Select value={basic} onValueChange={setBasic}><SelectTrigger placeholder="Select a fruit…" /><SelectContent><SelectItem value="apple">Apple</SelectItem><SelectItem value="banana">Banana</SelectItem><SelectItem value="cherry">Cherry</SelectItem></SelectContent></Select> },
            { value: "borderless", label: "Borderless", code: `<Select><SelectTrigger variant="borderless" placeholder="Borderless" /><SelectContent>...</SelectContent></Select>`, preview: <Select value={borderless} onValueChange={setBorderless}><SelectTrigger variant="borderless" placeholder="Borderless" /><SelectContent><SelectItem value="apple">Apple</SelectItem><SelectItem value="banana">Banana</SelectItem></SelectContent></Select> },
            { value: "with-icon", label: "With icon", code: iconsCode, preview: <Select value={theme} onValueChange={setTheme}><SelectTrigger icon={ThemeIcon} placeholder="Theme" /><SelectContent><SelectItem value="system" icon={Monitor}>System</SelectItem><SelectItem value="light" icon={Sun}>Light</SelectItem><SelectItem value="dark" icon={Moon}>Dark</SelectItem></SelectContent></Select> },
          ]}
        />
      </DocSection>

      <AnatomySection
        boundaryTarget='[data-slot="select-trigger"]'
        code={basicCode}
        component="Select"
        items={[
          { label: { en: "Trigger", zh: "触发器" }, target: '[data-slot="select-trigger"]', side: "bottom" },
          { label: { en: "Selected value", zh: "已选值" }, target: '[data-slot="select-value"]', side: "top" },
          { label: { en: "Disclosure icon", zh: "展开图标" }, target: '[data-slot="select-trigger-icon"]', side: "top" },
        ]}
      >
        <Select defaultValue="apple">
          <SelectTrigger className="w-72 max-w-[70vw]" placeholder="Select a fruit…" />
          <SelectContent><SelectItem value="apple">Apple</SelectItem></SelectContent>
        </Select>
      </AnatomySection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Select value={basic} onValueChange={setBasic}>
            <SelectTrigger placeholder="Select a fruit…" />
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="cherry">Cherry</SelectItem>
              <SelectItem value="mango">Mango</SelectItem>
            </SelectContent>
          </Select>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("variants")}>
        <ComponentPreview code={variantsCode}>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={bordered} onValueChange={setBordered}>
              <SelectTrigger variant="bordered" placeholder="Bordered" />
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>

            <Select value={borderless} onValueChange={setBorderless}>
              <SelectTrigger variant="borderless" placeholder="Borderless" />
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("sizes")}>
        <ComponentPreview code={sizesCode}>
          <div className="flex flex-wrap items-center gap-3">
            <Select size="sm" itemDensity="compact">
              <SelectTrigger placeholder="Small" />
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
              </SelectContent>
            </Select>

            <Select size="md" itemDensity="regular">
              <SelectTrigger placeholder="Medium" />
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
              </SelectContent>
            </Select>

            <Select size="lg" itemDensity="comfortable">
              <SelectTrigger placeholder="Large" />
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("withIcons")}>
        <ComponentPreview code={iconsCode}>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger icon={ThemeIcon} placeholder="Theme" />
            <SelectContent>
              <SelectItem value="system" icon={Monitor}>System</SelectItem>
              <SelectItem value="light" icon={Sun}>Light</SelectItem>
              <SelectItem value="dark" icon={Moon}>Dark</SelectItem>
            </SelectContent>
          </Select>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("groups")}>
        <ComponentPreview code={groupsCode}>
          <Select>
            <SelectTrigger placeholder="Settings…" />
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Account</SelectLabel>
                <SelectItem value="profile" icon={User}>Profile</SelectItem>
                <SelectItem value="email" icon={Mail}>Email</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Preferences</SelectLabel>
                <SelectItem value="notifications" icon={Bell}>Notifications</SelectItem>
                <SelectItem value="privacy" icon={Shield}>Privacy</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("scrollableList")}>
        <ComponentPreview code={timezoneCode}>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger icon={Globe} placeholder="Select timezone…" />
            <SelectContent>
              <SelectItem value="utc-8">(UTC-8) Pacific Time</SelectItem>
              <SelectItem value="utc-7">(UTC-7) Mountain Time</SelectItem>
              <SelectItem value="utc-6">(UTC-6) Central Time</SelectItem>
              <SelectItem value="utc-5">(UTC-5) Eastern Time</SelectItem>
              <SelectItem value="utc-4">(UTC-4) Atlantic Time</SelectItem>
              <SelectItem value="utc-3">(UTC-3) Buenos Aires</SelectItem>
              <SelectItem value="utc-1">(UTC-1) Azores</SelectItem>
              <SelectItem value="utc+0">(UTC+0) London</SelectItem>
              <SelectItem value="utc+1">(UTC+1) Paris</SelectItem>
              <SelectItem value="utc+2">(UTC+2) Helsinki</SelectItem>
              <SelectItem value="utc+3">(UTC+3) Moscow</SelectItem>
              <SelectItem value="utc+5:30">(UTC+5:30) Mumbai</SelectItem>
              <SelectItem value="utc+8">(UTC+8) Singapore</SelectItem>
              <SelectItem value="utc+9">(UTC+9) Tokyo</SelectItem>
              <SelectItem value="utc+10">(UTC+10) Sydney</SelectItem>
              <SelectItem value="utc+12">(UTC+12) Auckland</SelectItem>
            </SelectContent>
          </Select>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("searchable")}>
        <p className="text-body text-fg-muted">{t("searchableHint")}</p>
        <ComponentPreview code={searchableCode} minHeightClass="min-h-[240px]">
          <Combobox
            items={searchableFrameworks}
            value={framework}
            onValueChange={setFramework}
          >
            <ComboboxTrigger aria-label="Select a framework">
              <ComboboxValue placeholder="Select a framework…" />
            </ComboboxTrigger>
            <ComboboxContent>
              <ComboboxInput
                aria-label="Search frameworks"
                className="mb-1"
                placeholder="Search frameworks…"
                showTrigger={false}
              />
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxList className="max-h-56">
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("errorState")}>
        <ComponentPreview code={errorCode}>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger
              placeholder="Select a role…"
              error="Please select a role to continue."
            />
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("disabled")}>
        <ComponentPreview code={disabledCode}>
          <div className="flex flex-wrap items-center gap-3">
            <Select disabled>
              <SelectTrigger placeholder="Disabled" />
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger placeholder="Some disabled…" />
              <SelectContent>
                <SelectItem value="a">Available</SelectItem>
                <SelectItem value="b" disabled>Unavailable</SelectItem>
                <SelectItem value="c">Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ComponentPreview>
      </DocSection>

      <AgentGuide collection="components" slug="select" />

      <DocSection title={`${t("apiReference")} — Select`}>
        <PropsTable props={localize(selectProps, "p")} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — SelectTrigger`}>
        <PropsTable props={localize(triggerProps, "t")} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — SelectContent`}>
        <PropsTable props={localize(contentProps, "c")} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — SelectItem`}>
        <PropsTable props={localize(itemProps, "i")} />
      </DocSection>
    </DocPage>
  );
}
