"use client";

import { useMemo, useState } from "react";
import {
  defaultResourceListItems,
  ResourceListTable,
} from "@zeron/blocks/resource-list-table-01";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Input } from "@zeron/ui/input";
import { ResourceListLayout } from "@zeron/ui/resource-list-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zeron/ui/table";
import { AgentGuide } from "@docs/components/content/AgentGuide";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";

const resources = [
  { id: "res_01", name: "Production API", owner: "Platform", status: "Enabled" },
  { id: "res_02", name: "Billing events", owner: "Finance", status: "Enabled" },
  { id: "res_03", name: "Support archive", owner: "Support", status: "Draft" },
  { id: "res_04", name: "Analytics export", owner: "Data", status: "Enabled" },
  { id: "res_05", name: "Model registry", owner: "AI", status: "Draft" },
  { id: "res_06", name: "Audit stream", owner: "Security", status: "Enabled" },
] as const;

const standardCode = `import { useMemo, useState } from "react";
import { ResourceListLayout } from "@zeron/ui/resource-list-layout";
import { Button } from "@zeron/ui/button";
import { Input } from "@zeron/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";

const demoResources = [
  { id: "res_01", name: "Production API", owner: "Platform" },
  { id: "res_02", name: "Billing events", owner: "Finance" },
  { id: "res_03", name: "Support archive", owner: "Support" },
];

export function ResourcesPage({ onCreate }: { onCreate: () => void }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const filtered = useMemo(
    () => demoResources.filter((resource) => resource.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const pageSize = 2;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleResources = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <ResourceListLayout
      title="Resources"
      description="Review and manage connected resources."
      actions={<Button onClick={onCreate}>Create resource</Button>}
      toolbar={
        <Input
          aria-label="Search resources"
          className="max-w-sm"
          onChange={(event) => { setQuery(event.target.value); setPage(0); }}
          placeholder="Search resources"
          value={query}
        />
      }
      summary={<p>{filtered.length} resources</p>}
      pagination={
        <>
          <span>Page {currentPage + 1} of {pageCount}</span>
          <Button disabled={currentPage === 0} onClick={() => setPage((value) => value - 1)} variant="secondary">Previous</Button>
          <Button disabled={currentPage >= pageCount - 1} onClick={() => setPage((value) => value + 1)} variant="secondary">Next</Button>
        </>
      }
    >
      <div className="min-w-0 overflow-x-auto">
        <Table className="min-w-[32rem]">
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Owner</TableHead></TableRow></TableHeader>
          <TableBody>
            {visibleResources.map((resource, index) => (
              <TableRow index={index} key={resource.id}>
                <TableCell>{resource.name}</TableCell><TableCell>{resource.owner}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ResourceListLayout>
  );
}`;

const blockCode = `import { ResourceListTable } from "@zeron/blocks/resource-list-table-01";
import type { ResourceListItem } from "@zeron/blocks/resource-list-table-01";
import { Button } from "@zeron/ui/button";
import { ResourceListLayout } from "@zeron/ui/resource-list-layout";

interface ResourceInventoryPageProps {
  resources: readonly ResourceListItem[];
  onCreate: () => void;
  onEdit: (resource: ResourceListItem) => void;
  onRefresh: () => void;
}

export function ResourceInventoryPage({ resources, onCreate, onEdit, onRefresh }: ResourceInventoryPageProps) {
  return (
    <ResourceListLayout
      title="Resources"
      description="Review and manage connected resources."
      actions={<Button onClick={onCreate}>Create resource</Button>}
    >
      <ResourceListTable
        resources={resources}
        surface="plain"
        showCreateAction={false}
        onEdit={onEdit}
        onRefresh={onRefresh}
      />
    </ResourceListLayout>
  );
}`;

const props: PropDef[] = [
  { name: "title", type: "string", description: "Required page title rendered as the layout's single h1." },
  { name: "description", type: "ReactNode", description: "Optional supporting copy below the title." },
  { name: "actions", type: "ReactNode", description: "Page-level actions, usually including the primary create action." },
  { name: "toolbar", type: "ReactNode", description: "Caller-owned search, filters, and list-level controls kept above the scrolling body." },
  { name: "summary", type: "ReactNode", description: "Optional list context or statistics that scroll with the results." },
  { name: "children", type: "ReactNode", description: "The list, table, cards, or caller-owned state content." },
  { name: "pagination", type: "ReactNode", description: "Caller-owned pagination kept outside the scrolling body." },
  { name: "size", type: '"sm" | "md" | "lg" | "full"', default: '"full"', description: "PageLayout width preset." },
  { name: "gutter", type: '"default" | "none"', default: '"default"', description: "PageLayout outer gutter preset." },
];

function StandardResourceListPreview() {
  const [query, setQuery] = useState("");
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 3;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return resources.filter(
      (resource) =>
        (!enabledOnly || resource.status === "Enabled") &&
        (!normalized || resource.name.toLowerCase().includes(normalized))
    );
  }, [enabledOnly, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleResources = filtered.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize
  );

  return (
    <ResourceListLayout
      className="h-[34rem]"
      title="Resources"
      description="Review and manage connected resources."
      actions={<Button type="button">Create resource</Button>}
      toolbar={
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2">
          <Input
            aria-label="Search resources"
            className="min-w-48 flex-1 sm:max-w-sm"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Search resources"
            value={query}
          />
          <Button
            active={enabledOnly}
            aria-pressed={enabledOnly}
            onClick={() => {
              setEnabledOnly((value) => !value);
              setPage(0);
            }}
            type="button"
            variant="secondary"
          >
            Enabled only
          </Button>
        </div>
      }
      summary={
        <p aria-live="polite" className="text-label text-fg-muted">
          {filtered.length} matching resources
        </p>
      }
      pagination={
        <>
          <span className="mr-auto text-label text-fg-muted">
            Page {currentPage + 1} of {pageCount}
          </span>
          <Button
            disabled={currentPage === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            type="button"
            variant="secondary"
          >
            Previous
          </Button>
          <Button
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
            type="button"
            variant="secondary"
          >
            Next
          </Button>
        </>
      }
    >
      <div className="min-w-0 overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[32rem]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleResources.length > 0 ? (
              visibleResources.map((resource, index) => (
                <TableRow index={index} key={resource.id}>
                  <TableCell className="font-medium text-fg-default">{resource.name}</TableCell>
                  <TableCell>{resource.owner}</TableCell>
                  <TableCell>
                    <Badge color={resource.status === "Enabled" ? "green" : "gray"} size="sm" variant="dot">
                      {resource.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="py-8 text-center" colSpan={3}>
                  No resources match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ResourceListLayout>
  );
}

function ResourceListBlockPreview() {
  const [message, setMessage] = useState("Ready");

  return (
    <ResourceListLayout
      className="h-[38rem]"
      title="Resources"
      description="The data block owns its toolbar and pagination in this compatibility recipe."
      actions={
        <Button onClick={() => setMessage("Create flow opened")} type="button">
          Create resource
        </Button>
      }
      summary={<p aria-live="polite" className="text-label text-fg-muted">{message}</p>}
    >
      <ResourceListTable
        onEdit={(resource) => setMessage(`Opened ${resource.name}`)}
        onRefresh={() => setMessage("Resources refreshed")}
        resources={defaultResourceListItems}
        showCreateAction={false}
        surface="plain"
      />
    </ResourceListLayout>
  );
}

export default function ResourceListLayoutDoc() {
  return (
    <DocPage
      title="ResourceListLayout"
      slug="resource-list-layout"
      description="A complete resource-list page preset with one title, caller-owned controls, a scrolling result region, and fixed pagination."
    >
      <DocSection title="Standard list composition">
        <p className="text-body text-fg-muted">
          Use the layout slots when search, filters, summary, and pagination need to remain structurally independent from the result component.
        </p>
        <ComponentPreview code={standardCode} padding="none" minHeightClass="min-h-[600px]" align="top" fullScreenable>
          <StandardResourceListPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="ResourceListTable compatibility">
        <p className="text-body text-fg-muted">
          The existing data block can inherit the page surface and leave the create action to the page header. Its own toolbar and pagination remain inside the scrolling body.
        </p>
        <ComponentPreview code={blockCode} padding="none" minHeightClass="min-h-[660px]" align="top" fullScreenable>
          <ResourceListBlockPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={props} />
      </DocSection>

      <AgentGuide collection="components" slug="resource-list-layout" />
    </DocPage>
  );
}
