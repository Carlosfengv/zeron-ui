"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { NavMenu } from "@/components/ui/nav-menu";
import { NavItem } from "@/components/ui/nav-item";
import { aiAgentList, componentList, systemList } from "@/docs/components";
import { ScrollArea } from "@/components/ui/scroll-area";
import { internalPathname, localizePathname } from "@/docs/site/locale-path";


interface SidebarProps {
  mobile?: boolean;
  localePrefix?: string;
}

export function Sidebar({ mobile, localePrefix = "" }: SidebarProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const currentPathname = internalPathname(pathname);

  const sections = (
    <>
      {/* Top-level navigation */}
      <NavMenu activeSlug={currentPathname === "/" ? localizePathname("/", localePrefix) : currentPathname === "/docs" ? localizePathname("/docs", localePrefix) : null} aria-label={t("main")}>
        <NavItem index={0} href={localizePathname("/", localePrefix)} label={t("showcase")} />
        <NavItem index={1} href={localizePathname("/docs", localePrefix)} label={t("introduction")} />
      </NavMenu>

      {/* System section */}
      <div>
        <span className="text-[13px] text-muted-foreground/50 pl-1 pb-1.5 flex items-center gap-2">
          {t("systemGroup")}
          <span className="text-[11px]">{systemList.length}</span>
        </span>
        <NavMenu activeSlug={localizePathname(currentPathname, localePrefix)} aria-label={t("system")}>
          {systemList.map((s, i) => (
            <NavItem
              key={s.slug}
              index={i}
              href={localizePathname(`/docs/${s.slug}`, localePrefix)}
              label={s.name}
              isNew={s.isNew}
              isUpdated={s.isUpdated}
            />
          ))}
        </NavMenu>
      </div>

      {/* Components section */}
      <div>
        <span className="text-[13px] text-muted-foreground/50 pl-1 pb-1.5 flex items-center gap-2">
          {t("componentsGroup")}
          <span className="text-[11px]">{componentList.length}</span>
        </span>
        <NavMenu activeSlug={localizePathname(currentPathname, localePrefix)} aria-label={t("components")}>
          {componentList.map((c, i) => (
            <NavItem
              key={c.slug}
              index={i}
              href={localizePathname(`/docs/${c.slug}`, localePrefix)}
              label={c.name}
              isNew={c.isNew}
              isUpdated={c.isUpdated}
              dotColorClass={c.dotColor}
            />
          ))}
        </NavMenu>
      </div>

      {/* AI Agent section */}
      <div>
        <span className="text-[13px] text-muted-foreground/50 pl-1 pb-1.5 flex items-center gap-2">
          {t("aiAgentGroup")}
          <span className="text-[11px]">{aiAgentList.length}</span>
        </span>
        <NavMenu activeSlug={localizePathname(currentPathname, localePrefix)} aria-label={t("aiAgent")}>
          {aiAgentList.map((component, index) => (
            <NavItem
              key={component.slug}
              index={index}
              href={localizePathname(`/docs/${component.slug}`, localePrefix)}
              label={component.name}
              isNew={component.isNew}
              isUpdated={component.isUpdated}
              dotColorClass={component.dotColor}
            />
          ))}
        </NavMenu>
      </div>
    </>
  );

  // Inside the mobile drawer, which owns the scroll (overflow-y-auto): the
  // sidebar just flows as a plain column — a nested ScrollArea would
  // double-scroll and needs a bounded height the drawer doesn't hand it.
  if (mobile) {
    return <aside className="flex w-full flex-col gap-4 p-4">{sections}</aside>;
  }

  // Desktop: the aside is the sticky, full-height rail. ScrollArea gives it the
  // shape-system scrollbar on hover + a scroll-fade edge — the same trick the
  // /docs/scrollbars page ships, dogfooded on our own nav.
  return (
    <aside
      // max-xl:fixed — same trick as the right panel: while xl-fade-flex holds
      // display:flex through the fade-out (allow-discrete), fixed positioning
      // takes the sidebar out of flow at the breakpoint so the content reflows
      // once, not again when display flips to none. ml-2 mirrors the right
      // panel's mr-2 inset so both sides land on the same 8px gap.
      className="shrink-0 w-64 ml-2 flex-col sticky top-0 h-screen xl-fade-flex max-xl:fixed max-xl:top-0 max-xl:left-0 max-xl:z-40 max-xl:pointer-events-none"
    >
      <ScrollArea className="min-h-0 w-full flex-1" viewportClassName="scroll-fade">
        <div className="flex flex-col gap-4 p-4">{sections}</div>
      </ScrollArea>
    </aside>
  );
}

export default Sidebar;
