"use client";

import { Button } from "@zeron/ui/button";
import {
  Container,
  ContainerBody,
  ContainerFooter,
  ContainerHeader,
} from "@zeron/ui/container";
import {
  InfoItem,
  InfoItemContent,
  InfoItemDescription,
  InfoItemGroup,
  InfoItemLeading,
  InfoItemTitle,
  InfoItemTrailing,
  InfoItemValue,
} from "@zeron/ui/info-item";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useIcon } from "@zeron/icons/context";

const basicCode = `import {
  Container,
  ContainerBody,
  ContainerFooter,
  ContainerHeader,
} from "@zeron/ui/container";
import {
  InfoItem, InfoItemContent, InfoItemDescription, InfoItemGroup,
  InfoItemLeading, InfoItemTitle, InfoItemTrailing, InfoItemValue,
} from "@zeron/ui/info-item";

<Container className="h-[28rem]">
  <ContainerHeader>
    <h2 className="text-title">Workspace usage</h2>
    <Button size="sm">Manage</Button>
  </ContainerHeader>
  <ContainerBody className="p-0">
    <InfoItemGroup className="min-h-full rounded-[0.875rem] border-0 bg-transparent">
      <InfoItem>
        <InfoItemLeading><FileArchive /></InfoItemLeading>
        <InfoItemContent>
          <InfoItemTitle>Storage</InfoItemTitle>
          <InfoItemDescription>72 GB of 100 GB used</InfoItemDescription>
        </InfoItemContent>
        <InfoItemTrailing><InfoItemValue>72%</InfoItemValue></InfoItemTrailing>
      </InfoItem>
      {/* More usage rows */}
    </InfoItemGroup>
  </ContainerBody>
  <ContainerFooter>
    <span className="mr-auto text-label text-fg-muted">Updated 8 min ago</span>
    <Button variant="secondary">View billing</Button>
    <Button>Upgrade</Button>
  </ContainerFooter>
</Container>`;

const bodyOnlyCode = `<Container className="h-[18rem]">
  <ContainerBody>
    A body can stand alone when the content needs no context or actions.
  </ContainerBody>
</Container>`;

const maxHeightCode = `<Container className="w-full max-w-xl">
  <ContainerBody maxHeight="12rem" className="p-0">
    <InfoItemGroup className="border-0 bg-transparent">
      {/* A long list of InfoItem rows */}
    </InfoItemGroup>
  </ContainerBody>
</Container>`;

const props: PropDef[] = [
  {
    name: "Container",
    type: "div props",
    description: "The raised outer surface. It stacks its supplied parts vertically without imposing a height.",
  },
  {
    name: "ContainerHeader",
    type: "header props",
    description: "Optional contextual region above the body. It wraps actions onto a new line on narrow widths.",
  },
  {
    name: "ContainerBody",
    type: "div props",
    description: "The floating content surface. It fills available height and becomes the scroll region when its Container is height-constrained.",
  },
  {
    name: "maxHeight",
    type: 'CSSProperties["maxHeight"]',
    default: "undefined",
    description: "Caps a content-driven body and scrolls overflowing content vertically. Leave unset to let the body grow naturally; avoid it when the Container already has a fixed height.",
  },
  {
    name: "ContainerFooter",
    type: "footer props",
    description: "Optional action or status region below the body. Omit it entirely when it is not needed.",
  },
];

export default function ContainerDoc() {
  const FileArchive = useIcon("file-archive");
  const Globe = useIcon("globe");
  const Rocket = useIcon("rocket");
  const Users = useIcon("users");
  const resourceItems = [
    {
      id: "storage",
      title: "Storage",
      description: "72 GB of 100 GB used",
      value: "72%",
    },
    {
      id: "bandwidth",
      title: "Bandwidth",
      description: "384 GB transferred this month",
      value: "77%",
    },
    {
      id: "seats",
      title: "Team seats",
      description: "7 of 10 members invited",
      value: "3 left",
    },
    {
      id: "builds",
      title: "Build minutes",
      description: "1,840 of 2,000 minutes used",
      value: "92%",
    },
    {
      id: "requests",
      title: "API requests",
      description: "8.4M of 10M requests this month",
      value: "84%",
    },
  ] as const;
  const icons = {
    storage: FileArchive,
    bandwidth: Globe,
    seats: Users,
    builds: Rocket,
    requests: Globe,
  };

  return (
    <DocPage
      title="Container"
      slug="container"
      description="A composable raised container with optional header and footer regions around one floating content body."
    >
      <DocSection title="Composition">
        <ComponentPreview code={basicCode} padding="compact">
          <Container className="h-[28rem] w-full max-w-xl">
            <ContainerHeader>
              <div>
                <h2 className="text-title text-fg-default">Workspace usage</h2>
                <p className="mt-0.5 text-label text-fg-muted">A live snapshot of your current plan limits.</p>
              </div>
              <Button size="sm">Manage</Button>
            </ContainerHeader>
            <ContainerBody className="p-0">
              <InfoItemGroup className="min-h-full rounded-[0.875rem] border-0 bg-transparent">
                {resourceItems.map((item) => {
                  const Icon = icons[item.id];
                  return (
                    <InfoItem key={item.id}>
                      <InfoItemLeading>
                        <Icon aria-hidden="true" strokeWidth={1.5} />
                      </InfoItemLeading>
                      <InfoItemContent>
                        <InfoItemTitle>{item.title}</InfoItemTitle>
                        <InfoItemDescription>{item.description}</InfoItemDescription>
                      </InfoItemContent>
                      <InfoItemTrailing>
                        <InfoItemValue>{item.value}</InfoItemValue>
                      </InfoItemTrailing>
                    </InfoItem>
                  );
                })}
              </InfoItemGroup>
            </ContainerBody>
            <ContainerFooter>
              <span className="mr-auto text-label text-fg-muted">Updated 8 min ago</span>
              <Button variant="secondary">View billing</Button>
              <Button>Upgrade</Button>
            </ContainerFooter>
          </Container>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Body only">
        <ComponentPreview code={bodyOnlyCode} padding="compact">
          <Container className="h-[18rem] w-full max-w-xl">
            <ContainerBody className="grid place-items-center text-center">
              <div className="max-w-sm">
                <h2 className="text-title text-fg-default">No activity yet</h2>
                <p className="mt-1 text-body text-fg-muted">Use the container without header or footer when the content can speak for itself.</p>
              </div>
            </ContainerBody>
          </Container>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Maximum body height">
        <p className="text-body text-fg-muted">Leave <code>maxHeight</code> unset for a body that grows with its content. Set it only for a content-driven Container; if the Container already has a fixed height, its Body automatically fills the remaining space and scrolls as needed.</p>
        <ComponentPreview code={maxHeightCode} padding="compact" className="mt-4">
          <Container className="w-full max-w-xl">
            <ContainerBody maxHeight="12rem" className="p-0">
              <InfoItemGroup className="rounded-[0.875rem] border-0 bg-transparent">
                {resourceItems.map((item) => {
                  const Icon = icons[item.id];
                  return (
                    <InfoItem key={item.id}>
                      <InfoItemLeading>
                        <Icon aria-hidden="true" strokeWidth={1.5} />
                      </InfoItemLeading>
                      <InfoItemContent>
                        <InfoItemTitle>{item.title}</InfoItemTitle>
                        <InfoItemDescription>{item.description}</InfoItemDescription>
                      </InfoItemContent>
                      <InfoItemTrailing>
                        <InfoItemValue>{item.value}</InfoItemValue>
                      </InfoItemTrailing>
                    </InfoItem>
                  );
                })}
              </InfoItemGroup>
            </ContainerBody>
          </Container>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={props} />
      </DocSection>
    </DocPage>
  );
}
