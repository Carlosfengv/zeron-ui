import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("shell and page-layout composition contract", () => {
  const appShell = source("packages/ui/src/components/app-shell.tsx");
  const docsSidebar = source("docs/components/shell/site/sidebar.tsx");
  const navMenu = source("packages/ui/src/components/nav-menu.tsx");
  const navItem = source("packages/ui/src/components/nav-item.tsx");
  const topNav = source("packages/ui/src/components/top-nav.tsx");
  const pageLayout = source("packages/ui/src/components/page-layout.tsx");
  const playground = source("docs/components/playground/playground.tsx");
  const rightPanel = source("docs/components/shell/site/right-panel.tsx");

  it("lets a sidebar main occupy both grid rows when the header slot is absent", () => {
    expect(appShell).toContain(
      '"[&:not(:has(>_[data-slot=app-shell-header]))>_[data-slot=app-shell-main]]:row-span-2"'
    );
  });

  it("owns the base background at the shell while PageContent provides the floating surface", () => {
    expect(appShell).toContain('"min-h-svh min-w-0 bg-surface-base"');
    expect(pageLayout).toContain(
      '"flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-[0.5px] border-border bg-surface-floating rounded-container"'
    );
    expect(pageLayout).not.toContain(
      'cva("mx-auto flex h-full w-full min-h-0 min-w-0 flex-col bg-surface-'
    );
  });

  it("uses floating surfaces for the documentation side rails", () => {
    expect(docsSidebar).toContain('<SurfaceProvider role="floating">');
    expect(docsSidebar).toContain('className="bg-surface-floating"');
    expect(rightPanel).toContain(
      'className="rounded-control border-[0.5px] border-border-subtle bg-surface-floating p-4"'
    );
    expect(rightPanel).toContain('<SurfaceProvider role="floating">');
    expect(rightPanel).not.toContain(
      'className="p-4 rounded-control bg-muted"'
    );
  });

  it("matches playground controls to the documentation settings card", () => {
    expect(playground).toContain('<SurfaceProvider role="floating">');
    expect(playground).toContain(
      'className="w-full rounded-control border-[0.5px] border-border-subtle bg-surface-floating p-4"'
    );
    expect(playground).not.toContain('<SurfaceProvider role="raised">');
    expect(playground).not.toContain(
      'className="w-full rounded-control bg-muted p-3"'
    );
  });

  it("keeps main as the default landmark while allowing embedded previews to opt out", () => {
    expect(appShell).toContain("landmark?: boolean;");
    expect(appShell).toContain("({ landmark = true, className, ...props }, ref) => {");
    expect(appShell).toContain('const Main = landmark ? "main" : "div";');
  });

  it("keeps PageBody as a transparent content boundary", () => {
    expect(pageLayout).toContain('cn("min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain", className)');
    expect(pageLayout).not.toContain("PageAside");
    expect(pageLayout).not.toContain("data-slot=\"page-aside\"");
  });

  it("stacks page navigation and content beneath the breadcrumb header", () => {
    expect(pageLayout).toContain('data-slot="page-content"');
    expect(pageLayout).toContain('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden');
    expect(pageLayout).toContain('cva("mx-auto flex h-full w-full min-h-0 min-w-0 flex-col"');
  });

  it("lets PageHeaderContent add a consistent leading icon without changing its children", () => {
    expect(pageLayout).toContain('icon?: IconComponent;');
    expect(pageLayout).toContain('"flex min-w-0 items-center gap-2"');
    expect(pageLayout).toContain('size={20}');
  });

  it("makes PageBody the scroll boundary below fixed page chrome", () => {
    expect(pageLayout).toContain('"min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"');
    expect(pageLayout).toContain('"min-w-0 shrink-0 border-b border-border p-3"');
  });

  it("keeps PageSubnav as the only navigation landmark while reusing NavMenu", () => {
    expect(navMenu).toContain('as?: "nav" | "div";');
    expect(navMenu).toContain('as: Root = "nav",');
    expect(pageLayout).toContain('data-slot="page-subnav"');
    expect(pageLayout).toContain('className={cn("min-w-0 shrink-0 border-b border-border p-3", className)}');
    expect(pageLayout).toContain('as="div"');
    expect(pageLayout).toContain('orientation="horizontal"');
    expect(pageLayout).toContain('variant="segment"');
    expect(pageLayout).toContain('export type PageSubnavLabelVisibility = "all" | "active";');
    expect(pageLayout).toContain('labelVisibility = "all"');
    expect(pageLayout).toContain('icon: Icon');
    expect(pageLayout).toContain("<NavItem value={value} active={active}>");
  });

  it("offers an explicit no-gutter mode for immersive pages", () => {
    expect(pageLayout).toContain('export type PageLayoutGutter = "default" | "none";');
    expect(pageLayout).toContain('none: "gap-2 p-0"');
  });

  it("keeps the documentation preview interactive without changing route-navigation semantics", () => {
    const docs = source("docs/pages/components/page-layout/page.tsx");
    expect(docs).toContain("function PageSubnavPreview()");
    expect(docs).toContain("event.preventDefault();");
    expect(docs).toContain("setActiveSection(value);");
    expect(docs).toContain('aria-live="polite"');
  });

  it("composes TopNav with a stacked AppShell and a body-only PageLayout", () => {
    const docs = source("docs/pages/components/top-nav/page.tsx");
    expect(docs).toContain("function TopNavAppShellPlayground()");
    expect(docs).toContain('<AppShell\n              layout="stacked"');
    expect(docs).toContain("<AppShellHeader>");
    expect(docs).toContain('<AppShellMain landmark={false} className="flex min-h-0 overflow-hidden">');
    expect(docs).toContain('<PageLayout className="h-full pt-0">');
    expect(docs).toContain("<PageContent>");
    expect(docs).toContain("<PageBody>");
    expect(docs).not.toContain("<PageHeader>");
    expect(docs).toContain("<TopNavAppShellPlayground />");
    expect(docs).toContain('<div className="h-[400px] w-full group-data-[fullscreen=true]/preview-content:h-full">');
    expect(docs).toContain('className="h-full min-h-0 w-full overflow-hidden border-[0.5px] border-border text-body"');
    expect(docs).not.toContain('className="h-[22rem]');
    expect(docs).not.toContain('align="bottom"');
    expect(docs).not.toContain('className="w-full p-4 sm:p-5 group-data-[fullscreen=true]/preview-content:h-full"');
    expect(docs).toContain('padding="none"');
    expect(docs).toContain("<PlaygroundLayout");
    expect(docs).toContain('<PlaygroundPanel\n      title="TopNav"');
    expect(docs).toContain('<PlayField label="Navigation alignment">');
    expect(docs).toContain("<PlaySelect");
    expect(docs).not.toContain('role="group" aria-label="Navigation alignment"');
    expect(docs).not.toContain('className="mt-2 inline-flex gap-1 rounded-control bg-muted p-1"');
  });

  it("aligns TopNav navigation left, center, or right with center as the default", () => {
    expect(topNav).toContain('export type TopNavNavigationAlign = "left" | "center" | "right";');
    expect(topNav).toContain('left: "grid-cols-[auto_minmax(0,1fr)_auto] [&>[data-slot=top-nav-navigation]]:justify-start"');
    expect(topNav).toContain('center: "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] [&>[data-slot=top-nav-navigation]]:justify-center"');
    expect(topNav).toContain('right: "grid-cols-[auto_minmax(0,1fr)_auto] [&>[data-slot=top-nav-navigation]]:justify-end"');
    expect(topNav).toContain('defaultVariants: { variant: "default", navigationAlign: "center" }');
    expect(topNav).toContain('data-navigation-align={navigationAlign ?? "center"}');
    expect(topNav).toContain('topNavVariants({ variant, navigationAlign })');
    expect(topNav).toContain('export type TopNavNavigationProps = ComponentPropsWithoutRef<"div">;');
    expect(topNav).not.toContain("data-align={align}");

    const docs = source("docs/pages/components/top-nav/page.tsx");
    expect(docs).toContain('useState<TopNavNavigationAlign>("center")');
    expect(docs).toContain('<TopNav navigationAlign={navigationAlign} className="w-full px-3 py-1 sm:px-3">');
    expect(docs).not.toContain("<TopNavNavigation align=");
    expect(docs).toContain('type: \'"left" | "center" | "right"\'');
    expect(docs).toContain('default: \'"center"\'');
    expect(docs).toContain('name: "navigationAlign"');
    expect(docs).not.toContain('name: "TopNavNavigation.align"');
  });

  it("keeps the default TopNav transparent with two-pixel item underlines", () => {
    expect(topNav).toContain('default: ""');
    expect(topNav).toContain('variant === "floating" && [');
    expect(navMenu).toContain('"max-w-[calc(100%_+_8px)] overflow-x-auto scrollbar-hide"');
    expect(navMenu).toContain('variant === "underline" ? "gap-3"');
    expect(navMenu).toContain('{variant !== "underline" && isMeasured && activeRect && (');
    expect(navItem).toContain('"h-control-md border-b-2 border-transparent data-[active=true]:border-fg-default"');
  });

  it("offers an optional TopNav dropdown item with a replaceable chevron suffix", () => {
    expect(topNav).toContain("export type TopNavItemMenuProps = PopoverProps;");
    expect(topNav).toContain("export interface TopNavItemMenuTriggerProps");
    expect(topNav).toContain('suffix?: ReactNode;');
    expect(topNav).toContain('const ChevronDown = useIcon("chevron-down");');
    expect(topNav).toContain('render={<button type={type} />}');
    expect(topNav).toContain('suffix !== null');
    expect(topNav).toContain('group-data-[popup-open]/top-nav-menu-trigger:rotate-180');
    expect(topNav).toContain('flex-none gap-1 data-[popup-open]:text-fg-default [&>[data-slot=nav-item-content]]:flex-none');
    expect(topNav).toContain('className={cn("min-w-48 p-1", className)}');

    const docs = source("docs/pages/components/top-nav/page.tsx");
    expect(docs).toContain('const activeMoreSection = moreSections.find(');
    expect(docs).toContain('? demoSections[activeMoreSection].label');
    expect(docs).toContain('<TopNavItemMenuTrigger className="px-1.5">');
    expect(docs).not.toContain('<TopNavItemMenuTrigger className="w-24');
    expect(docs).toContain('<NavItemLabel>{activeMoreLabel}</NavItemLabel>');
    expect(docs).toContain('<TopNavItemMenu open={moreOpen} onOpenChange={setMoreOpen}>');
    expect(docs).toContain('<TopNavItemMenuContent aria-label="更多导航">');
    expect(docs).toContain('label: "API 管理"');
    expect(docs).toContain('label: "使用文档"');
    expect(docs).toContain('label: "更新日志"');
  });

  it("adapts the Zentrix Figma reference with existing project primitives", () => {
    const docs = source("docs/pages/components/top-nav/page.tsx");
    expect(docs).toContain("function ZentrixTopNav(");
    expect(docs).toContain(">Zentrix</strong>");
    expect(docs).toContain(">能力中心</span>");
    expect(docs).toContain('label: "首页"');
    expect(docs).toContain('label: "模型服务"');
    expect(docs).toContain('label: "MCP 广场"');
    expect(docs).toContain('<Button type="button" size="md" variant="neutral" className="px-2">登录</Button>');
    expect(docs).toContain('<ComponentPreview code={code} padding="none">');
    expect(docs).not.toMatch(/#[\da-fA-F]{3,8}\b/);
  });

  it("uses the PageLayout composition as the Sidebar preview's main region", () => {
    const docs = source("docs/pages/components/sidebar/page.tsx");
    expect(docs).toContain("function SidebarPageLayoutPreview()");
    expect(docs).toContain("<SidebarPageLayoutPreview />");
    expect(docs).toContain('<PageLayout className="h-full min-w-0 flex-1">');
    expect(docs).toContain('className="flex h-96 w-full min-w-0 overflow-hidden');
    expect(docs).not.toContain('className="flex h-96 overflow-hidden border border-border');
  });

  it("offers a Sidebar playground for every supported collapse behavior", () => {
    const docs = source("docs/pages/components/sidebar/page.tsx");
    expect(docs).toContain('const collapseModes: SidebarCollapsible[] = ["icon", "offcanvas", "none"]');
    expect(docs).toContain("function SidebarCollapsePlayground()");
    expect(docs).toContain("<SidebarFloatingTrigger");
    expect(docs).toContain('<DocSection title="Collapse playground">');
  });
});
