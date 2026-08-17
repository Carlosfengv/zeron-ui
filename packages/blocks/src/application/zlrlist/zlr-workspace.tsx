"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useMemo, useState } from "react";
import {
  defaultZlrProtectionGroups,
  type ZlrProtectionGroup,
  ZlrList,
} from "./zlrlist";
import {
  defaultZlrProtectionGroupDetail,
  type ZlrProtectionGroupDetailData,
  ZlrProtectionGroupDetail,
} from "./zlr-protection-group-detail";

export interface ZlrWorkspaceProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  groups?: readonly ZlrProtectionGroup[];
  getGroupDetail?: (group: ZlrProtectionGroup) => ZlrProtectionGroupDetailData;
}

/** A ready-to-preview list/detail flow. Applications can instead route from ZlrList's onGroupOpen callback. */
export function ZlrWorkspace({
  getGroupDetail,
  groups = defaultZlrProtectionGroups,
  ...props
}: ZlrWorkspaceProps) {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? null;
  const detail = useMemo(() => {
    if (!activeGroup) return null;
    return getGroupDetail?.(activeGroup) ?? {
      ...defaultZlrProtectionGroupDetail,
      ...activeGroup,
      description: `${activeGroup.name}，承载上海地区主要业务`,
      updatedAt: activeGroup.createdAt,
    };
  }, [activeGroup, getGroupDetail]);

  if (detail) {
    return <ZlrProtectionGroupDetail {...props} group={detail} onBack={() => setActiveGroupId(null)} />;
  }

  return <ZlrList {...props} groups={groups} onGroupOpen={(group) => setActiveGroupId(group.id)} />;
}
