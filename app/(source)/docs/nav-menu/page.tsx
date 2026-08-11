"use client";

import { useState } from "react";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import {
  NavItem,
  NavItemAction,
  NavItemBadge,
  NavItemContent,
  NavItemDescription,
  NavItemLabel,
  NavItemLeading,
  NavItemTrigger,
} from "@/components/ui/nav-item";
import {
  NavMenu,
  type NavKeyboardNavigation,
  type NavMenuVariant,
  type NavOrientation,
} from "@/components/ui/nav-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import {
  PLAY_SWITCH,
  PlayDivider,
  PlayField,
  PlaySelect,
  PlaySection,
  PlaygroundLayout,
  PlaygroundPanel,
} from "@/docs/playground";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { useIcon } from "@/lib/icon-context";

const code = `<NavMenu activeValue="projects" keyboardNavigation="roving">
  <NavItem value="projects">
    <NavItemTrigger href="/projects">
      <NavItemLeading><ProjectIcon /></NavItemLeading>
      <NavItemContent>
        <NavItemLabel>Projects</NavItemLabel>
        <NavItemDescription>12 active projects</NavItemDescription>
      </NavItemContent>
    </NavItemTrigger>
    <NavItemBadge>New</NavItemBadge>
    <DropdownMenu>
      <DropdownTrigger
        render={<NavItemAction aria-label="Project options" />}
      />
      <DropdownContent align="end" className="w-44">
        <MenuItem index={0} label="Rename" onSelect={renameProject} />
        <MenuItem index={1} label="Archive" onSelect={archiveProject} />
      </DropdownContent>
    </DropdownMenu>
  </NavItem>
</NavMenu>`;

const standaloneCode = `<NavItem value="settings" active>
  <NavItemTrigger href="/settings">
    <NavItemContent>
      <NavItemLabel>Settings</NavItemLabel>
    </NavItemContent>
  </NavItemTrigger>
</NavItem>`;

const groupedCode = `import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupTrigger,
} from "./sidebar";
import { NavMenu } from "./nav-menu";
import {
  NavItem,
  NavItemContent,
  NavItemLabel,
  NavItemTrigger,
} from "./nav-item";

<div className="w-72 space-y-4">
  <SidebarGroup>
    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
    <SidebarGroupContent>
      <NavMenu activeValue="projects" aria-label="Workspace">
        <NavItem value="projects">
          <NavItemTrigger href="/projects">
            <NavItemContent><NavItemLabel>Projects</NavItemLabel></NavItemContent>
          </NavItemTrigger>
        </NavItem>
        <NavItem value="reports">
          <NavItemTrigger href="/reports">
            <NavItemContent><NavItemLabel>Reports</NavItemLabel></NavItemContent>
          </NavItemTrigger>
        </NavItem>
      </NavMenu>
    </SidebarGroupContent>
  </SidebarGroup>

  <SidebarGroup collapsible defaultOpen>
    <SidebarGroupTrigger>Administration</SidebarGroupTrigger>
    <SidebarGroupContent>
      <NavMenu activeValue="projects" aria-label="Administration">
        <NavItem value="members">
          <NavItemTrigger href="/members">
            <NavItemContent><NavItemLabel>Members</NavItemLabel></NavItemContent>
          </NavItemTrigger>
        </NavItem>
        <NavItem value="settings">
          <NavItemTrigger href="/settings">
            <NavItemContent><NavItemLabel>Settings</NavItemLabel></NavItemContent>
          </NavItemTrigger>
        </NavItem>
      </NavMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</div>`;

const props: PropDef[] = [
  { name: "activeValue", type: "string | null", default: "null", description: "Strict value match used for aria-current and active styling." },
  { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Controls layout and roving arrow-key direction." },
  { name: "variant", type: '"default" | "underline"', default: '"default"', description: "Default moving surface or the Tabs-compatible underline treatment used by TopNav." },
  { name: "keyboardNavigation", type: '"native" | "roving"', default: '"native"', description: "Normal Tab order or optional roving focus." },
  { name: "NavItem.active", type: "boolean", description: "Explicit active styling for a NavItem used outside NavMenu." },
  { name: "NavItemTrigger.render", type: "ReactElement", description: "Composes behavior onto Next Link, React Router Link, or a custom anchor." },
];

interface PlaygroundOptions {
  orientation: NavOrientation;
  variant: NavMenuVariant;
  keyboardNavigation: NavKeyboardNavigation;
  showIcons: boolean;
  showDescriptions: boolean;
  showLabels: boolean;
  showActions: boolean;
}

function buildPlaygroundCode({
  orientation,
  variant,
  keyboardNavigation,
  showIcons,
  showDescriptions,
  showLabels,
  showActions,
}: PlaygroundOptions) {
  const parts = ["NavItem", "NavItemContent", "NavItemLabel", "NavItemTrigger"];
  if (showIcons) parts.push("NavItemLeading");
  if (showDescriptions) parts.push("NavItemDescription");
  if (showLabels) parts.push("NavItemBadge");
  if (showActions) parts.push("NavItemAction");

  const iconSetup = showIcons
    ? `\nimport { useIcons } from "@/lib/icon-context";\n\nconst { "square-library": ProjectsIcon, list: ReportsIcon, settings: SettingsIcon } = useIcons();`
    : "";
  const dropdownImports = showActions
    ? `\nimport { DropdownContent, DropdownMenu, DropdownTrigger } from "./dropdown";\nimport { MenuItem } from "./menu-item";`
    : "";

  const items = [
    { value: "projects", label: "Projects", description: "12 active", badge: "12", icon: "ProjectsIcon" },
    { value: "reports", label: "Reports", description: "Weekly summaries", badge: "New", icon: "ReportsIcon" },
    { value: "settings", label: "Settings", description: "Workspace preferences", badge: null, icon: "SettingsIcon" },
  ];

  const itemCode = items.map((item) => {
    const leading = showIcons
      ? `\n      <NavItemLeading><${item.icon} size={16} /></NavItemLeading>`
      : "";
    const description = showDescriptions
      ? `\n        <NavItemDescription>${item.description}</NavItemDescription>`
      : "";
    const badge = showLabels && item.badge
      ? `\n    <NavItemBadge>${item.badge}</NavItemBadge>`
      : "";
    const actions = showActions
      ? `\n    <DropdownMenu>\n      <DropdownTrigger render={<NavItemAction aria-label="${item.label} options" />} />\n      <DropdownContent align="end" className="w-44">\n        <MenuItem index={0} label="Rename" onSelect={renameItem} />\n        <MenuItem index={1} label="Archive" onSelect={archiveItem} />\n      </DropdownContent>\n    </DropdownMenu>`
      : "";

    return `  <NavItem value="${item.value}">\n    <NavItemTrigger href="/${item.value}">${leading}\n      <NavItemContent>\n        <NavItemLabel>${item.label}</NavItemLabel>${description}\n      </NavItemContent>\n    </NavItemTrigger>${badge}${actions}\n  </NavItem>`;
  }).join("\n");

  return `import { NavMenu } from "./nav-menu";\nimport { ${parts.join(", ")} } from "./nav-item";${dropdownImports}${iconSetup}\n\n<NavMenu\n  activeValue="projects"\n  orientation="${orientation}"\n  variant="${variant}"\n  keyboardNavigation="${keyboardNavigation}"\n>\n${itemCode}\n</NavMenu>`;
}

function NavMenuPlayground() {
  const ProjectsIcon = useIcon("square-library");
  const ReportsIcon = useIcon("list");
  const SettingsIcon = useIcon("settings");
  const [active, setActive] = useState("projects");
  const [orientation, setOrientation] = useState<NavOrientation>("vertical");
  const [variant, setVariant] = useState<NavMenuVariant>("default");
  const [keyboardNavigation, setKeyboardNavigation] = useState<NavKeyboardNavigation>("roving");
  const [showIcons, setShowIcons] = useState(true);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const effectiveVariant = orientation === "horizontal" ? variant : "default";
  const codePreview = buildPlaygroundCode({
    orientation,
    variant: effectiveVariant,
    keyboardNavigation,
    showIcons,
    showDescriptions,
    showLabels,
    showActions,
  });
  const items = [
    { value: "projects", label: "Projects", description: "12 active", badge: "12", icon: ProjectsIcon },
    { value: "reports", label: "Reports", description: "Weekly summaries", badge: "New", icon: ReportsIcon },
    { value: "settings", label: "Settings", description: "Workspace preferences", badge: null, icon: SettingsIcon },
  ];

  const randomize = () => {
    const pick = <T,>(options: readonly T[]) => options[Math.floor(Math.random() * options.length)];
    const nextOrientation = pick(["vertical", "horizontal"] as const);
    setOrientation(nextOrientation);
    setVariant(nextOrientation === "horizontal" ? pick(["default", "underline"] as const) : "default");
    setKeyboardNavigation(pick(["native", "roving"] as const));
    setShowIcons(Math.random() > 0.35);
    setShowDescriptions(Math.random() > 0.35);
    setShowLabels(Math.random() > 0.35);
    setShowActions(Math.random() > 0.35);
    setActive("projects");
  };

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Navigation" />
      <div>
        <PlayField label="Orientation">
          <PlaySelect
            value={orientation}
            onChange={(next) => setOrientation(next as NavOrientation)}
            options={[
              { value: "vertical", label: "Vertical" },
              { value: "horizontal", label: "Horizontal" },
            ]}
          />
        </PlayField>
        <PlayField label="Variant" disabled={orientation === "vertical"}>
          <PlaySelect
            value={effectiveVariant}
            onChange={(next) => setVariant(next as NavMenuVariant)}
            options={[
              { value: "default", label: "Default" },
              { value: "underline", label: "Underline" },
            ]}
          />
        </PlayField>
        <PlayField label="Keyboard">
          <PlaySelect
            value={keyboardNavigation}
            onChange={(next) => setKeyboardNavigation(next as NavKeyboardNavigation)}
            options={[
              { value: "native", label: "Native" },
              { value: "roving", label: "Roving" },
            ]}
          />
        </PlayField>
      </div>
      <PlayDivider />
      <PlaySection label="Optional content" />
      <div>
        <Switch label="Icon" checked={showIcons} onToggle={() => setShowIcons((current) => !current)} className={PLAY_SWITCH} />
        <Switch label="Description" checked={showDescriptions} onToggle={() => setShowDescriptions((current) => !current)} className={PLAY_SWITCH} />
        <Switch label="Label / badge" checked={showLabels} onToggle={() => setShowLabels((current) => !current)} className={PLAY_SWITCH} />
        <Switch label="More dropdown" checked={showActions} onToggle={() => setShowActions((current) => !current)} className={PLAY_SWITCH} />
      </div>
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview code={codePreview} minHeightClass="min-h-[300px]">
          <div className={orientation === "vertical" ? "w-80 max-w-full" : "w-full"}>
            <NavMenu
              activeValue={active}
              orientation={orientation}
              variant={effectiveVariant}
              keyboardNavigation={keyboardNavigation}
              aria-label="NavMenu playground"
            >
              {items.map((item, itemIndex) => (
                <NavItem key={item.value} value={item.value}>
                  <NavItemTrigger
                    href={`#${item.value}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setActive(item.value);
                    }}
                  >
                    {showIcons && <NavItemLeading><item.icon size={16} /></NavItemLeading>}
                    <NavItemContent>
                      <NavItemLabel>{item.label}</NavItemLabel>
                      {showDescriptions && <NavItemDescription>{item.description}</NavItemDescription>}
                    </NavItemContent>
                  </NavItemTrigger>
                  {showLabels && item.badge && <NavItemBadge>{item.badge}</NavItemBadge>}
                  {showActions && (
                    <DropdownMenu>
                      <DropdownTrigger render={<NavItemAction aria-label={`${item.label} options`} />} />
                      <DropdownContent align="end" className="w-44">
                        <MenuItem index={itemIndex * 2} label="Rename" onSelect={() => undefined} />
                        <MenuItem index={itemIndex * 2 + 1} label="Archive" onSelect={() => undefined} />
                      </DropdownContent>
                    </DropdownMenu>
                  )}
                </NavItem>
              ))}
            </NavMenu>
          </div>
        </ComponentPreview>
      }
    />
  );
}

export default function NavMenuDoc() {
  const [active, setActive] = useState("projects");
  const [groupedActive, setGroupedActive] = useState("projects");
  const ProjectIcon = useIcon("square-library");

  return (
    <DocPage title="NavMenu" slug="nav-menu" description="Router-agnostic composable navigation items with active, hover, focus, and keyboard behavior.">
      <DocSection title="Playground"><NavMenuPlayground /></DocSection>
      <DocSection title="Interactive">
        <ComponentPreview code={code}>
          <NavMenu activeValue={active} keyboardNavigation="roving" aria-label="Preview navigation" className="w-72">
            <NavItem value="projects">
              <NavItemTrigger href="#projects" onClick={(event) => { event.preventDefault(); setActive("projects"); }}>
                <NavItemLeading><ProjectIcon size={16} /></NavItemLeading>
                <NavItemContent><NavItemLabel>Projects</NavItemLabel><NavItemDescription>12 active projects</NavItemDescription></NavItemContent>
              </NavItemTrigger>
              <NavItemBadge>New</NavItemBadge>
              <DropdownMenu>
                <DropdownTrigger render={<NavItemAction aria-label="Project options" />} />
                <DropdownContent align="end" className="w-44">
                  <MenuItem index={0} label="Rename" onSelect={() => undefined} />
                  <MenuItem index={1} label="Archive" onSelect={() => undefined} />
                </DropdownContent>
              </DropdownMenu>
            </NavItem>
            <NavItem value="reports">
              <NavItemTrigger href="#reports" onClick={(event) => { event.preventDefault(); setActive("reports"); }}>
                <NavItemContent><NavItemLabel>Reports</NavItemLabel></NavItemContent>
              </NavItemTrigger>
            </NavItem>
          </NavMenu>
        </ComponentPreview>
      </DocSection>
      <DocSection title="Labels and groups">
        <p className="text-[13px] text-fg-muted">
          Use SidebarGroupLabel for a static label, or SidebarGroupTrigger when the group should collapse.
        </p>
        <ComponentPreview code={groupedCode} minHeightClass="min-h-[340px]">
          <div className="w-72 max-w-full space-y-4">
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavMenu activeValue={groupedActive} keyboardNavigation="roving" aria-label="Workspace navigation">
                  <NavItem value="projects">
                    <NavItemTrigger href="#group-projects" onClick={(event) => { event.preventDefault(); setGroupedActive("projects"); }}>
                      <NavItemContent><NavItemLabel>Projects</NavItemLabel></NavItemContent>
                    </NavItemTrigger>
                  </NavItem>
                  <NavItem value="reports">
                    <NavItemTrigger href="#group-reports" onClick={(event) => { event.preventDefault(); setGroupedActive("reports"); }}>
                      <NavItemContent><NavItemLabel>Reports</NavItemLabel></NavItemContent>
                    </NavItemTrigger>
                  </NavItem>
                </NavMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup collapsible defaultOpen>
              <SidebarGroupTrigger>Administration</SidebarGroupTrigger>
              <SidebarGroupContent>
                <NavMenu activeValue={groupedActive} keyboardNavigation="roving" aria-label="Administration navigation">
                  <NavItem value="members">
                    <NavItemTrigger href="#group-members" onClick={(event) => { event.preventDefault(); setGroupedActive("members"); }}>
                      <NavItemContent><NavItemLabel>Members</NavItemLabel></NavItemContent>
                    </NavItemTrigger>
                  </NavItem>
                  <NavItem value="settings">
                    <NavItemTrigger href="#group-settings" onClick={(event) => { event.preventDefault(); setGroupedActive("settings"); }}>
                      <NavItemContent><NavItemLabel>Settings</NavItemLabel></NavItemContent>
                    </NavItemTrigger>
                  </NavItem>
                </NavMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </ComponentPreview>
      </DocSection>
      <DocSection title="Standalone item">
        <ComponentPreview code={standaloneCode}>
          <div className="w-72">
            <NavItem value="settings" active>
              <NavItemTrigger href="#settings" onClick={(event) => event.preventDefault()}>
                <NavItemContent><NavItemLabel>Settings</NavItemLabel></NavItemContent>
              </NavItemTrigger>
            </NavItem>
          </div>
        </ComponentPreview>
      </DocSection>
      <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
    </DocPage>
  );
}
