"use client";

import { forwardRef, useMemo, useState, type ForwardedRef } from "react";
import { Tree } from "#components/tree/tree";
import type { TreeAccessibleName, TreeBaseProps, TreeChangeDetails, TreeNode, TreeProps } from "./tree/tree-types";
import { useIcon } from "#system/icon-context";

type OrganizationBase = {
  key: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  selectable?: boolean;
  keywords?: readonly string[];
};

export type OrganizationNode =
  | (OrganizationBase & {
      type: "department";
      departmentId: string;
      children?: readonly OrganizationNode[];
    })
  | (OrganizationBase & {
      type: "member";
      memberId: string;
      avatarUrl?: string;
      description?: string;
      children?: never;
    });

type MemberSelectionState = {
  selectedKeys?: readonly string[];
  defaultSelectedKeys?: readonly string[];
  onSelectionChange?: (keys: readonly string[], details: TreeChangeDetails<OrganizationNode>) => void;
};

type MemberSelectionProps =
  | (MemberSelectionState & {
      selectionMode?: "multiple";
      selectionIndicator?: "highlight";
      checkStrategy?: "independent";
      selectableTypes?: readonly OrganizationNode["type"][];
    })
  | (MemberSelectionState & {
      selectionMode?: "multiple";
      selectionIndicator: "checkbox";
      checkStrategy?: "independent";
      selectableTypes?: readonly OrganizationNode["type"][];
    })
  | (MemberSelectionState & {
      selectionMode?: "multiple";
      selectionIndicator: "checkbox";
      checkStrategy: "cascade";
      selectableTypes?: readonly "member"[];
    })
  | (MemberSelectionState & {
      selectionMode: "single";
      selectionIndicator?: "highlight";
      checkStrategy?: never;
      selectableTypes?: readonly OrganizationNode["type"][];
    })
  | {
      selectionMode: "none";
      selectionIndicator?: never;
      checkStrategy?: never;
      selectedKeys?: never;
      defaultSelectedKeys?: never;
      onSelectionChange?: never;
      selectableTypes?: readonly OrganizationNode["type"][];
    };

export type MemberTreeProps = Omit<TreeBaseProps<OrganizationNode>, "items" | "selectionScope" | "renderIcon"> & TreeAccessibleName & MemberSelectionProps & {
  items: readonly OrganizationNode[];
};

function MemberAvatar({ avatarUrl, label, User }: { avatarUrl?: string; label: string; User: ReturnType<typeof useIcon> }) {
  const [failed, setFailed] = useState(false);
  const initial = label.trim().slice(0, 1).toLocaleUpperCase();
  if (avatarUrl && !failed) {
    // Tree is framework-agnostic; consumers may supply a remote avatar URL.
    // eslint-disable-next-line @next/next/no-img-element
    return <img aria-hidden src={avatarUrl} alt="" className="size-5 shrink-0 rounded-full object-cover" onError={() => setFailed(true)} />;
  }
  return initial ? <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-medium text-fg-muted">{initial}</span>
    : <span aria-hidden className="grid size-5 shrink-0 place-items-center text-fg-muted"><User size={16} /></span>;
}

function normalizeNodes(
  items: readonly OrganizationNode[],
  selectableTypes: readonly OrganizationNode["type"][],
  seenMemberIds = new Set<string>(),
  seenDepartmentIds = new Set<string>(),
): readonly TreeNode<OrganizationNode>[] {
  return items.map((item) => {
    if (item.type === "member") {
      if (seenMemberIds.has(item.memberId)) throw new Error(`MemberTree memberId \"${item.memberId}\" is duplicated.`);
      seenMemberIds.add(item.memberId);
    } else {
      if (seenDepartmentIds.has(item.departmentId)) throw new Error(`MemberTree departmentId \"${item.departmentId}\" is duplicated.`);
      seenDepartmentIds.add(item.departmentId);
    }
    return {
      key: item.key,
      label: item.label,
      description: item.type === "member" ? item.description : undefined,
      keywords: item.keywords,
      disabled: item.disabled,
      disabledReason: item.disabledReason,
      selectable: item.selectable !== false && selectableTypes.includes(item.type),
      data: item,
      children: item.type === "department" && item.children
        ? normalizeNodes(item.children, selectableTypes, seenMemberIds, seenDepartmentIds)
        : undefined,
    };
  });
}

function MemberTreeInner(
  { items, selectableTypes = ["member"], selectionMode, selectionIndicator, checkStrategy, ...props }: MemberTreeProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const User = useIcon("user");
  const Users = useIcon("users");
  const normalized = useMemo(() => normalizeNodes(items, selectableTypes), [items, selectableTypes]);
  const isInvalidCascade = checkStrategy === "cascade" && selectableTypes.some((type) => type !== "member");
  if (isInvalidCascade) {
    throw new Error("MemberTree cascade selection only supports selectableTypes={[\"member\"]}.");
  }
  const resolvedSelectionMode = selectionMode ?? "multiple";
  const resolvedSelectionIndicator = resolvedSelectionMode === "multiple"
    ? (selectionIndicator ?? "checkbox")
    : resolvedSelectionMode === "single" ? "highlight" : undefined;
  const treeProps = {
    ...props,
    ref,
    items: normalized,
    selectionMode: resolvedSelectionMode,
    selectionIndicator: resolvedSelectionIndicator,
    checkStrategy: resolvedSelectionMode === "multiple" && resolvedSelectionIndicator === "checkbox" ? (checkStrategy ?? "independent") : undefined,
    density: props.density ?? "comfortable",
    renderIcon: ({ node }: { node: TreeNode<OrganizationNode> }) => {
        const item = node.data;
        if (item?.type === "member") return <MemberAvatar avatarUrl={item.avatarUrl} label={item.label} User={User} />;
        const Icon = item?.type === "department" ? Users : User;
        return <span aria-hidden className="grid size-5 shrink-0 place-items-center text-fg-muted"><Icon size={16} /></span>;
    },
  } as TreeProps<OrganizationNode> & { ref: ForwardedRef<HTMLDivElement> };
  return <Tree<OrganizationNode> {...treeProps} />;
}

export const MemberTree = forwardRef(MemberTreeInner);
MemberTree.displayName = "MemberTree";
