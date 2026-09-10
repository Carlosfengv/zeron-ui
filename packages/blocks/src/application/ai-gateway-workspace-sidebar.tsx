"use client";

import type { MouseEvent } from "react";
import {
  NavItem,
  NavItemContent,
  NavItemLabel,
  NavItemLeading,
  NavItemTrigger,
} from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar,
} from "@zeron/ui/sidebar";
import {
  SidebarIdentityAvatar,
  SidebarIdentityRow,
} from "@zeron/ui/sidebar-identity-row";
import { useIcon } from "@zeron/ui/system/icon-context";
import type {
  AiGatewaySidebarActions,
  AiGatewaySidebarConfig,
  AiGatewaySidebarNavigationItem,
  AiGatewaySidebarOptions,
} from "./ai-gateway-workspace-types";

export const defaultAiGatewaySidebarConfig = {
  ariaLabel: "AI gateway navigation",
  activeItem: "overview",
  workspace: {
    name: "Carlos’s test",
  },
  groups: [
    {
      id: "overview",
      items: [
        { id: "overview", label: "Overview", iconName: "home", href: "#overview" },
      ],
    },
    {
      id: "observability",
      label: "AI capability observability",
      items: [
        { id: "traces", label: "Traces", iconName: "list", href: "#traces" },
        { id: "sessions", label: "Sessions", iconName: "message-circle", href: "#sessions" },
        { id: "logs", label: "Logs", iconName: "file-text", href: "#logs" },
        { id: "mcp", label: "MCP", iconName: "brain", href: "#mcp" },
      ],
    },
    {
      id: "config",
      label: "Config",
      items: [
        { id: "setup", label: "Setup", iconName: "globe", href: "#setup" },
        { id: "api-keys", label: "API keys", iconName: "lock", href: "#api-keys" },
        { id: "settings", label: "Settings", iconName: "settings", href: "#settings" },
      ],
    },
  ],
  account: {
    name: "carlos",
    description: "wei.feng@zstack.io",
    avatarLabel: "C",
  },
} as const satisfies AiGatewaySidebarConfig;

export function resolveAiGatewaySidebarConfig(
  options: AiGatewaySidebarOptions | false | undefined,
  defaultActiveItem: string = defaultAiGatewaySidebarConfig.activeItem,
): AiGatewaySidebarConfig | null {
  if (options === false) return null;

  return {
    ...defaultAiGatewaySidebarConfig,
    ...options,
    activeItem: options?.activeItem ?? defaultActiveItem,
    workspace: {
      ...defaultAiGatewaySidebarConfig.workspace,
      ...options?.workspace,
    },
    groups: options?.groups ?? defaultAiGatewaySidebarConfig.groups,
    account: {
      ...defaultAiGatewaySidebarConfig.account,
      ...options?.account,
    },
  };
}

function GatewayNavigationItem({
  item,
  onSelect,
}: {
  item: AiGatewaySidebarNavigationItem;
  onSelect?: (itemId: string, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const Icon = useIcon(item.iconName);
  const { closeMobile } = useSidebar();

  return (
    <NavItem value={item.id}>
      <NavItemTrigger
        className="px-2"
        href={item.href ?? `#${item.id}`}
        onClick={(event) => {
          onSelect?.(item.id, event);
          closeMobile();
        }}
        tooltip={item.label}
      >
        <NavItemLeading>
          <Icon aria-hidden size={16} strokeWidth={1.5} />
        </NavItemLeading>
        <NavItemContent>
          <NavItemLabel>{item.label}</NavItemLabel>
        </NavItemContent>
      </NavItemTrigger>
    </NavItem>
  );
}

function GatewaySidebarNavigation({
  config,
  onAccountSelect,
  onNavigationSelect,
  onWorkspaceSelect,
}: { config: AiGatewaySidebarConfig } & AiGatewaySidebarActions) {
  const WorkspaceIcon = useIcon("rocket");
  const SwitchIcon = useIcon("chevrons-up-down");
  const MoreIcon = useIcon("ellipsis");

  return (
    <>
      <SidebarHeader className="px-2 py-1.5">
        <SidebarIdentityRow
          as={onWorkspaceSelect ? "button" : "div"}
          className="px-1.5"
          leading={
            <SidebarIdentityAvatar className="rounded-xl bg-inverse-background text-fg-on-inverse">
              {config.workspace.avatarLabel ? config.workspace.avatarLabel : <WorkspaceIcon aria-hidden size={16} strokeWidth={1.5} />}
            </SidebarIdentityAvatar>
          }
          onClick={onWorkspaceSelect}
          primary={config.workspace.name}
          trailing={onWorkspaceSelect ? <SwitchIcon aria-hidden size={14} strokeWidth={1.5} /> : undefined}
          trailingPlacement="edge"
        />
      </SidebarHeader>

      <SidebarContent contentClassName="gap-3 px-2 py-1">
        {config.groups.map((group) => (
          <SidebarGroup key={group.id}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <NavMenu activeValue={config.activeItem} aria-label={group.label ?? config.ariaLabel} keyboardNavigation="roving">
                {group.items.map((item) => (
                  <GatewayNavigationItem item={item} key={item.id} onSelect={onNavigationSelect} />
                ))}
              </NavMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-2 py-1.5">
        <SidebarIdentityRow
          as={onAccountSelect ? "button" : "div"}
          className="px-1.5"
          description={config.account.description}
          leading={<SidebarIdentityAvatar>{config.account.avatarLabel ?? config.account.name.slice(0, 1)}</SidebarIdentityAvatar>}
          onClick={onAccountSelect}
          primary={config.account.name}
          trailing={onAccountSelect ? <MoreIcon aria-hidden size={16} strokeWidth={1.5} /> : undefined}
          trailingPlacement="edge"
        />
      </SidebarFooter>
    </>
  );
}

export function AiGatewayWorkspaceSidebar({
  actions,
  config,
}: {
  actions?: AiGatewaySidebarActions;
  config: AiGatewaySidebarConfig;
}) {
  return (
    <Sidebar
      ariaLabel={config.ariaLabel}
      className="relative !h-full"
      collapsible="offcanvas"
      mobileWidth="min(280px, calc(100vw - 24px))"
      width="280px"
    >
      <GatewaySidebarNavigation config={config} {...actions} />
    </Sidebar>
  );
}
