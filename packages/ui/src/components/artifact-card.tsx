"use client";

import { FileType } from "#components/file-type";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemTitle, InfoItemTrailing } from "#components/info-item";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";
import { artifactCardEnLabels, artifactCardZhLabels } from "./artifact-card/labels";
import type { ArtifactCardItem, ArtifactCardProps } from "./artifact-card/types";

export function ArtifactCard<TResource extends ArtifactCardItem>({ resources, title, onOpen, getDescription, getReviewStatus, labels: overrides, locale, className, ...props }: ArtifactCardProps<TResource>) {
  const labels = { ...(locale?.toLowerCase().startsWith("zh") ? artifactCardZhLabels : artifactCardEnLabels), ...overrides };
  const Globe = useIcon("globe");
  const Arrow = useIcon("arrow-right");
  return (
    <div {...props} data-slot="artifact-card" className={cn("min-w-0 overflow-hidden rounded-lg border-hairline border-border bg-surface-floating", className)}>
      <div className="border-b-hairline border-border px-3 py-2 text-label font-medium">{title ?? labels.resources}</div>
      <ul className="flex min-w-0 flex-col gap-1 p-2">
        {resources.map((resource) => {
          const review = getReviewStatus ? getReviewStatus(resource) : resource.review;
          const description = getDescription ? getDescription(resource) : resource.description;
          return <li key={resource.id} className="min-w-0">
            <InfoItem render={<button type="button" />} onClick={() => onOpen(resource)} aria-label={`${labels.preview}: ${resource.name}`}>
              <span className="flex size-8 shrink-0 items-center justify-center">{resource.kind === "url" ? <Globe size={20} aria-hidden /> : <FileType fileName={resource.name} size="sm" aria-hidden />}</span>
              <InfoItemContent>
                <InfoItemTitle className="truncate" title={resource.name}>{resource.name}</InfoItemTitle>
                {description != null && description !== "" && <InfoItemDescription className="truncate" title={typeof description === "string" ? description : undefined}>{description}</InfoItemDescription>}
              </InfoItemContent>
              <InfoItemTrailing>{review && <span className="text-label text-fg-muted">{labels[review]}</span>}<Arrow size={14} aria-hidden /></InfoItemTrailing>
            </InfoItem>
          </li>;
        })}
      </ul>
    </div>
  );
}

export { artifactCardEnLabels, artifactCardZhLabels } from "./artifact-card/labels";
export type { ArtifactCardItem, ArtifactCardLabels, ArtifactCardProps, ArtifactCardReviewStatus } from "./artifact-card/types";
