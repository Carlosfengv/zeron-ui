"use client";

import type { ReactNode } from "react";
import { AppShell, AppShellHeader, AppShellMain } from "@zeron/ui/app-shell";
import { Button } from "@zeron/ui/button";
import { NavItem, NavItemContent, NavItemLabel, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { TopNav, TopNavActions, TopNavBrand, TopNavNavigation } from "@zeron/ui/top-nav";

export function DetailBlockPreviewShell({ active, children }: { active: "models" | "mcp"; children: ReactNode }) {
  return (
    <AppShell layout="stacked" className="h-full min-h-0 overflow-hidden bg-surface-base">
      <AppShellHeader className="static bg-surface-base">
        <TopNav navigationAlign="center" className="px-3">
          <TopNavBrand className="gap-3 text-fg-default"><strong className="text-heading font-bold leading-none">Zentrix</strong><span className="hidden text-body font-medium @[38rem]:inline">能力中心</span></TopNavBrand>
          <TopNavNavigation className="overflow-hidden max-sm:hidden"><NavMenu as="div" orientation="horizontal" variant="underline" activeValue={`#${active}`} keyboardNavigation="roving" aria-label="能力中心导航" className="w-full"><NavItem value="#home" className="shrink-0"><NavItemTrigger href="#home"><NavItemContent><NavItemLabel>首页</NavItemLabel></NavItemContent></NavItemTrigger></NavItem><NavItem value="#models" className="shrink-0"><NavItemTrigger href="#models"><NavItemContent><NavItemLabel>模型服务</NavItemLabel></NavItemContent></NavItemTrigger></NavItem><NavItem value="#mcp" className="shrink-0"><NavItemTrigger href="#mcp"><NavItemContent><NavItemLabel>MCP 广场</NavItemLabel></NavItemContent></NavItemTrigger></NavItem></NavMenu></TopNavNavigation>
          <TopNavActions><Button type="button" size="sm" variant="neutral">登录</Button></TopNavActions>
        </TopNav>
      </AppShellHeader>
      <AppShellMain landmark={false} className="min-h-0 overflow-hidden">{children}</AppShellMain>
    </AppShell>
  );
}
