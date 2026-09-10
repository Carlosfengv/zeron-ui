"use client";

import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import {
  NavItem,
  NavItemContent,
  NavItemLabel,
  NavItemLeading,
  NavItemTrigger,
} from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import {
  SidebarAccountMenu,
  type SidebarAccountMenuSection,
} from "@zeron/ui/sidebar-account-menu";
import {
  SidebarIdentityAvatar,
  SidebarIdentityRow,
} from "@zeron/ui/sidebar-identity-row";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@zeron/ui/sidebar";
import {
  type IconName,
  useIcon,
} from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";

export type ResourceWorkspaceAccountAction =
  | "profile"
  | "settings"
  | "sign-out";

export interface ResourceWorkspaceNavigationItem {
  value: string;
  label: string;
  iconName: IconName;
  href?: string;
  group?: string;
}

export interface ResourceWorkspaceNavigationGroup {
  value: string;
  label?: string;
}

export interface ResourceWorkspace {
  id: string;
  name: string;
  description?: string;
}

export interface ResourceWorkspaceShellContext {
  workspace: ResourceWorkspace;
}

export interface ResourceWorkspaceShellProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children:
    | ReactNode
    | ((context: ResourceWorkspaceShellContext) => ReactNode);
  workspaceId?: string;
  defaultWorkspaceId?: string;
  /** @deprecated Prefer workspaceId with object-based workspaces. */
  workspaceName?: string;
  /** @deprecated Prefer defaultWorkspaceId with object-based workspaces. */
  defaultWorkspaceName?: string;
  workspaces?: readonly (ResourceWorkspace | string)[];
  workspaceAvatar?: ReactNode;
  accountName?: string;
  accountEmail?: string;
  accountAvatar?: ReactNode;
  accountSections?: SidebarAccountMenuSection[];
  navigation?: readonly ResourceWorkspaceNavigationItem[];
  navigationGroups?: readonly ResourceWorkspaceNavigationGroup[];
  activeNavigation?: string;
  navigationLabel?: string;
  onNavigationSelect?: (value: string) => void;
  onWorkspaceChange?: (workspaceId: string) => void;
  onAccountAction?: (action: ResourceWorkspaceAccountAction) => void;
}

export const defaultResourceWorkspaceNavigation = [
  {
    value: "overview",
    label: "概览",
    iconName: "home",
    href: "#overview",
    group: "overview",
  },
  {
    value: "mcp-services",
    label: "MCP 服务",
    iconName: "rocket",
    href: "#mcp-services",
    group: "ai-distribution",
  },
  {
    value: "model-services",
    label: "模型服务",
    iconName: "brain",
    href: "#model-services",
    group: "ai-distribution",
  },
  {
    value: "pii-policies",
    label: "PII 策略",
    iconName: "shield",
    href: "#pii-policies",
    group: "ai-governance",
  },
  {
    value: "session-tasks",
    label: "会话任务",
    iconName: "message-circle",
    href: "#session-tasks",
    group: "ai-governance",
  },
  {
    value: "audit-trace",
    label: "审计追溯",
    iconName: "clock",
    href: "#audit-trace",
    group: "ai-governance",
  },
  {
    value: "execution-records",
    label: "执行记录",
    iconName: "list-checks",
    href: "#execution-records",
    group: "ai-governance",
  },
  {
    value: "functional-groups",
    label: "职能组",
    iconName: "users",
    href: "#functional-groups",
    group: "organization",
  },
  {
    value: "organization-structure",
    label: "组织架构",
    iconName: "square-library",
    href: "#organization-structure",
    group: "organization",
  },
  {
    value: "account-management",
    label: "账号管理",
    iconName: "user",
    href: "#user-account-management",
    group: "organization",
  },
  {
    value: "model-providers",
    label: "模型供应商",
    iconName: "globe",
    href: "#model-providers",
    group: "infrastructure",
  },
] as const satisfies readonly ResourceWorkspaceNavigationItem[];

export const defaultResourceWorkspaceNavigationGroups = [
  { value: "overview" },
  { value: "ai-distribution", label: "AI 能力分发" },
  { value: "ai-governance", label: "AI 安全治理" },
  { value: "organization", label: "组织与成员" },
  { value: "infrastructure", label: "基础设施" },
] as const satisfies readonly ResourceWorkspaceNavigationGroup[];

export const defaultResourceWorkspaces = [
  { id: "carlos", name: "Carlos’s workspace" },
  { id: "design", name: "Design workspace" },
  { id: "engineering", name: "Engineering workspace" },
] as const satisfies readonly ResourceWorkspace[];

function NavigationItemRow({
  item,
  onNavigate,
}: {
  item: ResourceWorkspaceNavigationItem;
  onNavigate: (value: string) => void;
}) {
  const Icon = useIcon(item.iconName);

  return (
    <NavItem value={item.value}>
      <NavItemTrigger
        className="px-2"
        href={item.href ?? `#${item.value}`}
        onClick={() => onNavigate(item.value)}
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

function NavigationItems({
  activeNavigation,
  items,
  label,
  onNavigate,
}: {
  activeNavigation: string;
  items: readonly ResourceWorkspaceNavigationItem[];
  label: string;
  onNavigate: (value: string) => void;
}) {
  return (
    <NavMenu
      activeValue={activeNavigation}
      aria-label={label}
      keyboardNavigation="roving"
    >
      {items.map((item) => (
        <NavigationItemRow
          item={item}
          key={item.value}
          onNavigate={onNavigate}
        />
      ))}
    </NavMenu>
  );
}

function ResourceWorkspaceNavigation({
  accountAvatar,
  accountEmail,
  accountName,
  accountSections,
  activeNavigation,
  navigation,
  navigationGroups,
  onAccountAction,
  onNavigate,
  onWorkspaceChange,
  workspace,
  workspaceAvatar,
  workspaces,
}: {
  accountAvatar?: ReactNode;
  accountEmail: string;
  accountName: string;
  accountSections?: SidebarAccountMenuSection[];
  activeNavigation: string;
  navigation: readonly ResourceWorkspaceNavigationItem[];
  navigationGroups: readonly ResourceWorkspaceNavigationGroup[];
  onAccountAction?: (action: ResourceWorkspaceAccountAction) => void;
  onNavigate: (value: string) => void;
  onWorkspaceChange: (workspaceId: string) => void;
  workspace: ResourceWorkspace;
  workspaceAvatar?: ReactNode;
  workspaces: readonly ResourceWorkspace[];
}) {
  const ChevronDown = useIcon("chevron-down");
  const MoreIcon = useIcon("ellipsis");
  const ProfileIcon = useIcon("user");
  const SettingsIcon = useIcon("settings");
  const resolvedNavigationGroups = [...navigationGroups];
  const configuredGroupValues = new Set(
    resolvedNavigationGroups.map((group) => group.value)
  );

  for (const item of navigation) {
    const groupValue = item.group ?? "overview";
    if (configuredGroupValues.has(groupValue)) continue;

    resolvedNavigationGroups.push({
      value: groupValue,
      label:
        groupValue === "workspace"
          ? "Workspace"
          : groupValue === "manage"
            ? "Manage"
            : undefined,
    });
    configuredGroupValues.add(groupValue);
  }
  const workspaceOptions = workspaces.some((item) => item.id === workspace.id)
    ? workspaces
    : [workspace, ...workspaces];
  const activeWorkspaceIndex = workspaceOptions.findIndex(
    (item) => item.id === workspace.id
  );
  const resolvedAccountSections = accountSections ?? [
    {
      items: [
        {
          id: "profile",
          label: "Profile",
          icon: ProfileIcon,
          onSelect: () => onAccountAction?.("profile"),
        },
        {
          id: "settings",
          label: "Settings",
          icon: SettingsIcon,
          onSelect: () => onAccountAction?.("settings"),
        },
      ],
    },
    {
      items: [
        {
          id: "sign-out",
          label: "Sign out",
          onSelect: () => onAccountAction?.("sign-out"),
        },
      ],
    },
  ];

  return (
    <>
      <SidebarHeader className="space-y-1 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-1">
          <DropdownMenu>
            <DropdownTrigger
              render={
                <SidebarIdentityRow
                  as="button"
                  className="group-data-[state=collapsed]/sidebar:hidden"
                  leading={
                    workspaceAvatar ?? (
                      <SidebarIdentityAvatar
                        className="rounded-lg"
                        tone="brand"
                      >
                        Z
                      </SidebarIdentityAvatar>
                    )
                  }
                  primary={workspace.name}
                  trailing={<ChevronDown aria-hidden className="size-4" />}
                />
              }
            />
            <DropdownContent
              align="start"
              checkedIndex={activeWorkspaceIndex}
              className="!w-60 !min-w-60 !max-w-60"
            >
              {workspaceOptions.map((item, index) => (
                <MenuItem
                  checked={item.id === workspace.id}
                  index={index}
                  key={item.id}
                  label={item.name}
                  onSelect={() => onWorkspaceChange(item.id)}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
          <SidebarTrigger
            className="shrink-0 group-data-[state=collapsed]/sidebar:hidden"
            label="收起管理后台导航"
            size="xs"
          />
          <SidebarTrigger
            className="hidden shrink-0 group-data-[state=collapsed]/sidebar:inline-flex"
            icon={
              workspaceAvatar ?? (
                <SidebarIdentityAvatar className="rounded-lg" tone="brand">
                  Z
                </SidebarIdentityAvatar>
              )
            }
            label="展开管理后台导航"
          />
        </div>
      </SidebarHeader>

      <SidebarContent contentClassName="gap-1 px-2 py-0">
        {resolvedNavigationGroups.map((group) => {
          const items = navigation.filter(
            (item) => (item.group ?? "overview") === group.value
          );
          if (items.length === 0) return null;

          return (
            <SidebarGroup className="py-1" key={group.value}>
              {group.label ? (
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              ) : null}
              <SidebarGroupContent>
                <NavigationItems
                  activeNavigation={activeNavigation}
                  items={items}
                  label={group.label ?? "主要导航"}
                  onNavigate={onNavigate}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarAccountMenu
          avatar={accountAvatar}
          className="group-data-[state=collapsed]/sidebar:px-0 group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-content]]:hidden group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-trailing]]:hidden"
          description={accountEmail}
          primary={accountName}
          sections={resolvedAccountSections}
          triggerTrailing={<MoreIcon aria-hidden className="size-4" />}
        />
      </SidebarFooter>
    </>
  );
}

/** Shared Sidebar Basic workspace shell used by resource list and detail pages. */
export function ResourceWorkspaceShell({
  accountAvatar,
  accountEmail = "wei.feng@zstack.io",
  accountName = "carlos",
  accountSections,
  activeNavigation = "mcp-services",
  children,
  className,
  defaultWorkspaceId,
  defaultWorkspaceName = "Carlos’s workspace",
  navigation = defaultResourceWorkspaceNavigation,
  navigationGroups = defaultResourceWorkspaceNavigationGroups,
  navigationLabel = "管理后台导航",
  onAccountAction,
  onNavigationSelect,
  onWorkspaceChange,
  workspaceAvatar,
  workspaceId,
  workspaceName,
  workspaces = defaultResourceWorkspaces,
  ...props
}: ResourceWorkspaceShellProps) {
  const normalizedWorkspaces = useMemo<ResourceWorkspace[]>(
    () =>
      workspaces.map((workspace) =>
        typeof workspace === "string"
          ? { id: workspace, name: workspace }
          : workspace
      ),
    [workspaces]
  );
  const initialWorkspaceId =
    defaultWorkspaceId ??
    normalizedWorkspaces.find(
      (workspace) => workspace.name === defaultWorkspaceName
    )?.id ??
    normalizedWorkspaces[0]?.id ??
    defaultWorkspaceName;
  const [internalWorkspaceId, setInternalWorkspaceId] =
    useState(initialWorkspaceId);
  const controlledWorkspaceId =
    workspaceId ??
    normalizedWorkspaces.find((workspace) => workspace.name === workspaceName)
      ?.id;
  const currentWorkspaceId = controlledWorkspaceId ?? internalWorkspaceId;
  const currentWorkspace = normalizedWorkspaces.find(
    (workspace) => workspace.id === currentWorkspaceId
  ) ?? {
    id: currentWorkspaceId,
    name: workspaceName ?? currentWorkspaceId,
  };
  const selectWorkspace = (value: string) => {
    if (controlledWorkspaceId === undefined) setInternalWorkspaceId(value);
    onWorkspaceChange?.(value);
  };

  return (
    <SidebarProvider defaultOpen breakpointBehavior="collapse">
      <div
        className={cn(
          "flex h-full min-h-[42rem] w-full min-w-0 overflow-hidden bg-surface-base",
          className
        )}
        {...props}
      >
        <Sidebar
          ariaLabel={navigationLabel}
          className="relative !h-full"
          collapsible="icon"
          mobileWidth="min(280px, calc(100vw - 24px))"
          width="280px"
        >
          <ResourceWorkspaceNavigation
            accountAvatar={accountAvatar}
            accountEmail={accountEmail}
            accountName={accountName}
            accountSections={accountSections}
            activeNavigation={activeNavigation}
            navigation={navigation}
            navigationGroups={navigationGroups}
            onAccountAction={onAccountAction}
            onNavigate={(value) => onNavigationSelect?.(value)}
            onWorkspaceChange={selectWorkspace}
            workspace={currentWorkspace}
            workspaceAvatar={workspaceAvatar}
            workspaces={normalizedWorkspaces}
          />
        </Sidebar>

        {typeof children === "function"
          ? children({ workspace: currentWorkspace })
          : children}
      </div>
    </SidebarProvider>
  );
}
