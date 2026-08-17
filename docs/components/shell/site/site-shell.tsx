"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from "@zeron/ui/app-shell";
import { Button } from "@zeron/ui/button";
import { NavItem, NavItemContent, NavItemLabel, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@zeron/ui/sidebar";
import { useIcon } from "@zeron/icons/context";
import { useThemeContext } from "@zeron/ui/system/theme-context";
import { ColorPickerPopover } from "@zeron/ui/color-picker";
import { TopNav, TopNavActions, TopNavBrand, TopNavNavigation } from "@zeron/ui/top-nav";
import { Tooltip } from "@zeron/ui/tooltip";
import { rgbToHex, useBrandColor } from "@docs/components/playground/brand-playground";
import { DeferredDesktopRightPanel } from "@docs/components/shell/site/deferred-desktop-chrome";
import { DocsSidebar } from "@docs/components/shell/site/sidebar";
import { RightRailProvider } from "@docs/components/shell/right-rail";
import { docEntries, type DocCollection } from "@docs/manifest";
import { internalPathname, localePrefixFromPathname, localizePathname } from "@docs/components/shell/site/locale-path";

function pageOrderFor(pathname: string) {
  const collection = pathname.split("/")[2] as DocCollection | undefined;
  if (collection !== "components" && collection !== "blocks" && collection !== "icons") return ["/", "/docs"];
  return [`/docs/${collection}`, ...docEntries.filter((entry) => entry.collection === collection).map((entry) => `/docs/${entry.collection}/${entry.slug}`)];
}

function GitHubMark() {
  return (
    <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function DocsPrimaryNavigation({
  localePrefix,
  currentPathname,
  showSidebarTrigger,
}: {
  localePrefix: string;
  currentPathname: string;
  showSidebarTrigger: boolean;
}) {
  const t = useTranslations("navigation");
  const searchParams = useSearchParams();
  const { theme, setTheme } = useThemeContext();
  const { brandColor, setBrandColor } = useBrandColor();
  const SunIcon = useIcon("sun");
  const MoonIcon = useIcon("moon");
  const nextTheme = theme === "dark" ? "light" : "dark";
  const themeActionLabel = localePrefix
    ? nextTheme === "dark" ? "切换至深色模式" : "切换至浅色模式"
    : nextTheme === "dark" ? "Switch to dark mode" : "Switch to light mode";
  const activePath = currentPathname === "/"
    ? localizePathname("/", localePrefix)
    : currentPathname === "/guides"
      ? localizePathname("/guides", localePrefix)
      : currentPathname.startsWith("/docs/blocks")
        ? localizePathname("/docs/blocks", localePrefix)
        : currentPathname.startsWith("/docs/components")
          ? localizePathname("/docs/components", localePrefix)
          : currentPathname === "/docs"
            ? localizePathname("/docs", localePrefix)
            : null;
  const items = [
    { href: localizePathname("/", localePrefix), label: t("showcase") },
    { href: localizePathname("/docs/blocks", localePrefix), label: t("businessTemplates") },
    { href: localizePathname("/docs/components", localePrefix), label: t("componentsEntry") },
    { href: localizePathname("/guides", localePrefix), label: t("guides") },
  ];
  const languageActionLabel = localePrefix ? "Switch to English" : "切换至中文";
  const languageLabel = localePrefix ? "EN" : "中";
  const alternateLocalePrefix = localePrefix ? "" : "/zh-cn";
  const languageHref = `${localizePathname(currentPathname, alternateLocalePrefix)}${searchParams.size ? `?${searchParams}` : ""}`;
  const brandLabel = localePrefix ? "品牌色" : "Brand";

  return (
    <TopNav navigationAlign="left" className="w-full gap-2 border-0 px-4 sm:px-6">
      <TopNavBrand className="shrink-0 px-0 pr-3 text-title font-semibold tracking-tight text-fg-default sm:pr-8">
        <Link aria-label="Zeron Design" href={localizePathname("/", localePrefix)}>
          <span className="sm:hidden">ZD</span>
          <span className="max-sm:hidden">Zeron Design</span>
        </Link>
      </TopNavBrand>
      <TopNavNavigation className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavMenu
          as="div"
          aria-label={t("main")}
          activeValue={activePath}
          keyboardNavigation="roving"
          orientation="horizontal"
          variant="underline"
          className="flex w-max min-w-full max-sm:[&_[data-slot=nav-item-trigger]]:px-2"
        >
          {items.map((item) => (
            <NavItem key={item.href} value={item.href} className="shrink-0">
              <NavItemTrigger render={<Link href={item.href} />}>
                <NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent>
              </NavItemTrigger>
            </NavItem>
          ))}
        </NavMenu>
      </TopNavNavigation>
      <TopNavActions className="gap-1 px-0">
        <Tooltip content={brandLabel} side="bottom">
          <ColorPickerPopover
            format="hex"
            onValueChange={(_value, parsed) => setBrandColor(rgbToHex({ r: parsed.r, g: parsed.g, b: parsed.b }))}
            swatches={["#0060D2", "#7C3AED", "#DB2777", "#DC2626", "#EA580C", "#16A34A"]}
            triggerLabel={brandLabel}
            triggerShowValue={false}
            triggerClassName="h-8 border-transparent px-2 hover:bg-hover"
            value={brandColor}
          />
        </Tooltip>
        <Tooltip content={themeActionLabel} side="bottom">
          <Button aria-label={themeActionLabel} iconOnly size="sm" type="button" variant="ghost" onClick={() => setTheme(nextTheme)}>
            {theme === "dark" ? <SunIcon aria-hidden="true" size={16} strokeWidth={1.5} /> : <MoonIcon aria-hidden="true" size={16} strokeWidth={1.5} />}
          </Button>
        </Tooltip>
        <Tooltip content="GitHub" side="bottom">
          <Button asChild aria-label="Open GitHub repository" iconOnly size="sm" variant="ghost">
            <a href="https://github.com/Carlosfengv/zeron-ui" rel="noreferrer" target="_blank"><GitHubMark /></a>
          </Button>
        </Tooltip>
        <Tooltip content={languageActionLabel} side="bottom">
          <Button asChild aria-label={languageActionLabel} size="sm" variant="ghost">
            <Link href={languageHref}>{languageLabel}</Link>
          </Button>
        </Tooltip>
        {showSidebarTrigger && <SidebarTrigger label={t("open")} className="xl:hidden" />}
      </TopNavActions>
    </TopNav>
  );
}

function DocsShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { closeMobile } = useSidebar();
  const localePrefix = localePrefixFromPathname(pathname);
  const currentPathname = internalPathname(pathname);
  const isLocalizedDocumentation = currentPathname === "/" || currentPathname === "/guides" || currentPathname === "/docs" || currentPathname.startsWith("/docs/");
  const isBlocksWorkspace = currentPathname === "/docs/blocks" || currentPathname.startsWith("/docs/blocks/");
  const isGuidesWorkspace = currentPathname === "/guides";
  const isComponentsDetail = currentPathname.startsWith("/docs/components/");
  const hasDocumentationSidebar = currentPathname === "/docs" || currentPathname.startsWith("/docs/icons");
  const expectedIndexRef = useRef(pageOrderFor(currentPathname).indexOf(currentPathname));

  useEffect(() => {
    closeMobile();
    expectedIndexRef.current = pageOrderFor(currentPathname).indexOf(currentPathname);
  }, [closeMobile, currentPathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target as HTMLElement;
      const tag = target.tagName;
      const role = target.getAttribute("role");
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable || role === "slider" || role === "tablist" || role === "radiogroup" || role === "listbox" || role === "menu" || target.closest("[role=slider],[role=tablist],[role=radiogroup],[role=listbox],[role=menu],[role=menubar]")) return;
      const currentIndex = expectedIndexRef.current;
      const pageOrder = pageOrderFor(currentPathname);
      const nextIndex = event.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= pageOrder.length) return;
      event.preventDefault();
      expectedIndexRef.current = nextIndex;
      router.push(localizePathname(pageOrder[nextIndex], localePrefix));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [localePrefix, router]);

  return (
    <RightRailProvider>
      <AppShell layout="stacked">
        <AppShellHeader className="border-b border-border bg-surface-base">
          <DocsPrimaryNavigation
            currentPathname={currentPathname}
            localePrefix={localePrefix}
            showSidebarTrigger={hasDocumentationSidebar}
          />
        </AppShellHeader>
        <AppShellMain className="flex min-h-svh">
          {hasDocumentationSidebar && <AppShellSidebar><DocsSidebar localePrefix={localePrefix} showLanguage={isLocalizedDocumentation} /></AppShellSidebar>}
          <div className="min-w-0 flex-1">{children}</div>
          {currentPathname !== "/" && !isBlocksWorkspace && !isGuidesWorkspace && currentPathname !== "/docs/components" && !isComponentsDetail && <DeferredDesktopRightPanel localePrefix={localePrefix} showLanguage={isLocalizedDocumentation} />}
        </AppShellMain>
      </AppShell>
    </RightRailProvider>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return <SidebarProvider persistenceKey="docs-sidebar"><DocsShellContent>{children}</DocsShellContent></SidebarProvider>;
}
