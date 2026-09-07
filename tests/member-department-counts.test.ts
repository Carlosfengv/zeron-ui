import { describe, expect, it } from "vitest";
import { calculateDepartmentMemberCounts } from "../packages/blocks/src/application/member-department-01/member-department-data";
import type {
  MemberDepartmentDepartment,
  MemberDepartmentMember,
} from "../packages/blocks/src/application/member-department-01/member-department-types";

const departments = [
  {
    id: "root",
    name: "Root",
    memberCount: 999,
    status: "active",
    children: [
      {
        id: "child",
        name: "Child",
        memberCount: 888,
        status: "active",
        children: [{ id: "leaf", name: "Leaf", status: "active" }],
      },
    ],
  },
  { id: "other", name: "Other", status: "active" },
] as const satisfies readonly MemberDepartmentDepartment[];

const member = (
  id: string,
  departmentId: string,
  status: MemberDepartmentMember["status"]
): MemberDepartmentMember => ({
  id,
  name: id,
  email: `${id}@example.com`,
  functionGroup: "Test",
  status,
  departmentId,
  departmentPath: [],
});

describe("department member counts", () => {
  it("derives direct and descendant totals from non-departed members", () => {
    const result = calculateDepartmentMemberCounts(departments, [
      member("root-active", "root", "active"),
      member("child-invited", "child", "invited"),
      member("child-suspended", "child", "suspended"),
      member("leaf-active", "leaf", "active"),
      member("leaf-departed", "leaf", "departed"),
      member("other-active", "other", "active"),
      member("unknown-active", "missing", "active"),
    ]);

    expect(result[0]?.memberCount).toBe(4);
    expect(result[0]?.children?.[0]?.memberCount).toBe(3);
    expect(result[0]?.children?.[0]?.children?.[0]?.memberCount).toBe(1);
    expect(result[1]?.memberCount).toBe(1);
  });

  it("does not mutate or trust supplied legacy totals", () => {
    const result = calculateDepartmentMemberCounts(departments, []);

    expect(result[0]?.memberCount).toBe(0);
    expect(departments[0].memberCount).toBe(999);
  });
});
