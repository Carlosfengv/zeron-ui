import type { ComponentPropsWithoutRef } from "react";
import type { OrganizationNode } from "@zeron/ui/member-tree";

export type MemberDepartmentStatus =
  | "active"
  | "invited"
  | "suspended"
  | "departed";

export type MemberDepartmentView = "members" | "departments";

export type MemberDepartmentDepartmentStatus = "active" | "disabled";

export interface MemberDepartmentOwner {
  name: string;
  email: string;
  avatarUrl?: string;
}

/** A department row. Children are rendered by the Department view's expandable table. */
export interface MemberDepartmentDepartment {
  /** Stable identifier shared by the department table, member records, and callbacks. */
  id: string;
  name: string;
  /** @deprecated Counts are derived from `members`; supplied values are ignored. */
  memberCount?: number;
  owner?: MemberDepartmentOwner;
  status: MemberDepartmentDepartmentStatus;
  children?: readonly MemberDepartmentDepartment[];
}

export type MemberDepartmentCountedDepartment = Omit<
  MemberDepartmentDepartment,
  "children" | "memberCount"
> & {
  /** Computed total of non-departed direct and descendant members. */
  memberCount: number;
  children?: readonly MemberDepartmentCountedDepartment[];
};

export interface MemberDepartmentMember {
  /** Stable identifier used for table rows and action callbacks. */
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  functionGroup: string;
  phone?: string;
  status: MemberDepartmentStatus;
  /** Department identifier must match a department node's `departmentId`. */
  departmentId: string;
  /** Human-readable ancestry used in search and table display. */
  departmentPath: readonly string[];
  leftAt?: string;
}

export interface MemberDepartmentLabels {
  ariaLabel: string;
  memberTab: string;
  departmentTab: string;
  departedTab: string;
  departmentTree: string;
  openDepartmentTree: string;
  createDepartment: string;
  searchPlaceholder: string;
  statusFilter: string;
  createMember: string;
  name: string;
  functionGroup: string;
  phone: string;
  status: string;
  department: string;
  departmentName: string;
  departmentOwner: string;
  departmentMemberCount: string;
  departmentDetails: string;
  departmentMembers: string;
  openDepartmentDetails: string;
  departmentSearchPlaceholder: string;
  departmentMemberSearchPlaceholder: string;
  addMember: string;
  active: string;
  invited: string;
  suspended: string;
  departed: string;
  empty: string;
}

export interface MemberDepartmentProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  /** Replaces the sample member directory. Departed members remain available for a future departed view. */
  members?: readonly MemberDepartmentMember[];
  /** Replaces the department hierarchy used to scope the member table. */
  departments?: readonly OrganizationNode[];
  /** Replaces the expandable department directory and its details panel. */
  departmentDirectory?: readonly MemberDepartmentDepartment[];
  /** Controls the visible workspace. The departed-member view remains outside this block's scope. */
  view?: MemberDepartmentView;
  /** Initial workspace when `view` is uncontrolled. */
  defaultView?: MemberDepartmentView;
  /** Overrides block copy for localization or product terminology. */
  labels?: Partial<MemberDepartmentLabels>;
  /** Shows the shared table loading state while member data is being fetched. */
  isLoading?: boolean;
  onCreateMember?: () => void;
  onCreateDepartment?: () => void;
  onMemberOpen?: (member: MemberDepartmentMember) => void;
  onDepartmentSelect?: (departmentId: string | null) => void;
  onDepartmentOpen?: (department: MemberDepartmentCountedDepartment) => void;
  onDepartmentExpand?: (
    department: MemberDepartmentCountedDepartment,
    expanded: boolean
  ) => void;
  onViewChange?: (view: MemberDepartmentView) => void;
}
