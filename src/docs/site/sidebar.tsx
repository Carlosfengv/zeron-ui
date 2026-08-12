"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  NavItem,
  NavItemContent,
  NavItemLabel,
  NavItemTrigger,
} from "@/components/ui/nav-item";
import { NavMenu } from "@/components/ui/nav-menu";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { aiAgentList, componentList, layoutList, systemList } from "@/docs/components";
import { SettingsContent } from "@/docs/site/right-panel";
import { internalPathname, localizePathname } from "@/docs/site/locale-path";
import { SurfaceProvider } from "@/lib/surface-context";

interface DocsSidebarProps {
  localePrefix?: string;
  showLanguage?: boolean;
}

function SiteNavItem({
  href,
  label,
  isNew,
  isUpdated,
  dotColor,
}: {
  href: string;
  label: string;
  isNew?: boolean;
  isUpdated?: boolean;
  dotColor?: string;
}) {
  return (
    <NavItem value={href}>
      <NavItemTrigger render={<Link href={href} />} tooltip={label}>
        <NavItemContent>
          <span className="flex min-w-0 items-center gap-2">
            <NavItemLabel>{label}</NavItemLabel>
            {(isNew || isUpdated) && (
              <span
                aria-label={isUpdated ? "Updated" : "New"}
                className={cn("size-1.5 shrink-0 rounded-full", isUpdated ? "bg-brand" : dotColor ?? "bg-brand")}
              />
            )}
          </span>
        </NavItemContent>
      </NavItemTrigger>
    </NavItem>
  );
}

function DocsSidebarContent({ localePrefix = "" }: Pick<DocsSidebarProps, "localePrefix">) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const currentPathname = internalPathname(pathname);
  const activePath = localizePathname(currentPathname, localePrefix);
  const section = (label: string, count: number, ariaLabel: string, children: ReactNode) => (
    <section>
      <p className="flex items-center gap-2 px-1 pb-1.5 text-label text-fg-muted">
        {label} <span>{count}</span>
      </p>
      <NavMenu activeValue={activePath} keyboardNavigation="roving" aria-label={ariaLabel}>{children}</NavMenu>
    </section>
  );

  return (
    <>
      <NavMenu activeValue={currentPathname === "/" ? localizePathname("/", localePrefix) : currentPathname === "/docs" ? localizePathname("/docs", localePrefix) : null} keyboardNavigation="roving" aria-label={t("main")}>
        <SiteNavItem href={localizePathname("/", localePrefix)} label={t("showcase")} />
        <SiteNavItem href={localizePathname("/docs", localePrefix)} label={t("introduction")} />
      </NavMenu>
      {section(t("systemGroup"), systemList.length, t("system"), systemList.map((item) => <SiteNavItem key={item.slug} href={localizePathname(`/docs/${item.slug}`, localePrefix)} label={item.name} isNew={item.isNew} isUpdated={item.isUpdated} />))}
      {section(t("layoutGroup"), layoutList.length, t("layout"), layoutList.map((item) => <SiteNavItem key={item.slug} href={localizePathname(`/docs/${item.slug}`, localePrefix)} label={item.name} />))}
      {section(t("componentsGroup"), componentList.length, t("components"), componentList.map((item) => <SiteNavItem key={item.slug} href={localizePathname(`/docs/${item.slug}`, localePrefix)} label={item.name} isNew={item.isNew} isUpdated={item.isUpdated} dotColor={item.dotColor} />))}
      {section(t("aiAgentGroup"), aiAgentList.length, t("aiAgent"), aiAgentList.map((item) => <SiteNavItem key={item.slug} href={localizePathname(`/docs/${item.slug}`, localePrefix)} label={item.name} isNew={item.isNew} isUpdated={item.isUpdated} dotColor={item.dotColor} />))}
    </>
  );
}

function DocsSidebarFooter({ localePrefix = "", showLanguage = false }: DocsSidebarProps) {
  const { isMobile } = useSidebar();
  if (!isMobile) return null;
  return <SidebarFooter className="border-t border-border"><SettingsContent tooltipSide="right" localePrefix={localePrefix} showLanguage={showLanguage} /></SidebarFooter>;
}

export function DocsSidebar({ localePrefix = "", showLanguage = false }: DocsSidebarProps) {
  return (
    <SurfaceProvider role="floating">
      <SidebarRoot
        width="260px"
        collapsible="offcanvas"
        mobileLabel="Documentation navigation"
        className="bg-surface-floating"
      >
        <SidebarContent><DocsSidebarContent localePrefix={localePrefix} /></SidebarContent>
        <DocsSidebarFooter localePrefix={localePrefix} showLanguage={showLanguage} />
      </SidebarRoot>
    </SurfaceProvider>
  );
}

/** @deprecated Use DocsSidebar to make the business adapter explicit. */
export const Sidebar = DocsSidebar;
export default DocsSidebar;
