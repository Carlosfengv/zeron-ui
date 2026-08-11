"use client";

import { useState } from "react";
import { NavItem, NavItemAction, NavItemBadge, NavItemContent, NavItemDescription, NavItemLabel, NavItemTrigger } from "@/components/ui/nav-item";
import { NavMenu } from "@/components/ui/nav-menu";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { PropsTable, type PropDef } from "@/docs/PropsTable";

const code = `<NavMenu activeValue="projects" keyboardNavigation="roving">
  <NavItem value="projects">
    <NavItemTrigger href="/projects">
      <NavItemContent><NavItemLabel>Projects</NavItemLabel></NavItemContent>
    </NavItemTrigger>
    <NavItemBadge>12</NavItemBadge>
  </NavItem>
</NavMenu>`;
const props: PropDef[] = [
  { name: "activeValue", type: "string | null", default: "null", description: "Strict value match used for aria-current and active styling." },
  { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Controls layout and roving arrow-key direction." },
  { name: "keyboardNavigation", type: '"native" | "roving"', default: '"native"', description: "Normal Tab order or optional roving focus." },
  { name: "NavItemTrigger.render", type: "ReactElement", description: "Composes behavior onto Next Link, React Router Link, or a custom anchor." },
];

export default function NavMenuDoc() {
  const [active, setActive] = useState("projects");
  return <DocPage title="NavMenu" slug="nav-menu" description="Router-agnostic composable navigation items with active, hover, focus, and keyboard behavior.">
    <DocSection title="Interactive"><ComponentPreview code={code}><NavMenu activeValue={active} keyboardNavigation="roving" aria-label="Preview navigation" className="w-72"><NavItem value="projects"><NavItemTrigger href="#projects" onClick={(event) => { event.preventDefault(); setActive("projects"); }}><NavItemContent><NavItemLabel>Projects</NavItemLabel><NavItemDescription>12 active projects</NavItemDescription></NavItemContent></NavItemTrigger><NavItemBadge>12</NavItemBadge><NavItemAction aria-label="Project options">•••</NavItemAction></NavItem><NavItem value="reports"><NavItemTrigger href="#reports" onClick={(event) => { event.preventDefault(); setActive("reports"); }}><NavItemContent><NavItemLabel>Reports</NavItemLabel></NavItemContent></NavItemTrigger></NavItem></NavMenu></ComponentPreview></DocSection>
    <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
  </DocPage>;
}
