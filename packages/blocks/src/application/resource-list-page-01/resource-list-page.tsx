"use client";

import { type ReactNode, useState } from "react";
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
import { useIcon } from "@zeron/ui/system/icon-context";
import {
  ResourceListTable,
  type ResourceListItem,
  type ResourceListTableBulkActionContext,
  type ResourceListTableProps,
} from "../resource-list-table-01";
import {
  ResourceWorkspaceShell,
  type ResourceWorkspace,
  type ResourceWorkspaceAccountAction,
  type ResourceWorkspaceNavigationItem,
  type ResourceWorkspaceShellProps,
} from "../resource-workspace-shell-01";

export type ResourceListPageSection = "overview" | "members" | "activity";
export type ResourceListPageAccountAction = ResourceWorkspaceAccountAction;
export type ResourceListPageNavigationItem = ResourceWorkspaceNavigationItem;
export type ResourceListPageWorkspace = ResourceWorkspace;

export interface ResourceListPageProps
  extends Omit<ResourceWorkspaceShellProps, "children"> {
  resources?: readonly ResourceListItem[];
  breadcrumb?: ReactNode;
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
    | "resources"
    | "surface"
    | "onCreate"
    | "onEdit"
    | "onRefresh"
    | "renderBulkActions"
  >;
  sectionContent?: Partial<Record<ResourceListPageSection, ReactNode>>;
  sectionHrefs?: Partial<Record<ResourceListPageSection, string>>;
}

const sectionLabels: Record<ResourceListPageSection, string> = {
  overview: "Overview",
  members: "Members",
  activity: "Activity",
};

const secondarySectionTitles: Record<
  Exclude<ResourceListPageSection, "overview">,
  string
> = {
  members: "Collaborators and roles",
  activity: "Recent project activity",
};

function SecondarySection({
  content,
  section,
}: {
  content?: ReactNode;
  section: Exclude<ResourceListPageSection, "overview">;
}) {
  const Icon = useIcon(section === "members" ? "users" : "clock");

  return (
    <section
      aria-labelledby={`resource-${section}-heading`}
      className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-surface-floating px-6 py-12 text-center shadow-xs"
    >
      {content ?? (
        <>
          <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-surface-raised text-fg-muted">
            <Icon aria-hidden size={18} strokeWidth={1.5} />
          </span>
          <h2
            className="text-title font-semibold text-fg-default"
            id={`resource-${section}-heading`}
          >
            {secondarySectionTitles[section]}
          </h2>
          <p className="mt-1 max-w-md text-body text-fg-muted">
            Supply sectionContent to connect this area to your product data.
          </p>
        </>
      )}
    </section>
  );
}

export function ResourceListPage({
  accountAvatar,
  accountEmail,
  accountName,
  accountSections,
  activeNavigation,
  activeSection,
  breadcrumb,
  className,
  defaultSection = "overview",
  defaultWorkspaceId,
  defaultWorkspaceName,
  navigation,
  navigationLabel,
  onAccountAction,
  onCreate,
  onEdit,
  onNavigationSelect,
  onRefresh,
  onSectionChange,
  onWorkspaceChange,
  renderBulkActions,
  resources = [],
  sectionContent,
  sectionHrefs,
  tableProps,
  workspaceAvatar,
  workspaceId,
  workspaceName,
  workspaces,
  ...props
}: ResourceListPageProps) {
  const [uncontrolledSection, setUncontrolledSection] =
    useState<ResourceListPageSection>(defaultSection);
  const section = activeSection ?? uncontrolledSection;
  const ChevronRightIcon = useIcon("chevron-right");

  const handleSectionChange = (value: ResourceListPageSection) => {
    if (activeSection === undefined) setUncontrolledSection(value);
    onSectionChange?.(value);
  };

  return (
    <ResourceWorkspaceShell
      accountAvatar={accountAvatar}
      accountEmail={accountEmail}
      accountName={accountName}
      accountSections={accountSections}
      activeNavigation={activeNavigation}
      className={className}
      defaultWorkspaceId={defaultWorkspaceId}
      defaultWorkspaceName={defaultWorkspaceName}
      navigation={navigation}
      navigationLabel={navigationLabel}
      onAccountAction={onAccountAction}
      onNavigationSelect={onNavigationSelect}
      onWorkspaceChange={onWorkspaceChange}
      workspaceAvatar={workspaceAvatar}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      workspaces={workspaces}
      {...props}
    >
      {({ workspace }) => (
        <PageLayout className="h-full min-w-0 flex-1">
          <PageHeader>
            <PageHeaderContent className="min-w-0 gap-1.5 text-label text-fg-muted">
              {breadcrumb ?? (
                <>
                  <span>{workspace.name}</span>
                  <ChevronRightIcon aria-hidden size={14} strokeWidth={1.5} />
                  <span className="text-fg-default">Resources</span>
                </>
              )}
            </PageHeaderContent>
          </PageHeader>

          <PageContent>
            <PageSubnav>
              <PageTitle className="px-3 py-2">Resources</PageTitle>
              <PageSubnavList aria-label="Resource sections">
                {(Object.keys(sectionLabels) as ResourceListPageSection[]).map(
                  (item) => (
                    <PageSubnavItem
                      active={section === item}
                      href={sectionHrefs?.[item] ?? `#${item}`}
                      key={item}
                      onClick={(event) => {
                        if (!sectionHrefs?.[item]) event.preventDefault();
                        handleSectionChange(item);
                      }}
                      value={item}
                    >
                      {sectionLabels[item]}
                    </PageSubnavItem>
                  )
                )}
              </PageSubnavList>
            </PageSubnav>

            <PageBody className="max-w-[1620px] p-4">
              {section === "overview" ? (
                sectionContent?.overview ?? (
                  <ResourceListTable
                    key={workspace.id}
                    onCreate={onCreate}
                    onEdit={onEdit}
                    onRefresh={onRefresh}
                    renderBulkActions={renderBulkActions}
                    resources={resources}
                    surface="plain"
                    {...tableProps}
                  />
                )
              ) : (
                <SecondarySection
                  content={sectionContent?.[section]}
                  section={section}
                />
              )}
            </PageBody>
          </PageContent>
        </PageLayout>
      )}
    </ResourceWorkspaceShell>
  );
}
