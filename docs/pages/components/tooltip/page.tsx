"use client";

import { Tooltip } from "@zeron/ui/tooltip";
import { Button } from "@zeron/ui/button";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const basicCode = `import { Tooltip } from "./components";

<Tooltip content="Save your changes">
  <button>Hover me</button>
</Tooltip>`;

const placementCode = `import { Tooltip } from "./components";

<Tooltip content="Top" side="top">...</Tooltip>
<Tooltip content="Right" side="right">...</Tooltip>
<Tooltip content="Bottom" side="bottom">...</Tooltip>
<Tooltip content="Left" side="left">...</Tooltip>`;

const richCode = `import { Tooltip } from "./components";

<Tooltip
  content={
    <div className="flex flex-col gap-1">
      <span className="font-medium">Keyboard shortcut</span>
      <span className="text-fg-muted">⌘ + S</span>
    </div>
  }
>
  <button>Save</button>
</Tooltip>`;

const delayCode = `import { Tooltip } from "./components";

<Tooltip content="Instant" delayDuration={0}>...</Tooltip>
<Tooltip content="Slow" delayDuration={500}>...</Tooltip>`;

// ---------------------------------------------------------------------------
// Props table
// ---------------------------------------------------------------------------

const tooltipProps = (t: ReturnType<typeof useTranslations>): PropDef[] => [
  {
    name: "content",
    type: "ReactNode",
    description: t("content"),
  },
  {
    name: "children",
    type: "ReactElement",
    description: t("children"),
  },
  {
    name: "side",
    type: '"top" | "right" | "bottom" | "left"',
    default: '"top"',
    description: t("side"),
  },
  {
    name: "sideOffset",
    type: "number",
    default: "8",
    description: t("sideOffset"),
  },
  {
    name: "delayDuration",
    type: "number",
    default: "200",
    description: t("delayDuration"),
  },
  {
    name: "className",
    type: "string",
    description: t("className"),
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TooltipDoc() {
  const t = useTranslations("tooltip");
  return (
    <DocPage
      title="Tooltip"
      slug="tooltip"
      description="Floating tooltip with spring-based animations, configurable placement, and rich content support."
    >
      <DocSection title="Playground">
        <VariantPlayground
          minHeightClass="min-h-[180px]"
          variants={[
            {
              value: "top",
              label: "Top",
              code: `<Tooltip content="Save your changes" side="top"><Button>Save</Button></Tooltip>`,
              preview: <Tooltip content="Save your changes" side="top"><Button>Save</Button></Tooltip>,
            },
            {
              value: "right",
              label: "Right",
              code: `<Tooltip content="Save your changes" side="right"><Button>Save</Button></Tooltip>`,
              preview: <Tooltip content="Save your changes" side="right"><Button>Save</Button></Tooltip>,
            },
            {
              value: "instant",
              label: "Instant",
              code: `<Tooltip content="Save your changes" delayDuration={0}><Button>Save</Button></Tooltip>`,
              preview: <Tooltip content="Save your changes" delayDuration={0}><Button>Save</Button></Tooltip>,
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Tooltip content="Save your changes">
            <Button>Hover me</Button>
          </Tooltip>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("placement")}>
        <ComponentPreview code={placementCode}>
          <div className="flex gap-3">
            <Tooltip content="Top" side="top">
              <Button variant="secondary">Top</Button>
            </Tooltip>
            <Tooltip content="Right" side="right">
              <Button variant="secondary">Right</Button>
            </Tooltip>
            <Tooltip content="Bottom" side="bottom">
              <Button variant="secondary">Bottom</Button>
            </Tooltip>
            <Tooltip content="Left" side="left">
              <Button variant="secondary">Left</Button>
            </Tooltip>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("richContent")}>
        <ComponentPreview code={richCode}>
          <Tooltip
            content={
              <div className="flex flex-col gap-1">
                <span className="font-semibold">
                  Keyboard shortcut
                </span>
                <span className="text-fg-muted">⌘ + S</span>
              </div>
            }
          >
            <Button>Save</Button>
          </Tooltip>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("delay")}>
        <ComponentPreview code={delayCode}>
          <div className="flex gap-3">
            <Tooltip content="Instant" delayDuration={0}>
              <Button variant="secondary">No delay</Button>
            </Tooltip>
            <Tooltip content="Slow" delayDuration={500}>
              <Button variant="secondary">500ms delay</Button>
            </Tooltip>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={tooltipProps(t)} />
      </DocSection>
    </DocPage>
  );
}
