"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import {
  Tabs,
  TabsList,
  TabItem,
  TabPanel,
  type TabLabelVisibility,
  type TabsVariant,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlaygroundLayout,
  PlaygroundPanel,
} from "@/docs/playground";

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
import { useIcons } from "@/lib/icon-context";

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
import { useIcons } from "@/lib/icon-context";

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
  return <p className="text-[13px] text-muted-foreground pt-3">{children}</p>;
}

type BadgeMode = "none" | "count" | "status";

function buildPlaygroundCode({
  variant,
  labelVisibility,
  activationMode,
  showIcons,
  badgeMode,
}: {
  variant: TabsVariant;
  labelVisibility: TabLabelVisibility;
  activationMode: "automatic" | "manual";
  showIcons: boolean;
  badgeMode: BadgeMode;
}) {
  const iconImport = showIcons
    ? '\nimport { useIcons } from "@/lib/icon-context";\nconst { "square-library": SquareLibrary, clock: Clock, star: Star } = useIcons();'
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

<Tabs defaultValue="library" variant="${variant}">
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
  const SquareLibrary = useIcon("square-library");
  const Clock = useIcon("clock");
  const Star = useIcon("star");
  const [variant, setVariant] = useState<TabsVariant>("pill");
  const [labelVisibility, setLabelVisibility] = useState<TabLabelVisibility>("all");
  const [activationMode, setActivationMode] = useState<"automatic" | "manual">("automatic");
  const [showIcons, setShowIcons] = useState(true);
  const [badgeMode, setBadgeMode] = useState<BadgeMode>("count");
  const [value, setValue] = useState("library");
  const effectiveLabelVisibility = showIcons ? labelVisibility : "all";
  const code = buildPlaygroundCode({
    variant,
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
    setLabelVisibility(pick(["all", "active"] as const));
    setActivationMode(pick(["automatic", "manual"] as const));
    setShowIcons(Math.random() > 0.2);
    setBadgeMode(pick(["none", "count", "status"] as const));
    setValue("library");
  };

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Tabs" />
      <div>
        <PlayField label="Variant">
          <PlaySelect
            value={variant}
            onChange={(next) => setVariant(next as TabsVariant)}
            options={[
              { value: "pill", label: "Pill" },
              { value: "segment", label: "Segment" },
              { value: "underline", label: "Underline" },
            ]}
          />
        </PlayField>
        <PlayField label="Label visibility" disabled={!showIcons}>
          <PlaySelect
            value={effectiveLabelVisibility}
            onChange={(next) => setLabelVisibility(next as TabLabelVisibility)}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active only" },
            ]}
          />
        </PlayField>
        <PlayField label="Activation">
          <PlaySelect
            value={activationMode}
            onChange={(next) => setActivationMode(next as "automatic" | "manual")}
            options={[
              { value: "automatic", label: "Automatic" },
              { value: "manual", label: "Manual" },
            ]}
          />
        </PlayField>
        <PlayField label="Badge">
          <PlaySelect
            value={badgeMode}
            onChange={(next) => setBadgeMode(next as BadgeMode)}
            options={[
              { value: "none", label: "None" },
              { value: "count", label: "Count" },
              { value: "status", label: "Status" },
            ]}
          />
        </PlayField>
        <Switch
          label="Icons"
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
            <Tabs value={value} onValueChange={setValue} variant={variant}>
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
      <DocSection title="Playground">
        <TabsPlayground />
      </DocSection>

      <DocSection title="Pill">
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

      <DocSection title="Segment">
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

      <DocSection title="Underline">
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

      <DocSection title="Active label">
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

      <DocSection title="Badges">
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

      <DocSection title="Controlled">
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
            <p className="text-[12px] text-muted-foreground">Active: <span className="text-foreground">{controlled}</span></p>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Tabs"><PropsTable props={tabsProps} /></DocSection>
      <DocSection title="API Reference — TabsList"><PropsTable props={tabsListProps} /></DocSection>
      <DocSection title="API Reference — TabItem"><PropsTable props={tabItemProps} /></DocSection>
      <DocSection title="API Reference — TabPanel"><PropsTable props={tabPanelProps} /></DocSection>
    </DocPage>
  );
}
