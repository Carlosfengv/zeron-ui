"use client";

import { useState } from "react";
import { TopNav, TopNavActions, TopNavBrand, TopNavNavigation } from "@/components/ui/top-nav";
import { NavItem, NavItemContent, NavItemLabel, NavItemTrigger } from "@/components/ui/nav-item";
import { NavMenu } from "@/components/ui/nav-menu";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { PropsTable, type PropDef } from "@/docs/PropsTable";

const code = `<TopNav>
  <TopNavBrand>Brand</TopNavBrand>
  <TopNavNavigation>
    <NavMenu
      orientation="horizontal"
      variant="underline"
      activeValue="overview"
      keyboardNavigation="roving"
    >
      ...
    </NavMenu>
  </TopNavNavigation>
  <TopNavActions>...</TopNavActions>
</TopNav>`;
const props: PropDef[] = [{ name: "variant", type: '"default" | "floating"', default: '"default"', description: "Base or raised navigation surface." }];

export default function TopNavDoc() {
  const [active, setActive] = useState("overview");
  return <DocPage title="TopNav" slug="top-nav" description="A compact horizontal navigation container that shares NavMenu and NavItem behavior with Sidebar.">
    <DocSection title="Basic"><ComponentPreview code={code}><TopNav className="border border-border"><TopNavBrand className="text-label text-fg-default">Zeron</TopNavBrand><TopNavNavigation><NavMenu orientation="horizontal" variant="underline" activeValue={active} keyboardNavigation="roving" aria-label="Preview navigation"><NavItem value="overview"><NavItemTrigger href="#overview" onClick={(event) => { event.preventDefault(); setActive("overview"); }}><NavItemContent><NavItemLabel>Overview</NavItemLabel></NavItemContent></NavItemTrigger></NavItem><NavItem value="activity"><NavItemTrigger href="#activity" onClick={(event) => { event.preventDefault(); setActive("activity"); }}><NavItemContent><NavItemLabel>Activity</NavItemLabel></NavItemContent></NavItemTrigger></NavItem></NavMenu></TopNavNavigation><TopNavActions><Button size="sm" variant="ghost">Share</Button></TopNavActions></TopNav></ComponentPreview></DocSection>
    <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
  </DocPage>;
}
