"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@zeron/ui/breadcrumb";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs">Components</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const collapsedCode = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/projects/atlas">Atlas</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Settings</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const customCode = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator>/</BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs/components">Components</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator>/</BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const renderCode = `import Link from "next/link";

<BreadcrumbLink render={<Link href="/docs" />}>
  Documentation
</BreadcrumbLink>`;

const resourceSwitcherCode = `import { useState } from "react";

const resources = [
  { value: "atlas", label: "Atlas" },
  { value: "orion", label: "Orion" },
  { value: "nova", label: "Nova" },
];
const [resource, setResource] = useState("atlas");

<BreadcrumbPage
  resources={resources}
  value={resource}
  onValueChange={setResource}
/>`;

const breadcrumbProps: PropDef[] = [
  {
    name: "children",
    type: "ReactNode",
    description: "BreadcrumbList containing the navigation path.",
  },
  {
    name: "aria-label",
    type: "string",
    default: '"breadcrumb"',
    description: "Accessible name for the navigation landmark.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the nav element.",
  },
];

const linkProps: PropDef[] = [
  {
    name: "href",
    type: "string",
    description: "Destination when the default anchor element is used.",
  },
  {
    name: "render",
    type: "ReactElement | ((props, state) => ReactElement)",
    description: "Composes breadcrumb behavior onto a router link or custom anchor.",
  },
  {
    name: "children",
    type: "ReactNode",
    description: "Visible link label.",
  },
];

const partProps: PropDef[] = [
  {
    name: "BreadcrumbList",
    type: "ol props",
    description: "Responsive wrapping list that controls path spacing and typography.",
  },
  {
    name: "BreadcrumbItem",
    type: "li props",
    description: "Groups one link, page label, or ellipsis item.",
  },
  {
    name: "BreadcrumbPage",
    type: "span props + resource switcher props",
    description: "Current page label with aria-current=page. Pass resources to switch between same-level resources.",
  },
  {
    name: "BreadcrumbSeparator",
    type: "li props",
    description: "Presentation-only separator; accepts custom children.",
  },
  {
    name: "BreadcrumbEllipsis",
    type: "span props",
    description: "Presentation-only marker for collapsed path levels.",
  },
];

export default function BreadcrumbDoc() {
  const t = useTranslations("breadcrumb");
  const [resource, setResource] = useState("atlas");
  const resources = [
    { value: "atlas", label: "Atlas" },
    { value: "orion", label: "Orion" },
    { value: "nova", label: "Nova" },
  ];
  const localize = (props: PropDef[], prefix: string) => props.map((prop, index) => ({ ...prop, description: t(`${prefix}${index}`) }));
  return (
    <DocPage
      title="Breadcrumb"
      slug="breadcrumb"
      description="Composable path navigation with router-link composition, custom separators, and collapsed levels."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("collapsedLevels")}>
        <ComponentPreview code={collapsedCode}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Workspace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Atlas</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("customSeparator")}>
        <ComponentPreview code={customCode}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Docs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("routerLink")}>
        <ComponentPreview code={renderCode}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/docs" />}>
                  Documentation
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("resourceSwitcher")}>
        <p className="text-body text-fg-muted">{t("resourceSwitcherBody")}</p>
        <ComponentPreview code={resourceSwitcherCode}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage
                  resources={resources}
                  value={resource}
                  onValueChange={setResource}
                />
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">Breadcrumb</h3>
            <PropsTable props={localize(breadcrumbProps, "b")} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">BreadcrumbLink</h3>
            <PropsTable props={localize(linkProps, "l")} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">Composition parts</h3>
            <PropsTable props={localize(partProps, "p")} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
