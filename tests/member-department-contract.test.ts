import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/blocks/src/application/member-department-01/member-department.tsx"),
  "utf8"
);
const types = readFileSync(
  join(ROOT, "packages/blocks/src/application/member-department-01/member-department-types.ts"),
  "utf8"
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8")
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8")
);

describe("Member & Department block contract", () => {
  it("is publicly exported as a data block with every implementation file", () => {
    expect(packageJson.exports["./member-department-01"]).toBe(
      "./src/application/member-department-01/index.ts"
    );
    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "member-department-01"
    );
    expect(item).toMatchObject({
      type: "registry:block",
      dependencies: ["tw-animate-css", "@tanstack/react-table"],
      registryDependencies: [
        "avatar", "badge", "button", "data-table", "icon-context",
        "input-group", "member-tree", "mobile-drawer", "page-layout", "tabs", "utils",
      ],
    });
    expect(item.files).toHaveLength(4);
  });

  it("uses existing primitives and exposes replaceable data and actions", () => {
    expect(source).toContain("<MemberTree");
    expect(source).toContain("<DataTable");
    expect(source).toContain("<Avatar");
    expect(source).toContain("<Tabs");
    expect(source).toContain("<MobileDrawer");
    expect(types).toContain("members?: readonly MemberDepartmentMember[]");
    expect(types).toContain("departments?: readonly OrganizationNode[]");
    expect(types).toContain("onMemberOpen?: (member: MemberDepartmentMember) => void");
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("keeps search, status filtering, department scoping, pagination, and mobile navigation in the block", () => {
    expect(source).toContain("memberSearchFilter");
    expect(source).toContain("statusFilter");
    expect(source).toContain("descendantDepartmentIds");
    expect(source).toContain("DataTableFacetedFilter");
    expect(source).toContain('variant: "multiSelect"');
    expect(source).toContain("table.setPageIndex(0)");
    expect(source).toContain("isDepartmentDrawerOpen");
  });
});
