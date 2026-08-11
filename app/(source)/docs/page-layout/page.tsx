"use client";

import { Button } from "@/components/ui/button";
import { PageActions, PageAside, PageBody, PageDescription, PageHeader, PageHeaderContent, PageLayout, PageTitle } from "@/components/ui/page-layout";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { PropsTable, type PropDef } from "@/docs/PropsTable";

const code = `<PageLayout size="lg">
  <PageHeader>...</PageHeader>
  <PageBody>...</PageBody>
  <PageAside>...</PageAside>
</PageLayout>`;
const props: PropDef[] = [
  { name: "size", type: '"sm" | "md" | "lg" | "full"', default: '"md"', description: "Maximum width for the composed page." },
  { name: "PageAside", type: "aside props", description: "Moves into a second column from the lg breakpoint." },
  { name: "PageActions", type: "div props", description: "Wraps below the header content on narrow screens." },
];

export default function PageLayoutDoc() {
  return <DocPage title="PageLayout" slug="page-layout" description="Responsive page composition for titles, actions, body content, and a supporting aside.">
    <DocSection title="Composition"><ComponentPreview code={code}><PageLayout size="full" className="gap-y-5 border border-border py-5"><PageHeader><PageHeaderContent><PageTitle className="text-title">Projects</PageTitle><PageDescription>Manage work and ownership.</PageDescription></PageHeaderContent><PageActions><Button size="sm">New project</Button></PageActions></PageHeader><PageBody className="rounded-control bg-muted p-4">Main content</PageBody><PageAside className="rounded-control border border-border p-4 text-body">Page tools</PageAside></PageLayout></ComponentPreview></DocSection>
    <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
  </DocPage>;
}
