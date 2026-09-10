import type { MouseEvent } from "react";
import type { IconName } from "@zeron/ui/system/icon-context";

export interface AiGatewaySidebarNavigationItem {
  id: string;
  label: string;
  iconName: IconName;
  href?: string;
}
export interface AiGatewaySidebarNavigationGroup {
  id: string;
  label?: string;
  items: readonly AiGatewaySidebarNavigationItem[];
}

export interface AiGatewaySidebarIdentity {
  name: string;
  description?: string;
  avatarLabel?: string;
}

export interface AiGatewaySidebarConfig {
  ariaLabel: string;
  activeItem: string;
  workspace: AiGatewaySidebarIdentity;
  groups: readonly AiGatewaySidebarNavigationGroup[];
  account: AiGatewaySidebarIdentity;
}

export interface AiGatewaySidebarOptions
  extends Partial<Omit<AiGatewaySidebarConfig, "workspace" | "account">> {
  workspace?: Partial<AiGatewaySidebarIdentity>;
  account?: Partial<AiGatewaySidebarIdentity>;
}

export interface AiGatewaySidebarActions {
  onNavigationSelect?: (
    itemId: string,
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
  onWorkspaceSelect?: () => void;
  onAccountSelect?: () => void;
}
