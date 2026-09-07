import type {
  MemberDepartmentCountedDepartment,
  MemberDepartmentDepartment,
  MemberDepartmentMember,
} from "./member-department-types";

function calculateDepartmentMemberCounts(
  departments: readonly MemberDepartmentDepartment[],
  members: readonly MemberDepartmentMember[]
): MemberDepartmentCountedDepartment[] {
  const directMemberCounts = new Map<string, number>();

  for (const member of members) {
    if (member.status === "departed") continue;
    directMemberCounts.set(
      member.departmentId,
      (directMemberCounts.get(member.departmentId) ?? 0) + 1
    );
  }

  const countDepartment = (
    department: MemberDepartmentDepartment
  ): MemberDepartmentCountedDepartment => {
    const children = department.children?.map(countDepartment);
    const descendantCount =
      children?.reduce((total, child) => total + child.memberCount, 0) ?? 0;

    return {
      ...department,
      children,
      memberCount:
        (directMemberCounts.get(department.id) ?? 0) + descendantCount,
    };
  };

  return departments.map(countDepartment);
}

export { calculateDepartmentMemberCounts };
