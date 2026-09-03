"use client";

import { Button } from "@zeron/ui/button";
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyHeader,
  EmptyHelp,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  type EmptyIllustrationVariant,
} from "@zeron/ui/empty";
import { Input } from "@zeron/ui/input";
import { useIcon } from "@zeron/icons/context";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const firstUseCode = `import { Button } from "@zeron/ui/button";
import {
  Empty, EmptyActions, EmptyDescription, EmptyHeader,
  EmptyHelp, EmptyIllustration, EmptyMedia, EmptyTitle,
} from "@zeron/ui/empty";

<Empty reason="first-use" scope="page" align="start">
  <EmptyMedia><EmptyIllustration /></EmptyMedia>
  <EmptyHeader>
    <EmptyTitle>No resources yet</EmptyTitle>
    <EmptyDescription>
      Create a resource to connect data, tools, and automations in one place.
    </EmptyDescription>
  </EmptyHeader>
  <EmptyActions>
    <Button>Create resource</Button>
    <Button variant="secondary">Import</Button>
  </EmptyActions>
  <EmptyHelp><a href="/docs">Learn how resources work</a></EmptyHelp>
</Empty>`;

const searchCode = `<Empty reason="no-results" scope="section" announce>
  <EmptyMedia><EmptyIllustration /></EmptyMedia>
  <EmptyHeader>
    <EmptyTitle>No results for “invoice anomaly”</EmptyTitle>
    <EmptyDescription>Try another keyword or clear the search.</EmptyDescription>
  </EmptyHeader>
  <EmptyActions><Button variant="secondary">Clear search</Button></EmptyActions>
</Empty>`;

const inlineCode = `<div role="table">
  {/* Keep the table header and filters visible. */}
  <div role="rowgroup">...</div>
  <Empty reason="no-filter-results" scope="inline" announce>
    <EmptyHeader>
      <EmptyTitle>No resources match these filters</EmptyTitle>
      <EmptyDescription>Clear the filters to see every resource.</EmptyDescription>
    </EmptyHeader>
    <EmptyActions><Button variant="tertiary">Clear filters</Button></EmptyActions>
  </Empty>
</div>`;

const customMediaCode = `<Empty reason="first-use" scope="section">
  <EmptyMedia variant="custom">
    <img src={workspace.emptyImageUrl} alt="" />
  </EmptyMedia>
  <EmptyHeader>
    <EmptyTitle>No documents yet</EmptyTitle>
    <EmptyDescription>Uploaded documents will appear here.</EmptyDescription>
  </EmptyHeader>
  <EmptyActions><Button>Upload document</Button></EmptyActions>
</Empty>`;

const illustrationVariants: Exclude<EmptyIllustrationVariant, "preview">[] = [
  "general",
  "resources",
  "search",
  "filter",
  "inbox",
  "analytics",
];

export default function EmptyDoc() {
  const t = useTranslations("empty");
  const PreviewIcon = useIcon("image");

  const rootProps: PropDef[] = [
    {
      name: "reason",
      type: '"first-use" | "no-data" | "no-results" | "no-filter-results" | "no-condition-results" | "empty-group" | "informational"',
      description: t("reasonProp"),
    },
    {
      name: "scope",
      type: '"page" | "section" | "inline"',
      default: '"section"',
      description: t("scopeProp"),
    },
    {
      name: "density",
      type: '"compact" | "default" | "comfortable"',
      default: '"default"',
      description: t("densityProp"),
    },
    {
      name: "align",
      type: '"center" | "start"',
      default: '"center"',
      description: t("alignProp"),
    },
    {
      name: "announce",
      type: "boolean",
      default: "false",
      description: t("announceProp"),
    },
  ];

  const partProps: PropDef[] = [
    { name: "EmptyMedia", type: 'variant: "icon" | "illustration" | "custom"', description: t("mediaPart") },
    { name: "EmptyHeader", type: "div props", description: t("headerPart") },
    { name: "EmptyTitle", type: 'as: "h2" | "h3" | "h4"', description: t("titlePart") },
    { name: "EmptyDescription", type: "p props", description: t("descriptionPart") },
    { name: "EmptyContent", type: "div props", description: t("contentPart") },
    { name: "EmptyActions", type: "div props", description: t("actionsPart") },
    { name: "EmptyHelp", type: "div props", description: t("helpPart") },
    { name: "EmptyIllustration", type: "7 built-in variants", description: t("illustrationPart") },
  ];

  return (
    <DocPage
      title="Empty"
      slug="empty"
      description="Composable empty and first-use states for pages, sections, and inline data surfaces."
    >
      <DocSection title={t("firstUse")}>
        <ComponentPreview
          code={firstUseCode}
          padding="compact"
          minHeightClass="min-h-[32rem]"
        >
          <div className="w-full overflow-hidden rounded-2xl bg-surface-floating">
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-title font-semibold text-fg-default">{t("resources")}</h2>
                <p className="mt-1 text-label text-fg-muted">{t("resourcesDescription")}</p>
              </div>
            </div>
            <Empty
              reason="first-use"
              scope="page"
              align="start"
              className="min-h-[26rem]"
            >
              <EmptyMedia>
                <EmptyIllustration />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t("noResources")}</EmptyTitle>
                <EmptyDescription>{t("noResourcesDescription")}</EmptyDescription>
              </EmptyHeader>
              <EmptyActions>
                <Button>{t("createResource")}</Button>
                <Button variant="secondary">{t("importResource")}</Button>
              </EmptyActions>
              <EmptyHelp>
                <a href="#usage">{t("learnResources")}</a>
              </EmptyHelp>
            </Empty>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("searchResults")}>
        <ComponentPreview code={searchCode} minHeightClass="min-h-[22rem]">
          <Empty reason="no-results" scope="section" announce>
            <EmptyMedia>
              <EmptyIllustration />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{t("noSearchResults")}</EmptyTitle>
              <EmptyDescription>{t("noSearchResultsDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyActions>
              <Button variant="secondary">{t("clearSearch")}</Button>
            </EmptyActions>
          </Empty>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("inlineTable")}>
        <ComponentPreview code={inlineCode} padding="compact">
          <div className="w-full overflow-hidden rounded-xl border border-border bg-surface-floating">
            <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle p-3">
              <Input className="max-w-64" value={t("searchValue")} readOnly aria-label={t("searchLabel")} />
              <Button variant="tertiary">{t("statusActive")}</Button>
            </div>
            <div role="table" aria-label={t("resourceTable")}>
              <div role="row" className="grid grid-cols-[1fr_8rem] border-b border-border-subtle px-4 py-2 text-label font-medium text-fg-muted">
                <span role="columnheader">{t("name")}</span>
                <span role="columnheader">{t("status")}</span>
              </div>
              <Empty reason="no-filter-results" scope="inline" announce>
                <EmptyHeader>
                  <EmptyTitle>{t("noFilterResults")}</EmptyTitle>
                  <EmptyDescription>{t("noFilterResultsDescription")}</EmptyDescription>
                </EmptyHeader>
                <EmptyActions>
                  <Button variant="tertiary">{t("clearFilters")}</Button>
                </EmptyActions>
              </Empty>
            </div>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("customMedia")}>
        <p className="max-w-2xl text-body leading-6 text-fg-muted">{t("customMediaBody")}</p>
        <ComponentPreview code={customMediaCode} className="mt-3" minHeightClass="min-h-[20rem]">
          <Empty reason="first-use" scope="section">
            <EmptyMedia variant="custom">
              <div aria-hidden="true" className="relative h-24 w-40">
                <span className="absolute inset-x-6 top-3 h-16 rotate-[-4deg] rounded-xl border border-border bg-surface-raised" />
                <span className="absolute inset-x-3 top-1 h-16 rotate-[3deg] rounded-xl border border-border bg-surface-floating" />
                <span className="absolute inset-x-0 top-5 flex h-16 items-center gap-3 rounded-xl border border-border bg-surface-floating px-4">
                  <span className="size-7 rounded-lg bg-brand" />
                  <span className="flex flex-1 flex-col gap-2">
                    <span className="h-2 rounded-full bg-emphasis" />
                    <span className="h-2 w-2/3 rounded-full bg-emphasis" />
                  </span>
                </span>
              </div>
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{t("noDocuments")}</EmptyTitle>
              <EmptyDescription>{t("noDocumentsDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyActions>
              <Button>{t("uploadDocument")}</Button>
            </EmptyActions>
          </Empty>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("illustrations")}>
        <p className="max-w-2xl text-body leading-6 text-fg-muted">{t("illustrationsBody")}</p>
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border-subtle sm:grid-cols-3">
          {illustrationVariants.map((variant) => (
            <div key={variant} className="flex min-h-44 flex-col items-center justify-center bg-surface-floating p-4">
              <EmptyIllustration variant={variant} className="w-32" />
              <span className="mt-1 text-label text-fg-muted">{t(`illustrationNames.${variant}`)}</span>
            </div>
          ))}
          <div className="flex min-h-44 flex-col items-center justify-center bg-surface-floating p-4">
            <EmptyIllustration
              variant="preview"
              media={<PreviewIcon aria-hidden />}
              className="w-32"
            />
            <span className="mt-1 text-label text-fg-muted">{t("illustrationNames.preview")}</span>
          </div>
        </div>
      </DocSection>

      <DocSection title={t("usage")}>
        <div id="usage" className="flex max-w-2xl flex-col gap-3 text-body leading-6 text-fg-muted">
          <p>{t("usageBody")}</p>
          <p>{t("loadingBody")}</p>
          <p>{t("actionBody")}</p>
        </div>
      </DocSection>

      <DocSection title={t("accessibility")}>
        <div className="flex max-w-2xl flex-col gap-3 text-body leading-6 text-fg-muted">
          <p>{t("accessibilityBody")}</p>
          <p>{t("announcementBody")}</p>
          <p>{t("mediaAccessibilityBody")}</p>
        </div>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <PropsTable props={rootProps} />
          <PropsTable props={partProps} />
        </div>
      </DocSection>
    </DocPage>
  );
}
