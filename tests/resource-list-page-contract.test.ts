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
const shellSource = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/resource-workspace-shell-01/resource-workspace-shell.tsx"
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
        "resource-workspace-shell-01",
      ]),
    });
    expect(item.files).toHaveLength(2);
  });

  it("shares the application Sidebar and composes the resource page preset", () => {
    expect(source).toContain("<ResourceWorkspaceShell");
    expect(shellSource).toContain(
      '<SidebarProvider defaultOpen breakpointBehavior="collapse">'
    );
    expect(shellSource).toContain('collapsible="icon"');
    expect(shellSource).toContain('width="280px"');
    expect(shellSource).toContain('{ value: "ai-distribution", label: "AI 能力分发" }');
    expect(shellSource).toContain('{ value: "ai-governance", label: "AI 安全治理" }');
    expect(shellSource).toContain('{ value: "organization", label: "组织与成员" }');
    expect(shellSource).toContain('{ value: "infrastructure", label: "基础设施" }');
    expect(shellSource).toContain("<SidebarGroupLabel>{group.label}</SidebarGroupLabel>");
    expect(shellSource).toContain("<DropdownMenu>");
    expect(shellSource).toContain(
      '<SidebarHeader className="space-y-1 px-2 py-1.5">'
    );
    expect(shellSource).toContain(
      '<div className="flex min-w-0 items-center gap-1">'
    );
    expect(shellSource).toContain('primary={workspace.name}');
    expect(shellSource).toContain('trailing={<ChevronDown aria-hidden className="size-4" />}');
    expect(shellSource).toContain('Z\n                      </SidebarIdentityAvatar>');
    expect(shellSource).toContain('checked={item.id === workspace.id}');
    expect(shellSource).toContain("<SidebarAccountMenu");
    expect(shellSource).toContain('primary={accountName}');
    expect(shellSource).toContain('description={accountEmail}');
    expect(shellSource).toMatch(
      /<SidebarTrigger\s+className="shrink-0 group-data-\[state=collapsed\]\/sidebar:hidden"\s+label="收起管理后台导航"\s+size="xs"\s+\/>/
    );
    expect(shellSource).toMatch(
      /<SidebarTrigger[\s\S]*?className="hidden shrink-0 group-data-\[state=collapsed\]\/sidebar:inline-flex"[\s\S]*?icon=\{[\s\S]*?<SidebarIdentityAvatar className="rounded-lg" tone="brand">[\s\S]*?Z[\s\S]*?<\/SidebarIdentityAvatar>[\s\S]*?label="展开管理后台导航"[\s\S]*?\/>/
    );
    expect(source).toContain("<PageSubnav");
    expect(source).toContain('<PageBody className="max-w-[1620px] p-4"');
    expect(source).toContain("<ResourceListTable");
    expect(source).toContain('surface="plain"');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(shellSource).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("keeps data, navigation, and business actions replaceable", () => {
    expect(source).toContain("resources?: readonly ResourceListItem[]");
    expect(source).toContain(
      'extends Omit<ResourceWorkspaceShellProps, "children">'
    );
    expect(shellSource).toContain(
      "navigation?: readonly ResourceWorkspaceNavigationItem[]"
    );
    expect(shellSource).toContain(
      "navigationGroups?: readonly ResourceWorkspaceNavigationGroup[]"
    );
    expect(shellSource).toContain(
      "workspaces?: readonly (ResourceWorkspace | string)[]"
    );
    expect(shellSource).toContain("onWorkspaceChange?: (workspaceId: string) => void");
    expect(shellSource).toContain("workspaceId?: string");
    expect(shellSource).toContain("onNavigationSelect?: (value: string) => void");
    expect(shellSource).toContain(
      "onAccountAction?: (action: ResourceWorkspaceAccountAction) => void"
    );
    expect(shellSource).toContain("accountSections?: SidebarAccountMenuSection[]");
    expect(source).toContain("onSectionChange?: (value: ResourceListPageSection) => void");
    expect(source).toContain("onCreate?: () => void");
    expect(source).toContain("onEdit?: (resource: ResourceListItem) => void");
    expect(source).toContain("onRefresh?: () => void");
    expect(source).toContain("renderBulkActions?: (");
    expect(source).toContain("tableProps?: Omit<");
    expect(source).toContain(
      "sectionContent?: Partial<Record<ResourceListPageSection, ReactNode>>"
    );
    expect(shellSource).toContain("href={item.href ?? `#${item.value}`}");
    expect(source).toContain("key={workspace.id}");
  });
});
