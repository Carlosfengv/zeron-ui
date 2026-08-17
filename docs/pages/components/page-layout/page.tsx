"use client";

import { useState } from "react";
import {
  PageBody,
  PageAside,
  PageColumns,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageLayout,
  PageSidebar,
  PagePrimary,
  PageSubnav,
  PageSubnavItem,
  PageSubnavList,
  PageTitle,
} from "@zeron/ui/page-layout";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useIcon } from "@zeron/icons/context";

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

const sidebarCode = `<PageLayout className="h-[32rem]">
  <PageSidebar width="200px" aria-label="Catalog filters">
    <nav>...</nav>
  </PageSidebar>
  <PageContent>
    <PageBody>...</PageBody>
  </PageContent>
</PageLayout>`;

const columnsCode = `<PageColumns asideWidth="24rem" columnsAt="xl">
  <PageAside aria-label="Quickstart">...</PageAside>
  <PagePrimary>...</PagePrimary>
</PageColumns>`;

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
        <section aria-live="polite" className="rounded-lg bg-muted p-4">
          <PageTitle className="text-title">{section.label}</PageTitle>
          <PageDescription>{section.description}</PageDescription>
        </section>
      </PageBody>
    </PageContent>
  );
}

function PageSidebarPreview() {
  const SearchIcon = useIcon("search");
  const DatabaseIcon = useIcon("file-spreadsheet");
  const CodeIcon = useIcon("file-text");

  return (
    <PageLayout className="h-[28rem]">
      <PageSidebar aria-label="Catalog filters" className="p-3">
        <div className="flex h-control-md items-center gap-2 rounded-lg bg-hover px-2 text-label text-fg-muted">
          <SearchIcon aria-hidden size={14} />
          <span>Search resources</span>
        </div>
        <nav aria-label="Resource categories" className="mt-4 space-y-1">
          <p className="px-2 text-label text-fg-subtle">Categories</p>
          <a href="#all" className="flex h-control-md items-center justify-between rounded-lg bg-active px-2 text-body text-fg-default">
            All resources <span className="text-label text-fg-muted">24</span>
          </a>
          <a href="#models" className="flex h-control-md items-center gap-2 rounded-lg px-2 text-body text-fg-muted hover:bg-hover hover:text-fg-default">
            <CodeIcon aria-hidden size={14} /> Models
          </a>
          <a href="#mcp" className="flex h-control-md items-center gap-2 rounded-lg px-2 text-body text-fg-muted hover:bg-hover hover:text-fg-default">
            <DatabaseIcon aria-hidden size={14} /> MCP servers
          </a>
        </nav>
      </PageSidebar>
      <PageContent>
        <PageBody className="p-4">
          <p className="text-label text-fg-muted">Catalog results</p>
          <h2 className="mt-1 text-title text-fg-default">A shared content surface</h2>
          <p className="mt-2 max-w-md text-body text-fg-muted">The sidebar owns local filters while the main area remains the page's flexible scroll region.</p>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}

function PageColumnsPreview() {
  return (
    <PageLayout gutter="none" className="h-[22rem] bg-surface-raised p-3">
      <PageContent>
        <PageBody className="p-4">
          <PageColumns asideWidth="11rem" columnsAt="lg">
            <PageAside aria-label="Quickstart" className="rounded-xl border border-border bg-surface-floating p-3">
              <p className="text-title text-fg-default">Quickstart</p>
              <p className="mt-1 text-label text-fg-muted">Appears first in the collapsed reading order.</p>
            </PageAside>
            <PagePrimary className="rounded-xl bg-muted p-3">
              <p className="text-title text-fg-default">Primary content</p>
              <p className="mt-1 text-body text-fg-muted">On desktop this stays in the first grid column, regardless of the Aside-first DOM order.</p>
            </PagePrimary>
          </PageColumns>
        </PageBody>
      </PageContent>
    </PageLayout>
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
    name: "PageSidebar",
    type: 'aside props & { width?: CSSProperties["width"] }',
    default: 'width: "200px"',
    description: "A direct PageLayout child for page-local navigation or filters. It forms one shared surface with PageContent and stacks above it below lg.",
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
    description: "The flexible vertical scroll region. It centers direct page content and constrains its width to 1280px.",
  },
  {
    name: "PageColumns",
    type: 'div props & { asideWidth?: CSSProperties["width"]; columnsAt?: "lg" | "xl" }',
    default: 'asideWidth: "25rem", columnsAt: "lg"',
    description: "A PageBody-local grid. On collapse it keeps DOM order; when expanded PagePrimary is always left and PageAside is right.",
  },
  {
    name: "PagePrimary / PageAside",
    type: "div props / aside props",
    description: "Direct PageColumns children with min-width protection. PageAside retains native complementary-content semantics.",
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
      <DocSection title="Playground">
        <VariantPlayground
          padding="compact"
          variants={[
            {
              value: "subnav",
              label: "With subnavigation",
              code: compositionCode,
              preview: <PageLayout gutter="none" className="h-[28rem]"><PageHeader><PageHeaderContent icon={WorkspaceIcon}><nav aria-label="Breadcrumb" className="text-body text-fg-muted">Workspace / Projects</nav></PageHeaderContent></PageHeader><PageSubnavPreview /></PageLayout>,
            },
            {
              value: "body-only",
              label: "Body only",
              code: bodyOnlyCode,
              preview: <PageLayout gutter="none" className="h-[18rem] bg-surface-raised"><PageContent><PageBody className="rounded-lg bg-muted p-4">A page can omit its separate title area.</PageBody></PageContent></PageLayout>,
            },
            {
              value: "sidebar",
              label: "With sidebar",
              code: sidebarCode,
              preview: <PageSidebarPreview />,
            },
            {
              value: "columns",
              label: "Primary with aside",
              code: columnsCode,
              preview: <PageColumnsPreview />,
            },
          ]}
        />
      </DocSection>

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
              <PageBody className="rounded-lg bg-muted p-4">A page can omit its separate title area.</PageBody>
            </PageContent>
          </PageLayout>
        </ComponentPreview>
      </DocSection>
      <DocSection title="Sidebar content layout">
        <ComponentPreview code={sidebarCode} padding="compact">
          <PageSidebarPreview />
        </ComponentPreview>
      </DocSection>
      <DocSection title="Primary with aside">
        <ComponentPreview code={columnsCode} padding="compact">
          <PageColumnsPreview />
        </ComponentPreview>
      </DocSection>
      <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
    </DocPage>
  );
}
