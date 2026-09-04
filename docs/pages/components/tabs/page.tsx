"use client";

import { useState } from "react";
import { useIcon } from "@zeron/icons/context";
import {
  Tabs,
  TabsList,
  TabItem,
  TabPanel,
  type TabLabelVisibility,
  type TabsColor,
  type TabsVariant,
} from "@zeron/ui/tabs";
import { Switch } from "@zeron/ui/switch";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlaygroundLayout,
  PlaygroundPanel,
} from "@docs/components/playground/playground";

const pillCode = `import { Tabs, TabsList, TabItem, TabPanel } from "./components";

<Tabs defaultValue="library" variant="pill">
  <TabsList>
    <TabItem value="library" label="Library" />
    <TabItem value="recents" label="Recents" />
    <TabItem value="favorites" label="Favorites" />
  </TabsList>
  <TabPanel value="library">Library content.</TabPanel>
  <TabPanel value="recents">Recents content.</TabPanel>
  <TabPanel value="favorites">Favorites content.</TabPanel>
</Tabs>`;

const segmentCode = `import { Tabs, TabsList, TabItem, TabPanel } from "./components";
import { useIcons } from "@zeron/icons/context";

const { "square-library": SquareLibrary, clock: Clock, star: Star } = useIcons();

<Tabs defaultValue="library" variant="segment">
  <TabsList activationMode="manual" labelVisibility="active">
    <TabItem value="library" icon={SquareLibrary} label="Library" />
    <TabItem value="recents" icon={Clock} label="Recents" />
    <TabItem value="favorites" icon={Star} label="Favorites" />
  </TabsList>
  <TabPanel value="library">Library content.</TabPanel>
  <TabPanel value="recents">Recents content.</TabPanel>
  <TabPanel value="favorites">Favorites content.</TabPanel>
</Tabs>`;

const underlineCode = `import { Tabs, TabsList, TabItem, TabPanel } from "./components";

<Tabs defaultValue="overview" variant="underline">
  <TabsList>
    <TabItem value="overview" label="Overview" />
    <TabItem value="activity" label="Activity" />
    <TabItem value="settings" label="Settings" />
  </TabsList>
  <TabPanel value="overview">Overview content.</TabPanel>
  <TabPanel value="activity">Activity content.</TabPanel>
  <TabPanel value="settings">Settings content.</TabPanel>
</Tabs>`;

const badgesCode = `import { Tabs, TabsList, TabItem, TabPanel } from "./components";

<Tabs defaultValue="inbox" variant="pill">
  <TabsList>
    <TabItem
      value="inbox"
      label="Inbox"
      badge={{ children: 12, color: "blue" }}
    />
    <TabItem
      value="updates"
      label="Updates"
      badge={{ children: "New", variant: "dot", color: "green" }}
    />
    <TabItem value="archived" label="Archived" badge={4} />
  </TabsList>
  <TabPanel value="inbox">Inbox content.</TabPanel>
  <TabPanel value="updates">Updates content.</TabPanel>
  <TabPanel value="archived">Archived content.</TabPanel>
</Tabs>`;

const activeLabelCode = `import { Tabs, TabsList, TabItem } from "./components";
import { useIcons } from "@zeron/icons/context";

const { "square-library": SquareLibrary, clock: Clock, star: Star } = useIcons();

<Tabs defaultValue="library" variant="underline">
  <TabsList labelVisibility="active">
    <TabItem value="library" icon={SquareLibrary} label="Library" />
    <TabItem value="recents" icon={Clock} label="Recents" />
    <TabItem value="favorites" icon={Star} label="Favorites" />
  </TabsList>
</Tabs>`;

const controlledCode = `import { Tabs, TabsList, TabItem, TabPanel } from "./components";
import { useState } from "react";

const [value, setValue] = useState("library");

<Tabs value={value} onValueChange={setValue} variant="pill">
  <TabsList>
    <TabItem value="library" label="Library" />
    <TabItem value="recents" label="Recents" />
    <TabItem value="favorites" label="Favorites" />
  </TabsList>
  <TabPanel value="library">Library content.</TabPanel>
  <TabPanel value="recents">Recents content.</TabPanel>
  <TabPanel value="favorites">Favorites content.</TabPanel>
</Tabs>`;

const tabsProps: PropDef[] = [
  { name: "variant", type: '"pill" | "segment" | "underline"', default: '"pill"', description: "Visual treatment for the tab list." },
  { name: "color", type: '"brand" | "neutral" | "default"', default: '"brand"', description: "Visual treatment for the selected tab." },
  { name: "value", type: "string", description: "Controlled active tab value. Takes precedence over selectedIndex." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called when the active tab changes." },
  { name: "selectedIndex", type: "number", description: "Index-based controlled alternative." },
  { name: "onSelect", type: "(index: number) => void", description: "Called with the new index when the active tab changes." },
  { name: "defaultValue", type: "string", description: "Default active tab for uncontrolled usage." },
];

const tabsListProps: PropDef[] = [
  { name: "activationMode", type: '"automatic" | "manual"', default: '"automatic"', description: "Whether arrow-key focus also selects a tab." },
  { name: "labelVisibility", type: '"all" | "active"', default: '"all"', description: "For pill, segment, and underline tabs: show every icon label, or only the selected tab's label. Requires icons to collapse labels." },
  { name: "className", type: "string", description: "Additional CSS classes for the container." },
];

const tabItemProps: PropDef[] = [
  { name: "value", type: "string", description: "Unique value identifying this tab." },
  { name: "icon", type: "IconComponent", description: "Optional leading icon." },
  { name: "label", type: "string", description: "Text label for the tab." },
  { name: "badge", type: "ReactNode | TabBadgeProps", description: "Optional count, status, Badge element, or Badge props object. Use { children, color, variant } for Badge colors and dot status." },
];

const tabPanelProps: PropDef[] = [
  { name: "value", type: "string", description: "Must match a TabItem value." },
  { name: "children", type: "ReactNode", description: "Panel content, rendered when the matching tab is active." },
];

function PanelText({ children }: { children: string }) {
  return <p className="text-body text-fg-muted pt-3">{children}</p>;
}

type BadgeMode = "none" | "count" | "status";

function buildPlaygroundCode({
  variant,
  color,
  labelVisibility,
  activationMode,
  showIcons,
  badgeMode,
}: {
  variant: TabsVariant;
  color: TabsColor;
  labelVisibility: TabLabelVisibility;
  activationMode: "automatic" | "manual";
  showIcons: boolean;
  badgeMode: BadgeMode;
}) {
  const iconImport = showIcons
    ? '\nimport { useIcons } from "@zeron/icons/context";\nconst { "square-library": SquareLibrary, clock: Clock, star: Star } = useIcons();'
    : "";
  const iconProps = showIcons
    ? [" icon={SquareLibrary}", " icon={Clock}", " icon={Star}"]
    : ["", "", ""];
  const badges = badgeMode === "count"
    ? ["", ' badge={{ children: 12, color: "blue" }}', ""]
    : badgeMode === "status"
      ? ["", ' badge={{ children: "New", variant: "dot", color: "green" }}', ""]
      : ["", "", ""];

  return `import { Tabs, TabsList, TabItem, TabPanel } from "./components";${iconImport}

<Tabs defaultValue="library" variant="${variant}" color="${color}">
  <TabsList activationMode="${activationMode}" labelVisibility="${labelVisibility}">
    <TabItem value="library"${iconProps[0]} label="Library"${badges[0]} />
    <TabItem value="recents"${iconProps[1]} label="Recents"${badges[1]} />
    <TabItem value="favorites"${iconProps[2]} label="Favorites"${badges[2]} />
  </TabsList>
  <TabPanel value="library">Library content.</TabPanel>
  <TabPanel value="recents">Recents content.</TabPanel>
  <TabPanel value="favorites">Favorites content.</TabPanel>
</Tabs>`;
}

function TabsPlayground() {
  const t = useTranslations("tabs");
  const SquareLibrary = useIcon("square-library");
  const Clock = useIcon("clock");
  const Star = useIcon("star");
  const [variant, setVariant] = useState<TabsVariant>("pill");
  const [color, setColor] = useState<TabsColor>("brand");
  const [labelVisibility, setLabelVisibility] = useState<TabLabelVisibility>("all");
  const [activationMode, setActivationMode] = useState<"automatic" | "manual">("automatic");
  const [showIcons, setShowIcons] = useState(true);
  const [badgeMode, setBadgeMode] = useState<BadgeMode>("count");
  const [value, setValue] = useState("library");
  const effectiveLabelVisibility = showIcons ? labelVisibility : "all";
  const code = buildPlaygroundCode({
    variant,
    color,
    labelVisibility: effectiveLabelVisibility,
    activationMode,
    showIcons,
    badgeMode,
  });
  const items = [
    { value: "library", label: "Library", icon: SquareLibrary },
    { value: "recents", label: "Recents", icon: Clock },
    { value: "favorites", label: "Favorites", icon: Star },
  ];

  const randomize = () => {
    const pick = <T,>(options: readonly T[]) => options[Math.floor(Math.random() * options.length)];
    setVariant(pick(["pill", "segment", "underline"] as const));
    setColor(pick(["brand", "neutral", "default"] as const));
    setLabelVisibility(pick(["all", "active"] as const));
    setActivationMode(pick(["automatic", "manual"] as const));
    setShowIcons(Math.random() > 0.2);
    setBadgeMode(pick(["none", "count", "status"] as const));
    setValue("library");
  };

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label={t("controlsTabs")} />
      <div>
        <PlayField label={t("variant")}>
          <PlaySelect
            value={variant}
            onChange={(next) => setVariant(next as TabsVariant)}
            options={[
              { value: "pill", label: t("pill") },
              { value: "segment", label: t("segment") },
              { value: "underline", label: t("underline") },
            ]}
          />
        </PlayField>
        <PlayField label={t("color")}>
          <PlaySelect
            value={color}
            onChange={(next) => setColor(next as TabsColor)}
            options={[
              { value: "brand", label: t("brand") },
              { value: "neutral", label: t("neutral") },
              { value: "default", label: t("default") },
            ]}
          />
        </PlayField>
        <PlayField label={t("labelVisibility")} disabled={!showIcons}>
          <PlaySelect
            value={effectiveLabelVisibility}
            onChange={(next) => setLabelVisibility(next as TabLabelVisibility)}
            options={[
              { value: "all", label: t("all") },
              { value: "active", label: t("activeOnly") },
            ]}
          />
        </PlayField>
        <PlayField label={t("activation")}>
          <PlaySelect
            value={activationMode}
            onChange={(next) => setActivationMode(next as "automatic" | "manual")}
            options={[
              { value: "automatic", label: t("automatic") },
              { value: "manual", label: t("manual") },
            ]}
          />
        </PlayField>
        <PlayField label={t("badge")}>
          <PlaySelect
            value={badgeMode}
            onChange={(next) => setBadgeMode(next as BadgeMode)}
            options={[
              { value: "none", label: t("none") },
              { value: "count", label: t("count") },
              { value: "status", label: t("status") },
            ]}
          />
        </PlayField>
        <Switch
          label={t("icons")}
          checked={showIcons}
          onToggle={() => setShowIcons((current) => !current)}
          className={PLAY_SWITCH}
        />
      </div>
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview code={code} minHeightClass="min-h-[230px]">
          <div className="flex w-full max-w-md flex-col gap-4">
            <Tabs value={value} onValueChange={setValue} variant={variant} color={color}>
              <TabsList activationMode={activationMode} labelVisibility={effectiveLabelVisibility}>
                {items.map((item) => (
                  <TabItem
                    key={item.value}
                    value={item.value}
                    icon={showIcons ? item.icon : undefined}
                    label={item.label}
                    badge={
                      item.value === "recents" && badgeMode === "count"
                        ? { children: 12, color: "blue" }
                        : item.value === "recents" && badgeMode === "status"
                          ? { children: "New", variant: "dot", color: "green" }
                          : undefined
                    }
                  />
                ))}
              </TabsList>
              {items.map((item) => (
                <TabPanel key={item.value} value={item.value}>
                  <PanelText>{`${item.label} content.`}</PanelText>
                </TabPanel>
              ))}
            </Tabs>
          </div>
        </ComponentPreview>
      }
    />
  );
}

export default function TabsDoc() {
  const t = useTranslations("tabs");
  const localize = (props: PropDef[], prefix: string) =>
    props.map((prop, index) => ({ ...prop, description: t(`${prefix}${index}`) }));
  const SquareLibrary = useIcon("square-library");
  const Clock = useIcon("clock");
  const Star = useIcon("star");
  const [controlled, setControlled] = useState("library");

  return (
    <DocPage
      title="Tabs"
      slug="tabs"
      description="A single tabs primitive with pill, segment, and underline variants."
    >
      <DocSection title={t("playground")}>
        <TabsPlayground />
      </DocSection>

      <DocSection title={t("pill")}>
        <ComponentPreview code={pillCode}>
          <Tabs defaultValue="library" variant="pill">
            <TabsList>
              <TabItem value="library" label="Library" />
              <TabItem value="recents" label="Recents" />
              <TabItem value="favorites" label="Favorites" />
            </TabsList>
            <TabPanel value="library"><PanelText>Library content.</PanelText></TabPanel>
            <TabPanel value="recents"><PanelText>Recents content.</PanelText></TabPanel>
            <TabPanel value="favorites"><PanelText>Favorites content.</PanelText></TabPanel>
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("segment")}>
        <ComponentPreview code={segmentCode}>
          <Tabs defaultValue="library" variant="segment">
            <TabsList activationMode="manual" labelVisibility="active">
              <TabItem value="library" icon={SquareLibrary} label="Library" />
              <TabItem value="recents" icon={Clock} label="Recents" />
              <TabItem value="favorites" icon={Star} label="Favorites" />
            </TabsList>
            <TabPanel value="library"><PanelText>Library content.</PanelText></TabPanel>
            <TabPanel value="recents"><PanelText>Recents content.</PanelText></TabPanel>
            <TabPanel value="favorites"><PanelText>Favorites content.</PanelText></TabPanel>
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("underline")}>
        <ComponentPreview code={underlineCode}>
          <div className="w-full max-w-md">
            <Tabs defaultValue="overview" variant="underline">
              <TabsList>
                <TabItem value="overview" label="Overview" />
                <TabItem value="activity" label="Activity" />
                <TabItem value="settings" label="Settings" />
              </TabsList>
              <TabPanel value="overview"><PanelText>Overview content.</PanelText></TabPanel>
              <TabPanel value="activity"><PanelText>Activity content.</PanelText></TabPanel>
              <TabPanel value="settings"><PanelText>Settings content.</PanelText></TabPanel>
            </Tabs>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("activeLabel")}>
        <ComponentPreview code={activeLabelCode}>
          <div className="flex w-full flex-col items-start gap-5">
            <Tabs defaultValue="library" variant="pill">
              <TabsList labelVisibility="active">
                <TabItem value="library" icon={SquareLibrary} label="Library" />
                <TabItem value="recents" icon={Clock} label="Recents" />
                <TabItem value="favorites" icon={Star} label="Favorites" />
              </TabsList>
            </Tabs>
            <Tabs defaultValue="library" variant="segment">
              <TabsList labelVisibility="active">
                <TabItem value="library" icon={SquareLibrary} label="Library" />
                <TabItem value="recents" icon={Clock} label="Recents" />
                <TabItem value="favorites" icon={Star} label="Favorites" />
              </TabsList>
            </Tabs>
            <Tabs defaultValue="library" variant="underline">
              <TabsList labelVisibility="active">
                <TabItem value="library" icon={SquareLibrary} label="Library" />
                <TabItem value="recents" icon={Clock} label="Recents" />
                <TabItem value="favorites" icon={Star} label="Favorites" />
              </TabsList>
            </Tabs>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("badges")}>
        <ComponentPreview code={badgesCode}>
          <div className="w-full max-w-md">
            <Tabs defaultValue="inbox" variant="pill">
              <TabsList>
                <TabItem
                  value="inbox"
                  label="Inbox"
                  badge={{ children: 12, color: "blue" }}
                />
                <TabItem
                  value="updates"
                  label="Updates"
                  badge={{ children: "New", variant: "dot", color: "green" }}
                />
                <TabItem value="archived" label="Archived" badge={4} />
              </TabsList>
              <TabPanel value="inbox"><PanelText>12 unread messages.</PanelText></TabPanel>
              <TabPanel value="updates"><PanelText>New product updates are available.</PanelText></TabPanel>
              <TabPanel value="archived"><PanelText>4 archived threads.</PanelText></TabPanel>
            </Tabs>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("controlled")}>
        <ComponentPreview code={controlledCode}>
          <div className="flex flex-col gap-4 w-full">
            <Tabs value={controlled} onValueChange={setControlled} variant="pill">
              <TabsList>
                <TabItem value="library" label="Library" />
                <TabItem value="recents" label="Recents" />
                <TabItem value="favorites" label="Favorites" />
              </TabsList>
              <TabPanel value="library"><PanelText>Library content.</PanelText></TabPanel>
              <TabPanel value="recents"><PanelText>Recents content.</PanelText></TabPanel>
              <TabPanel value="favorites"><PanelText>Favorites content.</PanelText></TabPanel>
            </Tabs>
            <p className="text-label text-fg-muted">Active: <span className="text-fg-default">{controlled}</span></p>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — Tabs`}><PropsTable props={localize(tabsProps, "p")} /></DocSection>
      <DocSection title={`${t("apiReference")} — TabsList`}><PropsTable props={localize(tabsListProps, "l")} /></DocSection>
      <DocSection title={`${t("apiReference")} — TabItem`}><PropsTable props={localize(tabItemProps, "i")} /></DocSection>
      <DocSection title={`${t("apiReference")} — TabPanel`}><PropsTable props={localize(tabPanelProps, "n")} /></DocSection>
    </DocPage>
  );
}
