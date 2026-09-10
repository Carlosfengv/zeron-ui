import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/resource-list-page-01/resource-list-page.tsx"
  ),
  "utf8"
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8")
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8")
);

describe("Resource List Page 1 block contract", () => {
  it("is exported as a complete installable Block", () => {
    expect(packageJson.exports["./resource-list-page-01"]).toBe(
      "./src/application/resource-list-page-01/index.ts"
    );

    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "resource-list-page-01"
    );
    expect(item).toMatchObject({
      type: "registry:block",
      dependencies: ["tw-animate-css", "@tanstack/react-table"],
      registryDependencies: expect.arrayContaining([
        "page-layout",
        "resource-list-table-01",
        "sidebar",
        "sidebar-account-menu",
        "sidebar-identity-row",
        "dropdown",
        "menu-item",
        "nav-menu",
      ]),
    });
    expect(item.files).toHaveLength(2);
  });

  it("owns the application Sidebar and composes the resource page preset", () => {
    expect(source).toContain('<SidebarProvider defaultOpen breakpointBehavior="collapse">');
    expect(source).toContain('collapsible="icon"');
    expect(source).toContain("<SidebarGroupTrigger>Workspace</SidebarGroupTrigger>");
    expect(source).toContain("<SidebarGroupTrigger>Manage</SidebarGroupTrigger>");
    expect(source).toContain("<DropdownMenu>");
    expect(source).toContain('primary={workspace.name}');
    expect(source).toContain('checked={item.id === workspace.id}');
    expect(source).toContain(
      "group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-leading]]:flex-none"
    );
    expect(source).toContain("<SidebarAccountMenu");
    expect(source).toContain('primary={accountName}');
    expect(source).toContain('description={accountEmail}');
    expect(source).toMatch(
      /<SidebarTrigger\s+className="shrink-0"\s+label="Toggle resource sidebar"\s+\/>/
    );
    expect(source).toContain("<PageSubnav");
    expect(source).toContain('<PageBody className="max-w-[1620px] p-4"');
    expect(source).toContain("<ResourceListTable");
    expect(source).toContain('surface="plain"');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("keeps data, navigation, and business actions replaceable", () => {
    expect(source).toContain("resources?: readonly ResourceListItem[]");
    expect(source).toContain("navigation?: readonly ResourceListPageNavigationItem[]");
    expect(source).toContain(
      "workspaces?: readonly (ResourceListPageWorkspace | string)[]"
    );
    expect(source).toContain("onWorkspaceChange?: (workspaceId: string) => void");
    expect(source).toContain("workspaceId?: string");
    expect(source).toContain("onNavigationSelect?: (value: string) => void");
    expect(source).toContain("onAccountAction?: (action: ResourceListPageAccountAction) => void");
    expect(source).toContain("accountSections?: SidebarAccountMenuSection[]");
    expect(source).toContain("onSectionChange?: (value: ResourceListPageSection) => void");
    expect(source).toContain("onCreate?: () => void");
    expect(source).toContain("onEdit?: (resource: ResourceListItem) => void");
    expect(source).toContain("onRefresh?: () => void");
    expect(source).toContain("renderBulkActions?: (");
    expect(source).toContain("tableProps?: Omit<");
    expect(source).toContain(
      "sectionContent?: Partial<Record<ResourceListPageSection, ReactNode>>"
    );
    expect(source).toContain("href={item.href ?? `#${item.value}`}");
    expect(source).toContain("key={currentWorkspace.id}");
  });
});
