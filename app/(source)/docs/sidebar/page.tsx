"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupTrigger, SidebarHeader, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavItem, NavItemContent, NavItemLabel, NavItemTrigger } from "@/components/ui/nav-item";
import { NavMenu } from "@/components/ui/nav-menu";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { ZaiopsSidebarPreview } from "@/docs/site/zaiops-sidebar-preview";

const code = `<SidebarProvider defaultOpen>
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
</SidebarProvider>`;

const zaiopsCode = `"use client";

import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarProvider, SidebarRail,
} from "@/components/ui/sidebar";
import { NavMenu } from "@/components/ui/nav-menu";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@/components/ui/sidebar-identity-row";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

          <main className="min-w-0 flex-1 p-6">巡检总览</main>
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
];
const groupProps: PropDef[] = [
  { name: "collapsible", type: "boolean", default: "false", description: "Turns SidebarGroupTrigger into an expandable label for the group content." },
  { name: "open", type: "boolean", description: "Controlled expanded state." },
  { name: "defaultOpen", type: "boolean", default: "true", description: "Initial expanded state for an uncontrolled collapsible group." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the group trigger expands or collapses the content." },
];

export default function SidebarDoc() {
  return <DocPage title="Sidebar" slug="sidebar" description="A responsive navigation rail that becomes a focus-managed drawer on compact screens.">
    <DocSection title="Basic"><ComponentPreview fullScreenable code={code}><SidebarProvider><div className="flex h-72 overflow-hidden border border-border group-data-[fullscreen=true]/preview-content:h-full group-data-[fullscreen=true]/preview-content:min-h-0"><Sidebar collapsible="icon" className="static"><SidebarHeader className="flex items-center justify-between"><span className="px-2 text-label group-data-[state=collapsed]/sidebar:hidden">Zeron</span><SidebarTrigger label="Toggle preview sidebar" /></SidebarHeader><SidebarContent><SidebarGroup collapsible defaultOpen><SidebarGroupTrigger>Workspace</SidebarGroupTrigger><SidebarGroupContent><NavMenu activeValue="projects"><NavItem value="projects"><NavItemTrigger tooltip="Projects"><NavItemContent><NavItemLabel>Projects</NavItemLabel></NavItemContent></NavItemTrigger></NavItem></NavMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter className="text-label text-fg-muted">v0.1</SidebarFooter></Sidebar><div className="flex-1 p-4 text-body">Main content reflows with the rail.</div></div></SidebarProvider></ComponentPreview></DocSection>
    <DocSection title="ZAIops recipe"><ComponentPreview fullScreenable padding="none" code={zaiopsCode}><ZaiopsSidebarPreview /></ComponentPreview></DocSection>
    <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
    <DocSection title="API Reference — SidebarGroup"><PropsTable props={groupProps} /></DocSection>
  </DocPage>;
}
