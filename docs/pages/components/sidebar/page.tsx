"use client";

import { useState } from "react";
import { Sidebar, SidebarContent, SidebarFloatingTrigger, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupTrigger, SidebarHeader, SidebarProvider, SidebarTrigger, type SidebarCollapsible } from "@zeron/ui/sidebar";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageHeader, PageHeaderContent, PageLayout, PageSubnav, PageSubnavItem, PageSubnavList, PageTitle } from "@zeron/ui/page-layout";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PlayField, PlaySelect, PlaySection, PlaygroundLayout, PlaygroundPanel } from "@docs/components/playground/playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { ZaiopsSidebarPreview } from "@docs/components/shell/site/zaiops-sidebar-preview";
import { useIcon } from "@zeron/icons/context";

const code = `<SidebarProvider defaultOpen>
  <div className="flex h-96 w-full min-w-0 overflow-hidden">
    <Sidebar collapsible="icon">
      <SidebarHeader>...</SidebarHeader>
      <SidebarContent>
        <SidebarGroup collapsible defaultOpen>
          <SidebarGroupTrigger>Workspace</SidebarGroupTrigger>
          <SidebarGroupContent>
            <NavMenu>...</NavMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>...</SidebarFooter>
    </Sidebar>
    <PageLayout className="h-full min-w-0 flex-1">
      <PageHeader>...</PageHeader>
      <PageContent>
        <PageSubnav aria-label="Project settings">...</PageSubnav>
        <PageBody>...</PageBody>
      </PageContent>
    </PageLayout>
  </div>
</SidebarProvider>`;

const sidebarPageSections = {
  overview: "Project overview",
  members: "Collaborators and roles",
  activity: "Recent project activity",
} as const;

const collapseModes: SidebarCollapsible[] = ["icon", "offcanvas", "none"];

function buildCollapsePlaygroundCode(collapsible: SidebarCollapsible) {
  return `<SidebarProvider>
  <Sidebar collapsible="${collapsible}">...</Sidebar>
  <PageLayout>
    <PageHeader>
      <SidebarFloatingTrigger
        collapsedBehavior="offcanvas"
        renderContent={({ close }) => <Navigation onNavigate={close} />}
      />
      <PageHeaderContent icon={Home}>...</PageHeaderContent>
    </PageHeader>
  </PageLayout>
</SidebarProvider>`;
}

function SidebarPageLayoutPreview() {
  const [activeSection, setActiveSection] = useState<keyof typeof sidebarPageSections>("overview");
  const WorkspaceIcon = useIcon("home");
  const OverviewIcon = useIcon("home");
  const MembersIcon = useIcon("users");
  const ActivityIcon = useIcon("clock");
  const icons = { overview: OverviewIcon, members: MembersIcon, activity: ActivityIcon };

  return (
    <PageLayout className="h-full min-w-0 flex-1">
      <PageHeader>
        <PageHeaderContent icon={WorkspaceIcon}>
          <nav aria-label="Breadcrumb" className="text-body text-fg-muted">Workspace / Projects</nav>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <PageSubnav aria-label="Project settings">
          <PageSubnavList activeValue={activeSection}>
            {(Object.entries(sidebarPageSections) as [keyof typeof sidebarPageSections, string][]).map(([value]) => (
              <PageSubnavItem
                key={value}
                value={value}
                icon={icons[value]}
                href={`#${value}`}
                onClick={(event) => {
                  event.preventDefault();
                  setActiveSection(value);
                }}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </PageSubnavItem>
            ))}
          </PageSubnavList>
        </PageSubnav>
        <PageBody className="p-4">
          <PageTitle className="text-title">{sidebarPageSections[activeSection]}</PageTitle>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}

function SidebarCollapsePreview({ collapsible }: { collapsible: SidebarCollapsible }) {
  const Home = useIcon("home");
  const Project = useIcon("file");
  const Team = useIcon("users");
  const Activity = useIcon("clock");
  const Settings = useIcon("settings");

  return (
    <SidebarProvider key={collapsible} defaultOpen>
      <div className="flex h-80 w-full min-w-0 overflow-hidden bg-surface-base">
        <Sidebar collapsible={collapsible} className="relative !h-full">
          <SidebarHeader className="flex items-center justify-between">
            <span className="px-2 text-label group-data-[state=collapsed]/sidebar:hidden">Workspace</span>
            {collapsible !== "none" && <SidebarTrigger label="Toggle playground sidebar" />}
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup collapsible defaultOpen>
              <SidebarGroupTrigger>Workspace</SidebarGroupTrigger>
              <SidebarGroupContent>
                <NavMenu activeValue="projects">
                  <NavItem value="projects">
                    <NavItemTrigger tooltip="Projects">
                      <NavItemLeading><Project size={16} strokeWidth={1.5} /></NavItemLeading>
                      <NavItemContent><NavItemLabel>Projects</NavItemLabel></NavItemContent>
                    </NavItemTrigger>
                  </NavItem>
                  <NavItem value="team">
                    <NavItemTrigger tooltip="Team">
                      <NavItemLeading><Team size={16} strokeWidth={1.5} /></NavItemLeading>
                      <NavItemContent><NavItemLabel>Team</NavItemLabel></NavItemContent>
                    </NavItemTrigger>
                  </NavItem>
                </NavMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup collapsible defaultOpen>
              <SidebarGroupTrigger>Manage</SidebarGroupTrigger>
              <SidebarGroupContent>
                <NavMenu aria-label="Manage navigation">
                  <NavItem value="activity">
                    <NavItemTrigger tooltip="Activity">
                      <NavItemLeading><Activity size={16} strokeWidth={1.5} /></NavItemLeading>
                      <NavItemContent><NavItemLabel>Activity</NavItemLabel></NavItemContent>
                    </NavItemTrigger>
                  </NavItem>
                  <NavItem value="settings">
                    <NavItemTrigger tooltip="Settings">
                      <NavItemLeading><Settings size={16} strokeWidth={1.5} /></NavItemLeading>
                      <NavItemContent><NavItemLabel>Settings</NavItemLabel></NavItemContent>
                    </NavItemTrigger>
                  </NavItem>
                </NavMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <PageLayout className="h-full min-w-0 flex-1">
          <PageHeader>
            <div className="flex min-w-0 items-center gap-2">
              <SidebarFloatingTrigger
                collapsedBehavior={collapsible}
                label="Expand playground sidebar"
                renderContent={({ close }) => (
                  <NavMenu activeValue="projects" aria-label="Playground navigation" className="p-1">
                    <NavItem value="projects">
                      <NavItemTrigger render={<a href="#projects" />} onClick={close}>
                        <NavItemLeading><Project size={16} strokeWidth={1.5} /></NavItemLeading>
                        <NavItemContent><NavItemLabel>Projects</NavItemLabel></NavItemContent>
                      </NavItemTrigger>
                    </NavItem>
                    <NavItem value="team">
                      <NavItemTrigger render={<a href="#team" />} onClick={close}>
                        <NavItemLeading><Team size={16} strokeWidth={1.5} /></NavItemLeading>
                        <NavItemContent><NavItemLabel>Team</NavItemLabel></NavItemContent>
                      </NavItemTrigger>
                    </NavItem>
                    <NavItem value="activity">
                      <NavItemTrigger render={<a href="#activity" />} onClick={close}>
                        <NavItemLeading><Activity size={16} strokeWidth={1.5} /></NavItemLeading>
                        <NavItemContent><NavItemLabel>Activity</NavItemLabel></NavItemContent>
                      </NavItemTrigger>
                    </NavItem>
                    <NavItem value="settings">
                      <NavItemTrigger render={<a href="#settings" />} onClick={close}>
                        <NavItemLeading><Settings size={16} strokeWidth={1.5} /></NavItemLeading>
                        <NavItemContent><NavItemLabel>Settings</NavItemLabel></NavItemContent>
                      </NavItemTrigger>
                    </NavItem>
                  </NavMenu>
                )}
              />
              <PageHeaderContent icon={Home}>
                <span className="text-body text-fg-muted">Workspace / Projects</span>
              </PageHeaderContent>
            </div>
          </PageHeader>
          <PageContent>
            <PageBody className="p-4"><PageTitle className="text-title">Collapse playground</PageTitle></PageBody>
          </PageContent>
        </PageLayout>
      </div>
    </SidebarProvider>
  );
}

function SidebarCollapsePlayground() {
  const [collapsible, setCollapsible] = useState<SidebarCollapsible>("icon");
  const randomize = () => {
    setCollapsible(collapseModes[Math.floor(Math.random() * collapseModes.length)]);
  };
  const controls = (
    <PlaygroundPanel title="Sidebar" onShuffle={randomize}>
      <PlaySection label="Behavior" />
      <PlayField label="Collapse mode">
        <PlaySelect
          value={collapsible}
          onChange={(next) => setCollapsible(next as SidebarCollapsible)}
          options={collapseModes.map((mode) => ({ value: mode, label: mode }))}
        />
      </PlayField>
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview padding="none" code={buildCollapsePlaygroundCode(collapsible)}>
          <SidebarCollapsePreview collapsible={collapsible} />
        </ComponentPreview>
      }
    />
  );
}

const zaiopsCode = `"use client";

import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarFloatingTrigger, SidebarProvider, SidebarRail,
} from "@zeron/ui/sidebar";
import { NavMenu } from "@zeron/ui/nav-menu";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
import { Dialog, DialogContent } from "@zeron/ui/dialog";
import { PageBody, PageContent, PageHeader, PageHeaderContent, PageLayout, PageTitle } from "@zeron/ui/page-layout";

export function ZaiopsSidebarPreview() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeNavigationValue, setActiveNavigationValue] = useState("#home");

  return (
    <SidebarProvider>
      <div className="w-full p-5 group-data-[fullscreen=true]/preview-content:h-full">
        <div className="relative flex h-[min(42rem,calc(100svh-8rem))] min-h-120 w-full overflow-hidden bg-surface-base group-data-[fullscreen=true]/preview-content:h-full group-data-[fullscreen=true]/preview-content:min-h-0">
          <Sidebar
            width="260px"
            mobileWidth="min(260px, calc(100vw - 24px))"
            collapsible="offcanvas"
            ariaLabel="ZAIops 应用导航"
            className="static h-full"
          >
            <SidebarHeader>
              <SidebarIdentityRow
                as="button"
                primary="ZAIops 生产组织"
                leading={<SidebarIdentityAvatar tone="brand">Z</SidebarIdentityAvatar>}
              />
              <SidebarSearchTrigger onOpen={() => setSearchOpen(true)} />
            </SidebarHeader>

            <SidebarContent contentClassName="gap-4 px-2 py-1">
              <SidebarGroup>
                <SidebarGroupContent>
                  <NavMenu
                    activeValue={activeNavigationValue}
                    aria-label="主导航"
                    keyboardNavigation="roving"
                  >
                    {primaryItems.map((item) => (
                      <NavigationItemView
                        key={item.value}
                        item={item}
                        onSelect={setActiveNavigationValue}
                      />
                    ))}
                  </NavMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>巡检治理</SidebarGroupLabel>
                <SidebarGroupContent>
                  <NavMenu
                    activeValue={activeNavigationValue}
                    aria-label="巡检治理"
                    keyboardNavigation="roving"
                  >
                    {governanceItems.map((item) => (
                      <NavigationItemView
                        key={item.value}
                        item={item}
                        onSelect={setActiveNavigationValue}
                      />
                    ))}
                  </NavMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>诊断会话</SidebarGroupLabel>
                <SidebarGroupContent>
                  <RecentSessionsContent />
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarIdentityRow
                as="button"
                primary="Carlos Feng"
                description="wei.feng@zstack.io"
                layout="two-line"
                trailingPlacement="edge"
                leading={<SidebarIdentityAvatar>CF</SidebarIdentityAvatar>}
              />
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <PageLayout className="h-full min-w-0 flex-1">
            <PageHeader>
              <SidebarFloatingTrigger
                collapsedBehavior="offcanvas"
                renderContent={({ close }) => (
                  <ZaiopsNavigationPanel onNavigate={close} />
                )}
              />
              <PageHeaderContent icon={Home}>...</PageHeaderContent>
            </PageHeader>
            <PageContent>
              <PageBody>
                <PageTitle>巡检总览</PageTitle>
              </PageBody>
            </PageContent>
          </PageLayout>
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>搜索会话、集群、巡检方案和知识库。</DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}`;
const props: PropDef[] = [
  { name: "collapsible", type: '"offcanvas" | "icon" | "none"', default: '"offcanvas"', description: "Desktop collapse behavior." },
  { name: "width", type: "string", default: '"16rem"', description: "Expanded desktop panel width." },
  { name: "mobileWidth", type: "string", default: '"16rem"', description: "Drawer panel width on compact viewports." },
  { name: "ariaLabel", type: "string", default: '"Navigation"', description: "Accessible name for the desktop aside and compact drawer." },
  { name: "side", type: '"start" | "end"', default: '"start"', description: "Logical edge used by the panel, rail, border, and drawer motion." },
  { name: "persistenceKey", type: "string", description: "Optional localStorage key for the desktop open state." },
  { name: "breakpointBehavior", type: '"drawer" | "collapse"', default: '"drawer"', description: "Uses either the compact drawer or the same effective collapsed state below 1280px." },
  { name: "setActiveTrigger", type: "(owner: HTMLElement | null) => void", description: "For a controlled or programmatic compact-drawer open, set the final-focus owner immediately before opening. Pass null when there is no valid owner." },
];
const groupProps: PropDef[] = [
  { name: "collapsible", type: "boolean", default: "false", description: "Turns SidebarGroupTrigger into an expandable label for the group content." },
  { name: "open", type: "boolean", description: "Controlled expanded state." },
  { name: "defaultOpen", type: "boolean", default: "true", description: "Initial expanded state for an uncontrolled collapsible group." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the group trigger expands or collapses the content." },
];
const floatingTriggerProps: PropDef[] = [
  { name: "collapsedBehavior", type: '"offcanvas" | "icon" | "none"', default: '"offcanvas"', description: "Shows the relocated header trigger after an offcanvas Sidebar is collapsed." },
  { name: "renderContent", type: "(controls: { close: () => void }) => ReactNode", description: "Renders the complete navigation inside the hover popover. Call close after an in-place navigation action." },
  { name: "label", type: "string", default: '"Expand sidebar"', description: "Accessible label for the sidebar expand icon button." },
  { name: "contentClassName", type: "string", description: "Optional classes for the navigation popover." },
  { name: "clickBehavior", type: '"expand" | "menu"', default: '"expand"', description: "Expands the persistent sidebar or opens the same floating menu on click." },
];

export default function SidebarDoc() {
  const Project = useIcon("file");
  const Team = useIcon("users");
  const Activity = useIcon("clock");
  const Settings = useIcon("settings");

  return <DocPage title="Sidebar" slug="sidebar" description="A responsive navigation rail that becomes a focus-managed drawer on compact screens.">
    <DocSection title="Basic">
      <ComponentPreview fullScreenable padding="none" code={code}>
        <SidebarProvider>
          <div className="flex h-96 w-full min-w-0 overflow-hidden bg-surface-base group-data-[fullscreen=true]/preview-content:h-full group-data-[fullscreen=true]/preview-content:min-h-0">
            <Sidebar collapsible="icon" className="static">
              <SidebarHeader className="flex items-center justify-between">
                <span className="px-2 text-label group-data-[state=collapsed]/sidebar:hidden">Zeron</span>
                <SidebarTrigger label="Toggle preview sidebar" />
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup collapsible defaultOpen>
                  <SidebarGroupTrigger>Workspace</SidebarGroupTrigger>
                  <SidebarGroupContent>
                    <NavMenu activeValue="projects">
                      <NavItem value="projects">
                        <NavItemTrigger tooltip="Projects">
                          <NavItemLeading><Project size={16} strokeWidth={1.5} /></NavItemLeading>
                          <NavItemContent><NavItemLabel>Projects</NavItemLabel></NavItemContent>
                        </NavItemTrigger>
                      </NavItem>
                      <NavItem value="team">
                        <NavItemTrigger tooltip="Team">
                          <NavItemLeading><Team size={16} strokeWidth={1.5} /></NavItemLeading>
                          <NavItemContent><NavItemLabel>Team</NavItemLabel></NavItemContent>
                        </NavItemTrigger>
                      </NavItem>
                    </NavMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup collapsible defaultOpen>
                  <SidebarGroupTrigger>Manage</SidebarGroupTrigger>
                  <SidebarGroupContent>
                    <NavMenu aria-label="Manage navigation">
                      <NavItem value="activity">
                        <NavItemTrigger tooltip="Activity">
                          <NavItemLeading><Activity size={16} strokeWidth={1.5} /></NavItemLeading>
                          <NavItemContent><NavItemLabel>Activity</NavItemLabel></NavItemContent>
                        </NavItemTrigger>
                      </NavItem>
                      <NavItem value="settings">
                        <NavItemTrigger tooltip="Settings">
                          <NavItemLeading><Settings size={16} strokeWidth={1.5} /></NavItemLeading>
                          <NavItemContent><NavItemLabel>Settings</NavItemLabel></NavItemContent>
                        </NavItemTrigger>
                      </NavItem>
                    </NavMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter className="text-label text-fg-muted">v0.1</SidebarFooter>
            </Sidebar>
            <SidebarPageLayoutPreview />
          </div>
        </SidebarProvider>
      </ComponentPreview>
    </DocSection>
    <DocSection title="Collapse playground">
      <SidebarCollapsePlayground />
    </DocSection>
    <DocSection title="ZAIops recipe"><ComponentPreview fullScreenable padding="none" code={zaiopsCode}><ZaiopsSidebarPreview /></ComponentPreview></DocSection>
    <DocSection title="Focus behavior"><p className="max-w-3xl text-body leading-5 text-fg-muted">On compact screens, closing the drawer restores the control that opened it. SidebarTrigger records that owner automatically; controlled or programmatic opens should call setActiveTrigger(owner) immediately before opening, or pass null to avoid restoring a stale trigger.</p></DocSection>
    <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
    <DocSection title="API Reference — SidebarGroup"><PropsTable props={groupProps} /></DocSection>
    <DocSection title="API Reference — SidebarFloatingTrigger"><PropsTable props={floatingTriggerProps} /></DocSection>
  </DocPage>;
}
