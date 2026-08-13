"use client";

import { Button } from "@zeron/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@zeron/ui/popover";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const basicCode = `import {
  Button, Popover, PopoverTrigger, PopoverContent,
  PopoverHeader, PopoverFooter, PopoverTitle,
  PopoverDescription, PopoverClose,
} from "./components";

<Popover>
  <PopoverTrigger render={<Button variant="secondary">Share</Button>} />
  <PopoverContent className="w-72" align="start">
    <PopoverHeader>
      <PopoverTitle>Workspace access</PopoverTitle>
      <PopoverDescription>
        Anyone with the link can view this workspace.
      </PopoverDescription>
    </PopoverHeader>
    <PopoverFooter>
      <PopoverClose render={<Button size="sm" variant="ghost">Done</Button>} />
    </PopoverFooter>
  </PopoverContent>
</Popover>`;

const hoverCode = `<Popover trigger="hover" hoverDelay={120}>
  <PopoverTrigger render={<Button variant="secondary">Status</Button>} />
  <PopoverContent side="top" className="w-64">
    <PopoverTitle>All systems operational</PopoverTitle>
    <PopoverDescription>Updated a few seconds ago.</PopoverDescription>
  </PopoverContent>
</Popover>`;

const liquidCode = `<Popover liquid>
  <PopoverTrigger render={<Button variant="secondary">Details</Button>} />
  <PopoverContent side="right" className="w-60">
    A compact panel with an optional liquid connector.
  </PopoverContent>
</Popover>`;

const popoverProps: PropDef[] = [
  {
    name: "trigger",
    type: '"click" | "hover"',
    default: '"click"',
    description: "How the popover is opened. Hover mode remains keyboard accessible.",
  },
  {
    name: "open / defaultOpen",
    type: "boolean",
    description: "Controlled or initial open state.",
  },
  {
    name: "onOpenChange",
    type: "(open: boolean) => void",
    description: "Called whenever the open state changes.",
  },
  {
    name: "hoverDelay / closeDelay",
    type: "number",
    default: "160 / 120",
    description: "Open and close delay in milliseconds for hover mode.",
  },
  {
    name: "liquid",
    type: "boolean",
    default: "false",
    description: "Optionally draws a soft visual connection between anchor and panel.",
  },
  {
    name: "gooStrength",
    type: "number",
    default: "5",
    description: "Controls the softness of the liquid merge.",
  },
];

const contentProps: PropDef[] = [
  {
    name: "side",
    type: '"top" | "right" | "bottom" | "left"',
    default: '"bottom"',
    description: "Preferred placement. The panel flips when space is constrained.",
  },
  {
    name: "align",
    type: '"start" | "center" | "end"',
    default: '"center"',
    description: "Alignment along the anchor's cross axis.",
  },
  {
    name: "sideOffset / alignOffset",
    type: "number",
    default: "10 / 0",
    description: "Distance from and offset along the anchor.",
  },
  {
    name: "collisionPadding",
    type: "number",
    default: "12",
    description: "Minimum viewport padding used during collision avoidance.",
  },
  {
    name: "liquid",
    type: "boolean",
    description: "Overrides the root liquid setting for one panel.",
  },
];

export default function PopoverDoc() {
  const t = useTranslations("popover");
  const localizedPopoverProps = popoverProps.map((prop) => ({
    ...prop,
    description: t(prop.name.replace(" / ", "").replace("opendefaultOpen", "openDefaultOpen").replace("hoverDelaycloseDelay", "hoverDelayCloseDelay")),
  }));
  const localizedContentProps = contentProps.map((prop) => ({
    ...prop,
    description: t(prop.name === "sideOffset / alignOffset" ? "sideOffsetAlignOffset" : prop.name === "liquid" ? "contentLiquid" : prop.name),
  }));
  return (
    <DocPage
      title="Popover"
      slug="popover"
      description="Accessible floating content with collision-aware positioning and an optional liquid anchor-to-panel transition."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode} minHeightClass="min-h-[260px]">
          <Popover>
            <PopoverTrigger
              render={<Button variant="secondary">Share workspace</Button>}
            />
            <PopoverContent align="start" className="w-72">
              <PopoverHeader>
                <PopoverTitle>Workspace access</PopoverTitle>
                <PopoverDescription>
                  Anyone with the link can view this workspace.
                </PopoverDescription>
              </PopoverHeader>
              <PopoverFooter>
                <PopoverClose
                  render={
                    <Button size="sm" variant="ghost">
                      Done
                    </Button>
                  }
                />
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("hoverTrigger")}>
        <ComponentPreview code={hoverCode} minHeightClass="min-h-[240px]">
          <Popover trigger="hover" hoverDelay={120}>
            <PopoverTrigger
              render={<Button variant="secondary">Service status</Button>}
            />
            <PopoverContent side="top" className="w-64">
              <PopoverHeader>
                <PopoverTitle>All systems operational</PopoverTitle>
                <PopoverDescription>
                  Updated a few seconds ago.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("liquidConnector")}>
        <ComponentPreview code={liquidCode} minHeightClass="min-h-[220px]">
          <Popover liquid>
            <PopoverTrigger
              render={<Button variant="secondary">View details</Button>}
            />
            <PopoverContent side="right" className="w-60">
              A compact panel with an optional liquid connector.
            </PopoverContent>
          </Popover>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — Popover`}>
        <PropsTable props={localizedPopoverProps} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — PopoverContent`}>
        <PropsTable props={localizedContentProps} />
      </DocSection>
    </DocPage>
  );
}
