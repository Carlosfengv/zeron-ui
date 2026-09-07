import type { ComponentPropsWithoutRef } from "react";
import type { OrganizationNode } from "@zeron/ui/member-tree";

export type MemberDepartmentStatus =
  | "active"
  | "invited"
  | "suspended"
  | "departed";

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
  /** Overrides block copy for localization or product terminology. */
  labels?: Partial<MemberDepartmentLabels>;
  /** Shows the shared table loading state while member data is being fetched. */
  isLoading?: boolean;
  onCreateMember?: () => void;
  onCreateDepartment?: () => void;
  onMemberOpen?: (member: MemberDepartmentMember) => void;
  onDepartmentSelect?: (departmentId: string | null) => void;
}
