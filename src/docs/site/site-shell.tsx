"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIcon } from "@/lib/icon-context";
import { Button } from "@/components/ui/button";
import {
  DeferredDesktopRightPanel,
  DeferredDesktopSidebar,
} from "@/docs/site/deferred-desktop-chrome";
import { RightRailProvider } from "@/docs/right-rail";
import { aiAgentList, systemList, componentList } from "@/docs/components";

const loadMobileSiteDrawer = () => import("@/docs/site/mobile-site-drawer");
const MobileSiteDrawer = lazy(() =>
  loadMobileSiteDrawer().then((module) => ({ default: module.MobileSiteDrawer }))
);

const pageOrder = [
  "/",
  "/docs",
  ...systemList.map((item) => `/docs/${item.slug}`),
  ...componentList.map((item) => `/docs/${item.slug}`),
  ...aiAgentList.map((item) => `/docs/${item.slug}`),
];

export function SiteShell({ children }: { children: ReactNode }) {
  const MenuIcon = useIcon("menu");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const expectedIndexRef = useRef(pageOrder.indexOf(pathname));

  useEffect(() => {
    setDrawerOpen(false);
    expectedIndexRef.current = pageOrder.indexOf(pathname);
  }, [pathname]);

  const handleClose = useCallback(() => setDrawerOpen(false), []);
  const handleOpen = useCallback(() => {
    setDrawerMounted(true);
    setDrawerOpen(true);
  }, []);
  const preloadMobileDrawer = useCallback(() => {
    void loadMobileSiteDrawer();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

      const target = event.target as HTMLElement;
      const tag = target.tagName;
      const role = target.getAttribute("role");
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable ||
        role === "slider" ||
        role === "tablist" ||
        role === "radiogroup" ||
        role === "listbox" ||
        role === "menu" ||
        target.closest("[role=slider],[role=tablist],[role=radiogroup],[role=listbox],[role=menu],[role=menubar]")
      ) return;

      const currentIndex = expectedIndexRef.current;
      const nextIndex = event.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= pageOrder.length) return;

      event.preventDefault();
      expectedIndexRef.current = nextIndex;
      router.push(pageOrder[nextIndex]);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <RightRailProvider>
      <div className="flex min-h-screen">
        <DeferredDesktopSidebar />

        <Button
          ref={menuButtonRef}
          variant="ghost"
          size="icon"
          className="xl:hidden fixed top-4 left-4 z-50"
          onClick={handleOpen}
          onPointerEnter={preloadMobileDrawer}
          onFocus={preloadMobileDrawer}
          aria-label="Open navigation"
        >
          <MenuIcon />
        </Button>

        {drawerMounted && (
          <Suspense fallback={null}>
            <MobileSiteDrawer
              open={drawerOpen}
              onClose={handleClose}
              triggerRef={menuButtonRef}
            />
          </Suspense>
        )}

        <main className="flex-1 min-w-0">{children}</main>
        <DeferredDesktopRightPanel />
      </div>
    </RightRailProvider>
  );
}
