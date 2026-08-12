"use client";

import { useState } from "react";
import {
  PageBody,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageLayout,
  PageSubnav,
  PageSubnavItem,
  PageSubnavList,
  PageTitle,
} from "@/components/ui/page-layout";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { useIcon } from "@/lib/icon-context";

const compositionCode = `<PageLayout gutter="none" className="h-[32rem]">
  <PageHeader>
    <PageHeaderContent icon={WorkspaceIcon}>...</PageHeaderContent>
  </PageHeader>
  <PageContent>
    <PageSubnav aria-label="Project settings">
      <PageSubnavList activeValue="overview">
        <PageSubnavItem value="overview" icon={OverviewIcon}>Overview</PageSubnavItem>
      </PageSubnavList>
    </PageSubnav>
    <PageBody className="grid gap-3">
      <section>...</section>
      <aside>...</aside>
    </PageBody>
  </PageContent>
</PageLayout>`;

const bodyOnlyCode = `<PageLayout gutter="none" className="h-[32rem]">
  <PageContent>
    <PageBody>...</PageBody>
  </PageContent>
</PageLayout>`;

const previewSections = {
  overview: {
    label: "Overview",
    description: "Manage project ownership, status, and core settings.",
  },
  members: {
    label: "Members",
    description: "Invite collaborators and manage project roles.",
  },
  activity: {
    label: "Activity",
    description: "Review recent project changes and events.",
  },
} as const;

function PageSubnavPreview() {
  const [activeSection, setActiveSection] = useState<keyof typeof previewSections>("overview");
  const section = previewSections[activeSection];
  const OverviewIcon = useIcon("home");
  const MembersIcon = useIcon("users");
  const ActivityIcon = useIcon("clock");
  const icons = { overview: OverviewIcon, members: MembersIcon, activity: ActivityIcon };

  return (
    <PageContent>
      <PageSubnav aria-label="Project settings">
        <PageSubnavList activeValue={activeSection}>
          {(Object.entries(previewSections) as [keyof typeof previewSections, (typeof previewSections)[keyof typeof previewSections]][]).map(([value, item]) => (
            <PageSubnavItem
              key={value}
              value={value}
              icon={icons[value]}
              href={`#${value}`}
              onClick={(event) => {
                event.preventDefault();
                setActiveSection(value);
              }}
            >
              {item.label}
            </PageSubnavItem>
          ))}
        </PageSubnavList>
      </PageSubnav>
      <PageBody className="grid gap-3">
        <section aria-live="polite" className="rounded-control bg-muted p-4">
          <PageTitle className="text-title">{section.label}</PageTitle>
          <PageDescription>{section.description}</PageDescription>
        </section>
      </PageBody>
    </PageContent>
  );
}

const props: PropDef[] = [
  {
    name: "size",
    type: '"sm" | "md" | "lg" | "full"',
    default: '"full"',
    description: "Maximum width for the composed page. Defaults to the available width.",
  },
  {
    name: "gutter",
    type: '"default" | "none"',
    default: '"default"',
    description: "Use none for immersive content that owns its own edge spacing.",
  },
  {
    name: "PageHeader",
    type: "header props",
    description: "Optional breadcrumb context above the page's unified content container.",
  },
  {
    name: "PageHeaderContent",
    type: "div props & { icon?: IconComponent }",
    description: "Header content with an optional 20px leading icon and gap-2 spacing.",
  },
  {
    name: "PageContent",
    type: "div props",
    description: "Fills the remaining layout height and stacks optional PageSubnav above its scrolling PageBody.",
  },
  {
    name: "PageBody",
    type: "div props",
    description: "The flexible vertical scroll region. It directly receives page children and does not prescribe their layout.",
  },
  {
    name: "PageSubnav",
    type: "nav props",
    description: "Optional route navigation, fixed above the scrolling body.",
  },
  {
    name: "PageSubnavList",
    type: 'NavMenu props & { labelVisibility?: "all" | "active" }',
    description: "Horizontal segment-style navigation with one-line scrolling overflow.",
  },
  {
    name: "PageSubnavItem",
    type: "anchor props & { value: string; active?: boolean; icon?: IconComponent; label?: string }",
    description: "A route link. Use icon with labelVisibility=active to collapse inactive labels accessibly.",
  },
];

export default function PageLayoutDoc() {
  const WorkspaceIcon = useIcon("home");

  return (
    <DocPage
      title="PageLayout"
      slug="page-layout"
      description="Responsive composition with a breadcrumb context header and one unified content container."
    >
      <DocSection title="Composition">
        <ComponentPreview code={compositionCode} padding="compact">
          <PageLayout gutter="none" className="h-[28rem]">
            <PageHeader>
              <PageHeaderContent icon={WorkspaceIcon}>
                <nav aria-label="Breadcrumb" className="text-body text-fg-muted">Workspace / Projects</nav>
              </PageHeaderContent>
            </PageHeader>
            <PageSubnavPreview />
          </PageLayout>
        </ComponentPreview>
      </DocSection>
      <DocSection title="Body only">
        <ComponentPreview code={bodyOnlyCode} padding="compact">
          <PageLayout gutter="none" className="h-[18rem] bg-surface-raised">
            <PageContent>
              <PageBody className="rounded-control bg-muted p-4">A page can omit its separate title area.</PageBody>
            </PageContent>
          </PageLayout>
        </ComponentPreview>
      </DocSection>
      <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
    </DocPage>
  );
}
