import type { ReactNode } from "react";
import { AppShell, AppShellHeader, AppShellMain } from "@zeron/ui/app-shell";
import { NavItem, NavItemContent, NavItemLabel, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageLayout } from "@zeron/ui/page-layout";
import { TopNav, TopNavActions, TopNavBrand, TopNavNavigation } from "@zeron/ui/top-nav";
import { cn } from "@zeron/ui/system/utils";

export interface TopNavAppShellItem {
  label: string;
  href: string;
}

export interface TopNavAppShellProps {
  brand?: ReactNode;
  context?: ReactNode;
  navigation?: readonly TopNavAppShellItem[];
  activeHref?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

const defaultNavigation = [
  { label: "Overview", href: "#overview" },
  { label: "Models", href: "#models" },
  { label: "MCP", href: "#mcp" },
] as const;

/** A centered TopNav arranged above the application content, without a sidebar. */
export function TopNavAppShell({
  brand = "Zentrix",
  context = "Capability center",
  navigation = defaultNavigation,
  activeHref = navigation[0]?.href,
  actions,
  children,
  className,
}: TopNavAppShellProps) {
  return (
    <AppShell layout="stacked" className={cn("@container min-h-0 overflow-hidden border-[0.5px] border-border bg-surface-base", className)}>
      <AppShellHeader>
        <TopNav navigationAlign="center" className="w-full px-3 py-1 sm:px-3">
          <TopNavBrand className="min-w-0 gap-3 text-fg-default">
            <strong className="whitespace-nowrap text-heading leading-none font-bold">{brand}</strong>
            {context && <span className="hidden shrink-0 text-body font-medium @[52rem]:inline">{context}</span>}
          </TopNavBrand>
          <TopNavNavigation className="overflow-hidden">
            <NavMenu
              as="div"
              orientation="horizontal"
              variant="underline"
              activeValue={activeHref}
              keyboardNavigation="roving"
              aria-label="Application navigation"
              className="w-full"
            >
              {navigation.map((item) => (
                <NavItem key={item.href} value={item.href} className="shrink-0">
                  <NavItemTrigger href={item.href} className="px-1.5">
                    <NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent>
                  </NavItemTrigger>
                </NavItem>
              ))}
            </NavMenu>
          </TopNavNavigation>
          <TopNavActions className="min-w-0 justify-end">{actions}</TopNavActions>
        </TopNav>
      </AppShellHeader>
      <AppShellMain landmark={false} className="flex min-h-0 overflow-hidden">
        <PageLayout className="h-full pt-0">
          <PageContent>
            <PageBody>{children}</PageBody>
          </PageContent>
        </PageLayout>
      </AppShellMain>
    </AppShell>
  );
}
