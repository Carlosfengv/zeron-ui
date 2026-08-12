import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("shell and page-layout composition contract", () => {
  const appShell = source("src/components/ui/app-shell.tsx");
  const navMenu = source("src/components/ui/nav-menu.tsx");
  const pageLayout = source("src/components/ui/page-layout.tsx");

  it("lets a sidebar main occupy both grid rows when the header slot is absent", () => {
    expect(appShell).toContain(
      '"[&:not(:has(>_[data-slot=app-shell-header]))>_[data-slot=app-shell-main]]:row-span-2"'
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
    const docs = source("app/(source)/docs/page-layout/page.tsx");
    expect(docs).toContain("function PageSubnavPreview()");
    expect(docs).toContain("event.preventDefault();");
    expect(docs).toContain("setActiveSection(value);");
    expect(docs).toContain('aria-live="polite"');
  });

  it("uses the PageLayout composition as the Sidebar preview's main region", () => {
    const docs = source("app/(source)/docs/sidebar/page.tsx");
    expect(docs).toContain("function SidebarPageLayoutPreview()");
    expect(docs).toContain("<SidebarPageLayoutPreview />");
    expect(docs).toContain('<PageLayout className="h-full min-w-0 flex-1">');
    expect(docs).toContain('className="flex h-72 w-full min-w-0 overflow-hidden');
    expect(docs).not.toContain('className="flex h-72 overflow-hidden border border-border');
  });
});
