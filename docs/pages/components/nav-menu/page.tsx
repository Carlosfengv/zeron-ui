"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge, type BadgeStatus } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import {
  NavItem,
  NavItemAction,
  NavItemBadge,
  NavItemContent,
  NavItemDescription,
  NavItemLabel,
  NavItemLeading,
  NavItemTrigger,
} from "@zeron/ui/nav-item";
import {
  NavMenu,
  type NavKeyboardNavigation,
  type NavMenuVariant,
  type NavOrientation,
} from "@zeron/ui/nav-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupTrigger,
} from "@zeron/ui/sidebar";
import { Switch } from "@zeron/ui/switch";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import {
  PLAY_SWITCH,
  PlayDivider,
  PlayField,
  PlaySelect,
  PlaySection,
  PlaygroundLayout,
  PlaygroundPanel,
} from "@docs/components/playground/playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useIcon } from "@zeron/icons/context";

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

const agentSessionsCode = `const agents = [
  {
    id: "zeron",
    name: "Zeron",
    defaultOpen: true,
    sessions: [
      { id: "market-intel", title: "搜集 OpenClaw 市场情报", badge: "定时任务" },
      { id: "production-data", title: "查询最近生产环境数据", updatedAt: "1分钟" },
    ],
  },
];

<SidebarGroup collapsible defaultOpen={agent.defaultOpen}>
  <SidebarGroupTrigger>
    <Image alt="" className="size-5 rounded-md" height={20} src="/figma/nav-menu-agent-avatar.png" width={20} />
    {agent.name}
  </SidebarGroupTrigger>
  <SidebarGroupContent>
    <NavMenu
      activeValue={activeSessionId}
      className="[--active:var(--hover)] [&_[data-slot=nav-list]]:gap-0"
    >
      {agent.sessions.map((session) => (
        <NavItem className="py-0" key={session.id} value={session.id}>
          <NavItemTrigger className="h-8 gap-1 px-1.5" render={<button type="button" />}>
            <NavItemLeading className="size-5"><SessionChannelIcon /></NavItemLeading>
            <NavItemContent><NavItemLabel>{session.title}</NavItemLabel></NavItemContent>
          </NavItemTrigger>
          <span className="relative mr-1 flex h-8 min-w-11 items-center justify-end">
            {session.badge ?? <span className="text-[10px] text-fg-subtle">{session.updatedAt}</span>}
            <DropdownMenu>
              <DropdownTrigger render={<NavItemAction className="absolute right-0 mr-0 size-6 opacity-0 group-hover/nav-item:opacity-100 group-focus-within/nav-item:opacity-100" />} />
              <DropdownContent align="end"><MenuItem index={0} label="重命名" /></DropdownContent>
            </DropdownMenu>
          </span>
        </NavItem>
      ))}
    </NavMenu>
  </SidebarGroupContent>
</SidebarGroup>`;

interface AgentSessionDemoItem {
  id: string;
  title: string;
  badge?: string;
  badgeStatus?: BadgeStatus;
  channel?: "dingtalk";
  updatedAt?: string;
}

interface AgentSessionDemoGroup {
  id: string;
  name: string;
  defaultOpen: boolean;
  sessions: readonly AgentSessionDemoItem[];
}

const agentSessionGroups: readonly AgentSessionDemoGroup[] = [
  {
    id: "zeron",
    name: "Zeron",
    defaultOpen: true,
    sessions: [
      { id: "market-intel", title: "搜集 OpenClaw 市场情报", badge: "定时任务" },
      { id: "production-data", title: "查询最近生产环境数据", updatedAt: "1分钟" },
      { id: "build-agent", title: "如何构建 Agent", channel: "dingtalk", updatedAt: "2分钟" },
    ],
  },
  {
    id: "zeron-carlos",
    name: "Zeron carlos test",
    defaultOpen: false,
    sessions: [
      { id: "approval-needed", title: "发布策略等待确认", badge: "待确认", badgeStatus: "warning" },
    ],
  },
];

const props: PropDef[] = [
  { name: "activeValue", type: "string | null", default: "null", description: "Strict value match used for aria-current and active styling." },
  { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Controls layout and roving arrow-key direction." },
  { name: "variant", type: '"default" | "segment" | "underline"', default: '"default"', description: "Default moving surface, Tabs-compatible Segment treatment for route navigation, or the underline treatment used by TopNav." },
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
    ? `\nimport { useIcons } from "@zeron/icons/context";\n\nconst { "square-library": ProjectsIcon, list: ReportsIcon, settings: SettingsIcon } = useIcons();`
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
    setVariant(nextOrientation === "horizontal" ? pick(["default", "segment", "underline"] as const) : "default");
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
              { value: "segment", label: "Segment" },
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

function AgentSessionsDemo() {
  const ChevronRight = useIcon("chevron-right");
  const More = useIcon("ellipsis");
  const [activeSessionId, setActiveSessionId] = useState("market-intel");
  const [openAgentIds, setOpenAgentIds] = useState<string[]>(() =>
    agentSessionGroups.filter((agent) => agent.defaultOpen).map((agent) => agent.id)
  );

  return (
    <ComponentPreview code={agentSessionsCode} minHeightClass="min-h-[300px]">
      <div className="w-[272px] max-w-full [--agent-session-nav-row-height:32px] [--agent-session-nav-radius:8px] [--agent-session-nav-selected:var(--hover)]">
        <SidebarGroup>
          <SidebarGroupLabel className="px-1.5 pb-1.5">智能体</SidebarGroupLabel>
          <div className="space-y-1.5">
            {agentSessionGroups.map((agent) => {
              const hasActiveSession = agent.sessions.some((session) => session.id === activeSessionId);
              const isOpen = openAgentIds.includes(agent.id);

              return (
                <SidebarGroup
                  key={agent.id}
                  collapsible
                  open={isOpen}
                  onOpenChange={(open) => setOpenAgentIds((current) =>
                    open ? [...new Set([...current, agent.id])] : current.filter((id) => id !== agent.id)
                  )}
                  className="group/agent-session-nav"
                >
                  <SidebarGroupTrigger
                    className="mb-0 h-[var(--agent-session-nav-row-height)] gap-1 px-1.5 text-body font-semibold text-fg-default"
                    indicator={
                      <ChevronRight
                        aria-hidden="true"
                        size={16}
                        strokeWidth={1.5}
                        className="shrink-0 transition-transform duration-fast group-data-[panel-open]/sidebar-group-trigger:rotate-90 motion-reduce:transition-none"
                      />
                    }
                  >
                    <span className="flex min-w-0 items-center gap-1">
                      <Image
                        alt=""
                        className="size-5 shrink-0 rounded-md border-[0.5px] border-border object-cover"
                        height={20}
                        src="/figma/nav-menu-agent-avatar.png"
                        width={20}
                      />
                      <span className="truncate">{agent.name}</span>
                    </span>
                  </SidebarGroupTrigger>
                  {isOpen && (
                    <DropdownMenu>
                      <DropdownTrigger
                        render={
                          <Button
                            aria-label={`${agent.name} 更多操作`}
                            className="absolute right-6 top-1 size-6 text-fg-muted"
                            iconOnly
                            size="xs"
                            type="button"
                            variant="ghost"
                          >
                            <More aria-hidden="true" size={16} strokeWidth={1.5} />
                          </Button>
                        }
                      />
                      <DropdownContent align="end" className="w-36">
                        <MenuItem index={0} label="编辑智能体" onSelect={() => undefined} />
                        <MenuItem index={1} label="智能体设置" onSelect={() => undefined} />
                      </DropdownContent>
                    </DropdownMenu>
                  )}
                  <SidebarGroupContent className="pt-0">
                    <NavMenu
                      activeValue={hasActiveSession ? activeSessionId : null}
                      aria-label={`${agent.name} 会话`}
                      keyboardNavigation="roving"
                      className="[--active:var(--agent-session-nav-selected)] [&_[data-slot=nav-list]]:gap-0"
                    >
                      {agent.sessions.map((session) => (
                        <NavItem key={session.id} value={session.id} className="py-0">
                          <NavItemTrigger
                            className="h-[var(--agent-session-nav-row-height)] gap-1 px-1.5"
                            render={<button type="button" />}
                            onClick={() => setActiveSessionId(session.id)}
                          >
                            <NavItemLeading className="size-5">
                              {session.channel === "dingtalk" && (
                                <Image alt="钉钉" className="size-4" height={16} src="/figma/nav-menu-dingtalk.svg" width={16} />
                              )}
                            </NavItemLeading>
                            <NavItemContent>
                              <NavItemLabel>{session.title}</NavItemLabel>
                            </NavItemContent>
                          </NavItemTrigger>
                          <span className="relative mr-1 flex h-[var(--agent-session-nav-row-height)] min-w-11 shrink-0 items-center justify-end">
                            {session.badge ? (
                              <Badge
                                size="sm"
                                status={session.badgeStatus}
                                className="h-5 rounded px-1 text-[10px] leading-5 transition-opacity group-hover/nav-item:opacity-0 group-focus-within/nav-item:opacity-0"
                                style={session.badgeStatus ? undefined : { backgroundColor: "var(--inverse-background)", color: "var(--fg-on-inverse)" }}
                              >
                                {session.badge}
                              </Badge>
                            ) : (
                              <span className="whitespace-nowrap text-[10px] text-fg-subtle transition-opacity group-hover/nav-item:opacity-0 group-focus-within/nav-item:opacity-0">
                                {session.updatedAt}
                              </span>
                            )}
                            <DropdownMenu>
                              <DropdownTrigger
                                render={
                                  <NavItemAction
                                    aria-label={`${session.title} 更多操作`}
                                    className="pointer-events-none absolute right-0 mr-0 size-6 opacity-0 group-hover/nav-item:pointer-events-auto group-hover/nav-item:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
                                  />
                                }
                              />
                              <DropdownContent align="end" className="w-36">
                                <MenuItem index={0} label="重命名会话" onSelect={() => undefined} />
                                <MenuItem index={1} label="删除会话" onSelect={() => undefined} />
                              </DropdownContent>
                            </DropdownMenu>
                          </span>
                        </NavItem>
                      ))}
                    </NavMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </div>
        </SidebarGroup>
      </div>
    </ComponentPreview>
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
        <p className="text-body text-fg-muted">
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
      <DocSection title="Agent sessions">
        <p className="max-w-3xl text-body leading-5 text-fg-muted">
          Compose a collapsible <code>SidebarGroup</code> for each agent, then render its sessions with <code>NavMenu</code>. The metadata slot shows a status badge before time, while the session menu replaces that metadata only on hover or keyboard focus.
        </p>
        <AgentSessionsDemo />
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
      <DocSection title="Focus behavior">
        <p className="max-w-3xl text-body leading-5 text-fg-muted">
          The moving row indicator belongs only to a primary navigation trigger that matches <code>:focus-visible</code>. Row actions and nested links keep their own focus treatment so pointer focus never lights the parent row.
        </p>
      </DocSection>
      <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
    </DocPage>
  );
}
