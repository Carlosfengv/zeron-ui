"use client";

import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import {
  NavItem,
  NavItemContent,
  NavItemLabel,
  NavItemLeading,
  NavItemTrigger,
} from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import {
  SidebarAccountMenu,
  type SidebarAccountMenuSection,
} from "@zeron/ui/sidebar-account-menu";
import {
  SidebarIdentityAvatar,
  SidebarIdentityRow,
} from "@zeron/ui/sidebar-identity-row";
import {
  PageBody,
  PageContent,
  PageHeader,
  PageHeaderContent,
  PageLayout,
  PageSubnav,
  PageSubnavItem,
  PageSubnavList,
  PageTitle,
} from "@zeron/ui/page-layout";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupTrigger,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@zeron/ui/sidebar";
import {
  type IconName,
  useIcon,
} from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import {
  ResourceListTable,
  type ResourceListItem,
  type ResourceListTableBulkActionContext,
  type ResourceListTableProps,
} from "../resource-list-table-01";

export type ResourceListPageSection = "overview" | "members" | "activity";
export type ResourceListPageAccountAction = "profile" | "settings" | "sign-out";

export interface ResourceListPageNavigationItem {
  value: string;
  label: string;
  iconName: IconName;
  href?: string;
  group?: "workspace" | "manage";
}

export interface ResourceListPageWorkspace {
  id: string;
  name: string;
}

export interface ResourceListPageProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  resources?: readonly ResourceListItem[];
  workspaceId?: string;
  defaultWorkspaceId?: string;
  /** @deprecated Prefer workspaceId with object-based workspaces. */
  workspaceName?: string;
  /** @deprecated Prefer defaultWorkspaceId with object-based workspaces. */
  defaultWorkspaceName?: string;
  workspaces?: readonly (ResourceListPageWorkspace | string)[];
  accountName?: string;
  accountEmail?: string;
  accountAvatar?: ReactNode;
  accountSections?: SidebarAccountMenuSection[];
  breadcrumb?: ReactNode;
  navigation?: readonly ResourceListPageNavigationItem[];
  activeNavigation?: string;
  onNavigationSelect?: (value: string) => void;
  onWorkspaceChange?: (workspaceId: string) => void;
  onAccountAction?: (action: ResourceListPageAccountAction) => void;
  activeSection?: ResourceListPageSection;
  defaultSection?: ResourceListPageSection;
  onSectionChange?: (value: ResourceListPageSection) => void;
  onCreate?: () => void;
  onEdit?: (resource: ResourceListItem) => void;
  onRefresh?: () => void;
  renderBulkActions?: (
    context: ResourceListTableBulkActionContext
  ) => ReactNode;
  /** Passes loading, query, localization, permission, and toolbar options through. */
  tableProps?: Omit<
    ResourceListTableProps,
    "resources" | "surface" | "onCreate" | "onEdit" | "onRefresh" | "renderBulkActions"
  >;
  sectionContent?: Partial<Record<ResourceListPageSection, ReactNode>>;
  sectionHrefs?: Partial<Record<ResourceListPageSection, string>>;
}

const defaultNavigation = [
  { value: "projects", label: "Projects", iconName: "file", href: "#projects", group: "workspace" },
  { value: "team", label: "Team", iconName: "users", href: "#team", group: "workspace" },
  { value: "activity", label: "Activity", iconName: "clock", href: "#activity", group: "manage" },
  { value: "settings", label: "Settings", iconName: "settings", href: "#settings", group: "manage" },
] as const satisfies readonly ResourceListPageNavigationItem[];

const defaultWorkspaces = [
  { id: "carlos", name: "Carlos’s workspace" },
  { id: "design", name: "Design workspace" },
  { id: "engineering", name: "Engineering workspace" },
] as const;

const sectionLabels: Record<ResourceListPageSection, string> = {
  overview: "Overview",
  members: "Members",
  activity: "Activity",
};

const secondarySectionTitles: Record<Exclude<ResourceListPageSection, "overview">, string> = {
  members: "Collaborators and roles",
  activity: "Recent project activity",
};

function NavigationItemRow({
  item,
  onNavigate,
}: {
  item: ResourceListPageNavigationItem;
  onNavigate: (value: string) => void;
}) {
  const Icon = useIcon(item.iconName);

  return (
    <NavItem value={item.value}>
      <NavItemTrigger
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
  onNavigate,
}: {
  activeNavigation: string;
  items: readonly ResourceListPageNavigationItem[];
  onNavigate: (value: string) => void;
}) {
  return (
    <NavMenu activeValue={activeNavigation} keyboardNavigation="roving">
      {items.map((item) => (
        <NavigationItemRow item={item} key={item.value} onNavigate={onNavigate} />
      ))}
    </NavMenu>
  );
}

function ResourceNavigation({
  accountAvatar,
  accountEmail,
  accountName,
  accountSections,
  activeNavigation,
  navigation,
  onAccountAction,
  onNavigate,
  onWorkspaceChange,
  workspace,
  workspaces,
}: {
  accountAvatar?: ReactNode;
  accountEmail: string;
  accountName: string;
  accountSections?: SidebarAccountMenuSection[];
  activeNavigation: string;
  navigation: readonly ResourceListPageNavigationItem[];
  onAccountAction?: (action: ResourceListPageAccountAction) => void;
  onNavigate: (value: string) => void;
  onWorkspaceChange: (workspaceId: string) => void;
  workspace: ResourceListPageWorkspace;
  workspaces: readonly ResourceListPageWorkspace[];
}) {
  const ChevronDownIcon = useIcon("chevron-down");
  const MoreIcon = useIcon("ellipsis");
  const ProfileIcon = useIcon("user");
  const SettingsIcon = useIcon("settings");
  const workspaceItems = navigation.filter(
    (item, index) =>
      (item.group ?? (index < 2 ? "workspace" : "manage")) === "workspace"
  );
  const manageItems = navigation.filter(
    (item, index) =>
      (item.group ?? (index < 2 ? "workspace" : "manage")) === "manage"
  );
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
      <SidebarHeader className="flex flex-row items-center gap-1 group-data-[state=collapsed]/sidebar:flex-col">
        <DropdownMenu>
          <DropdownTrigger
            render={
              <SidebarIdentityRow
                as="button"
                className="min-w-0 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0 group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-content-row]]:justify-center group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-leading]]:flex-none group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-content]]:hidden group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-trailing]]:hidden"
                leading={<SidebarIdentityAvatar className="rounded-lg" tone="brand">W</SidebarIdentityAvatar>}
                primary={workspace.name}
                trailing={<ChevronDownIcon aria-hidden className="size-4" />}
                trailingPlacement="edge"
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
          className="shrink-0"
          label="Toggle resource sidebar"
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup collapsible defaultOpen>
          <SidebarGroupTrigger>Workspace</SidebarGroupTrigger>
          <SidebarGroupContent>
            <NavigationItems
              activeNavigation={activeNavigation}
              items={workspaceItems}
              onNavigate={onNavigate}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup collapsible defaultOpen>
          <SidebarGroupTrigger>Manage</SidebarGroupTrigger>
          <SidebarGroupContent>
            <NavigationItems
              activeNavigation={activeNavigation}
              items={manageItems}
              onNavigate={onNavigate}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[state=collapsed]/sidebar:p-2">
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

/** The Sidebar Basic layout with its project overview replaced by a resource DataTable. */
export function ResourceListPage({
  accountAvatar,
  accountEmail = "wei.feng@zstack.io",
  accountName = "Carlos Feng",
  accountSections,
  activeNavigation = "projects",
  activeSection,
  breadcrumb = "Workspace / Projects",
  className,
  defaultWorkspaceId,
  defaultWorkspaceName = "Carlos’s workspace",
  defaultSection = "overview",
  navigation = defaultNavigation,
  onCreate,
  onEdit,
  onAccountAction,
  onNavigationSelect,
  onRefresh,
  onSectionChange,
  onWorkspaceChange,
  renderBulkActions,
  resources,
  sectionContent,
  sectionHrefs,
  tableProps,
  workspaceId,
  workspaceName,
  workspaces = defaultWorkspaces,
  ...props
}: ResourceListPageProps) {
  const [internalSection, setInternalSection] = useState(defaultSection);
  const normalizedWorkspaces = useMemo<ResourceListPageWorkspace[]>(
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
    normalizedWorkspaces.find((workspace) => workspace.name === defaultWorkspaceName)
      ?.id ??
    normalizedWorkspaces[0]?.id ??
    defaultWorkspaceName;
  const [internalWorkspaceId, setInternalWorkspaceId] =
    useState(initialWorkspaceId);
  const currentSection = activeSection ?? internalSection;
  const controlledWorkspaceId =
    workspaceId ??
    normalizedWorkspaces.find((workspace) => workspace.name === workspaceName)?.id;
  const currentWorkspaceId = controlledWorkspaceId ?? internalWorkspaceId;
  const currentWorkspace = normalizedWorkspaces.find(
    (workspace) => workspace.id === currentWorkspaceId
  ) ?? {
    id: currentWorkspaceId,
    name: workspaceName ?? currentWorkspaceId,
  };
  const WorkspaceIcon = useIcon("home");
  const OverviewIcon = useIcon("home");
  const MembersIcon = useIcon("users");
  const ActivityIcon = useIcon("clock");
  const sectionIcons = {
    overview: OverviewIcon,
    members: MembersIcon,
    activity: ActivityIcon,
  };
  const selectSection = (value: ResourceListPageSection) => {
    if (activeSection === undefined) setInternalSection(value);
    onSectionChange?.(value);
  };
  const selectWorkspace = (value: string) => {
    if (controlledWorkspaceId === undefined) setInternalWorkspaceId(value);
    onWorkspaceChange?.(value);
  };
  const customSectionContent = sectionContent?.[currentSection];

  return (
    <SidebarProvider defaultOpen breakpointBehavior="collapse">
      <div
        className={cn(
          "flex h-full min-h-[42rem] w-full min-w-0 overflow-hidden bg-surface-base",
          className
        )}
        {...props}
      >
        <Sidebar ariaLabel="Resource navigation" className="relative !h-full" collapsible="icon">
          <ResourceNavigation
            accountAvatar={accountAvatar}
            accountEmail={accountEmail}
            accountName={accountName}
            accountSections={accountSections}
            activeNavigation={activeNavigation}
            navigation={navigation}
            onAccountAction={onAccountAction}
            onNavigate={(value) => onNavigationSelect?.(value)}
            onWorkspaceChange={selectWorkspace}
            workspace={currentWorkspace}
            workspaces={normalizedWorkspaces}
          />
        </Sidebar>

        <PageLayout className="h-full min-w-0 flex-1">
          <PageHeader>
            <PageHeaderContent icon={WorkspaceIcon}>
              <nav aria-label="Breadcrumb" className="text-body text-fg-muted">
                {breadcrumb}
              </nav>
            </PageHeaderContent>
          </PageHeader>

          <PageContent>
            <PageSubnav aria-label="Project settings">
              <PageSubnavList activeValue={currentSection}>
                {(Object.keys(sectionLabels) as ResourceListPageSection[]).map((value) => (
                  <PageSubnavItem
                    href={sectionHrefs?.[value] ?? `#${value}`}
                    icon={sectionIcons[value]}
                    key={value}
                    onClick={() => selectSection(value)}
                    value={value}
                  >
                    {sectionLabels[value]}
                  </PageSubnavItem>
                ))}
              </PageSubnavList>
            </PageSubnav>

            <PageBody className="max-w-[1620px] p-4" id={currentSection}>
              {customSectionContent !== undefined ? (
                customSectionContent
              ) : currentSection === "overview" ? (
                <ResourceListTable
                  {...tableProps}
                  key={currentWorkspace.id}
                  onCreate={onCreate}
                  onEdit={onEdit}
                  onRefresh={onRefresh}
                  renderBulkActions={renderBulkActions}
                  resources={resources}
                  surface="plain"
                />
              ) : (
                <PageTitle className="text-title">
                  {secondarySectionTitles[currentSection]}
                </PageTitle>
              )}
            </PageBody>
          </PageContent>
        </PageLayout>
      </div>
    </SidebarProvider>
  );
}
