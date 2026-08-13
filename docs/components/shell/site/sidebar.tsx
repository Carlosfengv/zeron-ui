"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  NavItem,
  NavItemContent,
  NavItemLeading,
  NavItemLabel,
  NavItemTrigger,
} from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@zeron/ui/sidebar";
import { cn } from "@zeron/ui/system/utils";
import { useIcon, type IconName } from "@zeron/icons/context";
import { CollectionSwitcher } from "@docs/components/navigation/CollectionSwitcher";
import { docEntries, sectionDefinitions, pathnameOf, type DocCollection } from "@docs/manifest";
import { SettingsContent } from "@docs/components/shell/site/right-panel";
import { internalPathname, localizePathname } from "@docs/components/shell/site/locale-path";
import { SurfaceProvider } from "@zeron/ui/system/surface-context";

interface DocsSidebarProps {
  localePrefix?: string;
  showLanguage?: boolean;
}

function SiteNavItem({
  href,
  label,
  icon,
  isNew,
  isUpdated,
  dotColor,
}: {
  href: string;
  label: string;
  icon: IconName;
  isNew?: boolean;
  isUpdated?: boolean;
  dotColor?: string;
}) {
  const Icon = useIcon(icon);

  return (
    <NavItem value={href}>
      <NavItemTrigger render={<Link href={href} />} tooltip={label}>
        <NavItemLeading><Icon aria-hidden="true" size={16} strokeWidth={1.5} /></NavItemLeading>
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
  const pathCollection = currentPathname.split("/")[2];
  const collection: DocCollection = pathCollection === "blocks" || pathCollection === "icons" ? pathCollection : "components";
  const sections = sectionDefinitions.filter((definition) => definition.collection === collection);
  const section = (key: string, label: string, count: number, ariaLabel: string, children: ReactNode) => (
    <section key={key}>
      <p className="flex items-center gap-2 px-1 pb-1.5 text-label text-fg-muted">
        {label} <span>{count}</span>
      </p>
      <NavMenu activeValue={activePath} keyboardNavigation="roving" aria-label={ariaLabel}>{children}</NavMenu>
    </section>
  );

  return (
    <>
      <NavMenu activeValue={currentPathname === "/" ? localizePathname("/", localePrefix) : currentPathname === "/docs" ? localizePathname("/docs", localePrefix) : null} keyboardNavigation="roving" aria-label={t("main")}>
        <SiteNavItem href={localizePathname("/", localePrefix)} label={t("showcase")} icon="doc-showcase" />
        <SiteNavItem href={localizePathname("/docs", localePrefix)} label={t("introduction")} icon="doc-introduction" />
      </NavMenu>
      <CollectionSwitcher localePrefix={localePrefix} />
      {sections.map((definition) => {
        const entries = docEntries.filter((entry) => entry.collection === collection && entry.section === definition.id);
        const label = t.has(definition.navigationKey) ? t(definition.navigationKey) : definition.id;
        return section(definition.id, label, entries.length, label, entries.map((item) => <SiteNavItem key={item.slug} href={localizePathname(pathnameOf(item), localePrefix)} label={item.name} icon={item.icon} isNew={item.isNew} isUpdated={item.isUpdated} dotColor={item.dotColor} />));
      })}
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
