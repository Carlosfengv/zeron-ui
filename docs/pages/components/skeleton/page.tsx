"use client";

import { Skeleton } from "@zeron/ui/skeleton";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const basicCode = `import { Skeleton } from "@zeron/ui/skeleton";

<Skeleton className="h-5 w-32 rounded-full" />`;

const avatarCode = `<div className="w-full max-w-sm">
  <span aria-atomic="true" className="sr-only" role="status">Loading profile</span>
  <div aria-busy="true" className="flex items-center gap-3">
    <Skeleton className="size-10 shrink-0 rounded-full" />
    <div className="flex flex-1 flex-col gap-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
</div>`;

const cardCode = `<div className="rounded-xl border border-border p-3">
  <span aria-atomic="true" className="sr-only" role="status">Loading card</span>
  <div aria-busy="true">
    <Skeleton className="aspect-[16/9] w-full" />
    <div className="mt-3 space-y-2">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  </div>
</div>`;

const textCode = `<div className="space-y-2">
  <span aria-atomic="true" className="sr-only" role="status">Loading article</span>
  <div aria-busy="true" className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/5" />
  </div>
</div>`;

const formCode = `<div className="space-y-4">
  <span aria-atomic="true" className="sr-only" role="status">Loading form</span>
  <div aria-busy="true" className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-control-md w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-control-md w-full" />
    </div>
    <Skeleton className="h-control-md w-24" />
  </div>
</div>`;

const tableCode = `<div className="overflow-hidden rounded-xl border border-border">
  <span aria-atomic="true" className="sr-only" role="status">Loading table</span>
  <div aria-busy="true">
    {[0, 1, 2, 3].map((row) => (
      <div key={row} className="grid grid-cols-[1.4fr_1fr_7rem] gap-4 border-b border-border-subtle px-4 py-3 last:border-b-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
    ))}
  </div>
</div>`;

function AvatarSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full max-w-sm">
      <span aria-atomic="true" className="sr-only" role="status">{label}</span>
      <div aria-busy="true" className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48 max-w-full" />
        </div>
      </div>
    </div>
  );
}

function CardSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface-floating p-3">
      <span aria-atomic="true" className="sr-only" role="status">{label}</span>
      <div aria-busy="true">
        <Skeleton className="aspect-[16/9] w-full" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}

function TextSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full max-w-lg">
      <span aria-atomic="true" className="sr-only" role="status">{label}</span>
      <div aria-busy="true" className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

function FormSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full max-w-md">
      <span aria-atomic="true" className="sr-only" role="status">{label}</span>
      <div aria-busy="true" className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-control-md w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-control-md w-full" />
        </div>
        <Skeleton className="h-control-md w-24" />
      </div>
    </div>
  );
}

function TableSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface-floating">
      <span aria-atomic="true" className="sr-only" role="status">{label}</span>
      <div aria-busy="true">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_7rem] gap-4 border-b border-border-subtle px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SkeletonDoc() {
  const t = useTranslations("skeleton");
  const skeletonProps: PropDef[] = [
    {
      name: "className",
      type: "string",
      description: t("classNameProp"),
    },
    {
      name: "aria-hidden",
      type: "boolean",
      default: "true",
      description: t("ariaHiddenProp"),
    },
  ];

  return (
    <DocPage
      title="Skeleton"
      slug="skeleton"
      description="A token-native loading placeholder composed to match the shape of incoming content."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Skeleton className="h-5 w-32 rounded-full" />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("avatar")}>
        <ComponentPreview code={avatarCode} minHeightClass="min-h-44">
          <AvatarSkeleton label={t("loadingProfile")} />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("card")}>
        <ComponentPreview code={cardCode} minHeightClass="min-h-80">
          <CardSkeleton label={t("loadingCard")} />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("text")}>
        <ComponentPreview code={textCode}>
          <TextSkeleton label={t("loadingArticle")} />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("form")}>
        <ComponentPreview code={formCode} minHeightClass="min-h-72">
          <FormSkeleton label={t("loadingForm")} />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("table")}>
        <ComponentPreview code={tableCode} padding="compact">
          <TableSkeleton label={t("loadingTable")} />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("accessibility")}>
        <p className="max-w-3xl text-body leading-6 text-fg-muted">
          {t("accessibilityBody")}
        </p>
      </DocSection>

      <DocSection title={t("usage")}>
        <p className="max-w-3xl text-body leading-6 text-fg-muted">
          {t("usageBody")}
        </p>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={skeletonProps} />
      </DocSection>
    </DocPage>
  );
}
