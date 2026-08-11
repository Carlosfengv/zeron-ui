"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppShell, AppShellMain, AppShellSidebar } from "@/components/ui/app-shell";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DeferredDesktopRightPanel } from "@/docs/site/deferred-desktop-chrome";
import { DocsSidebar } from "@/docs/site/sidebar";
import { RightRailProvider } from "@/docs/right-rail";
import { aiAgentList, componentList, layoutList, systemList } from "@/docs/components";
import { internalPathname, localePrefixFromPathname, localizePathname } from "@/docs/site/locale-path";

const pageOrder = [
  "/",
  "/docs",
  ...systemList.map((item) => `/docs/${item.slug}`),
  ...layoutList.map((item) => `/docs/${item.slug}`),
  ...componentList.map((item) => `/docs/${item.slug}`),
  ...aiAgentList.map((item) => `/docs/${item.slug}`),
];

function DocsShellContent({ children }: { children: ReactNode }) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const router = useRouter();
  const { closeMobile } = useSidebar();
  const localePrefix = localePrefixFromPathname(pathname);
  const currentPathname = internalPathname(pathname);
  const isLocalizedDocumentation = currentPathname === "/" || currentPathname === "/docs" || currentPathname.startsWith("/docs/");
  const expectedIndexRef = useRef(pageOrder.indexOf(currentPathname));

  useEffect(() => {
    closeMobile();
    expectedIndexRef.current = pageOrder.indexOf(currentPathname);
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
      <AppShell>
        <AppShellSidebar><DocsSidebar localePrefix={localePrefix} showLanguage={isLocalizedDocumentation} /></AppShellSidebar>
        <AppShellMain className="flex min-h-svh">
          <SidebarTrigger label={t("open")} className="fixed left-4 top-4 z-50 xl:hidden" />
          <div className="min-w-0 flex-1">{children}</div>
          <DeferredDesktopRightPanel localePrefix={localePrefix} showLanguage={isLocalizedDocumentation} />
        </AppShellMain>
      </AppShell>
    </RightRailProvider>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return <SidebarProvider persistenceKey="docs-sidebar"><DocsShellContent>{children}</DocsShellContent></SidebarProvider>;
}
