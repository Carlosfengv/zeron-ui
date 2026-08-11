"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import {
  Dropdown,
  DropdownLabel,
  DropdownSeparator,
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import { Dropdown, MenuItem } from "./components";
import { useIcons } from "@/lib/icon-context";
import { useState } from "react";

const { "square-library": SquareLibrary, clock: Clock, star: Star, users: Users, lock: Lock } = useIcons();

const items = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
  { icon: Lock, label: "Private" },
];
const [selected, setSelected] = useState<number | null>(0);

<Dropdown checkedIndex={selected ?? undefined}>
  {items.map((item, i) => (
    <MenuItem
      key={item.label}
      index={i}
      icon={item.icon}
      label={item.label}
      checked={selected === i}
      onSelect={() => setSelected(selected === i ? null : i)}
    />
  ))}
</Dropdown>`;

const groupsCode = `import { Dropdown, DropdownLabel, DropdownSeparator, MenuItem } from "./components";
import { useIcons } from "@/lib/icon-context";

const { mail: Mail, bell: Bell, shield: Shield, settings: Settings, palette: Palette, monitor: Monitor } = useIcons();

<Dropdown>
  <DropdownLabel>Account</DropdownLabel>
  <MenuItem index={0} icon={Mail} label="Email" />
  <MenuItem index={1} icon={Bell} label="Notifications" />
  <MenuItem index={2} icon={Shield} label="Privacy" />
  <DropdownSeparator />
  <DropdownLabel>Appearance</DropdownLabel>
  <MenuItem index={3} icon={Settings} label="General" />
  <MenuItem index={4} icon={Palette} label="Theme" />
  <MenuItem index={5} icon={Monitor} label="Display" />
</Dropdown>`;

const triggeredCode = `import { DropdownMenu, DropdownTrigger, DropdownContent, MenuItem, Button } from "./components";
import { useIcons } from "@/lib/icon-context";
import { useState } from "react";

const { "square-library": SquareLibrary, clock: Clock, star: Star, users: Users, lock: Lock } = useIcons();

const items = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
  { icon: Lock, label: "Private" },
];
const [view, setView] = useState(0);

<DropdownMenu>
  <DropdownTrigger render={<Button variant="secondary">Open menu</Button>} />
  <DropdownContent checkedIndex={view}>
    {items.map((item, i) => (
      <MenuItem
        key={item.label}
        index={i}
        icon={item.icon}
        label={item.label}
        checked={view === i}
        onSelect={() => setView(i)}
      />
    ))}
  </DropdownContent>
</DropdownMenu>`;

const dropdownProps: PropDef[] = [
  { name: "checkedIndex", type: "number", description: "Index of the currently checked item." },
  { name: "children", type: "ReactNode", description: "MenuItem children." },
  { name: "aria-label", type: "string", description: "Accessible name for the inline panel. The always-visible panel renders as a plain role=\"group\" — popup menu semantics (role=\"menu\") belong to the triggered DropdownContent." },
];

const dropdownMenuProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "DropdownTrigger and DropdownContent." },
  { name: "open", type: "boolean", description: "Controlled open state." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state (uncontrolled)." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the menu opens or closes." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables opening the menu." },
];

const dropdownTriggerProps: PropDef[] = [
  { name: "render", type: "ReactElement", description: "Element to render as the trigger (Base UI composition), e.g. a Button." },
  { name: "children", type: "ReactNode", description: "Trigger content when no render element is given." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the trigger." },
];

const dropdownContentProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "MenuItem, DropdownLabel, and DropdownSeparator children." },
  { name: "checkedIndex", type: "number", description: "Index of the checked item — drives the animated selected background and the radio-group value." },
  { name: "side", type: "\"top\" | \"bottom\" | \"left\" | \"right\"", default: "\"bottom\"", description: "Preferred side of the trigger to place the popup." },
  { name: "align", type: "\"start\" | \"center\" | \"end\"", default: "\"start\"", description: "Alignment against the trigger." },
  { name: "sideOffset", type: "number", default: "6", description: "Gap between trigger and popup, in pixels." },
];

const labelProps: PropDef[] = [
  {
    name: "children",
    type: "ReactNode",
    description: "Label text content.",
  },
];

const separatorProps: PropDef[] = [
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes.",
  },
];

const menuItemProps: PropDef[] = [
  { name: "icon", type: "IconComponent", description: "Icon displayed in the menu item." },
  { name: "label", type: "string", description: "Text label for the menu item." },
  { name: "index", type: "number", description: "Position index within the dropdown." },
  { name: "checked", type: "boolean", default: "false", description: "Whether this item is checked. When set (even false), the item is a radio-style option; when undefined it is a plain action item." },
  { name: "onSelect", type: "() => void", description: "Called when this item is selected." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the item." },
  { name: "closeOnClick", type: "boolean", default: "true", description: "Popup-only: whether selecting the item closes the menu. Ignored in the inline panel." },
];

export default function DropdownDoc() {
  const t = useTranslations("dropdown");
  const localize = (props: PropDef[], prefix: string) => props.map((prop, index) => ({ ...prop, description: t(`${prefix}${index}`) }));
  const SquareLibrary = useIcon("square-library");
  const Clock = useIcon("clock");
  const Star = useIcon("star");
  const Users = useIcon("users");
  const Lock = useIcon("lock");
  const Mail = useIcon("mail");
  const Bell = useIcon("bell");
  const Shield = useIcon("shield");
  const Settings = useIcon("settings");
  const Palette = useIcon("palette");
  const Monitor = useIcon("monitor");

  const items = [
    { icon: SquareLibrary, label: "Teamspaces" },
    { icon: Clock, label: "Recents" },
    { icon: Star, label: "Favorites" },
    { icon: Users, label: "Shared" },
    { icon: Lock, label: "Private" },
  ];
  const [selected, setSelected] = useState<number | null>(0);
  const [view, setView] = useState(0);

  return (
    <DocPage
      title="Dropdown"
      slug="dropdown"
      description="Menu-style dropdown with proximity hover and animated backgrounds — as an always-visible inline panel or a triggered popup built on Base UI Menu."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Dropdown checkedIndex={selected ?? undefined}>
            {items.map((item, i) => (
              <MenuItem
                key={item.label}
                index={i}
                icon={item.icon}
                label={item.label}
                checked={selected === i}
                onSelect={() => setSelected(selected === i ? null : i)}
              />
            ))}
          </Dropdown>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("groups")}>
        <ComponentPreview code={groupsCode}>
          <Dropdown>
            <DropdownLabel>Account</DropdownLabel>
            <MenuItem index={0} icon={Mail} label="Email" />
            <MenuItem index={1} icon={Bell} label="Notifications" />
            <MenuItem index={2} icon={Shield} label="Privacy" />
            <DropdownSeparator />
            <DropdownLabel>Appearance</DropdownLabel>
            <MenuItem index={3} icon={Settings} label="General" />
            <MenuItem index={4} icon={Palette} label="Theme" />
            <MenuItem index={5} icon={Monitor} label="Display" />
          </Dropdown>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("triggeredMenu")}>
        <p className="text-[14px] text-fg-muted">
          {t("triggeredBody")}
        </p>
        <ComponentPreview code={triggeredCode}>
          <DropdownMenu>
            <DropdownTrigger
              render={<Button variant="secondary">Open menu</Button>}
            />
            <DropdownContent checkedIndex={view}>
              {items.map((item, i) => (
                <MenuItem
                  key={item.label}
                  index={i}
                  icon={item.icon}
                  label={item.label}
                  checked={view === i}
                  onSelect={() => setView(i)}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — Dropdown`}>
        <PropsTable props={localize(dropdownProps, "p")} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — MenuItem`}>
        <PropsTable props={localize(menuItemProps, "i")} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — DropdownMenu`}>
        <PropsTable props={localize(dropdownMenuProps, "m")} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — DropdownTrigger`}>
        <PropsTable props={localize(dropdownTriggerProps, "t")} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — DropdownContent`}>
        <PropsTable props={localize(dropdownContentProps, "c")} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — DropdownLabel`}>
        <PropsTable props={localize(labelProps, "l")} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — DropdownSeparator`}>
        <PropsTable props={localize(separatorProps, "s")} />
      </DocSection>
    </DocPage>
  );
}
