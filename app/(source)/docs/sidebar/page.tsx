"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavItem, NavItemContent, NavItemLabel, NavItemTrigger } from "@/components/ui/nav-item";
import { NavMenu } from "@/components/ui/nav-menu";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { PropsTable, type PropDef } from "@/docs/PropsTable";

const code = `<SidebarProvider defaultOpen>
  <Sidebar collapsible="icon">
    <SidebarHeader>...</SidebarHeader>
    <SidebarContent>...</SidebarContent>
    <SidebarFooter>...</SidebarFooter>
  </Sidebar>
</SidebarProvider>`;
const props: PropDef[] = [
  { name: "collapsible", type: '"offcanvas" | "icon" | "none"', default: '"offcanvas"', description: "Desktop collapse behavior." },
  { name: "width", type: "string", default: '"16rem"', description: "Expanded desktop panel width." },
  { name: "mobileWidth", type: "string", default: '"16rem"', description: "Drawer panel width on compact viewports." },
  { name: "persistenceKey", type: "string", description: "Optional localStorage key for the desktop open state." },
];

export default function SidebarDoc() {
  return <DocPage title="Sidebar" slug="sidebar" description="A responsive navigation rail that becomes a focus-managed drawer on compact screens.">
    <DocSection title="Basic"><ComponentPreview code={code}><SidebarProvider><div className="flex h-72 overflow-hidden border border-border"><Sidebar collapsible="icon" className="static"><SidebarHeader className="flex items-center justify-between"><span className="px-2 text-label group-data-[state=collapsed]/sidebar:hidden">Zeron</span><SidebarTrigger label="Toggle preview sidebar" /></SidebarHeader><SidebarContent><SidebarGroup><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent><NavMenu activeValue="projects"><NavItem value="projects"><NavItemTrigger tooltip="Projects"><NavItemContent><NavItemLabel>Projects</NavItemLabel></NavItemContent></NavItemTrigger></NavItem></NavMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter className="text-label text-fg-muted">v0.1</SidebarFooter></Sidebar><div className="flex-1 p-4 text-body">Main content reflows with the rail.</div></div></SidebarProvider></ComponentPreview></DocSection>
    <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
  </DocPage>;
}
