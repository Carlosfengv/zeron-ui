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
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
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
    <SelectItem index={0} value="apple">Apple</SelectItem>
    <SelectItem index={1} value="banana">Banana</SelectItem>
    <SelectItem index={2} value="cherry">Cherry</SelectItem>
    <SelectItem index={3} value="mango">Mango</SelectItem>
  </SelectContent>
</Select>`;

const variantsCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";

{/* Bordered (default) */}
<Select>
  <SelectTrigger variant="bordered" placeholder="Bordered" />
  <SelectContent>
    <SelectItem index={0} value="a">Option A</SelectItem>
    <SelectItem index={1} value="b">Option B</SelectItem>
  </SelectContent>
</Select>

{/* Borderless */}
<Select>
  <SelectTrigger variant="borderless" placeholder="Borderless" />
  <SelectContent>
    <SelectItem index={0} value="a">Option A</SelectItem>
    <SelectItem index={1} value="b">Option B</SelectItem>
  </SelectContent>
</Select>`;

const sizesCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";

<Select>
  <SelectTrigger size="sm" placeholder="Small" />
  <SelectContent>
    <SelectItem index={0} value="a">Option A</SelectItem>
    <SelectItem index={1} value="b">Option B</SelectItem>
  </SelectContent>
</Select>

<Select>
  <SelectTrigger size="md" placeholder="Medium" />
  <SelectContent>
    <SelectItem index={0} value="a">Option A</SelectItem>
    <SelectItem index={1} value="b">Option B</SelectItem>
  </SelectContent>
</Select>

<Select>
  <SelectTrigger size="lg" placeholder="Large" />
  <SelectContent>
    <SelectItem index={0} value="a">Option A</SelectItem>
    <SelectItem index={1} value="b">Option B</SelectItem>
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
    <SelectItem index={0} value="system" icon={Monitor}>System</SelectItem>
    <SelectItem index={1} value="light" icon={Sun}>Light</SelectItem>
    <SelectItem index={2} value="dark" icon={Moon}>Dark</SelectItem>
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
      <SelectItem index={0} value="profile" icon={User}>Profile</SelectItem>
      <SelectItem index={1} value="email" icon={Mail}>Email</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Preferences</SelectLabel>
      <SelectItem index={2} value="notifications" icon={Bell}>Notifications</SelectItem>
      <SelectItem index={3} value="privacy" icon={Shield}>Privacy</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`;

const timezoneCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";
import { useIcon } from "@zeron/icons/context";

const Globe = useIcon("globe");

<Select value={timezone} onValueChange={setTimezone}>
  <SelectTrigger icon={Globe} placeholder="Select timezone…" />
  <SelectContent>
    <SelectItem index={0} value="utc-8">(UTC-8) Pacific Time</SelectItem>
    <SelectItem index={1} value="utc-7">(UTC-7) Mountain Time</SelectItem>
    <SelectItem index={2} value="utc-6">(UTC-6) Central Time</SelectItem>
    <SelectItem index={3} value="utc-5">(UTC-5) Eastern Time</SelectItem>
    <SelectItem index={4} value="utc-4">(UTC-4) Atlantic Time</SelectItem>
    <SelectItem index={5} value="utc-3">(UTC-3) Buenos Aires</SelectItem>
    <SelectItem index={6} value="utc-1">(UTC-1) Azores</SelectItem>
    <SelectItem index={7} value="utc+0">(UTC+0) London</SelectItem>
    <SelectItem index={8} value="utc+1">(UTC+1) Paris</SelectItem>
    <SelectItem index={9} value="utc+2">(UTC+2) Helsinki</SelectItem>
    <SelectItem index={10} value="utc+3">(UTC+3) Moscow</SelectItem>
    <SelectItem index={11} value="utc+5:30">(UTC+5:30) Mumbai</SelectItem>
    <SelectItem index={12} value="utc+8">(UTC+8) Singapore</SelectItem>
    <SelectItem index={13} value="utc+9">(UTC+9) Tokyo</SelectItem>
    <SelectItem index={14} value="utc+10">(UTC+10) Sydney</SelectItem>
    <SelectItem index={15} value="utc+12">(UTC+12) Auckland</SelectItem>
  </SelectContent>
</Select>`;

const errorCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";

<Select value={role} onValueChange={setRole}>
  <SelectTrigger
    placeholder="Select a role…"
    error="Please select a role to continue."
  />
  <SelectContent>
    <SelectItem index={0} value="admin">Admin</SelectItem>
    <SelectItem index={1} value="editor">Editor</SelectItem>
    <SelectItem index={2} value="viewer">Viewer</SelectItem>
  </SelectContent>
</Select>`;

const disabledCode = `import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";

{/* Disabled trigger */}
<Select disabled>
  <SelectTrigger placeholder="Disabled" />
  <SelectContent>
    <SelectItem index={0} value="a">Option A</SelectItem>
  </SelectContent>
</Select>

{/* Disabled individual items */}
<Select>
  <SelectTrigger placeholder="Some disabled…" />
  <SelectContent>
    <SelectItem index={0} value="a">Available</SelectItem>
    <SelectItem index={1} value="b" disabled>Unavailable</SelectItem>
    <SelectItem index={2} value="c">Available</SelectItem>
  </SelectContent>
</Select>`;

// ---------------------------------------------------------------------------
// Props definitions
// ---------------------------------------------------------------------------

const selectProps: PropDef[] = [
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
    name: "size",
    type: '"sm" | "md" | "lg"',
    default: '"md"',
    description: "Height, padding, text size, and icon size of the trigger.",
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
    name: "index",
    type: "number",
    description: "Position index within the content for proximity hover.",
  },
  {
    name: "value",
    type: "string",
    description: "Unique value for this option.",
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

  const themeIcons: Record<string, IconComponent> = { light: Sun, dark: Moon, system: Monitor };
  const ThemeIcon = themeIcons[theme] ?? Monitor;

  return (
    <DocPage
      title="Select"
      slug="select"
      description="Animated select menu with three sizes, proximity hover, bordered/borderless variants, optional leading icons, and a spring-animated popover."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Select value={basic} onValueChange={setBasic}>
            <SelectTrigger placeholder="Select a fruit…" />
            <SelectContent>
              <SelectItem index={0} value="apple">Apple</SelectItem>
              <SelectItem index={1} value="banana">Banana</SelectItem>
              <SelectItem index={2} value="cherry">Cherry</SelectItem>
              <SelectItem index={3} value="mango">Mango</SelectItem>
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
                <SelectItem index={0} value="apple">Apple</SelectItem>
                <SelectItem index={1} value="banana">Banana</SelectItem>
                <SelectItem index={2} value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>

            <Select value={borderless} onValueChange={setBorderless}>
              <SelectTrigger variant="borderless" placeholder="Borderless" />
              <SelectContent>
                <SelectItem index={0} value="apple">Apple</SelectItem>
                <SelectItem index={1} value="banana">Banana</SelectItem>
                <SelectItem index={2} value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("sizes")}>
        <ComponentPreview code={sizesCode}>
          <div className="flex flex-wrap items-center gap-3">
            <Select>
              <SelectTrigger size="sm" placeholder="Small" />
              <SelectContent>
                <SelectItem index={0} value="a">Option A</SelectItem>
                <SelectItem index={1} value="b">Option B</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger size="md" placeholder="Medium" />
              <SelectContent>
                <SelectItem index={0} value="a">Option A</SelectItem>
                <SelectItem index={1} value="b">Option B</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger size="lg" placeholder="Large" />
              <SelectContent>
                <SelectItem index={0} value="a">Option A</SelectItem>
                <SelectItem index={1} value="b">Option B</SelectItem>
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
              <SelectItem index={0} value="system" icon={Monitor}>System</SelectItem>
              <SelectItem index={1} value="light" icon={Sun}>Light</SelectItem>
              <SelectItem index={2} value="dark" icon={Moon}>Dark</SelectItem>
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
                <SelectItem index={0} value="profile" icon={User}>Profile</SelectItem>
                <SelectItem index={1} value="email" icon={Mail}>Email</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Preferences</SelectLabel>
                <SelectItem index={2} value="notifications" icon={Bell}>Notifications</SelectItem>
                <SelectItem index={3} value="privacy" icon={Shield}>Privacy</SelectItem>
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
              <SelectItem index={0} value="utc-8">(UTC-8) Pacific Time</SelectItem>
              <SelectItem index={1} value="utc-7">(UTC-7) Mountain Time</SelectItem>
              <SelectItem index={2} value="utc-6">(UTC-6) Central Time</SelectItem>
              <SelectItem index={3} value="utc-5">(UTC-5) Eastern Time</SelectItem>
              <SelectItem index={4} value="utc-4">(UTC-4) Atlantic Time</SelectItem>
              <SelectItem index={5} value="utc-3">(UTC-3) Buenos Aires</SelectItem>
              <SelectItem index={6} value="utc-1">(UTC-1) Azores</SelectItem>
              <SelectItem index={7} value="utc+0">(UTC+0) London</SelectItem>
              <SelectItem index={8} value="utc+1">(UTC+1) Paris</SelectItem>
              <SelectItem index={9} value="utc+2">(UTC+2) Helsinki</SelectItem>
              <SelectItem index={10} value="utc+3">(UTC+3) Moscow</SelectItem>
              <SelectItem index={11} value="utc+5:30">(UTC+5:30) Mumbai</SelectItem>
              <SelectItem index={12} value="utc+8">(UTC+8) Singapore</SelectItem>
              <SelectItem index={13} value="utc+9">(UTC+9) Tokyo</SelectItem>
              <SelectItem index={14} value="utc+10">(UTC+10) Sydney</SelectItem>
              <SelectItem index={15} value="utc+12">(UTC+12) Auckland</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem index={0} value="admin">Admin</SelectItem>
              <SelectItem index={1} value="editor">Editor</SelectItem>
              <SelectItem index={2} value="viewer">Viewer</SelectItem>
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
                <SelectItem index={0} value="a">Option A</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger placeholder="Some disabled…" />
              <SelectContent>
                <SelectItem index={0} value="a">Available</SelectItem>
                <SelectItem index={1} value="b" disabled>Unavailable</SelectItem>
                <SelectItem index={2} value="c">Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ComponentPreview>
      </DocSection>

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
