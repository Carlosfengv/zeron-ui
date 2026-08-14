import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("sidebar implementation contract", () => {
  const sidebar = source("packages/ui/src/components/sidebar.tsx");
  const drawer = source("packages/ui/src/components/mobile-drawer.tsx");
  const identityRow = source("packages/ui/src/components/sidebar-identity-row.tsx");
  const navMenu = source("packages/ui/src/components/nav-menu.tsx");
  const sidebarDocs = source("docs/pages/components/sidebar/page.tsx");
  const zaiopsBlock = source("packages/blocks/src/application/zaiops-operations-01/zaiops-operations.tsx");
  const zaiopsPreview = source("docs/components/shell/site/zaiops-sidebar-preview.tsx");

  it("publishes one set of width variables and keeps the compact drawer explicit", () => {
    expect(sidebar).toContain('"--sidebar-width": width');
    expect(sidebar).toContain('"--sidebar-width-collapsed": collapsedWidth');
    expect(sidebar).toContain('"--sidebar-width-mobile": mobileWidth');
    expect(sidebar).toContain('panelStyle={{ width: mobileWidth }}');
  });

  it("removes the entire desktop branch from compact layout before hydration", () => {
    expect(sidebar).toContain('"hidden xl:block"');
    expect(sidebar).toContain('data-mobile="false"');
  });

  it("can derive compact offcanvas navigation from the desktop collapsed state", () => {
    expect(sidebar).toContain('export type SidebarBreakpointBehavior = "drawer" | "collapse";');
    expect(sidebar).toContain('breakpointBehavior = "drawer"');
    expect(sidebar).toContain('const isBreakpointCollapsed = breakpointBehavior === "collapse" && isMobile;');
    expect(sidebar).toContain('const open = preferredOpen && !isBreakpointCollapsed;');
    expect(sidebar).toContain('breakpointBehavior === "drawer"');
    expect(sidebar).toContain('? "hidden xl:block"');
    expect(sidebar).toContain(': isMobile');
    expect(sidebar).toContain('? "block"');
    expect(sidebar).toContain(': "block max-xl:hidden"');
    expect(sidebar).toContain('supportsBreakpointCollapse && state !== "collapsed" && "max-xl:inline-flex"');
  });

  it("keeps the icon Sidebar visible after compact-breakpoint hydration in both demos", () => {
    expect(sidebarDocs).toContain('<SidebarProvider defaultOpen breakpointBehavior="collapse">');
    expect(sidebarDocs).toContain('<SidebarProvider key={collapsible} defaultOpen breakpointBehavior="collapse">');
    expect(sidebarDocs).toContain('<Sidebar collapsible="icon" className="relative !h-full">');
  });

  it("keeps compact drawer actions stable while its open state changes", () => {
    expect(sidebar).toContain("const mobileOpenRef = useRef(mobileOpen);");
    expect(sidebar).toContain("if (nextOpen && !mobileOpenRef.current)");
    expect(sidebar).toContain("[mobileOpenProp, onMobileOpenChange]");
  });

  it("preserves SidebarContent prop placement while adding style outlets", () => {
    expect(sidebar).toContain("viewportClassName?: string;");
    expect(sidebar).toContain("contentClassName?: string;");
    expect(sidebar).toContain('data-slot="sidebar-content-inner"');
    expect(sidebar).toContain('"h-full overflow-x-hidden"');
    expect(sidebar).toContain('"flex min-h-full w-full min-w-0 flex-col gap-4 px-1 py-1.5"');
    expect(sidebar).toContain("{...props}");
  });

  it("inherits the shell background while preserving semantic nesting and floating separation", () => {
    expect(sidebar).toContain("const surface = variant === \"floating\" ? resolveSurface(parentSurface, \"raised\") : parentSurface;");
    expect(sidebar).toContain("{mobile ? children : <SurfaceProvider role={surface}>{children}</SurfaceProvider>}");
    expect(sidebar).toContain('!mobile && variant === "floating" && shadowClasses("raised")');
    expect(sidebar).not.toContain("surfaceClasses(");
    expect(sidebar).not.toContain("bg-surface-");
  });

  it("uses logical sidebar direction for desktop and drawer exit motion", () => {
    expect(sidebar).toContain('side?: SidebarSide;');
    expect(sidebar).toContain('dir={dir}');
    expect(sidebar).toContain("const offcanvasX = physicalLeft ? \"-100%\" : \"100%\";");
    expect(drawer).toContain('dir?: string;');
    expect(drawer).toContain('side?: "start" | "end";');
    expect(drawer).toContain("const hiddenX = physicalLeft ? \"-100%\" : \"100%\";");
  });

  it("renders recent diagnostic sessions as static history, not missing routes", () => {
    expect(zaiopsPreview).toContain('data-slot="recent-session-item"');
    expect(zaiopsPreview).not.toContain('/sessions/');
  });

  it("uses the NavMenu 16px leading-icon scale in the ZAIops recipe", () => {
    expect(zaiopsPreview).toContain('<Icon size={16} strokeWidth={1.5} />');
    expect(zaiopsPreview).toContain('<Message size={16} strokeWidth={1.5} />');
    expect(zaiopsPreview).not.toContain('className="size-5 group-data-[active=true]/nav-item:text-fg-brand"');
  });

  it("composes the ZAIops main area from PageLayout without a PageSubnav", () => {
    expect(zaiopsPreview).toContain('<PageLayout className="h-full min-w-0 flex-1">');
    expect(zaiopsPreview).toContain('<PageHeader className="h-control-xs py-0 max-sm:flex-row">');
    expect(zaiopsPreview).toContain("<PageContent>");
    expect(zaiopsPreview).toContain('<PageBody className="p-6">');
    expect(zaiopsPreview).not.toContain("PageSubnav");
  });

  it("keeps sidebar identity presentation generic while menus remain composable", () => {
    expect(identityRow).toContain('"auto" | "single-line" | "two-line"');
    expect(identityRow).toContain('"inline" | "edge"');
    expect(identityRow).toContain('as?: "button" | "div";');
    expect(identityRow).toContain('data-slot="sidebar-identity-row"');
    expect(identityRow).toContain('data-slot="sidebar-identity-content-row"');
    expect(identityRow).toContain('flex min-w-0 w-full items-center gap-1.5');
    expect(identityRow).toContain('data-slot="sidebar-identity-leading"');
    expect(identityRow).toContain('trailingPlacement === "edge" && "ms-auto"');
    expect(identityRow).toContain('min-h-control-md h-auto justify-start gap-1.5 px-0.5 py-2');
    expect(identityRow).toContain('[&>span.relative>span]:w-full');
    expect(zaiopsPreview).toContain("<SidebarIdentityRow");
    expect(zaiopsPreview).toContain('trailingPlacement="edge"');
    expect(zaiopsPreview).toContain("<DropdownTrigger");
    expect(zaiopsPreview).toContain('alignOffset={20}');
    expect(zaiopsPreview).toContain('className="!w-60 !min-w-60 !max-w-60"');
    expect(zaiopsPreview).toContain('<DropdownContent\n        align="center"\n        className="!w-60 !min-w-60 !max-w-60"');
  });

  it("allows exactly one active ZAIops navigation item across menu groups", () => {
    expect(zaiopsPreview).toContain("const [activeNavigationValue, setActiveNavigationValue]");
    expect(zaiopsPreview).not.toContain("primaryActiveValue");
    expect(zaiopsPreview).not.toContain("governanceActiveValue");
  });

  it("provides hover navigation and a click-to-expand trigger for an offcanvas Sidebar", () => {
    expect(sidebar).toContain("export interface SidebarFloatingTriggerProps");
    expect(sidebar).toContain('collapsedBehavior = "offcanvas"');
    expect(sidebar).toContain('state === "collapsed" && collapsedBehavior === "offcanvas"');
    expect(sidebar).toContain('<Popover trigger="hover"');
    expect(sidebar).toContain("toggle();");
    expect(sidebar).toContain('useIcon("chevrons-right")');
    expect(sidebar).toContain('useIcon("chevrons-left")');
    expect(sidebar).toContain('size="icon-sm"');
    expect(sidebar).toContain('variant="tertiary"');
    expect(zaiopsPreview).toContain("<SidebarFloatingTrigger");
    expect(zaiopsPreview).toContain('collapsedBehavior="offcanvas"');
    expect(zaiopsPreview).toContain("<ZaiopsNavigationPanel");
  });

  it("lets one floating-navigation interaction serve user and breakpoint collapse", () => {
    expect(sidebar).toContain('clickBehavior?: "expand" | "menu";');
    expect(sidebar).toContain('const opensMenuOnClick = isBreakpointCollapsed || clickBehavior === "menu";');
    expect(sidebar).toContain('const Icon = opensMenuOnClick ? MenuIcon : ExpandIcon;');
    expect(sidebar).toContain('aria-label={opensMenuOnClick ? menuLabel : label}');
    expect(sidebar).toContain('if (!opensMenuOnClick)');
    expect(zaiopsBlock).toContain('<SidebarProvider breakpointBehavior="collapse">');
    expect(zaiopsBlock).not.toContain('clickBehavior="menu"');
    expect(zaiopsBlock).toContain('size="icon-xs"\n              label="Collapse operations navigation"\n              className="shrink-0"');
    expect(zaiopsBlock).toContain('collapsedBehavior="offcanvas"\n                size="icon-xs"');
    expect(zaiopsBlock).toContain('label="Expand operations navigation"');
    expect(zaiopsBlock).toContain('menuLabel="Open operations navigation menu"');
    expect(zaiopsPreview).toContain('size="icon-xs"\n      label={isMobile ? "关闭导航" : "收起侧边栏"}\n      className="shrink-0"');
    expect(zaiopsPreview).toContain('collapsedBehavior="offcanvas"\n                  size="icon-xs"');
    expect(zaiopsPreview).toContain('<SidebarProvider breakpointBehavior="collapse">');
    expect(zaiopsPreview).not.toContain("CompactOpenTrigger");
    expect(zaiopsPreview).not.toContain('className="flex h-full items-center xl:hidden"');
    expect(zaiopsBlock).not.toContain('<div className="xl:hidden"><SidebarTrigger');
  });

  it("hydrates the platform shortcut from an invisible size-preserving placeholder", () => {
    expect(zaiopsBlock).toContain("useSyncExternalStore(");
    expect(zaiopsBlock).toContain("getServerPlatformShortcut");
    expect(zaiopsBlock).toContain('className="invisible ms-auto min-w-13 justify-end"');
    expect(zaiopsBlock).not.toContain('useState("Ctrl/⌘ K")');
    expect(zaiopsBlock).toContain('aria-keyshortcuts="Meta+K Control+K"');
  });

  it("uses the App Router paths and one shared navigation panel", () => {
    for (const href of [
      "/",
      "/clusters",
      "/reports",
      "/inspection-plans",
      "/expert-skills",
      "/knowledge-base",
    ]) {
      expect(zaiopsBlock).toContain(`value: "${href}"`);
    }
    expect(zaiopsBlock).toContain('render={<Link href={item.value} />}');
    expect(zaiopsBlock).toContain("function OperationsNavigationPanel(");
    expect(zaiopsBlock.match(/<OperationsNavigationPanel/g)).toHaveLength(2);
    expect(zaiopsBlock).not.toContain("event.preventDefault();\n            setActive");
  });

  it("keeps ZAIops navigation density independent of the viewport breakpoint", () => {
    expect(zaiopsBlock).toContain('className="px-1.5 text-body data-[active=true]:text-fg-brand"');
    expect(zaiopsPreview).toContain('className="gap-1 px-1.5 text-body data-[active=true]:text-fg-brand"');
    for (const sourceFile of [zaiopsPreview, zaiopsBlock]) {
      const navigationTriggerClass = sourceFile.match(
        /<NavItemTrigger[\s\S]*?className="([^"]+)"[\s\S]*?<\/NavItemTrigger>/
      )?.[1];
      expect(navigationTriggerClass).not.toContain("h-control-md");
      expect(navigationTriggerClass).not.toContain("max-xl:min-h-11");
    }
  });

  it("gives the collapsed ZAIops hover navigation a bordered floating surface", () => {
    for (const sourceFile of [zaiopsPreview, zaiopsBlock]) {
      expect(sourceFile).toContain('rounded-xl p-0');
      expect(sourceFile).toContain('surfaceClassName="border-[0.5px] border-border-subtle"');
      expect(sourceFile).toContain('surfaceShadow="floating-drop"');
    }
  });

  it("keeps the ZAIops page-header controls and breadcrumb on one 28px row", () => {
    for (const sourceFile of [zaiopsPreview, zaiopsBlock]) {
      expect(sourceFile).toContain('<PageHeader className="h-control-xs py-0 max-sm:flex-row">');
      expect(sourceFile).toContain('<div className="flex h-full min-w-0 items-center gap-2">');
      expect(sourceFile).toContain('<PageHeaderContent icon={Home} className="h-full">');
    }
  });

  it("keeps the embedded ZAIops Sidebar as the positioning context for its panel", () => {
    expect(zaiopsBlock).toContain('className="relative h-full"');
  });

  it("keeps vertical menu focus rings inside scrollable navigation bounds", () => {
    expect(navMenu).toContain('"min-w-0 max-w-full w-full flex-col"');
    expect(navMenu).toContain("left: focusRect.left,");
    expect(navMenu).toContain("width: focusRect.width,");
  });
});
